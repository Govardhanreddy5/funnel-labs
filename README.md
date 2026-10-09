# Funnel Labs — Marketing Experimentation Platform for D2C Brands

> **Tagline:** “Test. Learn. Scale.”  
> **Core Mission:** “Turn Data into Growth.”

Funnel Labs is a B2B SaaS marketing experimentation platform purpose-built for small and early-stage D2C/e-commerce founders. It helps business owners test different ads, offers, messages, and marketing strategies, compare their results, identify what actually drives conversions, and make data-driven marketing decisions.

---

## 🚀 Key Value Proposition & Core UX Question

The entire dashboard is built to immediately answer the single most critical question every D2C founder faces:

> **“Which marketing option should I spend more money on?”**

For the active benchmark experiment (**T-Shirt Offer Campaign**), the answer is immediately transparent:

- **Ad B — Buy 2 Get 1 Free** is the decisive winner because it produces:
  - **+50% More Clicks** (1,860 vs 1,240)
  - **+35% More Purchases** (84 vs 62)
  - **+80% Higher Conversion Rate** (9.0% vs 5.0%)
  - **+48% Higher Revenue** (₹18,300 vs ₹12,400)
  - **₹80 Cheaper CPA** (₹120 vs ₹200 Cost per Conversion)

---

## 🛠️ Tech Stack

- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (Dark Navy sidebar `#0b132b`, Clean light background `#f8fafc`, Indigo accent `#6366f1`, Emerald green `#10b981`, Amber `#f59e0b`)
- **Visualizations:** Recharts (Grouped Bar Charts, Area Trend Charts, Multi-metric comparisons)
- **Icons:** Lucide React
- **Currency & Data:** Indian Rupee (INR ₹) with internally consistent conversion and ROAS formulas
- **State Management:** React Context API with full local persistence across modals, filters, and searches

---

## 📱 Pages & Features

### 1. Dashboard (`/`)
- **4 Key KPI Cards:**
  1. *Campaign Reach:* **12,500** (+28% from previous period)
  2. *Total Purchases:* **146** (+35% from previous period)
  3. *Total Revenue:* **₹30,700** (+42% from previous period)
  4. *Best Conversion Rate:* **9.0%** (+4.0% improvement)
- **Hero Active Experiment Card:** Side-by-side comparison of **Ad A (20% Off)** vs **Ad B (Buy 2 Get 1 Free)** with glowing winner badge and metric lifts.
- **Performance Comparison:** Recharts interactive bar chart with filters for All Metrics, Clicks & Purchases, and Rates & CPA.
- **Key Insight Card:** Direct takeaway stating *“Ad B generated 35% more purchases at a lower cost”* with budget scaling CTA.

### 2. Experiments (`/experiments`)
- Filter tabs: **All**, **Active**, **Planned**, and **Completed**
- Search filter & Card Grid / Table view toggle
- Rich experiment cards showing Status badge, Date range, Variants count, Conversion Rate, and Winning Variant
- Direct **“View Details”** navigation

### 3. Create Experiment Modal
- Accessible via persistent sidebar and top navigation `+ Create Experiment`
- Fields:
  - Experiment Name
  - Experiment Type (*Ad Creative, Offer, Message, Landing Page, Other*)
  - Variant A details (Name & Copy)
  - Variant B details (Name & Copy)
  - Primary Goal (*Purchases, Leads, Clicks, Revenue, Conversion Rate*)
  - Budget in INR (₹)
  - Start Date & End Date
  - Connected Campaign selector
- Full form validation, instant list insertion, and feedback toast notifications.

### 4. Experiment Details (`/experiment-detail`)
- Comprehensive study report for any experiment
- Winner callout banner with 98.4% statistical confidence score
- Side-by-side variant deep dive
- **Export Results:** Generates and downloads real `.csv` and `.json` reports directly in the browser!
- Strategic next steps and recommendations

### 5. Campaigns (`/campaigns`)
- Connected ad channels:
  - *Instagram — T-Shirt Offer* (Active: 12,500 Reach, 3,100 Clicks, 146 Purchases, ₹30,700 Revenue)
  - *Google Search — Summer Collection* (Active: 7,800 Reach, 1,950 Clicks, 71 Purchases, ₹14,900 Revenue)
  - *Facebook — New Customer Offer* (Paused: 5,400 Reach, 980 Clicks, 34 Purchases, ₹7,200 Revenue)
  - *WhatsApp Broadcast — VIP Flash Sale* (Completed: 3,200 Reach, 1,120 Clicks, 88 Purchases, ₹24,600 Revenue)
- Status toggles (**Pause / Resume Campaign**) with real-time toast feedback
- Blended ROAS tracker

