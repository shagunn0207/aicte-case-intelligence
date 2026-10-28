import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  FileCheck,
  CheckCircle2,
  Clock,
  User,
  Send,
  AlertOctagon,
  Sparkles,
  ShieldCheck,
  Pencil,
  Activity,
  Calendar
} from 'lucide-react';
import { getOverlapById, getCaseComparison, submitCoordinationReview } from '../services/overlapApi';
import PageHeader from '../components/common/PageHeader';
import { BureauBadge, StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import MatchReasons from '../components/overlaps/MatchReasons';
import RelationshipGraph from '../components/overlaps/RelationshipGraph';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { REVIEW_DECISION_OPTIONS, formatDate, formatDateTime } from '../utils/formatters';
import { getCaseById, updateCase, postCaseAction, getCaseLinks } from '../services/caseApi';
import RecordActionModal from '../components/common/RecordActionModal';
import EditCaseModal from '../components/common/EditCaseModal';
import ActionTimeline from '../components/overlaps/ActionTimeline';

export default function CaseDetails({ mode = 'single' }) {
  const { overlapId, caseId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Overlap & Case Data
  const [overlapData, setOverlapData] = useState(null);
  const [caseA, setCaseA] = useState(null);
  const [caseB, setCaseB] = useState(null);
  const [singleCase, setSingleCase] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);

  // Review Form States (Unified on comparison page)
  const [selectedDecision, setSelectedDecision] = useState('');
  const [reviewerName, setReviewerName] = useState('Dr. S. K. Narayanan');
  const [reviewerDesignation, setReviewerDesignation] = useState('Senior Evaluation Officer, AICTE HQ');
  const [reviewerEmail, setReviewerEmail] = useState('eval.officer@aicte-india.org');
  const [remarks, setRemarks] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync editStatus with loaded case
  useEffect(() => {
    if (singleCase) {
      setEditStatus(singleCase.status);
    }
  }, [singleCase]);

  const handleStatusSave = async () => {
    if (!singleCase) return;
    setIsUpdating(true);
    try {
      await updateCase(singleCase.caseId, { status: editStatus });
      const refreshed = await getCaseById(singleCase.caseId);
      setSingleCase(refreshed);
    } catch (err) {
      alert('Failed to update case status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddAction = async (action) => {
    if (!singleCase) return;
    try {
      await postCaseAction(singleCase.caseId, action);
      const refreshed = await getCaseById(singleCase.caseId);
      setSingleCase(refreshed);
    } catch (err) {
      alert('Failed to record action');
    }
  };

  const handleRefresh = async () => {
    if (!singleCase) return;
    const refreshed = await getCaseById(singleCase.caseId);
    setSingleCase(refreshed);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        if (mode === 'compare' || overlapId) {
          const targetOverlapId = overlapId || "OVL-2026-0814";
          const ovl = await getOverlapById(targetOverlapId);
          setOverlapData(ovl);
          if (ovl.status && ovl.status !== 'Pending Review') {
            setSelectedDecision(ovl.status);
          }

          const comp = await getCaseComparison(ovl.caseAId, ovl.caseBId);
          setCaseA(comp.caseA);
          setCaseB(comp.caseB);
        } else if (caseId) {
          const cData = await getCaseById(caseId);
          setSingleCase(cData);
        }
      } catch (err) {
        console.error("Failed to load case data:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [overlapId, caseId, mode]);

  const validateReviewForm = () => {
    const errs = {};
    if (!selectedDecision) {
      errs.decision = "Please select one of the three review decisions.";
    }
    if (!reviewerName.trim()) {
      errs.reviewerName = "Reviewer Full Name is required.";
    }
    if (!reviewerDesignation.trim()) {
      errs.reviewerDesignation = "Reviewer Designation / Bureau is required.";
    }
    if (!remarks.trim()) {
      errs.remarks = "Audit remarks are required.";
    } else if (remarks.trim().length < 15) {
      errs.remarks = "Remarks must be at least 15 characters to provide adequate justification.";
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccessMsg(null);

    if (!validateReviewForm()) return;

    setIsSubmitting(true);
    try {
      const response = await submitCoordinationReview(overlapData.id, {
        decision: selectedDecision,
        reviewerName,
        reviewerDesignation,
        reviewerEmail,
        remarks
      });

      setSubmitSuccessMsg(response.message || "Coordination decision recorded successfully.");
      if (response.overlap) {
        setOverlapData(response.overlap);
      }
      setRemarks('');
    } catch (err) {
      console.error("Submission failed:", err);
      setSubmitError(err.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Retrieving Case intelligence dossiers..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  // Single Case View (if accessed directly by caseId)
  if (mode === 'single' || (!overlapId && caseId && singleCase)) {
    return (
      <>
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'All Cases', path: '/cases' },
            { label: singleCase.caseId }
          ]}
          title={`Case File: ${singleCase.caseId}`}
          subtitle={singleCase.category}
          badge={<BureauBadge code={singleCase.bureau} showFullName />}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-aicte-navy text-white text-xs font-semibold hover:bg-aicte-navy-light shadow-xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Case
              </button>
              <button
                onClick={() => setIsActionOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 shadow-xs"
              >
                <Activity className="w-3.5 h-3.5" />
                Record Action
              </button>
              <Link
                to="/cases"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Cases
              </Link>
            </div>
          }
        />

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Institution</span>
              <div className="font-bold text-slate-900 mt-0.5">{singleCase.institutionName}</div>
              <div className="font-mono text-slate-500">{singleCase.institutionId}</div>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Desk Officer</span>
              <div className="font-semibold text-slate-800 mt-0.5">{singleCase.assignedOfficer}</div>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Status</span>
              <div className="mt-0.5"><StatusBadge status={singleCase.status} /></div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-slate-700 mb-1">Description</h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded border border-slate-200">
              {singleCase.description}
            </p>
          </div>

          {singleCase.detailedAllegations && (
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-700 mb-1.5">Specific Allegations:</h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {singleCase.detailedAllegations.map((item, idx) => (
                  <li key={idx} className="p-2 rounded bg-slate-50 border border-slate-200">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Action History ─────────────────────────────────── */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-aicte-blue" />
                Action History
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                {(singleCase.actionHistory || []).length} record(s)
              </span>
            </div>

            {(!singleCase.actionHistory || singleCase.actionHistory.length === 0) ? (
              <div className="text-xs text-slate-500 py-6 text-center bg-slate-50 rounded border border-dashed border-slate-300">
                No actions recorded yet for this case.
              </div>
            ) : (
              <div className="relative pl-5 space-y-3 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {[...(singleCase.actionHistory)]
                  .sort((a, b) => new Date(b.action_date || 0) - new Date(a.action_date || 0))
                  .map((action, idx) => (
                    <div key={action.id || idx} className="relative">
                      <div className="absolute -left-5 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-aicte-navy flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-aicte-navy" />
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2 hover:bg-white hover:shadow-xs transition-all">
                        {/* Title row */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="font-semibold text-slate-900 leading-snug">
                            {action.action_taken}
                          </span>
                          {action.action_date && (
                            <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px] shrink-0">
                              <Calendar className="w-3 h-3" />
                              {formatDate(action.action_date)}
                            </span>
                          )}
                        </div>

                        {/* Remarks */}
                        {action.remarks && (
                          <p className="text-slate-600 leading-relaxed bg-white px-2.5 py-2 rounded border border-slate-200 font-mono text-[11px] italic">
                            &ldquo;{action.remarks}&rdquo;
                          </p>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
                          {action.action_by && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              By: <strong className="text-slate-700 ml-0.5">{action.action_by}</strong>
                            </span>
                          )}
                          {action.next_action && (
                            <span>
                              Next: <strong className="text-slate-700">{action.next_action}</strong>
                            </span>
                          )}
                          {(action.previous_status || action.new_status) && (
                            <span className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px]">
                                {action.previous_status || '—'}
                              </span>
                              <span className="text-slate-400">→</span>
                              <span className="px-1.5 py-0.5 rounded bg-aicte-navy/10 text-aicte-navy font-mono font-semibold text-[10px]">
                                {action.new_status || '—'}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Case Modal */}
      <EditCaseModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        caseData={singleCase?._raw}
        onRefresh={handleRefresh}
      />

      {/* Record Action Modal */}
      <RecordActionModal
        isOpen={isActionOpen}
        onClose={() => setIsActionOpen(false)}
        caseId={singleCase?.caseId}
        onRefresh={handleRefresh}
      />
      </>
    );
  }

  // --- UNIFIED CASE COMPARISON & REVIEW WORKFLOW ---
  const instName = overlapData?.institutionName || caseA?.institutionName;
  const instId = overlapData?.institutionId || caseA?.institutionId;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Overlaps Dashboard', path: '/overlaps' },
          { label: `Comparison: ${caseA?.caseId || 'Case A'} vs ${caseB?.caseId || 'Case B'}` }
        ]}
        title="Case Comparison & Coordination Review"
        subtitle={`Inspect related complaints across bureaus for ${instName} and record your statutory determination.`}
        actions={
          <Link
            to="/overlaps"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        }
      />

      {/* Target Institution Overview Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-aicte-navy text-white flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{instName}</h2>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-bold text-slate-700 border border-slate-200">
                {instId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {overlapData?.institutionCity} • {overlapData?.institutionRegion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Current Review Status</div>
            <div className="mt-0.5"><StatusBadge status={overlapData?.status || "Pending Review"} /></div>
          </div>
          <div className="text-center px-3 py-1 rounded bg-blue-50 border border-blue-200">
            <div className="text-[10px] font-bold text-blue-700 uppercase">Match Score</div>
            <div className="text-sm font-bold text-aicte-navy">{overlapData?.matchScore}%</div>
          </div>
        </div>
      </div>

      {/* 1. SIDE-BY-SIDE CASE COMPARISON */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-aicte-navy" />
          Side-by-Side Case Comparison
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Case A */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
            <div className="bg-rose-50/70 border-b border-rose-200 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Case Track 1</span>
                <div className="font-mono text-base font-bold text-slate-900">{caseA?.caseId}</div>
              </div>
              <BureauBadge code={caseA?.bureauCode} showFullName />
            </div>

            <div className="p-4 space-y-3.5 text-xs flex-1">
              <div className="flex items-center justify-between text-slate-600 border-b border-slate-100 pb-2">
                <span>Status: <StatusBadge status={caseA?.status} /></span>
                <span>Filed: <strong className="font-semibold text-slate-800">{formatDate(caseA?.filingDate)}</strong></span>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Subject / Allegation Title:</span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {caseA?.title}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Case Description:</span>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                  {caseA?.summary}
                </p>
              </div>

              {caseA?.detailedAllegations && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Key Allegations:</span>
                  <ul className="space-y-1 text-slate-600">
                    {caseA.detailedAllegations.map((item, idx) => (
                      <li key={idx} className="p-1.5 rounded bg-slate-50/70 border border-slate-200">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Case B */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
            <div className="bg-blue-50/70 border-b border-blue-200 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Case Track 2</span>
                <div className="font-mono text-base font-bold text-slate-900">{caseB?.caseId}</div>
              </div>
              <BureauBadge code={caseB?.bureauCode} showFullName />
            </div>

            <div className="p-4 space-y-3.5 text-xs flex-1">
              <div className="flex items-center justify-between text-slate-600 border-b border-slate-100 pb-2">
                <span>Status: <StatusBadge status={caseB?.status} /></span>
                <span>Filed: <strong className="font-semibold text-slate-800">{formatDate(caseB?.filingDate)}</strong></span>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Subject / Inspection Title:</span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {caseB?.title}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Case Description:</span>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                  {caseB?.summary}
                </p>
              </div>

              {caseB?.detailedAllegations && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Key Findings / Observations:</span>
                  <ul className="space-y-1 text-slate-600">
                    {caseB.detailedAllegations.map((item, idx) => (
                      <li key={idx} className="p-1.5 rounded bg-slate-50/70 border border-slate-200">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE RELATIONSHIP GRAPH TOPOLOGY */}
      <div>
        <RelationshipGraph
          institution={{ name: instName, id: instId, region: overlapData?.institutionRegion }}
          caseA={caseA}
          caseB={caseB}
          overlap={overlapData}
        />
      </div>

      {/* 3. SUPPLIED MATCHING EVIDENCE */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <MatchReasons matchReasons={overlapData?.matchReasons} />
      </div>

      {/* 4. HUMAN REVIEW FORM */}
      <div id="review-section" className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-aicte-navy" />
              Officer Coordination Review
            </h3>
            <span className="text-[11px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Human In The Loop Determination
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate the evidence above and select a statutory determination. Potential overlaps do not automatically merge cases.
          </p>
        </div>

        {/* Success message */}
        {submitSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Review Saved Successfully: </span>
              {submitSuccessMsg}
            </div>
          </div>
        )}

        {/* Error message */}
        {submitError && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-xs flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>{submitError}</div>
          </div>
        )}

        <form onSubmit={handleReviewSubmit} className="space-y-4">
          {/* Decision Selection: 3 Options */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Decision <span className="text-rose-600">*</span>
            </label>
            {validationErrors.decision && (
              <p className="text-xs text-rose-600 mb-1.5 font-medium">{validationErrors.decision}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {REVIEW_DECISION_OPTIONS.map((opt) => {
                const isSelected = selectedDecision === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setSelectedDecision(opt.id);
                      if (validationErrors.decision) {
                        setValidationErrors({ ...validationErrors, decision: null });
                      }
                    }}
                    className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between ${isSelected
                      ? `${opt.colorClass} shadow-xs ring-1 ring-offset-1`
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs uppercase tracking-wide">
                          {opt.title}
                        </span>
                        <input
                          type="radio"
                          name="reviewDecision"
                          checked={isSelected}
                          onChange={() => setSelectedDecision(opt.id)}
                          className="w-3.5 h-3.5 text-aicte-navy"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                        {opt.tagline}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviewer Identity */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reviewer Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. Dr. S. K. Narayanan"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:ring-1 focus:ring-aicte-blue"
                required
              />
              {validationErrors.reviewerName && (
                <p className="text-[11px] text-rose-600 mt-0.5">{validationErrors.reviewerName}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Official Designation / Bureau <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={reviewerDesignation}
                onChange={(e) => setReviewerDesignation(e.target.value)}
                placeholder="e.g. Senior Evaluation Officer, AICTE HQ"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:ring-1 focus:ring-aicte-blue"
                required
              />
              {validationErrors.reviewerDesignation && (
                <p className="text-[11px] text-rose-600 mt-0.5">{validationErrors.reviewerDesignation}</p>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Official Remarks & Justification <span className="text-rose-600">*</span>
              </label>
              <span className={`text-[11px] font-mono ${remarks.trim().length >= 15 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                {remarks.trim().length} chars (min 15)
              </span>
            </div>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (validationErrors.remarks) {
                  setValidationErrors({ ...validationErrors, remarks: null });
                }
              }}
              placeholder="State the findings and operational directive for the participating bureau desks..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:ring-1 focus:ring-aicte-blue leading-relaxed"
              required
            />
            {validationErrors.remarks && (
              <p className="text-[11px] text-rose-600 mt-0.5">{validationErrors.remarks}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Official Determination Record
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-aicte-navy text-white text-xs font-bold hover:bg-aicte-navy-light transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Determination
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 4. COMPACT REVIEW HISTORY */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-aicte-blue" />
            Recorded Review History ({overlapData?.reviewHistory?.length || 0})
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">Audit Log</span>
        </div>

        {overlapData?.reviewHistory && overlapData.reviewHistory.length > 0 ? (
          <div className="space-y-2.5">
            {overlapData.reviewHistory.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className={`p-3 rounded border text-xs ${entry.isDemoSubmission
                  ? 'bg-slate-50 border-blue-200'
                  : 'bg-slate-50 border-slate-200'
                  }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={entry.decision} />
                    {entry.isDemoSubmission && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-semibold">
                        RECENT DETERMINATION
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {formatDateTime(entry.timestamp)}
                  </span>
                </div>

                <p className="text-slate-800 bg-white p-2.5 rounded border border-slate-200 font-mono text-[11px]">
                  "{entry.remarks}"
                </p>

                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Officer: <strong className="text-slate-700">{entry.reviewerName}</strong> ({entry.reviewerDesignation})</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 py-3 text-center">
            No previous review records found.
          </div>
        )}
      </div>
    </div>
  );
}
