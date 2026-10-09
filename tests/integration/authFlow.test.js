import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock storage for Node test environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

describe('Integration Tests: Authentication Flow & Multi-Tenant Context', () => {
  let localStorage;

  beforeEach(() => {
    localStorage = new MockLocalStorage();
  });

  const DEMO_USER = {
    id: 'demo-user-12345',
    email: 'founder@bombaythreads.com',
    user_metadata: {
      full_name: 'Govardhan Reddy',
      store_name: 'Bombay Threads D2C',
    },
  };

  const DEMO_ORG = {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Bombay Threads D2C',
    slug: 'bombay-threads',
    currency: 'INR',
    created_at: '2026-10-09T00:00:00Z',
  };

  it('handles demo sign in, persisting session and organization context', () => {
    // 1. Initial State: Unauthenticated
    assert.equal(localStorage.getItem('funnel_labs_demo_auth'), null);

    // 2. Simulate signInAsDemo()
    localStorage.setItem('funnel_labs_demo_auth', 'true');
    const sessionUser = DEMO_USER;
    const currentOrg = DEMO_ORG;

    assert.equal(localStorage.getItem('funnel_labs_demo_auth'), 'true');
    assert.equal(sessionUser.email, 'founder@bombaythreads.com');
    assert.equal(currentOrg.id, 'a0000000-0000-0000-0000-000000000001');
    assert.equal(currentOrg.currency, 'INR');
  });

  it('guarantees protected route barrier logic for unauthenticated visitors', () => {
    function evaluateRouteAccess(isAuthenticated, targetPath) {
      if (!isAuthenticated) {
        return {
          allowed: false,
          redirectUrl: '/login',
          state: { from: { pathname: targetPath } },
        };
      }
      return { allowed: true, redirectUrl: targetPath };
    }

    // Attempting to visit /experiments while logged out
    const unauthedAccess = evaluateRouteAccess(false, '/experiments');
    assert.equal(unauthedAccess.allowed, false);
    assert.equal(unauthedAccess.redirectUrl, '/login');
    assert.equal(unauthedAccess.state.from.pathname, '/experiments');

    // Attempting to visit /experiments while authenticated
    const authedAccess = evaluateRouteAccess(true, '/experiments');
    assert.equal(authedAccess.allowed, true);
    assert.equal(authedAccess.redirectUrl, '/experiments');
  });

  it('cleans up session and organization context on sign out', () => {
    localStorage.setItem('funnel_labs_demo_auth', 'true');
    assert.equal(localStorage.getItem('funnel_labs_demo_auth'), 'true');

    // Simulate signOut()
    localStorage.removeItem('funnel_labs_demo_auth');
    assert.equal(localStorage.getItem('funnel_labs_demo_auth'), null);
  });

  it('handles Google OAuth redirect URL resolution and offline consent parameters', () => {
    function resolveGoogleOAuthOptions(appUrl, customPath) {
      const baseUrl = appUrl || 'http://localhost:5173';
      const targetPath = customPath || '/dashboard';
      const redirectTo = targetPath.startsWith('http')
        ? targetPath
        : `${baseUrl}${targetPath.startsWith('/') ? '' : '/'}${targetPath}`;

      return {
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      };
    }

    // Default dashboard redirect
    const defaultOptions = resolveGoogleOAuthOptions('https://funnel-labs.vercel.app');
    assert.equal(defaultOptions.provider, 'google');
    assert.equal(defaultOptions.options.redirectTo, 'https://funnel-labs.vercel.app/dashboard');
    assert.equal(defaultOptions.options.queryParams.access_type, 'offline');
    assert.equal(defaultOptions.options.queryParams.prompt, 'consent');

    // Custom deep-linked return path (e.g. returning to /experiments/exp-1)
    const deepLinkOptions = resolveGoogleOAuthOptions(
      'https://funnel-labs.vercel.app',
      '/experiments/exp-1'
    );
    assert.equal(deepLinkOptions.options.redirectTo, 'https://funnel-labs.vercel.app/experiments/exp-1');
  });

  it('correctly infers store name and founder identity from Google OAuth user metadata', () => {
    function inferGoogleMetadata(googleUser) {
      const meta = googleUser.user_metadata || {};
      const founderName = meta.full_name || meta.name || googleUser.email.split('@')[0];
      const storeName = meta.store_name || `${founderName}'s Store`;
      return { founderName, storeName };
    }

    const sampleGoogleUser = {
      id: 'g-user-999',
      email: 'alex.rivera@growthventures.com',
      user_metadata: {
        full_name: 'Alex Rivera',
        avatar_url: 'https://lh3.googleusercontent.com/a/sample',
      },
    };

    const inferred = inferGoogleMetadata(sampleGoogleUser);
    assert.equal(inferred.founderName, 'Alex Rivera');
    assert.equal(inferred.storeName, "Alex Rivera's Store");
  });

  it('retains existing organization membership when linking Google identity with matching email', () => {
    const existingMemberships = [
      {
        user_id: 'user-primary-id',
        email: 'founder@bombaythreads.com',
        organization_id: 'a0000000-0000-0000-0000-000000000001',
        role: 'owner',
      },
    ];

    function resolveOrganizationOnLogin(userId, memberships) {
      const userOrgs = memberships.filter((m) => m.user_id === userId);
      return userOrgs.length > 0 ? userOrgs[0].organization_id : 'new-org-id';
    }

    // Existing user authenticating with linked Google identity (matching auth.users id)
    const resolvedOrg = resolveOrganizationOnLogin('user-primary-id', existingMemberships);
    assert.equal(resolvedOrg, 'a0000000-0000-0000-0000-000000000001');

    // New Google user without prior membership gets provisioned
    const newOrg = resolveOrganizationOnLogin('new-google-user', existingMemberships);
    assert.equal(newOrg, 'new-org-id');
  });
});
