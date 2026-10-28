import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Layers,
  Info,
  GitMerge,
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { BureauBadge, StatusBadge } from '../common/StatusBadge';
import { BUREAU_DEFINITIONS, formatDate } from '../../utils/formatters';

export default function RelationshipGraph({
  institution,
  caseA,
  caseB,
  overlap,
  className = ''
}) {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState('overlap');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Extract institution data safely from passed props
  const instId = institution?.institution_id || institution?.id || overlap?.institution_id || overlap?.institutionId || '—';
  const instName = institution?.name || overlap?.institution_name || overlap?.institutionName || 'AICTE Approved Institution';
  const instRegion = institution?.region || institution?.state || overlap?.institution_region || overlap?.institutionRegion || '—';

  // Extract case A & case B data safely from passed props
  const caseAId = caseA?.case_id || caseA?.caseId || overlap?.case_a_id || overlap?.caseAId || overlap?.primary_case_id;
  const caseABureau = caseA?.bureau || caseA?.bureauCode || overlap?.case_a_bureau || overlap?.caseABureau || 'UNK';
  const caseAStatus = caseA?.status || overlap?.case_a_status || overlap?.caseAStatus || 'Pending';
  const caseATitle = caseA?.category || caseA?.title || caseA?.description || 'Complaint Proceeding A';

  const caseBId = caseB?.case_id || caseB?.caseId || overlap?.case_b_id || overlap?.caseBId || overlap?.secondary_case_id;
  const caseBBureau = caseB?.bureau || caseB?.bureauCode || overlap?.case_b_bureau || overlap?.caseBBureau || 'UNK';
  const caseBStatus = caseB?.status || overlap?.case_b_status || overlap?.caseBStatus || 'Pending';
  const caseBTitle = caseB?.category || caseB?.title || caseB?.description || 'Complaint Proceeding B';

  const overlapId = overlap?.id || overlap?.overlap_id || overlap?.overlapId;
  const score = overlap?.match_score ?? overlap?.matchScore ?? (overlap?.similarity_score ? Math.round(overlap.similarity_score * 100) : null);
  const overlapStatus = overlap?.status || 'Pending Review';
  const summary = overlap?.summary || overlap?.overlap_reason;
  const keySignals = overlap?.key_signals || overlap?.keySignals || [];
  const matchReasons = overlap?.match_reasons || overlap?.matchReasons || [];

  // Handle missing data gracefully
  if (!caseAId && !caseBId && !overlapId) {
    return (
      <div className={`bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs ${className}`}>
        <Network className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="font-semibold text-slate-700">Insufficient Data for Relationship Topology</p>
        <p className="text-slate-400 mt-1">Both complaint proceedings or overlap records must be loaded to render the graph.</p>
      </div>
    );
  }

  // Node details metadata for the inspector panel
  const nodeDetails = {
    institution: {
      type: 'Institution Entity',
      title: instName,
      id: instId,
      description: `Central AICTE affiliated technical entity. Concurrent proceedings across bureaus target this institution.`,
      actionLabel: 'View Full Institution Profile',
      actionPath: instId !== '—' ? `/institutions/${encodeURIComponent(instId)}` : null,
      attributes: [
        { label: 'AICTE Permanent ID', value: instId },
        { label: 'Region / State', value: instRegion },
        { label: 'Institution Status', value: institution?.status || institution?.institution_type || 'Active' }
      ]
    },
    bureauA: {
      type: 'Jurisdictional Bureau A',
      title: BUREAU_DEFINITIONS[caseABureau]?.name || `Bureau ${caseABureau}`,
      id: caseABureau,
      description: `AICTE statutory bureau handling case file ${caseAId}.`,
      actionLabel: null,
      actionPath: null,
      attributes: [
        { label: 'Bureau Code', value: caseABureau },
        { label: 'Mandate', value: BUREAU_DEFINITIONS[caseABureau]?.shortName || caseABureau },
        { label: 'Assigned Proceeding', value: caseAId }
      ]
    },
    bureauB: {
      type: 'Jurisdictional Bureau B',
      title: BUREAU_DEFINITIONS[caseBBureau]?.name || `Bureau ${caseBBureau}`,
      id: caseBBureau,
      description: `AICTE statutory bureau handling case file ${caseBId}.`,
      actionLabel: null,
      actionPath: null,
      attributes: [
        { label: 'Bureau Code', value: caseBBureau },
        { label: 'Mandate', value: BUREAU_DEFINITIONS[caseBBureau]?.shortName || caseBBureau },
        { label: 'Assigned Proceeding', value: caseBId }
      ]
    },
    caseA: {
      type: 'Complaint Case Proceeding 1',
      title: `Case File ${caseAId}`,
      id: caseAId,
      description: caseATitle,
      actionLabel: 'Open Single Case Dossier',
      actionPath: `/cases/${encodeURIComponent(caseAId)}`,
      attributes: [
        { label: 'Case Identifier', value: caseAId },
        { label: 'Managing Bureau', value: caseABureau },
        { label: 'Current Status', value: caseAStatus },
        { label: 'Received Date', value: caseA?.received_date || caseA?.filingDate ? formatDate(caseA.received_date || caseA.filingDate) : '—' }
      ]
    },
    caseB: {
      type: 'Complaint Case Proceeding 2',
      title: `Case File ${caseBId}`,
      id: caseBId,
      description: caseBTitle,
      actionLabel: 'Open Single Case Dossier',
      actionPath: `/cases/${encodeURIComponent(caseBId)}`,
      attributes: [
        { label: 'Case Identifier', value: caseBId },
        { label: 'Managing Bureau', value: caseBBureau },
        { label: 'Current Status', value: caseBStatus },
        { label: 'Received Date', value: caseB?.received_date || caseB?.filingDate ? formatDate(caseB.received_date || caseB.filingDate) : '—' }
      ]
    },
    overlap: {
      type: 'Cross-Bureau Overlap Correlation',
      title: `Nexus: ${caseAId} ↔ ${caseBId}`,
      id: overlapId || 'OVL-Nexus',
      description: summary || `Algorithmic linkage across ${caseABureau} & ${caseBBureau}.`,
      actionLabel: overlapId ? 'Open Dual Case Comparison' : null,
      actionPath: overlapId ? `/compare/${encodeURIComponent(overlapId)}` : null,
      attributes: [
        { label: 'Overlap Identifier', value: overlapId || 'Auto-generated' },
        { label: 'Correlation Score', value: score !== null ? `${score}% Match` : 'Calculated' },
        { label: 'Review Determination', value: overlapStatus },
        { label: 'Evidence Signals', value: `${matchReasons.length} signal(s)` }
      ]
    }
  };

  const activeDetail = nodeDetails[selectedNode] || nodeDetails.overlap;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-aicte-navy" />
          <h4 className="text-sm font-bold text-slate-900">
            Cross-Bureau Relationship Topology
          </h4>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Interactive Entity Map
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.3, z + 0.1))}
            className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
            className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 min-h-[460px]">
        {/* Interactive Visual Graph Canvas */}
        <div className="lg:col-span-8 p-6 bg-slate-50/50 flex flex-col justify-between relative overflow-hidden">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 mb-4 bg-white/90 p-2 rounded border border-slate-200">
            <span className="font-semibold text-slate-800">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-aicte-navy" />
              Institution
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              Bureaus
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Complaint Cases
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Cross-Bureau Nexus
            </span>
          </div>

          {/* Scalable Structured Visual Topology */}
          <div
            className="space-y-6 max-w-2xl mx-auto w-full my-auto py-2 transition-transform duration-200 origin-top"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* LEVEL 1: Central Institution Node */}
            <div className="flex justify-center">
              <div
                onClick={() => setSelectedNode('institution')}
                className={`relative px-4 py-3 rounded-lg border text-left cursor-pointer transition-all max-w-md w-full shadow-xs ${
                  selectedNode === 'institution'
                    ? 'ring-2 ring-aicte-blue border-aicte-blue bg-white shadow-md'
                    : 'bg-white border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-aicte-navy text-white flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Central Institution Node
                      </div>
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {instName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        PID: {instId}
                      </div>
                    </div>
                  </div>
                  {instId !== '—' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/institutions/${encodeURIComponent(instId)}`);
                      }}
                      className="p-1 text-slate-400 hover:text-aicte-blue"
                      title="Open Profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Connecting Lines Institution to Bureaus */}
            <div className="relative flex justify-around text-xs text-slate-400 font-mono">
              <div className="flex flex-col items-center">
                <div className="w-px h-5 bg-slate-300" />
                <span className="text-[9px] uppercase tracking-wider text-slate-400">jurisdiction</span>
                <div className="w-px h-3 bg-slate-300" />
              </div>
              <div className="flex flex-col items-center">
                <div className="w-px h-5 bg-slate-300" />
                <span className="text-[9px] uppercase tracking-wider text-slate-400">jurisdiction</span>
                <div className="w-px h-3 bg-slate-300" />
              </div>
            </div>

            {/* LEVEL 2: Bureau & Case Dual Columns */}
            <div className="grid grid-cols-2 gap-4 sm:gap-8">
              {/* Bureau A Column */}
              <div className="space-y-3">
                <div
                  onClick={() => setSelectedNode('bureauA')}
                  className={`p-2.5 rounded-md border text-left cursor-pointer transition-all ${
                    selectedNode === 'bureauA'
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <BureauBadge code={caseABureau} />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Bureau A</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-1 truncate">
                    {BUREAU_DEFINITIONS[caseABureau]?.name || caseABureau}
                  </div>
                </div>

                <div
                  onClick={() => setSelectedNode('caseA')}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all shadow-xs ${
                    selectedNode === 'caseA'
                      ? 'ring-2 ring-rose-500 bg-rose-50/50 border-rose-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {caseAId}
                    </span>
                    <StatusBadge status={caseAStatus} />
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-2 mt-1">
                    {caseATitle}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Click to inspect</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/cases/${encodeURIComponent(caseAId)}`);
                      }}
                      className="text-aicte-blue hover:underline flex items-center gap-0.5"
                    >
                      Open Dossier <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bureau B Column */}
              <div className="space-y-3">
                <div
                  onClick={() => setSelectedNode('bureauB')}
                  className={`p-2.5 rounded-md border text-left cursor-pointer transition-all ${
                    selectedNode === 'bureauB'
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <BureauBadge code={caseBBureau} />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Bureau B</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-1 truncate">
                    {BUREAU_DEFINITIONS[caseBBureau]?.name || caseBBureau}
                  </div>
                </div>

                <div
                  onClick={() => setSelectedNode('caseB')}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all shadow-xs ${
                    selectedNode === 'caseB'
                      ? 'ring-2 ring-rose-500 bg-rose-50/50 border-rose-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {caseBId}
                    </span>
                    <StatusBadge status={caseBStatus} />
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-2 mt-1">
                    {caseBTitle}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Click to inspect</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/cases/${encodeURIComponent(caseBId)}`);
                      }}
                      className="text-aicte-blue hover:underline flex items-center gap-0.5"
                    >
                      Open Dossier <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Connecting Lines Cases to Overlap Nexus */}
            <div className="relative flex justify-center text-xs text-slate-400 font-mono">
              <div className="flex flex-col items-center">
                <div className="w-px h-4 bg-slate-300" />
                <span className="text-[9px] uppercase tracking-wider text-rose-500 font-bold">algorithmic correlation</span>
                <div className="w-px h-3 bg-slate-300" />
              </div>
            </div>

            {/* LEVEL 3: Central Overlap Nexus Node */}
            <div>
              <div
                onClick={() => setSelectedNode('overlap')}
                className={`p-3.5 rounded-lg border text-center cursor-pointer transition-all ${
                  selectedNode === 'overlap'
                    ? 'ring-2 ring-rose-500 bg-rose-50 border-rose-300 shadow-sm'
                    : 'bg-amber-50/70 border-amber-300 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <GitMerge className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                    Cross-Bureau Overlap Correlation {score !== null ? `(${score}% Match)` : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 max-w-lg mx-auto line-clamp-2">
                  {summary || `Correlation detected across ${caseABureau} & ${caseBBureau} proceedings.`}
                </p>
                {overlapId && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-aicte-navy hover:underline">
                      Inspect Side-by-Side Comparison <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Entity Inspector Panel (Right Drawer) */}
        <div className="lg:col-span-4 p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold uppercase tracking-wide">
                <Info className="w-3.5 h-3.5 text-aicte-blue" />
                Topology Node Inspector
              </div>
              <span className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
                {activeDetail.id}
              </span>
            </div>

            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-aicte-blue">
                {activeDetail.type}
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                {activeDetail.title}
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {activeDetail.description}
              </p>
            </div>

            {/* Key Attributes Table */}
            {activeDetail.attributes && (
              <div className="mt-4 space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Metadata & Parameters
                </div>
                {activeDetail.attributes.map((attr, aIdx) => (
                  <div key={aIdx} className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="text-slate-500">{attr.label}:</span>
                    <span className="font-semibold text-slate-800 text-right">{attr.value || '—'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Substantive Match Reasons Signals (if overlap selected) */}
            {selectedNode === 'overlap' && matchReasons.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Algorithmic Evidence Signals ({matchReasons.length})
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {matchReasons.map((signal, sIdx) => (
                    <div key={sIdx} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-semibold text-slate-800">
                        {signal.signal_name || signal.signalName || 'Evidence Signal'}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        {signal.description}
                      </p>
                      {signal.evidence_extract || signal.evidenceExtract ? (
                        <div className="mt-1 text-[10px] font-mono text-slate-500 bg-white p-1 rounded border border-slate-200">
                          {signal.evidence_extract || signal.evidenceExtract}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Button for Navigating to Linked Views */}
          {activeDetail.actionPath && (
            <div className="pt-4 border-t border-slate-200 mt-5">
              <button
                type="button"
                onClick={() => navigate(activeDetail.actionPath)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-aicte-navy text-white text-xs font-semibold hover:bg-aicte-navy-light transition-colors shadow-xs"
              >
                <span>{activeDetail.actionLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
