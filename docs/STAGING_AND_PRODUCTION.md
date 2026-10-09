# Funnel Labs — Staging and Production Environment Strategy

This document details the multi-tier environment strategy, branch management, secret isolation, and database branching policies for Funnel Labs.

---

## 1. Environment Tier Matrix

| Dimension | Local Development | Staging / Preview | Production |
|---|---|---|---|
| **Purpose** | Rapid feature work, unit tests | Integration testing, stakeholder review | Live merchant traffic & ad spend |
| **Branch** | `feature/*`, `fix/*` | `staging` | `main` |
| **Vercel Target** | `localhost:5173` | `staging.funnel-labs.vercel.app` | `app.funnel-labs.com` |
| **Supabase Project** | Local Docker or Dev Project | `funnel-labs-staging` | `funnel-labs-prod` |
| **Integrations** | `USE_MOCK_INTEGRATIONS=true` | `USE_MOCK_INTEGRATIONS=true` | Live Shopify & Meta OAuth Apps |
| **Error Monitoring** | Console logger | Sentry (`environment: staging`) | Sentry (`environment: production`) |
| **Data Seed** | `npm run seed` mock brand | Clean demo organization | Real merchant data |

---

## 2. Git Branching & Promotion Workflow

```
[Feature Branch] ─────PR────► [staging] (Vercel Preview) ─────PR────► [main] (Production)
     │                             │                                       │
  Unit Tests                  Automated E2E                       Production Build
  ESLint Checks               Supabase Staging                    Zero-Downtime Rollout
```

1. **Feature Development**:
   - Create branches off `staging`: `git checkout -b feature/dynamic-allocation`.
   - Run linter and unit tests locally before pushing: `npm run lint && npm test`.
2. **Staging Review**:
   - Merge PR into `staging`.
   - GitHub Actions CI runs the full suite (lint, format, 38 unit & integration tests, production build, Playwright E2E).
   - Vercel automatically deploys to the Staging preview URL.
   - Perform user acceptance testing (UAT).
3. **Production Release**:
   - Open a pull request from `staging` to `main`.
   - Upon merge, Vercel initiates a production build and deploys to the global edge network.

---

## 3. Database Isolation & Migration Governance

> [!IMPORTANT]
> **Never share a Supabase instance between Staging and Production.** Staging data mutations or seed scripts could corrupt live merchant experiment histories and trigger false winner alerts.

### Migration Guidelines:
1. **Additive Schema Changes**: All column additions must be `NULL`able or have a safe default value.
2. **Two-Phase Deployments**:
   - *Phase 1*: Apply schema migration (new tables, columns, indexes).
   - *Phase 2*: Deploy application code utilizing new fields.
   - *Phase 3 (Optional)*: Deprecate or drop old columns only after all client versions stop referencing them.
3. **Rollback Safety**:
   Always prepare a corresponding down migration script for any non-trivial DDL alteration.

---

## 4. Secret Management & Key Rotation Protocol

### 4.1. AES-256-GCM Token Encryption Key
- The `INTEGRATION_ENCRYPTION_KEY` is a 32-byte cryptographically secure key used to encrypt merchant OAuth access tokens in PostgreSQL.
- To generate a secure key:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Rotation Procedure**:
  1. Generate `NEW_INTEGRATION_ENCRYPTION_KEY`.
  2. Run a migration script that reads records with `token_iv` and `token_auth_tag`, decrypts using `OLD_KEY`, and re-encrypts using `NEW_KEY`.
  3. Update the Vercel production environment variable and deploy.

### 4.2. Supabase Service Role Key
- Stored exclusively in server runtime and CI/CD secret vaults.
- Never exposed in frontend repositories or client-facing HTTP responses.

---

## 5. Live vs Mock Integration Policy

- In **Development and Staging**, setting `USE_MOCK_INTEGRATIONS="true"` activates the built-in deterministic adapters for Shopify and Meta Ads. This enables full end-to-end testing of sync engines, metrics tables, and experiment evaluations without incurring Meta API quotas or needing live store access.
- In **Production**, set `USE_MOCK_INTEGRATIONS="false"`. Verify that your Meta App has passed App Review for `ads_read` and `read_insights` permissions and your Shopify Partner App is approved for merchant installations.
