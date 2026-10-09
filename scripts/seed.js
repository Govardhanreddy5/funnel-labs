import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Helper to read .env file manually
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[match[1]] = value;
      }
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('Connecting to Supabase at:', supabaseUrl);

const DEMO_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

async function seed() {
  console.log('Starting Funnel Labs database seed...');

  // 1. Seed or Upsert Organization
  console.log('1. Seeding Organization...');
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .upsert(
      {
        id: DEMO_ORG_ID,
        name: 'Bombay Threads D2C',
        slug: 'bombay-threads-d2c',
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (orgError) {
    console.error('Error inserting organization:', orgError.message);
    console.log('\nNOTE: If the table does not exist, run the migration in supabase/schema.sql in your Supabase SQL Editor first.\n');
    process.exit(1);
  }
  console.log('  Organization ready:', orgData.name, `(${orgData.id})`);

  // 2. Seed Campaigns
  console.log('2. Seeding Campaigns...');
  const campaigns = [
    {
      id: 'camp-1',
      organization_id: DEMO_ORG_ID,
      name: 'Instagram — T-Shirt Offer',
      channel: 'Instagram',
      status: 'Active',
      reach: 12500,
      clicks: 3100,
      purchases: 146,
      revenue: 30700,
      spend: 18000,
      connected_experiment_id: 'exp-1',
    },
    {
      id: 'camp-2',
      organization_id: DEMO_ORG_ID,
      name: 'Google Search — Summer Collection',
      channel: 'Google Search',
      status: 'Active',
      reach: 8400,
      clicks: 1950,
      purchases: 82,
      revenue: 14900,
      spend: 9500,
      connected_experiment_id: 'exp-2',
    },
    {
      id: 'camp-3',
      organization_id: DEMO_ORG_ID,
      name: 'Meta Ads — Festive Kurta Drop',
      channel: 'Facebook',
      status: 'Paused',
      reach: 5600,
      clicks: 890,
      purchases: 38,
      revenue: 7200,
      spend: 6000,
      connected_experiment_id: 'exp-3',
    },
    {
      id: 'camp-4',
      organization_id: DEMO_ORG_ID,
      name: 'WhatsApp VIP Broadcast — Diwali Preview',
      channel: 'WhatsApp',
      status: 'Completed',
      reach: 4200,
      clicks: 1450,
      purchases: 73,
      revenue: 24600,
      spend: 2500,
      connected_experiment_id: 'exp-4',
    },
  ];

  for (const c of campaigns) {
    const { error } = await supabase.from('campaigns').upsert(c, { onConflict: 'id' });
    if (error) console.error(`  Error seeding campaign ${c.id}:`, error.message);
  }
  console.log(`  Seeded ${campaigns.length} campaigns.`);

  // 3. Seed Experiments
  console.log('3. Seeding Experiments & Variants...');
  const experiments = [
    {
      id: 'exp-1',
      organization_id: DEMO_ORG_ID,
      name: 'T-Shirt Offer Campaign',
      type: 'Offer Test',
      status: 'Active',
      description: 'Testing different discount offers to improve purchases.',
      start_date: '2026-09-20',
      end_date: '2026-10-10',
      primary_goal: 'Purchases',
      budget: 25000,
      connected_campaign: 'Instagram — T-Shirt Offer',
      confidence_score: 98.4,
      winner_label: 'Variant B',
      winner_name: 'Ad B — Buy 2 Get 1',
      winner_reason: 'Ad B generated 35% more purchases at a lower cost per acquisition.',
      recommendation: 'Allocate more budget to Ad B and consider running it for a longer period.',
    },
    {
      id: 'exp-2',
      organization_id: DEMO_ORG_ID,
      name: 'Checkout Message Test',
      type: 'Message Test',
      status: 'Planned',
      description: 'Testing cart abandonment reduction messages at checkout step.',
      start_date: '2026-10-12',
      end_date: '2026-10-26',
      primary_goal: 'Conversion Rate',
      budget: 15000,
      connected_campaign: 'Google Search — Summer Collection',
      confidence_score: 0,
      winner_name: 'Not available',
      winner_reason: 'Experiment not yet launched.',
      recommendation: 'Launch campaign once creative assets are approved.',
    },
    {
      id: 'exp-3',
      organization_id: DEMO_ORG_ID,
      name: 'Festive Kurta Creative Test',
      type: 'Ad Creative',
      status: 'Completed',
      description: 'Comparing user-generated video review vs studio flatlay imagery.',
      start_date: '2026-09-01',
      end_date: '2026-09-18',
      primary_goal: 'Purchases',
      budget: 20000,
      connected_campaign: 'Meta Ads — Festive Kurta Drop',
      confidence_score: 96.2,
      winner_label: 'Variant B',
      winner_name: 'Creator UGC Reel',
      winner_reason: 'UGC creative yielded 2.2x click-through rate and 44% lower cost per acquisition.',
      recommendation: 'Scale UGC formats across all Meta campaigns.',
    },
    {
      id: 'exp-4',
      organization_id: DEMO_ORG_ID,
      name: 'Mobile PDP Layout Experiment',
      type: 'Landing Page',
      status: 'Completed',
      description: 'Sticky Add-to-Cart vs Standard static checkout button on mobile viewport.',
      start_date: '2026-08-15',
      end_date: '2026-08-30',
      primary_goal: 'Conversion Rate',
      budget: 10000,
      connected_campaign: 'WhatsApp VIP Broadcast — Diwali Preview',
      confidence_score: 99.1,
      winner_label: 'Variant A',
      winner_name: 'Sticky Add to Cart Bar',
      winner_reason: 'Sticky CTA increased checkout initiation rate by 22% across mobile visitors.',
      recommendation: 'Permanent deployment across theme code.',
    },
  ];

  for (const exp of experiments) {
    const { error } = await supabase.from('experiments').upsert(exp, { onConflict: 'id' });
    if (error) console.error(`  Error seeding experiment ${exp.id}:`, error.message);
  }
  console.log(`  Seeded ${experiments.length} experiments.`);

  // 4. Seed Variants
  const variants = [
    {
      id: 'var-1a',
      experiment_id: 'exp-1',
      organization_id: DEMO_ORG_ID,
      label: 'Variant A',
      name: 'Ad A — 20% Off',
      tagline: '20% Off Today',
      clicks: 1240,
      purchases: 62,
      revenue: 12400,
      conversion_rate: 5.0,
      cost_per_conversion: 200,
      is_winner: false,
    },
    {
      id: 'var-1b',
      experiment_id: 'exp-1',
      organization_id: DEMO_ORG_ID,
      label: 'Variant B',
      name: 'Ad B — Buy 2 Get 1',
      tagline: 'Buy 2, Get 1 Free',
      clicks: 1860,
      purchases: 84,
      revenue: 18300,
      conversion_rate: 9.0,
      cost_per_conversion: 120,
      is_winner: true,
    },
    {
      id: 'var-2a',
      experiment_id: 'exp-2',
      organization_id: DEMO_ORG_ID,
      label: 'Variant A',
      name: 'Message A — Free Delivery Countdown',
      tagline: 'Order in the next 15 mins for Free Priority Delivery',
      clicks: 0,
      purchases: 0,
      revenue: 0,
      conversion_rate: 0,
      cost_per_conversion: 0,
      is_winner: false,
    },
    {
      id: 'var-2b',
      experiment_id: 'exp-2',
      organization_id: DEMO_ORG_ID,
      label: 'Variant B',
      name: 'Message B — Instant ₹150 Cashback',
      tagline: 'Pay via UPI and get ₹150 instant cashback',
      clicks: 0,
      purchases: 0,
      revenue: 0,
      conversion_rate: 0,
      cost_per_conversion: 0,
      is_winner: false,
    },
    {
      id: 'var-3a',
      experiment_id: 'exp-3',
      organization_id: DEMO_ORG_ID,
      label: 'Variant A',
      name: 'Studio Flatlay Photo',
      tagline: 'Handloom Cotton Kurtas — Pure Heritage',
      clicks: 410,
      purchases: 12,
      revenue: 2400,
      conversion_rate: 2.9,
      cost_per_conversion: 500,
      is_winner: false,
    },
    {
      id: 'var-3b',
      experiment_id: 'exp-3',
      organization_id: DEMO_ORG_ID,
      label: 'Variant B',
      name: 'Creator UGC Reel',
      tagline: 'Unboxing my favorite festive fit for Diwali',
      clicks: 890,
      purchases: 38,
      revenue: 7200,
      conversion_rate: 4.3,
      cost_per_conversion: 158,
      is_winner: true,
    },
    {
      id: 'var-4a',
      experiment_id: 'exp-4',
      organization_id: DEMO_ORG_ID,
      label: 'Variant A',
      name: 'Sticky Add to Cart Bar',
      tagline: 'Persistent bottom checkout pill on scroll',
      clicks: 1450,
      purchases: 73,
      revenue: 24600,
      conversion_rate: 5.0,
      cost_per_conversion: 34,
      is_winner: true,
    },
    {
      id: 'var-4b',
      experiment_id: 'exp-4',
      organization_id: DEMO_ORG_ID,
      label: 'Variant B',
      name: 'Default Static Button',
      tagline: 'Standard static CTA above description fold',
      clicks: 1120,
      purchases: 45,
      revenue: 15100,
      conversion_rate: 4.0,
      cost_per_conversion: 55,
      is_winner: false,
    },
  ];

  for (const v of variants) {
    const { error } = await supabase.from('variants').upsert(v, { onConflict: 'id' });
    if (error) console.error(`  Error seeding variant ${v.id}:`, error.message);
  }
  console.log(`  Seeded ${variants.length} variants.`);

  // 5. Seed Notifications
  console.log('4. Seeding Notifications...');
  const notifications = [
    {
      id: 'notif-1',
      organization_id: DEMO_ORG_ID,
      title: 'Statistical Winner Determined!',
      description: 'Ad B — Buy 2 Get 1 reached 98.4% confidence in T-Shirt Offer test.',
      time_label: '10m ago',
      is_read: false,
      type: 'success',
    },
    {
      id: 'notif-2',
      organization_id: DEMO_ORG_ID,
      title: 'Budget Alert: Instagram Campaign',
      description: '80% of testing budget utilized for Diwali Flash Offer.',
      time_label: '2h ago',
      is_read: false,
      type: 'alert',
    },
    {
      id: 'notif-3',
      organization_id: DEMO_ORG_ID,
      title: 'Conversion Velocity Milestone',
      description: 'Store conversion rate crossed 9.0% for the first time this quarter.',
      time_label: '1d ago',
      is_read: true,
      type: 'info',
    },
  ];

  for (const n of notifications) {
    const { error } = await supabase.from('notifications').upsert(n, { onConflict: 'id' });
    if (error) console.error(`  Error seeding notification ${n.id}:`, error.message);
  }
  console.log(`  Seeded ${notifications.length} notifications.`);

  console.log('\nSeed script completed successfully! PostgreSQL database populated with Funnel Labs data.\n');
}

seed().catch((err) => {
  console.error('Fatal error during seed execution:', err);
  process.exit(1);
});
