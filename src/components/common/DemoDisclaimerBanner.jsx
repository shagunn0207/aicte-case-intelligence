import React from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DEMO_DISCLAIMER_LABEL } from '../../mocks/overlapMockData';
import { apiConfig, resetMockData } from '../../services/overlapApi';

export default function DemoDisclaimerBanner({ onReset }) {
  const isMock = apiConfig.isMockActive();

  const handleReset = () => {
    if (window.confirm("Reset all synthetic demo records and review decisions to initial state?")) {
      resetMockData();
      if (onReset) onReset();
      window.location.reload();
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold tracking-wide bg-amber-200 text-amber-950 px-2 py-0.5 rounded text-[11px] uppercase">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-800" />
            {DEMO_DISCLAIMER_LABEL}
          </span>
          <span className="hidden md:inline text-amber-800">
            • Algorithmic overlaps represent potential procedural similarities, NOT confirmed duplication. Every action requires human review. Complaints are never automatically merged or closed.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/70 border border-amber-300 text-[11px]">
            {isMock ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Mode: <strong className="font-medium text-amber-950">Client Mock Store</strong>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Mode: <strong className="font-medium text-emerald-950">Live Backend ({apiConfig.baseUrl})</strong>
              </>
            )}
          </span>

          {isMock && (
            <button
              onClick={handleReset}
              title="Reset modified reviews and return to default demo state"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Demo Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
