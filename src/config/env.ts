/**
 * Type-safe, validated environment configuration for Funnel Labs.
 * Enforces strict boundary separation between client-safe variables
 * and server secrets to prevent accidental credential leakage into client bundles.
 */

export interface AppEnvConfig {
  appTitle: string;
  appEnv: 'development' | 'staging' | 'production';
  appVersion: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  sentryDsn?: string;
  tracesSampleRate: number;
  enableAnalyticsExport: boolean;
  enableAuditLogs: boolean;
  isProduction: boolean;
  isStaging: boolean;
  isDevelopment: boolean;
}

// Security guardrail: Audit client environment to guarantee no backend secrets leaked
function auditClientEnvSecurity() {
  const dangerousPatterns = [
    'SERVICE_ROLE',
    'ENCRYPTION_KEY',
    'CLIENT_SECRET',
    'APP_SECRET',
    'PRIVATE_KEY',
  ];

  for (const key of Object.keys(import.meta.env)) {
    for (const pattern of dangerousPatterns) {
      if (key.includes(pattern)) {
        console.error(
          `[CRITICAL SECURITY ALERT] Private secret key "${key}" detected in client bundle! Server secrets must never be prefixed with VITE_.`
        );
      }
    }
  }
}

auditClientEnvSecurity();

const getEnvVar = (key: string, defaultValue: string): string => {
  return import.meta.env[key] !== undefined ? String(import.meta.env[key]) : defaultValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1' || value === true;
};

const currentEnv = getEnvVar(
  'VITE_APP_ENV',
  import.meta.env.MODE || 'development'
) as AppEnvConfig['appEnv'];

if (currentEnv === 'production') {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error(
      '[CRITICAL CONFIGURATION ERROR] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be explicitly configured in production environment variables.'
    );
  }
}

export const env: AppEnvConfig = {
  appTitle: getEnvVar('VITE_APP_TITLE', 'Funnel Labs — D2C Growth & Experimentation'),
  appEnv: currentEnv,
  appVersion: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  supabaseUrl: getEnvVar('VITE_SUPABASE_URL', 'https://lxrkseksulgsercthjjp.supabase.co'),
  supabaseAnonKey: getEnvVar(
    'VITE_SUPABASE_ANON_KEY',
    'sb_publishable_6rpCmTuKmE6JNit5LBy4VA_6ZyLxRyf'
  ),
  sentryDsn: getEnvVar('VITE_SENTRY_DSN', ''),
  tracesSampleRate: Number(getEnvVar('VITE_SENTRY_TRACES_SAMPLE_RATE', '0.2')),
  enableAnalyticsExport: getEnvBoolean('VITE_ENABLE_ANALYTICS_EXPORT', true),
  enableAuditLogs: getEnvBoolean('VITE_ENABLE_AUDIT_LOGS', false),
  isProduction: currentEnv === 'production',
  isStaging: currentEnv === 'staging',
  isDevelopment: currentEnv === 'development',
};

export default env;
