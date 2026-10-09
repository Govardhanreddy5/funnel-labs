import { NormalizedDailyMetric } from '../types';

export interface ShopifyOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export class ShopifyAdapter {
  private config: ShopifyOAuthConfig;
  private isMock: boolean;

  constructor(config?: Partial<ShopifyOAuthConfig>) {
    this.config = {
      clientId: config?.clientId || process.env.SHOPIFY_CLIENT_ID || 'mock_shopify_client_id',
      clientSecret: config?.clientSecret || process.env.SHOPIFY_CLIENT_SECRET || 'mock_shopify_secret',
      redirectUri: config?.redirectUri || process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:5173/api/integrations/oauth/callback?provider=shopify',
      scopes: config?.scopes || ['read_orders', 'read_products', 'read_analytics'],
    };

    // Use mock mode if explicitly requested or if keys are mock placeholders
    this.isMock =
      process.env.USE_MOCK_INTEGRATIONS === 'true' ||
      !process.env.SHOPIFY_CLIENT_ID ||
      process.env.SHOPIFY_CLIENT_ID.startsWith('mock_') ||
      process.env.SHOPIFY_CLIENT_ID.includes('your-shopify');
  }

  /**
   * Generate Shopify OAuth authorization redirect URL
   */
  getAuthorizationUrl(shopDomain: string, state: string): string {
    const cleanShop = this.normalizeShopDomain(shopDomain);
    const scopeStr = this.config.scopes.join(',');

    if (this.isMock) {
      // Direct callback in mock mode for instant local testing
      return `${this.config.redirectUri}&code=mock_shopify_code_${Date.now()}&shop=${encodeURIComponent(cleanShop)}&state=${encodeURIComponent(state)}`;
    }

    return `https://${cleanShop}/admin/oauth/authorize?client_id=${encodeURIComponent(
      this.config.clientId
    )}&scope=${encodeURIComponent(scopeStr)}&redirect_uri=${encodeURIComponent(
      this.config.redirectUri
    )}&state=${encodeURIComponent(state)}`;
  }

  /**
   * Exchange OAuth authorization code for a permanent access token
   */
  async exchangeCodeForToken(shopDomain: string, code: string): Promise<{ accessToken: string; scope: string }> {
    const cleanShop = this.normalizeShopDomain(shopDomain);

    if (this.isMock) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return {
        accessToken: `shpat_mock_${Buffer.from(cleanShop).toString('hex').slice(0, 16)}_${Date.now()}`,
        scope: this.config.scopes.join(','),
      };
    }

