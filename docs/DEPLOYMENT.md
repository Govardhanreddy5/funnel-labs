# Funnel Labs — Production Deployment Guide: Vercel + Supabase

This guide provides step-by-step instructions for deploying Funnel Labs to production using **Vercel** (frontend and edge routing) and **Supabase** (PostgreSQL, Row Level Security, and Authentication).

---

## Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │             Vercel Edge CDN             │
                      │   - Vite React Single Page App (SPA)    │
                      │   - Strict Security Headers & CSP       │
                      │   - Sentry Client Error Monitoring      │
                      └────────────────────┬────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
                    ▼                                             ▼
       ┌────────────────────────┐                   ┌───────────────────────────┐
       │     Supabase Cloud     │                   │   Ad & Commerce APIs      │
       │ - PostgreSQL Database  │                   │ - Shopify Admin GraphQL   │
       │ - Multi-Tenant RLS     │                   │ - Meta Marketing Graph    │
       │ - Supabase Auth & JWT  │                   │ - AES-256-GCM Tokens      │
       └────────────────────────┘                   └───────────────────────────┘
```

---

## 1. Supabase Database & Auth Setup

### Step 1.1: Create a Production Project
1. Go to the [Supabase Dashboard](https://supabase.com/dashboard) and create a new project (e.g., `funnel-labs-prod`).
2. Select your target region (e.g., `ap-south-1 (Mumbai)` or closest to your primary customer base).
3. Save the generated **Database Password** in a secure password manager.

### Step 1.2: Apply Database Schema & Migrations
In the Supabase SQL Editor, run the migration scripts located in this repository in order:

1. **Core Schema & Multi-Tenancy**:
   Execute [`supabase/migrations/20261009000000_init_funnel_labs.sql`](../supabase/migrations/20261009000000_init_funnel_labs.sql):
   - Tables: `organizations`, `organization_members`, `campaigns`, `experiments`, `variants`, `notifications`, `user_settings`.
   - Security: RLS policies isolating records by `organization_id`.
   - Automatic triggers for updated timestamps.

2. **Integrations & Daily Metrics**:
   Execute [`supabase/migrations/20261009000001_integrations_and_metrics.sql`](../supabase/migrations/20261009000001_integrations_and_metrics.sql):
   - Tables: `integration_connections`, `integration_sync_logs`, `daily_campaign_metrics`.
   - Idempotency indexes: `(organization_id, provider, external_campaign_id, metric_date)`.
   - Encrypted token storage columns with initialization vector (IV) and GCM authentication tag.

### Step 1.3: Configure Supabase Authentication
1. Go to **Authentication -> URL Configuration**:
   - **Site URL**: `https://funnel-labs.vercel.app` (or your custom domain `https://app.yourbrand.com`).
   - **Redirect URLs**:
     - `https://funnel-labs.vercel.app/**`
     - `https://funnel-labs.vercel.app/update-password`
     - `http://localhost:5173/**` (for local development)
2. Under **Authentication -> Email Templates**, review password reset and invite emails to use your custom sender domain.

---

## 2. Vercel Deployment Setup

### Step 2.1: Import Repository
1. Log into [Vercel](https://vercel.com) and click **Add New -> Project**.
2. Select your GitHub repository (`funnel-labs`).
3. Set the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

### Step 2.2: Configure Environment Variables
Add the following variables in **Vercel Project Settings -> Environment Variables**:

| Variable Name | Environment | Description | Example / Source |
|---|---|---|---|
| `VITE_APP_TITLE` | All | Application Title | `Funnel Labs — D2C Growth & Experimentation` |
| `VITE_APP_ENV` | Production | Environment mode | `production` |
| `VITE_APP_VERSION` | All | Semantic release version | `1.0.0` |
| `VITE_SUPABASE_URL` | All | Supabase API URL | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | All | Supabase Public Anon Key | `sb_publishable_...` |
| `VITE_SENTRY_DSN` | Production, Preview | Sentry Error Tracking DSN | `https://xxxx@o1234.ingest.sentry.io/5678` |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | Production | Performance Traces Rate | `0.1` |
| `INTEGRATION_ENCRYPTION_KEY` | Production | AES-256-GCM 32-byte Key | 64-char Hex string (Keep strictly server-side) |
| `USE_MOCK_INTEGRATIONS` | Production | Mock fallback toggle | `false` |
| `SHOPIFY_CLIENT_ID` | Production | Shopify Partner App Key | From Shopify Partner App Settings |
| `SHOPIFY_CLIENT_SECRET` | Production | Shopify App Secret | From Shopify Partner App Settings |
| `META_APP_ID` | Production | Meta Developer App ID | From Meta Developers Portal |
| `META_APP_SECRET` | Production | Meta Developer App Secret | From Meta Developers Portal |

> [!CAUTION]
> Never prepend `VITE_` to `INTEGRATION_ENCRYPTION_KEY`, `SHOPIFY_CLIENT_SECRET`, or `META_APP_SECRET`. Doing so would expose secrets in the client-side JavaScript bundle!

---

## 3. Security Headers & Routing Verification

Funnel Labs includes an automated `vercel.json` configuration that applies defense-in-depth security headers across all edge responses:
- **Content-Security-Policy (CSP)**: Restricts scripts, styles, fonts, and connects strictly to trusted origins (`*.supabase.co`, `*.sentry.io`, Google Fonts).
- **X-Frame-Options**: `DENY` (prevents clickjacking attacks).
- **X-Content-Type-Options**: `nosniff` (prevents MIME sniffing).
- **Referrer-Policy**: `strict-origin-when-cross-origin`.
- **Permissions-Policy**: Disables camera, microphone, and geolocation.
- **Strict-Transport-Security (HSTS)**: 2-year duration with subdomains and preload enabled.

---

## 4. Post-Deployment Smoke Test Checklist

Once the deployment finishes:
1. **Visit Production URL**: Open `https://your-project.vercel.app`.
2. **Test Authentication**:
   - Register a test account (`test@yourbrand.com`).
   - Confirm successful organization generation in Supabase.
   - Verify protected routes redirect unauthenticated users to `/login`.
3. **Test Experiment Creation**:
   - Create an experiment with 2 variants.
   - Verify that calculated Z-scores, conversion rates, and decision states are populated without console errors.
4. **Test Campaign Status**:
   - Pause and resume a campaign; verify the toast notification and badge state.
5. **Inspect Sentry**:
   - Trigger a test exception to verify incoming telemetry on your Sentry dashboard.
