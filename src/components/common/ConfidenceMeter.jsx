import React from 'react';
import { getConfidenceMeta } from '../../utils/formatters';

export default function ConfidenceMeter({ score, showLabel = true, compact = false, className = '' }) {
  const num = typeof score === 'number' ? score : parseFloat(score) || 0;
  const meta = getConfidenceMeta(num);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${meta.badgeClass}`}>
          {num}%
        </span>
        {showLabel && (
          <span className={`text-xs font-medium ${meta.textColor}`}>
            {meta.level}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium">Match Confidence:</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-slate-900">{num}%</span>
          {showLabel && (
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${meta.badgeClass}`}>
              {meta.level}
            </span>
          )}
        </div>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${meta.meterColor}`}
          style={{ width: `${Math.min(100, Math.max(5, num))}%` }}
        />
      </div>
    </div>
  );
}