    // Live Shopify token exchange
    const response = await fetch(`https://${cleanShop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify OAuth token exchange failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      scope: data.scope,
    };
  }

  /**
   * Fetch and normalize Shopify orders into daily metrics
   */
  async fetchDailyMetrics(
    organizationId: string,
    shopDomain: string,
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<{ metrics: NormalizedDailyMetric[]; rateLimitInfo: Record<string, any> }> {
    const cleanShop = this.normalizeShopDomain(shopDomain);

    if (
      this.isMock ||
      !accessToken ||
      accessToken.startsWith('mock_') ||
      accessToken.startsWith('token_') ||
      accessToken.startsWith('shpat_mock_')
    ) {
      return this.generateMockMetrics(organizationId, cleanShop, startDate, endDate);
    }

    // Live API integration with rate limit tracking
    const ordersUrl = `https://${cleanShop}/admin/api/2024-01/orders.json?status=any&created_at_min=${startDate}T00:00:00Z&created_at_max=${endDate}T23:59:59Z&limit=250`;
    
    const response = await fetch(ordersUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    // Check Shopify API Rate Limit header: e.g. "32/40"
    const callLimitHeader = response.headers.get('X-Shopify-Shop-Api-Call-Limit') || '0/40';
    const [usedCalls, maxCalls] = callLimitHeader.split('/').map(Number);
    const rateLimitInfo = {
      provider: 'shopify',
      usedCalls: usedCalls || 0,
      maxCalls: maxCalls || 40,
      utilizationPercent: Math.round(((usedCalls || 0) / (maxCalls || 40)) * 100),
    };

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('Retry-After') || '2');
      const err: any = new Error(`Shopify API rate limit exceeded. Retry after ${retryAfter}s.`);
      err.status = 429;
      err.retryAfter = retryAfter;
      throw err;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Shopify orders API error (${response.status}): ${errorBody}`);
    }

    const json = await response.json();
    const orders = json.orders || [];

    // Group orders by date YYYY-MM-DD
    const dateMap = new Map<string, { purchases: number; revenue: number; rawOrders: any[] }>();
    for (const order of orders) {
      const d = (order.created_at || '').slice(0, 10);
      if (!d) continue;
      const current = dateMap.get(d) || { purchases: 0, revenue: 0, rawOrders: [] };
      current.purchases += 1;
      current.revenue += parseFloat(order.total_price || '0');
      current.rawOrders.push({ id: order.id, total: order.total_price });
      dateMap.set(d, current);
    }

    const metrics: NormalizedDailyMetric[] = [];
    for (const [date, data] of dateMap.entries()) {
      metrics.push({
        organization_id: organizationId,
        provider: 'shopify',
        campaign_id: `shopify-store-${cleanShop.split('.')[0]}`,
        campaign_name: `Shopify Online Store Orders (${cleanShop})`,
        date,
        impressions: 0,
        reach: 0,
        clicks: 0,
        spend: 0,
        purchases: data.purchases,
        revenue: Math.round(data.revenue * 100) / 100,
        ctr: 0,
        cvr: 0,
        cpa: 0,
        roas: 0,
        raw_data: { orderCount: data.purchases, rawOrdersCount: data.rawOrders.length },
      });
    }

    return { metrics, rateLimitInfo };
  }

  /**
   * Clean and normalize a myshopify.com domain string
   */
  private normalizeShopDomain(domain: string): string {
    let clean = (domain || '').trim().toLowerCase();
    clean = clean.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!clean.includes('.')) {
      clean = `${clean}.myshopify.com`;
    }

    // SSRF Guardrail: Enforce valid .myshopify.com hostname format
    const validShopifyRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!validShopifyRegex.test(clean)) {
      throw new Error(`Security validation error: Invalid Shopify domain "${domain}". Only valid *.myshopify.com domains are permitted.`);
    }

    return clean;
  }

  /**
   * Generate realistic D2C order metrics for local development & demonstration
   */
  private async generateMockMetrics(
    organizationId: string,
    shopDomain: string,
    startDate: string,
    endDate: string
  ): Promise<{ metrics: NormalizedDailyMetric[]; rateLimitInfo: Record<string, any> }> {
    // Simulate brief network roundtrip
    await new Promise((resolve) => setTimeout(resolve, 300));

    const metrics: NormalizedDailyMetric[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayMs = 24 * 60 * 60 * 1000;

    const baseRevenue = 15200;
    const baseOrders = 72;

    let idx = 0;
    for (let time = start.getTime(); time <= end.getTime(); time += dayMs) {
      idx++;
      const d = new Date(time);
      const dateStr = d.toISOString().slice(0, 10);

      // Create realistic daily variations (weekend boosts, campaign spikes)
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const variation = 1 + Math.sin(idx * 0.8) * 0.2 + (isWeekend ? 0.25 : 0);
      const dailyPurchases = Math.max(10, Math.round((baseOrders / 7) * variation));
      const averageOrderValue = 1850 + Math.round(Math.random() * 250);
      const dailyRevenue = dailyPurchases * averageOrderValue;

      metrics.push({
        organization_id: organizationId,
        provider: 'shopify',
        campaign_id: `shopify-store-${shopDomain.split('.')[0]}`,
        campaign_name: `Shopify Online Store Orders (${shopDomain})`,
        date: dateStr,
        impressions: 0,
        reach: 0,
        clicks: 0,
        spend: 0,
        purchases: dailyPurchases,
        revenue: dailyRevenue,
        ctr: 0,
        cvr: 0,
        cpa: 0,
        roas: 0,
        raw_data: {
          syncedFrom: 'Mock Shopify Store Adapter',
          averageOrderValue,
          currency: 'INR',
        },
      });
    }

    return {
      metrics,
      rateLimitInfo: {
        provider: 'shopify',
        usedCalls: 4,
        maxCalls: 40,
        utilizationPercent: 10,
        mode: 'mock_development',
      },
    };
  }
}
