import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  ArrowRight,
  GitCompare,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MapPin,
  ShieldAlert
} from 'lucide-react';
import { BureauBadge, StatusBadge } from '../common/StatusBadge';
import ConfidenceMeter from '../common/ConfidenceMeter';
import MatchReasons from './MatchReasons';
import { formatDate } from '../../utils/formatters';

export default function OverlapCard({ overlap, onReviewClick }) {
  const [showEvidence, setShowEvidence] = useState(false);

  if (!overlap) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow transition-all overflow-hidden flex flex-col">
      {/* Top Banner: Institution & Overlap Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-aicte-navy/10 text-aicte-navy flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 hover:text-aicte-blue transition-colors">
                {overlap.institutionName}
              </h3>
              <span className="px-1.5 py-0.5 rounded bg-slate-200/80 font-mono text-[11px] font-semibold text-slate-700">
                {overlap.institutionId}
              </span>
            </div>
            {overlap.institutionCity && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{overlap.institutionCity}</span>
                {overlap.institutionRegion && <span>• {overlap.institutionRegion}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs text-slate-500 font-semibold">
            {overlap.id}
          </span>
          <StatusBadge status={overlap.status} />
        </div>
      </div>

      {/* Main Body: Case A vs Case B Dual Column & Score */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
        {/* Two Case Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Case A Box */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-md p-3 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Case Track 1
              </span>
              <BureauBadge code={overlap.caseABureau} />
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <Link
                to={`/cases/${overlap.caseAId}`}
                className="font-mono text-sm font-bold text-aicte-navy hover:text-aicte-blue hover:underline"
              >
                {overlap.caseAId}
              </Link>
              <StatusBadge status={overlap.caseAStatus} />
            </div>
          </div>

          {/* Case B Box */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-md p-3 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Case Track 2
              </span>
              <BureauBadge code={overlap.caseBBureau} />
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <Link
                to={`/cases/${overlap.caseBId}`}
                className="font-mono text-sm font-bold text-aicte-navy hover:text-aicte-blue hover:underline"
              >
                {overlap.caseBId}
              </Link>
              <StatusBadge status={overlap.caseBStatus} />
            </div>
          </div>
        </div>

        {/* Summary Description */}
        {overlap.summary && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {overlap.summary}
          </p>
        )}

        {/* Key Signals / Tags */}
        {overlap.keySignals && overlap.keySignals.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {overlap.keySignals.map((signal, sIdx) => (
              <span
                key={sIdx}
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200 font-medium"
              >
                • {signal}
              </span>
            ))}
          </div>
        )}

        {/* Confidence Meter Bar */}
        <div className="pt-2 border-t border-slate-100">
          <ConfidenceMeter score={overlap.matchScore} />
        </div>

        {/* Collapsible Evidence Section */}
        {showEvidence && (
          <div className="pt-3 border-t border-slate-200 mt-1">
            <MatchReasons matchReasons={overlap.matchReasons} />
          </div>
        )}
      </div>

      {/* Card Footer: Action Controls */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => setShowEvidence(!showEvidence)}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          {showEvidence ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              Hide Evidence Details
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              Inspect Match Evidence ({overlap.matchReasons?.length || 0})
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Side by side comparison link */}
          <Link
            to={`/compare/${overlap.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <GitCompare className="w-3.5 h-3.5 text-slate-500" />
            Compare Cases
          </Link>

          {/* Coordination Review CTA */}
          <Link
            to={`/coordination-review/${overlap.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-aicte-navy text-white hover:bg-aicte-navy-light transition-colors shadow-xs"
          >
            <FileCheck className="w-3.5 h-3.5" />
            Review Coordination
          </Link>
        </div>
      </div>
    </div>
  );
}
