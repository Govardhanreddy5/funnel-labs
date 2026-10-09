# Funnel Labs — Production Readiness Checklist

This pre-flight readiness checklist verifies that the Funnel Labs marketing experimentation platform meets enterprise production standards across security, performance, data integrity, and compliance.

---

## 1. Code Quality & Automated Test Coverage

- [x] **Linting & Code Formatting**:
  - `npm run lint` completes with **0 errors and 0 warnings** under strict ESLint configuration.
  - `npm run format:check` validates formatting conformance across all files.
- [x] **Unit & Integration Test Suite**:
  - 38/38 unit and integration tests passing (`npm test`).
  - Covers: Two-proportion Z-score calculation, normal CDF approximation, zero-click edge cases, financial metrics (CVR, CPA, ROAS, AOV), Sample Ratio Mismatch (SRM) detection, 4 decision states, client form validation, password strength scoring, auth sessions, and campaign status transitions.
- [x] **End-to-End Test Suite**:
  - Playwright E2E suites implemented for authentication, experiment creation modal, and campaign status toggles.
- [x] **Continuous Integration**:
  - GitHub Actions CI workflow configured for Node 20.x and 22.x matrix verification, linting, unit tests, production build, and Playwright execution.

---

## 2. Authentication & Data Security (Multi-Tenancy)

- [x] **Multi-Tenant Data Isolation**:
  - PostgreSQL Row Level Security (RLS) active on all tables (`organizations`, `organization_members`, `campaigns`, `experiments`, `variants`, `notifications`, `user_settings`, `integration_connections`, `daily_campaign_metrics`).
  - Users are strictly quarantined within their respective organization workspace.
- [x] **Safe Environment Variable Handling**:
  - Runtime audit (`src/config/env.ts`) scans for backend secret keys and halts if server keys are inadvertently bundled.
  - Zero private credentials present in client-side code.
- [x] **Token Encryption**:
  - Merchant access tokens encrypted with AES-256-GCM authenticated encryption using distinct initialization vectors (IV) and authentication tags.
- [x] **Security Headers & CSP**:
  - Content-Security-Policy (CSP), HSTS, X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), and Referrer-Policy configured in `vercel.json` and local dev server.

---

## 3. Form Validation & User Experience

- [x] **Comprehensive Form Validation**:
  - RFC-compliant email validation on authentication, forgot password, and settings forms.
  - Password strength analyzer (score 0-4) with clear complexity rules.
  - Experiment form rules: end dates strictly after start dates, positive budget checks, duplicate variant name prevention.
  - Settings bounds: minimum sample sizes (50–100,000 visitors), confidence thresholds (80.0%–99.9%).
  - Integration validation: Shopify myshopify.com domains, Meta Ad Account numeric/act_ identifiers.
- [x] **Accessibility (a11y)**:
  - Error states equipped with `role="alert"` and `aria-live="assertive"`.
  - Loading states use `role="status"`, `aria-live="polite"`, and `sr-only` descriptions.
  - Form fields use `aria-invalid` and `aria-describedby` linking directly to error element IDs.
- [x] **Resilient Error Boundaries**:
  - Global `ErrorBoundary` catches unhandled exceptions and offers a recovery path.
  - Granular `WidgetErrorBoundary` protects individual dashboard charts and metrics from breaking the wider page.

---

## 4. Experimentation Engine & Statistical Integrity

- [x] **Server-Side Mathematical Calculation**:
  - Calculates clicks, purchases, revenue, conversion rate, CPA, ROAS, and variant lift dynamically.
- [x] **Two-Proportion Z-Test Significance**:
  - Mathematical model with pooled variance and rational approximation for standard normal CDF.
- [x] **4 Explicit Decision States**:
  - `insufficient_data`: Sample size below minimum threshold.
  - `in_progress`: Minimum sample met, but confidence below configured threshold.
  - `winner_declared`: Decisive statistical significance achieved.
  - `inconclusive`: Experiment concluded without reaching significance.
- [x] **Configurable Settings Integration**:
  - Thresholds dynamically read from user settings (`confidenceThreshold` and `minSampleSize`).
- [x] **Transparent Assumptions & Limitations**:
  - Detailed methodology notes displayed directly in UI and payload (stationarity, independent observations, attribution window).

---

## 5. Observability & Deployment Configuration

- [x] **Sentry-Ready Error Monitoring**:
  - `src/utils/monitoring.ts` and `server/monitoring.ts` read `VITE_SENTRY_DSN` and dispatch structured error telemetry, user context, and breadcrumbs.
  - Graceful dev console logging when DSN is unconfigured.
- [x] **Vercel Deployment Spec**:
  - `vercel.json` with SPA routing rewrites, cache-control headers, and edge security headers.
- [x] **Documentation & Strategy Guides**:
  - Complete deployment manual in `docs/DEPLOYMENT.md`.
  - Staging vs Production environment strategy in `docs/STAGING_AND_PRODUCTION.md`.

---

## 6. Pre-Flight Sign-Off Status

| Check Category | Status | Notes |
|---|---|---|
| TypeScript Compilation | **PASSED** | 0 build errors |
| ESLint Rules | **PASSED** | 0 warnings, 0 errors |
| Unit & Integration Tests | **PASSED** | 38/38 passing |
| Production Build | **PASSED** | Optimized rollup chunk splitting |
| Security Headers | **PASSED** | Configured in vercel.json & vite.config.ts |
| Remaining Blockers | **NONE** | Application is 100% deployment-ready |
