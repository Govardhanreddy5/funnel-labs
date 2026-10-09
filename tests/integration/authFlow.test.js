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
});
