import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  FileText,
  Clock,
  Sparkles,
  GitMerge,
  AlertTriangle,
  Inbox
} from 'lucide-react';
import { fetchInstitution } from '../services/institutionApi';
import { getOverlaps } from '../services/overlapApi';
import PageHeader from '../components/common/PageHeader';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { BureauBadge, StatusBadge } from '../components/common/StatusBadge';
import MatchReasons from '../components/overlaps/MatchReasons';
import { formatDate } from '../utils/formatters';

export default function InstitutionProfile() {
  const { institutionId } = useParams();

  const [institution, setInstitution] = useState(null);
  const [overlaps, setOverlaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!institutionId) return;
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch institution details and associated cases
        const instData = await fetchInstitution(institutionId);

        // 2. Fetch cross-bureau overlap intelligence
        let overlapsData = [];
        try {
          const res = await getOverlaps({ search: institutionId });
          overlapsData = res?.items || [];
        } catch (ovlErr) {
          console.warn('Could not load overlaps for institution:', ovlErr);
        }

        if (isMounted) {
          setInstitution(instData);
          setOverlaps(overlapsData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [institutionId]);

  // Derived metrics from verified complaint cases
  const associatedCases = useMemo(() => {
    return institution?.associated_cases || institution?.cases || [];
  }, [institution]);

  const metrics = useMemo(() => {
    const total = associatedCases.length;
    let active = 0;
    let overdue = 0;
    let canCalculateOverdue = true;

    const now = new Date();

    associatedCases.forEach((c) => {
      const status = (c.status || '').toLowerCase();
      const isDisposed = status === 'disposed' || status === 'resolved';

      if (!isDisposed) {
        active += 1;
      }

      // Overdue calculation only if valid due_date exists and not disposed
      if (c.due_date) {
        const dueDate = new Date(c.due_date);
        if (!isNaN(dueDate.getTime())) {
          if (!isDisposed && dueDate < now) {
            overdue += 1;
          }
        } else {
          canCalculateOverdue = false;
        }
      } else {
        canCalculateOverdue = false;
      }
    });

    return {
      total,
      active,
      overdue: canCalculateOverdue ? overdue : null
    };
  }, [associatedCases]);

  // Group complaint cases by bureau
  const casesByBureau = useMemo(() => {
    const map = {};
    associatedCases.forEach((c) => {
      const b = c.bureau || 'Unknown Bureau';
      if (!map[b]) {
        map[b] = [];
      }
      map[b].push(c);
    });
    return map;
  }, [associatedCases]);

  // Filter overlaps specific to this institution
  const relevantOverlaps = useMemo(() => {
    if (!institutionId || !overlaps.length) return [];
    const targetId = institutionId.toLowerCase().trim();
    return overlaps.filter((ovl) => {
      const oInstId = (ovl.institutionId || ovl.institution_id || '').toLowerCase().trim();
      return oInstId === targetId;
    });
  }, [institutionId, overlaps]);

  if (loading) {
    return <LoadingState message="Loading AICTE Institution 360° Profile..." />;
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState
          error={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <EmptyState
          title="Institution Not Found"
          description={`No record matches AICTE Institution ID "${institutionId}".`}
        />
      </div>
    );
  }

  const instName = institution.name || 'AICTE Approved Institution';
  const instId = institution.institution_id || institution.id || institutionId;
  const address = institution.address;
  const region = institution.region || institution.state;
  const institutionType = institution.institution_type || institution.institutionType;
  const createdAt = institution.created_at || institution.establishedYear;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Institutions', path: '/institutions' },
          { label: instName }
        ]}
        title={instName}
        subtitle="AICTE Institution 360° Profile & Cross-Bureau Compliance Intelligence"
        badge={
          <span className="px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            PID: {instId}
          </span>
        }
        actions={
          <Link
            to="/institutions"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Institutions
          </Link>
        }
      />

      {/* Institution Overview & Metrics Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Metadata */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-aicte-navy text-white flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {instName}
              </h2>
              {address && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {address}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                Region / State
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {region || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                Institution Type
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {institutionType || 'Technical Institution'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                Onboarding / Record Date
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {createdAt ? formatDate(createdAt) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Key Summary Metric Counters */}
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Complaints
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {metrics.total}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Across all AICTE Bureaus
              </div>
            </div>
            <div className="w-8 h-8 rounded bg-blue-50 text-aicte-blue flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Active Complaints
              </div>
              <div className="text-2xl font-bold text-amber-700 mt-1">
                {metrics.active}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Pending or Under Process
              </div>
            </div>
            <div className="w-8 h-8 rounded bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          {metrics.overdue !== null && (
            <div className="col-span-2 lg:col-span-1 bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Overdue Complaints
                </div>
                <div className="text-2xl font-bold text-rose-700 mt-1">
                  {metrics.overdue}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Past statutory resolution deadline
                </div>
              </div>
              <div className="w-8 h-8 rounded bg-rose-50 text-rose-700 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: Cross-Bureau Overlap Intelligence */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-aicte-navy" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Cross-Bureau Overlap & Coordinated Intelligence
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {relevantOverlaps.length} Overlap Nexus Detected
          </span>
        </div>

        {relevantOverlaps.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center shadow-xs">
            <Inbox className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">
              No Cross-Bureau Overlaps Flagged
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No procedural overlap or candidate convergence is currently flagged across AICTE bureaus for this institution.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {relevantOverlaps.map((ovl) => {
              const overlapId = ovl.id || ovl.overlap_id || ovl.overlapId;
              const caseA = ovl.caseAId || ovl.case_a_id || ovl.primary_case_id;
              const caseB = ovl.caseBId || ovl.case_b_id || ovl.secondary_case_id;
              const bureauA = ovl.caseABureau || ovl.case_a_bureau;
              const bureauB = ovl.caseBBureau || ovl.case_b_bureau;
              const score = ovl.matchScore ?? ovl.match_score ?? (ovl.similarity_score ? Math.round(ovl.similarity_score * 100) : null);
              const status = ovl.status || 'Pending Review';
              const summary = ovl.summary || ovl.overlap_reason;
              const matchReasons = ovl.matchReasons || ovl.match_reasons || [];

              const isConfirmed = status === 'Coordination Required';

              return (
                <div
                  key={overlapId}
                  className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                >
                  {/* Overlap Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                        {overlapId}
                      </span>

                      {/* Badge: Distinguish Potential vs Confirmed */}
                      {isConfirmed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Human-Confirmed Coordination
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          Potential Candidate Overlap
                        </span>
                      )}

                      <StatusBadge status={status} />
                    </div>

                    <div className="flex items-center gap-3">
                      {score !== null && (
                        <span className="px-2 py-0.5 rounded font-bold text-xs bg-blue-50 text-aicte-blue border border-blue-200">
                          {score}% Match
                        </span>
                      )}

                      {overlapId && (
                        <Link
                          to={`/compare/${overlapId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-aicte-navy text-white text-xs font-semibold hover:bg-aicte-navy-light transition-colors shadow-xs"
                        >
                          Compare Cases
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Connected Cases & Bureaus */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          Case File 1
                        </span>
                        <div className="font-mono font-bold text-slate-900">
                          {caseA}
                        </div>
                      </div>
                      <BureauBadge code={bureauA} showFullName />
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          Case File 2
                        </span>
                        <div className="font-mono font-bold text-slate-900">
                          {caseB}
                        </div>
                      </div>
                      <BureauBadge code={bureauB} showFullName />
                    </div>
                  </div>

                  {/* Narrative Summary */}
                  {summary && (
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-900 block mb-0.5">
                        Algorithmic Overlap Narrative:
                      </span>
                      <p className="bg-slate-50/70 p-2.5 rounded border border-slate-200">
                        {summary}
                      </p>
                    </div>
                  )}

                  {/* Algorithmic Evidence Signals (Reusing MatchReasons component) */}
                  {matchReasons && matchReasons.length > 0 && (
                    <div className="pt-2">
                      <MatchReasons matchReasons={matchReasons} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Complaint Records Grouped by Bureau */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-aicte-navy" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Registered Complaint Records by Bureau
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {Object.keys(casesByBureau).length} Participating Bureaus / Cells
          </span>
        </div>

        {associatedCases.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center shadow-xs">
            <Inbox className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">
              No Complaints Registered
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              There are currently no complaint proceedings on record for this institution.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(casesByBureau).map(([bureauCode, cases]) => (
              <div
                key={bureauCode}
                className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden"
              >
                {/* Bureau Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BureauBadge code={bureauCode} showFullName />
                    <span className="text-xs font-semibold text-slate-700">
                      ({cases.length} case{cases.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>

                {/* Complaints Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">Case ID</th>
                        <th className="py-2.5 px-4">Category & Description</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Filing / Received</th>
                        <th className="py-2.5 px-4">Statutory Due Date</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {cases.map((c) => {
                        const cid = c.case_id || c.caseId;
                        const isOverdue =
                          c.due_date &&
                          (c.status || '').toLowerCase() !== 'disposed' &&
                          new Date(c.due_date) < new Date();

                        return (
                          <tr key={cid} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap align-top">
                              {cid}
                            </td>
                            <td className="py-3 px-4 align-top max-w-md">
                              <div className="font-semibold text-slate-900 mb-0.5">
                                {c.category || 'General Grievance'}
                              </div>
                              <p className="text-slate-600 line-clamp-2 leading-relaxed">
                                {c.description || c.summary || c.title || 'No description provided.'}
                              </p>
                            </td>
                            <td className="py-3 px-4 align-top whitespace-nowrap">
                              <StatusBadge status={c.status} />
                            </td>
                            <td className="py-3 px-4 align-top text-slate-600 whitespace-nowrap">
                              {formatDate(c.received_date || c.filingDate)}
                            </td>
                            <td className="py-3 px-4 align-top whitespace-nowrap">
                              {c.due_date ? (
                                <div className="space-y-0.5">
                                  <span className={isOverdue ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                                    {formatDate(c.due_date)}
                                  </span>
                                  {isOverdue && (
                                    <span className="block text-[10px] font-bold text-rose-600 uppercase">
                                      Overdue
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                              <Link
                                to={`/cases/${cid}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
                              >
                                View File
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
