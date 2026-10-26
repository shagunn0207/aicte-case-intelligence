import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({
  message = "Loading AICTE Cross-Bureau Intelligence records...",
  description = "Consulting multi-bureau indexing engine and verified cases...",
  className = ""
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-aicte-navy animate-spin" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{message}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-md">{description}</p>}

      {/* Skeletons preview */}
      <div className="w-full max-w-xl mt-8 space-y-3">
        <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4 mx-auto" />
        <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2 mx-auto" />
        <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3 mx-auto" />
      </div>
    </div>
  );
}
