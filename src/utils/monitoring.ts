/**
 * Client-Side Error Monitoring and Sentry-Ready Telemetry Service.
 * Controlled via environment variables:
 * - VITE_SENTRY_DSN: Sentry project DSN
 * - VITE_APP_ENV: Current environment ('development' | 'staging' | 'production')
 * - VITE_APP_VERSION: App release version
 */

export interface ErrorContext {
  componentStack?: string;
  userAction?: string;
  route?: string;
  organizationId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

export interface Breadcrumb {
  category: string;
  message: string;
  level?: 'info' | 'warning' | 'error';
  timestamp?: number;
  data?: Record<string, any>;
}

export interface UserContext {
  id: string;
  email?: string;
  organizationId?: string;
  role?: string;
}

class ClientMonitoringService {
  private dsn: string | null = null;
  private environment: string = 'development';
  private release: string = '1.0.0';
  private breadcrumbs: Breadcrumb[] = [];
  private currentUser: UserContext | null = null;
  private isSentryActive = false;

  constructor() {
    this.init();
  }

  public init() {
    this.dsn = import.meta.env.VITE_SENTRY_DSN || null;
    this.environment =
      import.meta.env.VITE_APP_ENV || (import.meta.env.DEV ? 'development' : 'production');
    this.release = import.meta.env.VITE_APP_VERSION || '1.0.0';

    if (this.dsn && !this.dsn.includes('your-sentry-dsn')) {
      this.isSentryActive = true;
      if (typeof window !== 'undefined') {
        // If official @sentry/react script or bundle is injected in window
        if ((window as any).Sentry) {
          (window as any).Sentry.init({
            dsn: this.dsn,
            environment: this.environment,
            release: this.release,
            tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.2),
          });
        }
      }
      console.log(
        `[Monitoring] Sentry initialized in ${this.environment} mode (release ${this.release}).`
      );
    }

    // Attach global listeners for unhandled errors and promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureException(event.error || new Error(event.message), {
          tags: { source: 'window.onerror' },
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.captureException(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          { tags: { source: 'window.unhandledrejection' } }
        );
      });
    }
  }

  public setUser(user: UserContext | null) {
    this.currentUser = user;
    if (this.isSentryActive && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.setUser(user);
    }
  }

  public addBreadcrumb(breadcrumb: Breadcrumb) {
    const item: Breadcrumb = {
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now(),
      level: breadcrumb.level || 'info',
    };
    this.breadcrumbs.push(item);
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs.shift();
    }
    if (this.isSentryActive && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb(item);
    }
  }

  public captureException(error: Error | any, context?: ErrorContext) {
    const errorPayload = {
      message: error?.message || String(error),
      name: error?.name || 'Error',
      stack: error?.stack,
      environment: this.environment,
      release: this.release,
      user: this.currentUser,
      context,
      breadcrumbs: this.breadcrumbs.slice(-10),
      timestamp: new Date().toISOString(),
    };

    if (this.isSentryActive && typeof window !== 'undefined') {
      if ((window as any).Sentry) {
        (window as any).Sentry.captureException(error, { extra: errorPayload });
        return;
      }
      // If Sentry SDK isn't bundled, log structured Sentry telemetry envelope
      console.error('[SENTRY_CLIENT_DISPATCH]', errorPayload);
      return;
    }

    if (import.meta.env.DEV) {
      console.error('[Client Monitoring Exception]', error, context || '');
    }
  }

  public captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: ErrorContext
  ) {
    if (this.isSentryActive && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(message, level);
      return;
    }

    if (import.meta.env.DEV) {
      console.log(`[Client Monitoring ${level.toUpperCase()}]`, message, context || '');
    }
  }
}

export const monitoring = new ClientMonitoringService();
