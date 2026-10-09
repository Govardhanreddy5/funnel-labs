import React from 'react';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
}) => {
  return (
    <div
      role="region"
      aria-label={title}
      className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-sm max-w-xl mx-auto my-6 animate-fadeIn"
    >
      <div
        aria-hidden="true"
        className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-inner"
      >
        {icon || <Sparkles className="w-7 h-7 text-indigo-600" />}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {secondaryAction.label}
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