### 6. Analytics (`/analytics`)
- Focused on actionable growth insights for D2C founders
- Dynamic timeframe selector: **Last 7 days**, **Last 30 days**, **Last 90 days**
- Recharts Area and Bar charts for Conversion Rate Trend, Revenue Trend, and Purchase Volume
- **4 Actionable Marketing Insights Cards:**
  1. *“Buy 2 Get 1 offers are currently converting 80% better than the 20% discount.”*
  2. *“Ad B has the lowest cost per conversion.”*
  3. *“Instagram currently generates the highest purchase volume.”*
  4. *“Your conversion rate improved from 5.0% to 9.0% during the latest experiment.”*

### 7. Settings (`/settings`)
- Profile (Founder name, email)
- Business Information (Connected store: Bombay Threads D2C, Platform: Shopify, INR Currency, Ad budget)
- Notification Preferences (Winner alerts, Daily executive digest, Budget milestones)
- Experimentation Preferences (Confidence threshold slider, Minimum sample size, Auto-pause losing variants)

### 8. Global Search & Notifications
- Interactive Search Bar: Real-time dropdown search across experiments, campaigns, and insights.
- Notification Center: Bell popover with unread counter, filter tags, and "Mark all read".

---

## 🏃 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run local dev server
npm run dev

# 3. Open in browser
http://localhost:5173
```

---

## 🔐 Supabase Authentication & PostgreSQL Persistence

Funnel Labs includes an end-to-end multi-tenant database and authentication foundation powered by Supabase.

### 1. Database Architecture & Multi-Tenancy

- **Multi-Tenant Model:** Each founder belongs to an organization/store (`organizations` & `organization_members`).
- **Row Level Security (RLS):** All data (`campaigns`, `experiments`, `variants`, `notifications`, `user_settings`) is secured by organization isolation policies using `get_user_organizations()`.
- **Automatic Organization Provisioning:** An `on_auth_user_created` trigger automatically provisions a new organization, assigns the user as `owner`, and initializes `user_settings` upon sign-up.

### 2. Database Schema Migration

The complete PostgreSQL migration script is located at:
- `supabase/schema.sql` (or `supabase/migrations/20261009000000_init_funnel_labs.sql`)

**To run the migration in Supabase:**
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project: **Govardhanreddy5's Project** (`lxrkseksulgsercthjjp`).
3. Click on **SQL Editor** in the left sidebar.
4. Click **New query**, paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
5. All 7 tables, foreign key constraints, indexes, RLS policies, and triggers will be created.

### 3. Development Seed Script

To populate the database with the pre-configured Bombay Threads D2C campaigns, experiments, variants, and notifications:

```bash
# Runs scripts/seed.js using credentials from your .env file
npm run seed
```

### 4. Environment Variables

Create a `.env` file in the project root (see `.env.example` for reference):

```bash
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"
```

> **Security Note:** `VITE_SUPABASE_ANON_KEY` is the public key for client-side authentication and RLS queries. `SUPABASE_SERVICE_ROLE_KEY` is only used by `scripts/seed.js` for administrative data seeding and is never bundled in the frontend.

### 5. Authentication & Routes

- `/login` — Sign In with email/password or **Continue with Google**
- `/register` — Sign Up with email/password or **Continue with Google** (automatically provisions organization and founder workspace)
- `/forgot-password` — Password reset link dispatch
- `/reset-password` — Secure password update form
- Protected Routes: Dashboard (`/dashboard`), Experiments (`/experiments`), Campaigns (`/campaigns`), Analytics (`/analytics`), Settings (`/settings`).
- Google OAuth: Configured via Supabase Auth with OAuth 2.0 PKCE flow, automated organization creation, and verified email identity linking.

---

## 🔌 Real Data Integrations (Shopify & Meta Ads / Instagram)

Funnel Labs features a production-ready data integration layer that ingests real sales from Shopify and ad metrics from Meta Ads / Instagram.

### 1. Security & Token Encryption (AES-256-GCM)

- **Zero Browser Exposure:** Third-party OAuth client secrets and raw access tokens are **never exposed to the browser bundle**. All OAuth token exchanges and provider API calls remain 100% server-side.
- **Authenticated Encryption:** Tokens are encrypted in PostgreSQL using **AES-256-GCM** with a 256-bit key, unique 96-bit (12-byte) initialization vector (`token_iv`), and 128-bit authentication tag (`token_auth_tag`).
- **CSRF-Protected OAuth States:** OAuth state parameters are cryptographically signed with HMAC-SHA256 containing the user's `organizationId`, a cryptographic nonce, and a 15-minute expiration timestamp.

### 2. Normalized PostgreSQL Data Model

1. **`integration_connections`:** Tracks connection state (`connected`, `syncing`, `disconnected`, `error`), store domain, ad account ID, encrypted tokens, and `last_sync_at`.
2. **`sync_jobs`:** Idempotent sync job logs tracking `idempotency_key`, retry counts, rate-limit headers, and error logs.
3. **`campaign_metrics_daily`:** Normalized time-series performance data:
   - `organization_id`, `provider`, `campaign_id`, `campaign_name`, `date`
   - `impressions`, `reach`, `clicks`, `spend`, `purchases`, `revenue`
   - Dynamically calculated conversion metrics: `ctr` (Clicks / Impressions), `cvr` (Purchases / Clicks), `cpa` (Spend / Purchases), and `roas` (Revenue / Spend).
   - Enforces unique constraint on `(organization_id, provider, campaign_id, date)` for idempotent upserting.

### 3. Server-Side Sync Engine & Rate-Limit Handling

- **Idempotency:** Every sync execution validates `idempotencyKey = sync_{orgId}_{provider}_{timestamp}` to guarantee duplicate requests do not trigger concurrent jobs.
- **Rate-Limit Handling:**
  - **Shopify:** Tracks `X-Shopify-Shop-Api-Call-Limit` (e.g. `38/40`). Automatically respects `Retry-After` headers on HTTP 429.
  - **Meta Ads:** Inspects `X-Business-Use-Case-Usage` and `X-App-Usage` headers. Automatically throttles requests if call count exceeds 85%.
- **Exponential Backoff & Retries:** Transient errors (HTTP 429, 500, 502, 503, 504, and network timeouts) are retried up to 3 times with exponential backoff and random jitter.

### 4. Mocked Provider Adapters for Local Development

When `USE_MOCK_INTEGRATIONS="true"` (the default in `.env`), the application utilizes built-in development adapters:
- **Shopify Adapter:** Generates realistic D2C order transactions and revenue for *Bombay Threads* across the last 14–30 days.
- **Meta Ads Adapter:** Generates realistic Instagram Feed/Reels and Facebook campaign spend, impressions, clicks, purchases, and ROAS.
- Allows full end-to-end testing of the "Sync Now" workflows, rate-limit logic, and normalized table rendering without needing live merchant credentials.

### 5. Server Endpoints

The server middleware runs directly within the Vite dev server (`http://localhost:5173/api/integrations/*`):
- `GET /api/integrations/status` — Returns public, sanitized connection statuses (tokens omitted).
- `GET /api/integrations/oauth/start` — Generates OAuth authorization URL with signed state.
- `GET /api/integrations/oauth/callback` — Handles OAuth redirect, exchanges code, encrypts token, and triggers initial sync.
- `POST /api/integrations/connect` — Direct / mock connect handler.
- `POST /api/integrations/disconnect` — Revokes connection.
- `POST /api/integrations/sync` — Triggers idempotent synchronization job with exponential backoff.
- `GET /api/integrations/metrics` — Returns normalized daily time-series metrics.

