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
  FileText,
  AlertTriangle,
  CheckCircle2
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

  // 1. Safe extraction of institution fields (supporting snake_case & camelCase)
  const instId =
    institution?.institution_id ||
    institution?.id ||
    overlap?.institution_id ||
    overlap?.institutionId ||
    '—';
  const instName =
    institution?.name ||
    overlap?.institution_name ||
    overlap?.institutionName ||
    'AICTE Approved Institution';
  const instRegion =
    institution?.region ||
    institution?.state ||
    overlap?.institution_region ||
    overlap?.institutionRegion ||
    '—';

  // 2. Safe extraction of Case A & Case B fields (supporting snake_case & camelCase)
  const caseAId =
    caseA?.case_id ||
    caseA?.caseId ||
    overlap?.case_a_id ||
    overlap?.caseAId ||
    overlap?.primary_case_id;
  const caseABureau =
    caseA?.bureau ||
    caseA?.bureauCode ||
    overlap?.case_a_bureau ||
    overlap?.caseABureau ||
    'UNK';
  const caseAStatus =
    caseA?.status ||
    overlap?.case_a_status ||
    overlap?.caseAStatus ||
    'Pending';
  const caseATitle =
    caseA?.category ||
    caseA?.title ||
    caseA?.description ||
    'Complaint Proceeding A';
  const caseAFilingDate =
    caseA?.received_date ||
    caseA?.filingDate ||
    caseA?.filing_date;

  const caseBId =
    caseB?.case_id ||
    caseB?.caseId ||
    overlap?.case_b_id ||
    overlap?.caseBId ||
    overlap?.secondary_case_id;
  const caseBBureau =
    caseB?.bureau ||
    caseB?.bureauCode ||
    overlap?.case_b_bureau ||
    overlap?.caseBBureau ||
    'UNK';
  const caseBStatus =
    caseB?.status ||
    overlap?.case_b_status ||
    overlap?.caseBStatus ||
    'Pending';
  const caseBTitle =
    caseB?.category ||
    caseB?.title ||
    caseB?.description ||
    'Complaint Proceeding B';
  const caseBFilingDate =
    caseB?.received_date ||
    caseB?.filingDate ||
    caseB?.filing_date;

  // 3. Overlap identifiers, scores, and status
  const overlapId =
    overlap?.id ||
    overlap?.overlap_id ||
    overlap?.overlapId;

  // Handle both match_score (e.g. 89) and similarity_score (e.g. 0.89) without incorrect double multiplication
  let score = null;
  if (overlap?.match_score !== undefined && overlap?.match_score !== null) {
    score = typeof overlap.match_score === 'number' ? Math.round(overlap.match_score) : Number(overlap.match_score);
  } else if (overlap?.matchScore !== undefined && overlap?.matchScore !== null) {
    score = typeof overlap.matchScore === 'number' ? Math.round(overlap.matchScore) : Number(overlap.matchScore);
  } else if (overlap?.similarity_score !== undefined && overlap?.similarity_score !== null) {
    const rawSim = Number(overlap.similarity_score);
    score = rawSim <= 1 ? Math.round(rawSim * 100) : Math.round(rawSim);
  } else if (overlap?.similarityScore !== undefined && overlap?.similarityScore !== null) {
    const rawSim = Number(overlap.similarityScore);
    score = rawSim <= 1 ? Math.round(rawSim * 100) : Math.round(rawSim);
  }

  // Review status: Actual review status from backend (never inferred from match score)
  const rawStatus = overlap?.status || overlap?.reviewer_decision || overlap?.reviewerDecision || 'Pending Review';
  const isConfirmed = rawStatus.toLowerCase().includes('coordination') || rawStatus.toLowerCase().includes('confirmed');

  const summary = overlap?.summary || overlap?.overlap_reason || overlap?.overlapReason;
  const keySignals = overlap?.key_signals || overlap?.keySignals || [];
  const matchReasons = overlap?.match_reasons || overlap?.matchReasons || [];

  // Extract incident / shared taxonomy concepts if present
  const sharedEntities = overlap?.shared_entities || overlap?.sharedEntities || [];

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
      actionPath: instId && instId !== '—' ? `/institutions/${encodeURIComponent(instId)}` : null,
      attributes: [
        { label: 'AICTE Permanent ID', value: instId },
        { label: 'Region / State', value: instRegion },
        { label: 'Institution Status', value: institution?.status || institution?.institution_type || institution?.institutionType || 'Active' }
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
        { label: 'Bureau Mandate', value: BUREAU_DEFINITIONS[caseABureau]?.shortName || caseABureau },
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
        { label: 'Bureau Mandate', value: BUREAU_DEFINITIONS[caseBBureau]?.shortName || caseBBureau },
        { label: 'Assigned Proceeding', value: caseBId }
      ]
    },
    caseA: {
      type: 'Complaint Case Proceeding 1',
      title: `Case File ${caseAId}`,
      id: caseAId,
      description: caseATitle,
      actionLabel: 'Open Single Case Dossier',
      actionPath: caseAId ? `/cases/${encodeURIComponent(caseAId)}` : null,
      attributes: [
        { label: 'Case Identifier', value: caseAId },
        { label: 'Managing Bureau', value: caseABureau },
        { label: 'Current Status', value: caseAStatus },
        { label: 'Filing / Received Date', value: caseAFilingDate ? formatDate(caseAFilingDate) : '—' }
      ]
    },
    caseB: {
      type: 'Complaint Case Proceeding 2',
      title: `Case File ${caseBId}`,
      id: caseBId,
      description: caseBTitle,
      actionLabel: 'Open Single Case Dossier',
      actionPath: caseBId ? `/cases/${encodeURIComponent(caseBId)}` : null,
      attributes: [
        { label: 'Case Identifier', value: caseBId },
        { label: 'Managing Bureau', value: caseBBureau },
        { label: 'Current Status', value: caseBStatus },
        { label: 'Filing / Received Date', value: caseBFilingDate ? formatDate(caseBFilingDate) : '—' }
      ]
    },
    overlap: {
      type: isConfirmed ? 'Confirmed Coordination Link' : 'Candidate Overlap Nexus',
      title: `Nexus: ${caseAId || 'Case A'} ↔ ${caseBId || 'Case B'}`,
      id: overlapId || 'OVL-Nexus',
      description: summary || `Algorithmic correlation identified between ${caseABureau} & ${caseBBureau}.`,
      actionLabel: overlapId ? 'Open Dual Case Comparison' : null,
      actionPath: overlapId ? `/compare/${encodeURIComponent(overlapId)}` : null,
      attributes: [
        { label: 'Overlap Identifier', value: overlapId || 'Auto-generated' },
        { label: 'Algorithmic Score', value: score !== null ? `${score}% Match` : 'Calculated' },
        { label: 'Review Determination', value: rawStatus },
        { label: 'Evidence Signals', value: `${matchReasons.length} signal(s) recorded` }
      ]
    }
  };

  // Add dynamically discovered shared entity nodes if available in backend response
  if (sharedEntities && sharedEntities.length > 0) {
    sharedEntities.forEach((ent, idx) => {
      const entKey = `sharedEntity_${idx}`;
      nodeDetails[entKey] = {
        type: 'Shared Taxonomy / Evidence Concept',
        title: ent.title || ent.name || `Shared Entity ${idx + 1}`,
        id: ent.id || `ENT-${idx + 1}`,
        description: ent.description || 'Shared entity across concurrent proceedings.',
        actionLabel: null,
        actionPath: null,
        attributes: [
          { label: 'Entity Type', value: ent.type || 'Contextual Match' },
          { label: 'Evidence Value', value: ent.value || 'Corroborated' }
        ]
      };
    });
  }

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
            className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
            className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Heuristic Score Notice Banner */}
      <div className="bg-amber-50/70 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Algorithmic Heuristic Notice:</strong> Match scores represent heuristic convergence and do not constitute a confirmed statutory decision until reviewed by an authorized officer.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 font-medium">
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Human-Confirmed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
              Candidate Overlap (Pending Review)
            </span>
          )}
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
              <span className={`w-2.5 h-2.5 rounded-full ${isConfirmed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isConfirmed ? 'Confirmed Link' : 'Candidate Nexus'}
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
                  {instId && instId !== '—' && (
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

            {/* Connecting Lines: Institution to Bureaus */}
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
                    {caseAId && (
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
                    )}
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
                    {caseBId && (
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
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Connecting Lines: Cases to Overlap Nexus */}
            <div className="relative flex justify-center text-xs text-slate-400 font-mono">
              <div className="flex flex-col items-center">
                <div className="w-px h-4 bg-slate-300" />
                <span className={`text-[9px] uppercase tracking-wider font-bold ${isConfirmed ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isConfirmed ? 'confirmed coordination link' : 'candidate correlation nexus'}
                </span>
                <div className="w-px h-3 bg-slate-300" />
              </div>
            </div>

            {/* LEVEL 3: Central Overlap Nexus Node */}
            <div>
              <div
                onClick={() => setSelectedNode('overlap')}
                className={`p-3.5 rounded-lg border text-center cursor-pointer transition-all ${
                  selectedNode === 'overlap'
                    ? isConfirmed
                      ? 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-300 shadow-sm'
                      : 'ring-2 ring-amber-500 bg-amber-50 border-amber-300 shadow-sm'
                    : isConfirmed
                    ? 'bg-emerald-50/60 border-emerald-300 hover:bg-emerald-50'
                    : 'bg-amber-50/70 border-amber-300 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <GitMerge className={`w-4 h-4 ${isConfirmed ? 'text-emerald-700' : 'text-amber-700'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wide ${isConfirmed ? 'text-emerald-950' : 'text-amber-950'}`}>
                    {isConfirmed ? 'Human-Confirmed Coordination' : 'Cross-Bureau Candidate Overlap'} {score !== null ? `(${score}% Match)` : ''}
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

            {/* LEVEL 4: Shared Taxonomy / Evidence Concept Nodes (when present in backend response) */}
            {sharedEntities && sharedEntities.length > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                {sharedEntities.slice(0, 2).map((ent, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedNode(`sharedEntity_${idx}`)}
                    className={`p-2.5 rounded-md border text-left cursor-pointer transition-all ${
                      selectedNode === `sharedEntity_${idx}`
                        ? 'ring-2 ring-amber-500 bg-amber-50 border-amber-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                      <Layers className="w-3 h-3 text-amber-600" />
                      {ent.type || 'Shared Subject Concept'}
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                      {ent.title || ent.name || `Entity ${idx + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
