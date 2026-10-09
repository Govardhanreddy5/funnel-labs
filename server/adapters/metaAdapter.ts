import { NormalizedDailyMetric } from '../types';

export interface MetaOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  scopes: string[];
}

export class MetaAdapter {
  private config: MetaOAuthConfig;
  private isMock: boolean;

  constructor(config?: Partial<MetaOAuthConfig>) {
    this.config = {
      appId: config?.appId || process.env.META_APP_ID || 'mock_meta_app_id',
      appSecret: config?.appSecret || process.env.META_APP_SECRET || 'mock_meta_secret',
      redirectUri: config?.redirectUri || process.env.META_REDIRECT_URI || 'http://localhost:5173/api/integrations/oauth/callback?provider=meta',
      scopes: config?.scopes || ['ads_read', 'read_insights', 'instagram_basic', 'pages_read_engagement'],
    };

    this.isMock =
      process.env.USE_MOCK_INTEGRATIONS === 'true' ||
      !process.env.META_APP_ID ||
      process.env.META_APP_ID.startsWith('mock_') ||
      process.env.META_APP_ID.includes('your-meta');
  }

  /**
   * Generate Meta / Instagram OAuth dialog URL
   */
  getAuthorizationUrl(state: string): string {
    const scopeStr = this.config.scopes.join(',');

    if (this.isMock) {
      return `${this.config.redirectUri}&code=mock_meta_code_${Date.now()}&state=${encodeURIComponent(state)}`;
    }

    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(
      this.config.appId
    )}&redirect_uri=${encodeURIComponent(
      this.config.redirectUri
    )}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scopeStr)}`;
  }

  /**
   * Exchange code for a 60-day long-lived Meta access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    accountId: string;
    accountName: string;
    expiresIn: number;
  }> {
    if (this.isMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        accessToken: `EAA_mock_long_lived_token_${Date.now()}`,
        accountId: 'act_884920147',
        accountName: 'Meta Ads — Bombay Threads (Instagram Business)',
        expiresIn: 60 * 24 * 60 * 60, // 60 days
      };
    }

    // Step 1: Exchange code for short-lived token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${encodeURIComponent(
      this.config.appId
    )}&redirect_uri=${encodeURIComponent(this.config.redirectUri)}&client_secret=${encodeURIComponent(
      this.config.appSecret
    )}&code=${encodeURIComponent(code)}`;

    const tokenRes = await fetch(tokenUrl);
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new Error(`Meta token exchange failed (${tokenRes.status}): ${err}`);
    }
    const tokenData = await tokenRes.json();
    const shortLivedToken = tokenData.access_token;

    // Step 2: Exchange for long-lived 60-day token
    const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(
      this.config.appId
    )}&client_secret=${encodeURIComponent(this.config.appSecret)}&fb_exchange_token=${encodeURIComponent(
      shortLivedToken
    )}`;

    const longRes = await fetch(longLivedUrl);
    const longData = longRes.ok ? await longRes.json() : tokenData;
    const finalToken = longData.access_token || shortLivedToken;

    // Step 3: Fetch primary Ad Account
    const adAccountsRes = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id,currency&access_token=${finalToken}`);
    let accountId = 'act_default';
    let accountName = 'Meta Ads Account';

    if (adAccountsRes.ok) {
      const accData = await adAccountsRes.json();
      if (accData.data && accData.data.length > 0) {
        accountId = accData.data[0].id;
        accountName = accData.data[0].name || `Ad Account ${accData.data[0].account_id}`;
      }
    }

    return {
      accessToken: finalToken,
      accountId,
      accountName,
      expiresIn: longData.expires_in || 5184000,
    };
  }

  /**
   * Fetch and normalize Meta Ads / Instagram insights by date
   */
  async fetchDailyInsights(
    organizationId: string,
    adAccountId: string,
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<{ metrics: NormalizedDailyMetric[]; rateLimitInfo: Record<string, any> }> {
    if (
      this.isMock ||
      !accessToken ||
      accessToken.startsWith('mock_') ||
      accessToken.startsWith('token_') ||
      accessToken.startsWith('EAA_mock_')
    ) {
      return this.generateMockInsights(organizationId, adAccountId, startDate, endDate);
    }

    const fields = 'campaign_id,campaign_name,impressions,reach,clicks,spend,actions,action_values';
    const timeRange = JSON.stringify({ since: startDate, until: endDate });
    const url = `https://graph.facebook.com/v19.0/${adAccountId}/insights?level=campaign&time_increment=1&time_range=${encodeURIComponent(
      timeRange
    )}&fields=${fields}&access_token=${accessToken}`;

    const res = await fetch(url);

    // Meta App Usage header format: {"call_count":12,"total_cputime":14,"total_time":18}
    const appUsageHeader = res.headers.get('x-app-usage');
    let rateLimitInfo = { provider: 'meta', callCount: 0, totalCpuTime: 0, totalTime: 0 };
    if (appUsageHeader) {
      try {
        const parsed = JSON.parse(appUsageHeader);
        rateLimitInfo = { provider: 'meta', ...parsed };
      } catch {
        // ignore
      }
    }

    if (res.status === 429 || (rateLimitInfo.callCount && rateLimitInfo.callCount > 85)) {
      const err: any = new Error('Meta Graph API rate limit threshold reached.');
      err.status = 429;
      err.retryAfter = 60;
      throw err;
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Meta Insights API error (${res.status}): ${errorText}`);
    }

    const json = await res.json();
    const rows = json.data || [];

    const metrics: NormalizedDailyMetric[] = rows.map((row: any) => {
      const impressions = parseInt(row.impressions || '0', 10);
      const reach = parseInt(row.reach || '0', 10);
      const clicks = parseInt(row.clicks || '0', 10);
      const spend = parseFloat(row.spend || '0');

      // Extract purchases and purchase value from actions
      let purchases = 0;
      let revenue = 0;

      if (Array.isArray(row.actions)) {
        const purchaseAction = row.actions.find(
          (a: any) => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
        );
        if (purchaseAction) {
          purchases = parseInt(purchaseAction.value || '0', 10);
        }
      }

      if (Array.isArray(row.action_values)) {
        const purchaseVal = row.action_values.find(
          (a: any) => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
        );
        if (purchaseVal) {
          revenue = parseFloat(purchaseVal.value || '0');
        }
      }

      const ctr = impressions > 0 ? clicks / impressions : 0;
      const cvr = clicks > 0 ? purchases / clicks : 0;
      const cpa = purchases > 0 ? spend / purchases : 0;
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        organization_id: organizationId,
        provider: 'meta' as const,
        campaign_id: row.campaign_id || `meta-${row.campaign_name}`,
        campaign_name: row.campaign_name || 'Meta Ad Campaign',
        date: row.date_start,
        impressions,
        reach,
        clicks,
        spend: Math.round(spend * 100) / 100,
        purchases,
        revenue: Math.round(revenue * 100) / 100,
        ctr: Math.round(ctr * 10000) / 10000,
        cvr: Math.round(cvr * 10000) / 10000,
        cpa: Math.round(cpa * 100) / 100,
        roas: Math.round(roas * 100) / 100,
        raw_data: row,
      };
    });

    return { metrics, rateLimitInfo };
  }

  /**
   * Generate realistic Meta Ads & Instagram daily metrics for local development & demonstration
   */
  private async generateMockInsights(
    organizationId: string,
    adAccountId: string,
    startDate: string,
    endDate: string
  ): Promise<{ metrics: NormalizedDailyMetric[]; rateLimitInfo: Record<string, any> }> {
    await new Promise((resolve) => setTimeout(resolve, 350));

    const metrics: NormalizedDailyMetric[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayMs = 24 * 60 * 60 * 1000;

    const campaigns = [
      { id: 'meta-ig-tshirt', name: 'Instagram — T-Shirt Offer Campaign (Buy 2 Get 1)' },
      { id: 'meta-fb-retargeting', name: 'Facebook — Summer Collection Retargeting' },
    ];

    let dayIndex = 0;
    for (let time = start.getTime(); time <= end.getTime(); time += dayMs) {
      dayIndex++;
      const dateStr = new Date(time).toISOString().slice(0, 10);

      // 1. Instagram Main Winner Campaign
      const igImpressions = 1650 + Math.round(Math.sin(dayIndex * 0.9) * 220);
      const igReach = Math.round(igImpressions * 0.88);
      const igClicks = Math.round(igImpressions * 0.058); // 5.8% CTR
      const igSpend = 1200 + Math.round(Math.random() * 150);
      const igPurchases = Math.max(8, Math.round(igClicks * 0.092)); // 9.2% CVR
      const igRevenue = igPurchases * 1850;
      const igCtr = igImpressions > 0 ? igClicks / igImpressions : 0;
      const igCvr = igClicks > 0 ? igPurchases / igClicks : 0;
      const igCpa = igPurchases > 0 ? igSpend / igPurchases : 0;
      const igRoas = igSpend > 0 ? igRevenue / igSpend : 0;

      metrics.push({
        organization_id: organizationId,
        provider: 'meta',
        campaign_id: campaigns[0].id,
        campaign_name: campaigns[0].name,
        date: dateStr,
        impressions: igImpressions,
        reach: igReach,
        clicks: igClicks,
        spend: igSpend,
        purchases: igPurchases,
        revenue: igRevenue,
        ctr: Math.round(igCtr * 10000) / 10000,
        cvr: Math.round(igCvr * 10000) / 10000,
        cpa: Math.round(igCpa * 100) / 100,
        roas: Math.round(igRoas * 100) / 100,
        raw_data: { adAccountId, channel: 'Instagram Feed & Stories' },
      });

      // 2. Facebook Retargeting Campaign
      const fbImpressions = 780 + Math.round(Math.cos(dayIndex * 0.7) * 90);
      const fbReach = Math.round(fbImpressions * 0.82);
      const fbClicks = Math.round(fbImpressions * 0.038); // 3.8% CTR
      const fbSpend = 650 + Math.round(Math.random() * 80);
      const fbPurchases = Math.max(3, Math.round(fbClicks * 0.051)); // 5.1% CVR
      const fbRevenue = fbPurchases * 1650;
      const fbCtr = fbImpressions > 0 ? fbClicks / fbImpressions : 0;
      const fbCvr = fbClicks > 0 ? fbPurchases / fbClicks : 0;
      const fbCpa = fbPurchases > 0 ? fbSpend / fbPurchases : 0;
      const fbRoas = fbSpend > 0 ? fbRevenue / fbSpend : 0;

      metrics.push({
        organization_id: organizationId,
        provider: 'meta',
        campaign_id: campaigns[1].id,
        campaign_name: campaigns[1].name,
        date: dateStr,
        impressions: fbImpressions,
        reach: fbReach,
        clicks: fbClicks,
        spend: fbSpend,
        purchases: fbPurchases,
        revenue: fbRevenue,
        ctr: Math.round(fbCtr * 10000) / 10000,
        cvr: Math.round(fbCvr * 10000) / 10000,
        cpa: Math.round(fbCpa * 100) / 100,
        roas: Math.round(fbRoas * 100) / 100,
        raw_data: { adAccountId, channel: 'Facebook Reels & Feed' },
      });
    }

    return {
      metrics,
      rateLimitInfo: {
        provider: 'meta',
        callCount: 6,
        totalCpuTime: 8,
        totalTime: 12,
        mode: 'mock_development',
      },
    };
  }
}
