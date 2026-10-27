import React, { useState } from 'react';
import {
  Building2,
  FileText,
  Shield,
  Layers,
  ArrowRight,
  Info,
  GitMerge,
  Maximize2,
  HelpCircle,
  Network
} from 'lucide-react';
import { BureauBadge, StatusBadge } from '../common/StatusBadge';
import { BUREAU_DEFINITIONS } from '../../utils/formatters';

export default function RelationshipGraph({
  institution,
  caseA,
  caseB,
  overlap,
  className = ''
}) {
  const [selectedNode, setSelectedNode] = useState('overlap');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'overlap-only', 'bureau-only'

  const instName = institution?.name || overlap?.institutionName || overlap?.institution_name || "AICTE Approved Institution";
  const instId = institution?.id || institution?.institution_id || overlap?.institutionId || overlap?.institution_id || "PID-AICTE";

  const caseAId = caseA?.caseId || caseA?.case_id || overlap?.caseAId || overlap?.case_a_id || "CASE-A";
  const caseABureau = caseA?.bureauCode || caseA?.bureau || overlap?.caseABureau || overlap?.case_a_bureau || "PGRC";
  const caseBId = caseB?.caseId || caseB?.case_id || overlap?.caseBId || overlap?.case_b_id || "CASE-B";
  const caseBBureau = caseB?.bureauCode || caseB?.bureau || overlap?.caseBBureau || overlap?.case_b_bureau || "RB";
  const score = overlap?.matchScore ?? overlap?.match_score ?? (overlap?.similarity_score ? Math.round(overlap.similarity_score * 100) : 85);

  const isConfirmed = overlap?.status === 'Coordination Required';
  const signals = overlap?.keySignals || overlap?.key_signals || [];
  const signal1Title = signals[0] || "Identical Permanent Institution Record";
  const signal2Title = signals[1] || signals[2] || "Cross-Bureau Procedural Alignment";

  const incidentScope = overlap?.incidentRelationship || overlap?.incident_relationship || (isConfirmed ? "Confirmed Coordinated Action" : "Under Review");
  const conceptName = overlap?.issueSimilarity?.shared_concepts?.[0] || overlap?.issue_similarity?.shared_concepts?.[0] || signals[0] || "Regulatory Correlation";

  // Node metadata for the interactive sidebar
  const nodeDetails = {
    institution: {
      type: "Institution Master Entity",
      title: instName,
      id: instId,
      description: "Central AICTE affiliated entity under review. Both case files target programs and infrastructure hosted at this institution.",
      attributes: [
        { label: "AICTE Permanent ID", value: instId },
        { label: "Campus Region", value: institution?.region || overlap?.institutionRegion || overlap?.institution_region || "AICTE Regional Jurisdiction" },
        { label: "Entity Status", value: "Registered AICTE Institution" }
      ]
    },
    bureauA: {
      type: "Originating Bureau A",
      title: BUREAU_DEFINITIONS[caseABureau]?.name || caseABureau,
      id: caseABureau,
      description: "Statutory cell adjudicating grievance petitions lodged by faculty, students, or institutional staff.",
      attributes: [
        { label: "Bureau Mandate", value: BUREAU_DEFINITIONS[caseABureau]?.name || "Statutory Cell" },
        { label: "Active File", value: caseAId }
      ]
    },
    bureauB: {
      type: "Originating Bureau B",
      title: BUREAU_DEFINITIONS[caseBBureau]?.name || caseBBureau,
      id: caseBBureau,
      description: "Bureau overseeing compliance with AICTE Approval Process Handbook (APH) norms and physical inspections.",
      attributes: [
        { label: "Bureau Mandate", value: BUREAU_DEFINITIONS[caseBBureau]?.name || "Regulatory Bureau" },
        { label: "Active File", value: caseBId }
      ]
    },
    caseA: {
      type: "Case Proceeding 1",
      title: caseAId,
      id: caseAId,
      description: caseA?.title || caseA?.category || caseA?.description || "Complaint File A",
      attributes: [
        { label: "Bureau Desk", value: caseABureau },
        { label: "Current Status", value: caseA?.status || overlap?.caseAStatus || overlap?.case_a_status || "Under Process" },
        { label: "Filing Date", value: caseA?.filingDate || caseA?.received_date ? String(caseA?.filingDate || caseA?.received_date).split('T')[0] : "Active File" }
      ]
    },
    caseB: {
      type: "Case Proceeding 2",
      title: caseBId,
      id: caseBId,
      description: caseB?.title || caseB?.category || caseB?.description || "Complaint File B",
      attributes: [
        { label: "Bureau Desk", value: caseBBureau },
        { label: "Current Status", value: caseB?.status || overlap?.caseBStatus || overlap?.case_b_status || "Under Process" },
        { label: "Filing Date", value: caseB?.filingDate || caseB?.received_date ? String(caseB?.filingDate || caseB?.received_date).split('T')[0] : "Active File" }
      ]
    },
    overlap: {
      type: isConfirmed ? "Officially Confirmed Coordination Link" : "Algorithmically Detected Candidate Overlap",
      title: `Overlap Nexus: ${caseAId} ↔ ${caseBId}`,
      id: overlap?.id || overlap?.overlap_id || "OVL-LINK",
      description: overlap?.summary || overlap?.overlap_reason || overlap?.overlapReason || `Cross-bureau correlation score of ${score}%. Shared findings warrant joint review.`,
      attributes: [
        { label: "Matching Score", value: `${score}% (Heuristic Score, Not Probability)` },
        { label: "Review Status", value: overlap?.status || "Pending Review" },
        { label: "Incident Scope", value: incidentScope },
        { label: "Regulatory Issue", value: conceptName },
        { label: "Detected Date", value: overlap?.detectedDate || overlap?.detected_date || "Active Detection" },
        { label: "Recommendation", value: overlap?.reviewRecommendation || overlap?.review_recommendation || "Joint Coordination Review" }
      ]
    },
    sharedEntity1: {
      type: "Primary Correlated Signal",
      title: signal1Title,
      id: "SIG-01",
      description: `Primary evidence signal identified by the AICTE correlation engine: ${signal1Title}.`,
      attributes: [
        { label: "Signal Category", value: "Topical Evidence" },
        { label: "Relevance", value: "High Confidence" }
      ]
    },
    sharedEntity2: {
      type: "Secondary Correlated Signal",
      title: signal2Title,
      id: "SIG-02",
      description: `Corroborating signal identified across bureau files: ${signal2Title}.`,
      attributes: [
        { label: "Signal Category", value: "Procedural Nexus" },
        { label: "Relevance", value: "Supporting Factor" }
      ]
    }
  };

  const activeDetail = nodeDetails[selectedNode] || nodeDetails.overlap;

  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-aicte-blue" />
          <h4 className="text-sm font-bold text-slate-900">
            Multi-Entity Cross-Bureau Relationship Visualisation
          </h4>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Interactive Topology
          </span>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 text-[11px] mr-1">View Focus:</span>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-aicte-navy text-white font-semibold'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Full Map
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('overlap-only')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              filterMode === 'overlap-only'
                ? 'bg-aicte-navy text-white font-semibold'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Overlap Nexus
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 min-h-[460px]">
        {/* Interactive Visual Graph Area */}
        <div className="lg:col-span-8 p-6 bg-slate-50/50 flex flex-col justify-between relative overflow-x-auto">
          {/* Legend / Guide */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 mb-4 bg-white/80 p-2 rounded border border-slate-200">
            <span className="font-semibold text-slate-800">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-aicte-navy" />
              Institution
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Bureaus
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Active Cases
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Shared Evidence
            </span>
            <span className="text-slate-400 ml-auto hidden md:inline">
              Click any entity node to inspect details
            </span>
          </div>

          {/* Structured Visual Topology */}
          <div className="space-y-6 max-w-2xl mx-auto w-full my-auto py-2">
            {/* Level 1: Central Institution Node */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setSelectedNode('institution')}
                className={`relative px-4 py-2.5 rounded-lg border text-left transition-all max-w-md w-full shadow-sm ${
                  selectedNode === 'institution'
                    ? 'ring-2 ring-aicte-blue border-aicte-blue bg-white shadow-md'
                    : 'bg-white border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-aicte-navy text-white flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Central AICTE Institution
                    </div>
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {instName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      PID: {instId}
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Connecting Lines Institution to Bureaus */}
            <div className="relative flex justify-around text-xs text-slate-400 font-mono">
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-slate-300" />
                <span className="text-[10px] text-slate-500">has case in</span>
                <div className="w-px h-4 bg-slate-300" />
              </div>
              <div className="flex flex-col items-center">
                <div className="w-px h-6 bg-slate-300" />
                <span className="text-[10px] text-slate-500">has case in</span>
                <div className="w-px h-4 bg-slate-300" />
              </div>
            </div>

            {/* Level 2: Bureaus & Cases Dual Columns */}
            <div className="grid grid-cols-2 gap-4 sm:gap-8">
              {/* Bureau A & Case A */}
              <div className="space-y-3">
                {/* Bureau A Node */}
                {filterMode !== 'overlap-only' && (
                  <button
                    type="button"
                    onClick={() => setSelectedNode('bureauA')}
                    className={`w-full p-2.5 rounded-md border text-left transition-all ${
                      selectedNode === 'bureauA'
                        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <BureauBadge code={caseABureau} />
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Bureau A</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mt-1">
                      {BUREAU_DEFINITIONS[caseABureau]?.name}
                    </div>
                  </button>
                )}

                {/* Case A Node */}
                <button
                  type="button"
                  onClick={() => setSelectedNode('caseA')}
                  className={`w-full p-3 rounded-lg border text-left transition-all shadow-xs ${
                    selectedNode === 'caseA'
                      ? 'ring-2 ring-rose-500 bg-rose-50/50 border-rose-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-aicte-navy">
                      {caseAId}
                    </span>
                    <StatusBadge status={caseA?.status || "Under Review"} />
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-1 mt-1 font-medium">
                    {caseA?.title || "Irregular Faculty Appointments"}
                  </div>
                </button>
              </div>

              {/* Bureau B & Case B */}
              <div className="space-y-3">
                {/* Bureau B Node */}
                {filterMode !== 'overlap-only' && (
                  <button
                    type="button"
                    onClick={() => setSelectedNode('bureauB')}
                    className={`w-full p-2.5 rounded-md border text-left transition-all ${
                      selectedNode === 'bureauB'
                        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <BureauBadge code={caseBBureau} />
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Bureau B</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mt-1">
                      {BUREAU_DEFINITIONS[caseBBureau]?.name}
                    </div>
                  </button>
                )}

                {/* Case B Node */}
                <button
                  type="button"
                  onClick={() => setSelectedNode('caseB')}
                  className={`w-full p-3 rounded-lg border text-left transition-all shadow-xs ${
                    selectedNode === 'caseB'
                      ? 'ring-2 ring-rose-500 bg-rose-50/50 border-rose-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-aicte-navy">
                      {caseBId}
                    </span>
                    <StatusBadge status={caseB?.status || "In Progress"} />
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-1 mt-1 font-medium">
                    {caseB?.title || "Deficit in Qualified Faculty Cadre"}
                  </div>
                </button>
              </div>
            </div>

            {/* Level 3: Overlap Connection Nexus */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedNode('overlap')}
                className={`w-full p-3.5 rounded-lg border text-center transition-all ${
                  selectedNode === 'overlap'
                    ? 'ring-2 ring-rose-500 bg-rose-50 border-rose-400 shadow-sm'
                    : isConfirmed
                    ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-50'
                    : 'bg-amber-50/70 border-amber-300 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <GitMerge className={`w-4 h-4 ${isConfirmed ? 'text-emerald-700' : 'text-rose-600'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wide ${isConfirmed ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {isConfirmed
                      ? "Officially Confirmed Coordination Link"
                      : `Algorithmically Detected Candidate Nexus (${score}% Heuristic Match Score)`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 max-w-lg mx-auto">
                  {isConfirmed
                    ? `Statutorily confirmed joint proceeding across ${caseABureau} & ${caseBBureau}.`
                    : `Multi-signal linkage across ${caseABureau} & ${caseBBureau} pending officer determination. Heuristic matching score is not a probability.`}
                </p>
              </button>
            </div>

            {/* Level 4: Shared Evidence / Entity Nodes */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedNode('sharedEntity1')}
                className={`p-2.5 rounded-md border text-left transition-all ${
                  selectedNode === 'sharedEntity1'
                    ? 'ring-2 ring-amber-500 bg-amber-50 border-amber-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                  <Layers className="w-3 h-3 text-amber-600" />
                  Primary Correlated Signal
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate" title={signal1Title}>
                  {signal1Title}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNode('sharedEntity2')}
                className={`p-2.5 rounded-md border text-left transition-all ${
                  selectedNode === 'sharedEntity2'
                    ? 'ring-2 ring-amber-500 bg-amber-50 border-amber-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-amber-600" />
                  Secondary Correlated Signal
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate" title={signal2Title}>
                  {signal2Title}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Entity Inspector Panel (Right Drawer) */}
        <div className="lg:col-span-4 p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase">
                <Info className="w-3.5 h-3.5 text-aicte-blue" />
                Entity Details Inspector
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {activeDetail.id}
              </span>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-aicte-blue">
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
              <div className="mt-5 space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Associated Metadata
                </div>
                {activeDetail.attributes.map((attr, aIdx) => (
                  <div key={aIdx} className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="text-slate-500">{attr.label}:</span>
                    <span className="font-semibold text-slate-800 text-right">{attr.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 mt-6 text-[11px] text-slate-500">
            Click on any connected node in the graph to inspect related bureau actions or overlap justification.
          </div>
        </div>
      </div>
    </div>
  );
}
