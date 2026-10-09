import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
        <Compass className="w-8 h-8 animate-pulse" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full mb-3">
        404 — Page Not Found
      </span>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        Lost in the Funnel?
      </h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md leading-relaxed">
        The route you are trying to visit does not exist or may have been moved to another section
        of the platform.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all active:scale-[0.98]"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};
