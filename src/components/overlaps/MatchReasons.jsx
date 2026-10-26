import React from 'react';
import { ShieldCheck, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { getConfidenceMeta } from '../../utils/formatters';

export default function MatchReasons({ matchReasons = [], className = '' }) {
  if (!matchReasons || matchReasons.length === 0) {
    return (
      <div className={`p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm ${className}`}>
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <AlertCircle className="w-4 h-4" />
          No algorithmic evidence signals supplied for this record.
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Evidence details will be rendered here once provided by the backend matching engine.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-aicte-blue" />
          Cross-Bureau Algorithmic Matching Evidence ({matchReasons.length} Signals)
        </h4>
        <span className="text-[11px] text-slate-500 font-mono">
          Strict Evidence Verification
        </span>
      </div>

      <div className="space-y-3">
        {matchReasons.map((signal, index) => {
          const scoreMeta = getConfidenceMeta(signal.score || 0);

          return (
            <div
              key={signal.id || index}
              className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 transition-all shadow-sm"
            >
              {/* Header: Signal Name & Category & Score */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-bold flex items-center justify-center border border-slate-300">
                      {index + 1}
                    </span>
                    <h5 className="text-sm font-semibold text-slate-900">
                      {signal.signalName || 'Algorithmic Convergence Signal'}
                    </h5>
                    {signal.category && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {signal.category}
                      </span>
                    )}
                    {signal.weight && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {signal.weight}
                      </span>
                    )}
                  </div>

                  {signal.description && (
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {signal.description}
                    </p>
                  )}
                </div>

                {signal.score !== undefined && (
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${scoreMeta.badgeClass}`}>
                      {signal.score}% Match
                    </span>
                  </div>
                )}
              </div>

              {/* Evidence Extract Quote */}
              {signal.evidenceExtract && (
                <div className="mt-2.5 p-2.5 bg-slate-50 border-l-2 border-aicte-blue rounded-r text-xs font-mono text-slate-800 break-words">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 flex items-center gap-1 font-sans">
                    <FileText className="w-3 h-3 text-slate-500" />
                    Supplied Evidence Extract:
                  </div>
                  {signal.evidenceExtract}
                </div>
              )}

              {/* Verification Action Required by Human Reviewer */}
              {signal.verificationAction && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-600 bg-amber-50/60 border border-amber-200/60 rounded px-2.5 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-amber-900">Officer Verification Guideline: </span>
                    <span className="text-amber-800">{signal.verificationAction}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
