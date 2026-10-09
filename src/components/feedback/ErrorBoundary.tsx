import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorState } from '../common/ErrorState';
import { monitoring } from '../../utils/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    monitoring.captureException(error, {
      componentStack: errorInfo.componentStack || undefined,
      tags: { boundary: this.props.name || 'GlobalErrorBoundary' },
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <main
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
        >
          <ErrorState
            title="Application encountered an error"
            message="We encountered an unexpected problem. You can reload the page or return to the Dashboard safely."
            error={this.state.error}
            action={{
              label: 'Return to Dashboard',
              onClick: this.handleReset,
            }}
            onRetry={() => this.setState({ hasError: false, error: null })}
          />
        </main>
      );
    }

    return this.props.children;
  }
}

/**
 * Isolated widget-level error boundary to protect specific charts or cards
 * from crashing the surrounding dashboard.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    monitoring.captureException(error, {
      componentStack: errorInfo.componentStack || undefined,
      tags: { boundary: this.props.name || 'WidgetErrorBoundary' },
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="polite"
          className="p-6 bg-rose-50/50 border border-rose-200 rounded-2xl text-center"
        >
          <p className="text-xs font-semibold text-rose-800">
            Failed to render {this.props.name || 'widget'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            An error occurred while displaying this section. Other dashboard features remain fully
            functional.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50"
          >
            Retry Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
