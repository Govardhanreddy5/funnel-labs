import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this view. Please try again.',
  error,
  onRetry,
  action,
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-white rounded-2xl border border-rose-200/80 p-8 sm:p-12 text-center shadow-sm max-w-xl mx-auto my-6 animate-fadeIn"
    >
      <div
        aria-hidden="true"
        className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4"
      >
        <AlertTriangle className="w-7 h-7 text-rose-600" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
        {message}
      </p>

      {error && process.env.NODE_ENV !== 'production' && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-left text-xs font-mono text-rose-700 border border-slate-200 overflow-x-auto max-h-32">
          {error.message}
        </div>
      )}

      {(onRetry || action) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/20 transition-all active:scale-[0.98]"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
