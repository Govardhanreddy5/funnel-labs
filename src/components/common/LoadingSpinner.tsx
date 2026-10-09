import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading Funnel Labs data...',
  size = 'md',
  fullPage = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  const content = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col items-center justify-center p-8 text-center animate-fadeIn"
    >
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
          <Loader2 className={`${sizeClasses} text-indigo-600 animate-spin`} aria-hidden="true" />
        </div>
      </div>
      {message && (
        <p className="mt-4 text-xs sm:text-sm font-medium text-slate-500 tracking-wide">
          {message}
        </p>
      )}
      <span className="sr-only">{message || 'Loading...'}</span>
    </div>
  );

  if (fullPage) {
    return <div className="min-h-[60vh] flex items-center justify-center w-full">{content}</div>;
  }

  return content;
};

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-6 w-16 bg-slate-100 rounded-full" />
      </div>
      <div className="h-8 bg-slate-200/70 rounded w-1/2" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-100 rounded w-full" />
        ))}
      </div>
    </div>
  );
};
