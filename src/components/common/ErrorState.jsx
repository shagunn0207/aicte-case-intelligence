import React from 'react';
import { AlertOctagon, RefreshCw, ServerOff, Terminal } from 'lucide-react';
import { apiConfig } from '../../services/overlapApi';

export default function ErrorState({
  error,
  onRetry,
  title = "Failed to Retrieve Intelligence Data",
  className = ""
}) {
  const errorMessage = error?.message || "An unexpected error occurred while communicating with the service.";
  const statusCode = error?.status;
  const isMock = apiConfig.isMockActive();

  return (
    <div className={`p-6 bg-rose-50 border border-rose-200 rounded-lg text-slate-800 shadow-sm ${className}`}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 flex-shrink-0">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-rose-950">{title}</h3>
            {statusCode && (
              <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-mono text-xs font-semibold">
                Status {statusCode}
              </span>
            )}
          </div>
          <p className="text-sm text-rose-900/90 mt-1">
            {errorMessage}
          </p>

          {!isMock && (
            <div className="mt-3 p-3 bg-white/80 rounded border border-rose-200 text-xs text-slate-700 space-y-1">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <ServerOff className="w-4 h-4 text-rose-600" />
                Live Backend Mode Active ({apiConfig.baseUrl})
              </div>
              <p>
                As required by system safety rules, the platform will <strong>not silently fall back</strong> to mock data when live API mode fails.
              </p>
              <p className="text-slate-600">
                To test in standalone mode without a running FastAPI backend, set <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-900 font-mono">VITE_USE_MOCK_DATA=true</code> in your <code className="font-mono">.env</code> file.
              </p>
            </div>
          )}

          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-rose-700 text-white text-xs font-semibold hover:bg-rose-800 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