---

## 🚀 Production Deployment & Quality Verification

### 1. Production Architecture (Vercel + Supabase)
- **Frontend & Edge Hosting**: Vercel SPA with automated route rewrites and defense-in-depth HTTP security headers in [`vercel.json`](vercel.json).
- **Backend & Multi-Tenant Database**: Supabase PostgreSQL with Row Level Security (RLS) policies scoped via `get_user_organizations()`.
- **Error Telemetry**: Sentry error monitoring and performance tracing with global unhandled rejection hooks.
- **Detailed Step-by-Step Guides**:
  - [Production Deployment Guide (`docs/DEPLOYMENT.md`)](docs/DEPLOYMENT.md)
  - [Staging vs. Production Environment Guide (`docs/STAGING_AND_PRODUCTION.md`)](docs/STAGING_AND_PRODUCTION.md)

### 2. Quality Pipeline & Commands
Run all quality checks locally before deploying:

```bash
# 1. Run Unit & Integration Test Suite (38 tests)
npm run test

# 2. Run ESLint Quality Check (0 warnings allowed)
npm run lint

# 3. Check Prettier Formatting
npm run format:check

# 4. Compile Production Build
npm run build
```

### 3. CI/CD Pipeline
Continuous Integration is configured via [GitHub Actions (`.github/workflows/ci.yml`)](.github/workflows/ci.yml):
- **Lint & Format Verification**: ESLint (`--max-warnings 0`) + Prettier format validation.
- **Matrix Testing**: Node.js 20.x & 22.x execution of full test suite.
- **Production Build**: Vite asset compilation with bundle output verification.
- **End-to-End Testing**: Playwright headless browser execution with artifact upload on failure.

