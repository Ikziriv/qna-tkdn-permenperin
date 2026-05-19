import React from 'react';
import { useLoading } from '@/contexts/LoadingContext';

export const LoadingOverlay: React.FC = () => {
  const { isLoading, message, error, clearError } = useLoading();

  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 fade-in duration-300">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Navigation Error</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            type="button"
            onClick={clearError}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (!isLoading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md transition-opacity duration-200"
    >
      <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 fade-in duration-300">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
        {message && (
          <p className="text-sm font-semibold text-slate-600">{message}</p>
        )}
        <span className="sr-only">Loading, please wait...</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
