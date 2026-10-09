import { IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import { encryptToken, generateOAuthState, verifyOAuthState } from './crypto';
import { syncEngine } from './syncEngine';
import { ShopifyAdapter } from './adapters/shopifyAdapter';
import { MetaAdapter } from './adapters/metaAdapter';
import { ProviderType } from './types';
import { evaluateExperiment } from './experimentationEngine';
import {
  validateEvaluatePayload,
  validateSyncPayload,
  validateDisconnectPayload,
  validateOAuthInitiateQuery,
} from './validators';
import { serverMonitoring } from './monitoring';

// Helper to parse JSON body
async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export async function handleIntegrationApi(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const parsed = parseUrl(req.url || '', true);
  const pathname = parsed.pathname || '';

  if (!pathname.startsWith('/api/integrations') && !pathname.startsWith('/api/experiments')) {
    return false; // Not a handled API route
  }

  const method = req.method || 'GET';
  const query = parsed.query;

  try {
    // -------------------------------------------------------------------------
    // 1. GET /api/integrations/status
    // -------------------------------------------------------------------------
    if (pathname === '/api/integrations/status' && method === 'GET') {
      const orgId = (query.organizationId as string) || 'a0000000-0000-0000-0000-000000000001';

      const shopifyConn = await syncEngine.getConnection(orgId, 'shopify');
      const metaConn = await syncEngine.getConnection(orgId, 'meta');

      // Strip sensitive encrypted token fields before sending to client
      const sanitize = (conn: any, provider: ProviderType) => ({
        id: conn?.id || `conn-${provider}`,
        organization_id: orgId,
        provider,
        status: conn?.status || 'connected',
        account_id: conn?.account_id || (provider === 'shopify' ? 'bombay-threads.myshopify.com' : 'act_884920147'),
        account_name: conn?.account_name || (provider === 'shopify' ? 'Bombay Threads D2C Store' : 'Meta Ads — Bombay Threads'),
        last_sync_at: conn?.last_sync_at || new Date().toISOString(),
        last_sync_status: conn?.last_sync_status || 'success',
        last_error: conn?.last_error || null,
        metadata: conn?.metadata || { mode: 'mock_development' },
      });

      sendJson(res, 200, {
        shopify: sanitize(shopifyConn, 'shopify'),
        meta: sanitize(metaConn, 'meta'),
      });
      return true;
    }

    // -------------------------------------------------------------------------
    // 2. GET /api/integrations/oauth/start
    // -------------------------------------------------------------------------
    if (pathname === '/api/integrations/oauth/start' && method === 'GET') {
      const provider = query.provider as ProviderType;
      const orgId = (query.organizationId as string) || 'a0000000-0000-0000-0000-000000000001';
      const shopDomain = (query.shop as string) || 'bombay-threads.myshopify.com';

      if (!provider || (provider !== 'shopify' && provider !== 'meta')) {
        sendJson(res, 400, { error: 'Invalid provider. Must be "shopify" or "meta".' });
        return true;
      }

      const state = generateOAuthState(orgId, provider);

      let authUrl = '';
      if (provider === 'shopify') {
        const adapter = new ShopifyAdapter();
        authUrl = adapter.getAuthorizationUrl(shopDomain, state);
      } else {
        const adapter = new MetaAdapter();
        authUrl = adapter.getAuthorizationUrl(state);
      }

      sendJson(res, 200, { authorizationUrl: authUrl, state });
      return true;
    }

    // -------------------------------------------------------------------------
    // 3. GET /api/integrations/oauth/callback
    // -------------------------------------------------------------------------
    if (pathname === '/api/integrations/oauth/callback' && method === 'GET') {
      const provider = query.provider as ProviderType;
      const code = query.code as string;
      const stateStr = query.state as string;
      const shop = query.shop as string;

      const state = verifyOAuthState(stateStr);
      const orgId = state?.organizationId || 'a0000000-0000-0000-0000-000000000001';

      if (!code) {
        sendJson(res, 400, { error: 'Missing OAuth authorization code' });
        return true;
      }

      let rawToken = '';
      let accountId = '';
      let accountName = '';

      if (provider === 'shopify') {
        const adapter = new ShopifyAdapter();
        const tokenResult = await adapter.exchangeCodeForToken(shop || 'bombay-threads.myshopify.com', code);
        rawToken = tokenResult.accessToken;
        accountId = shop || 'bombay-threads.myshopify.com';
        accountName = `${accountId.split('.')[0]} Store`;
      } else {
        const adapter = new MetaAdapter();
        const tokenResult = await adapter.exchangeCodeForToken(code);
        rawToken = tokenResult.accessToken;
        accountId = tokenResult.accountId;
        accountName = tokenResult.accountName;
      }

      // Encrypt token with AES-256-GCM
      const encrypted = encryptToken(rawToken);

      // Save encrypted connection
      await syncEngine.updateConnectionStatus(orgId, provider, {
        status: 'connected',
        account_id: accountId,
        account_name: accountName,
        encrypted_access_token: encrypted.encrypted,
        token_iv: encrypted.iv,
        token_auth_tag: encrypted.authTag,
        last_sync_status: 'success',
        last_error: null,
      });

      // Automatically trigger initial sync
      await syncEngine.runSyncJob(orgId, provider, {
        triggerType: 'webhook',
        daysToSync: 14,
      });

      // Redirect back to Campaigns page in browser
      res.statusCode = 302;
      res.setHeader('Location', `/campaigns?connected=${provider}&status=success`);
      res.end();
      return true;
    }

    // -------------------------------------------------------------------------
    // 4. POST /api/integrations/connect (Direct/Mock connect)
    // -------------------------------------------------------------------------
    if (pathname === '/api/integrations/connect' && method === 'POST') {
      const body = await parseJsonBody(req);
      const provider = body.provider as ProviderType;
      const orgId = body.organizationId || 'a0000000-0000-0000-0000-000000000001';
      const accountId = body.accountId || (provider === 'shopify' ? 'bombay-threads.myshopify.com' : 'act_884920147');
      const accountName = body.accountName || (provider === 'shopify' ? 'Bombay Threads Store' : 'Meta Ads — Bombay Threads');

      // Generate a mock encrypted token
      const encrypted = encryptToken(`token_${provider}_${Date.now()}`);

      await syncEngine.updateConnectionStatus(orgId, provider, {
        status: 'connected',
        account_id: accountId,
        account_name: accountName,
        encrypted_access_token: encrypted.encrypted,
        token_iv: encrypted.iv,
        token_auth_tag: encrypted.authTag,
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
        last_error: null,
      });

      // Perform initial sync
      const syncResult = await syncEngine.runSyncJob(orgId, provider, { daysToSync: 14 });

      sendJson(res, 200, {
        success: true,
        message: `Successfully connected ${provider}`,
        syncResult,
      });
      return true;
    }

    // -------------------------------------------------------------------------
    // 5. POST /api/integrations/sync
    // -------------------------------------------------------------------------
    if (pathname === '/api/integrations/sync' && method === 'POST') {
      const body = await parseJsonBody(req);
      const validation = validateSyncPayload(body);
      if (!validation.isValid) {
        sendJson(res, 400, { success: false, error: validation.error });
        return true;
      }

      const provider = body.provider as ProviderType;
      const orgId = body.organizationId || 'a0000000-0000-0000-0000-000000000001';
      const days = body.days || 14;

      const result = await syncEngine.runSyncJob(orgId, provider, {
        daysToSync: days,
        idempotencyKey: body.idempotencyKey,
      });

      sendJson(res, result.success ? 200 : 500, result);
      return true;
    }

    // -------------------------------------------------------------------------
    // 6. POST /api/integrations/disconnect
    // -------------------------------------------------------------------------
    if (pathname === '/api/integrations/disconnect' && method === 'POST') {
      const body = await parseJsonBody(req);
      const validation = validateDisconnectPayload(body);
      if (!validation.isValid) {
        sendJson(res, 400, { success: false, error: validation.error });
        return true;
      }

      const provider = body.provider as ProviderType;
      const orgId = body.organizationId || 'a0000000-0000-0000-0000-000000000001';

      await syncEngine.updateConnectionStatus(orgId, provider, {
        status: 'disconnected',
        encrypted_access_token: null,
        token_iv: null,
        token_auth_tag: null,
        last_error: null,
      });

      sendJson(res, 200, { success: true, message: `Disconnected ${provider}` });
      return true;
    }

    // -------------------------------------------------------------------------
    // 7. GET /api/integrations/metrics
    // -------------------------------------------------------------------------
    if (pathname === '/api/integrations/metrics' && method === 'GET') {
      const orgId = (query.organizationId as string) || 'a0000000-0000-0000-0000-000000000001';
      const provider = query.provider as ProviderType | undefined;

      let metrics = await syncEngine.getMetrics(orgId, provider);

      // If empty, prime with initial sync for smooth dev experience
      if (metrics.length === 0) {
        await syncEngine.runSyncJob(orgId, 'shopify', { daysToSync: 14 });
        await syncEngine.runSyncJob(orgId, 'meta', { daysToSync: 14 });
        metrics = await syncEngine.getMetrics(orgId, provider);
      }

      sendJson(res, 200, {
        organizationId: orgId,
        count: metrics.length,
        metrics,
      });
      return true;
    }

    // -------------------------------------------------------------------------
    // 8. POST /api/experiments/evaluate
    // -------------------------------------------------------------------------
    if (pathname === '/api/experiments/evaluate' && method === 'POST') {
      const body = await parseJsonBody(req);
      const validation = validateEvaluatePayload(body);
      if (!validation.isValid) {
        sendJson(res, 400, { success: false, error: validation.error });
        return true;
      }

      const evaluation = evaluateExperiment(body.experiment, body.settings);
      sendJson(res, 200, evaluation);
      return true;
    }

    sendJson(res, 404, { error: 'Unknown API endpoint' });
    return true;
  } catch (error: any) {
    serverMonitoring.captureException(error, { endpoint: pathname });
    sendJson(res, 500, { error: error.message || 'Internal Server Error' });
    return true;
  }
}
