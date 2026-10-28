import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Network,
  Inbox
} from 'lucide-react';
import { fetchInstitution } from '../services/institutionApi';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import PageHeader from '../components/common/PageHeader';
import Institution360Graph from '../components/institutions/Institution360Graph';

/**
 * Institution360Map
 *
 * Route: /institutions/:institutionId/relationship-map
 *
 * Fetches the selected institution's full data (including associated_cases)
 * and renders the Institution360Graph relationship visualisation.
 */
export default function Institution360Map() {
  const { institutionId } = useParams();

  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!institutionId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchInstitution(institutionId);
        if (isMounted) setInstitution(data);
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [institutionId]);

  // Normalise associated cases — backend may use either key
  const cases = useMemo(() => {
    if (!institution) return [];
    return institution.associated_cases || institution.cases || [];
  }, [institution]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingState message="Building Institution 360° Relationship Map..." />;
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <ErrorState error={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!institution) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Link
          to="/institutions"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Institutions
        </Link>
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Institution Not Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            No record matches AICTE Institution ID &ldquo;{institutionId}&rdquo;.
          </p>
        </div>
      </div>
    );
  }

  const instName = institution.name || institution.institution_id || institutionId;
  const instId = institution.institution_id || institutionId;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <PageHeader
        breadcrumbs={[
          { label: 'Institutions', path: '/institutions' },
          { label: instName, path: `/institutions/${encodeURIComponent(instId)}` },
          { label: 'Relationship Map' },
        ]}
        title="Institution 360° Relationship Map"
        subtitle={`Dynamic complaint relationship graph for ${instName}`}
        badge={
          <span className="px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1.5">
            <Network className="w-3 h-3" />
            {instId}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/institutions/${encodeURIComponent(instId)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              Institution Profile
            </Link>
            <Link
              to="/institutions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Institutions
            </Link>
          </div>
        }
      />

      {/* ── Institution summary strip ──────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-aicte-navy text-white flex items-center justify-center">
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-snug">{instName}</div>
            <div className="text-[11px] text-slate-500 font-mono">
              {instId}
              {institution.region ? ` · ${institution.region}` : ''}
              {institution.institution_type ? ` · ${institution.institution_type}` : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">{cases.length}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Cases</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-700">
              {cases.filter((c) => {
                const s = (c.status || '').toLowerCase();
                return s !== 'disposed' && s !== 'resolved';
              }).length}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-700">
              {new Set(cases.map((c) => c.bureau).filter(Boolean)).size}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Bureaus</div>
          </div>
        </div>
      </div>

      {/* ── Empty state (institution exists but has no cases) ─────────────── */}
      {cases.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-xs">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Complaint Relationships Available</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No complaint cases are currently associated with{' '}
            <strong>{instName}</strong>. The relationship map will populate once
            cases are registered against this institution.
          </p>
        </div>
      ) : (
        /* ── Relationship Graph ─────────────────────────────────────────── */
        <Institution360Graph institution={institution} cases={cases} />
      )}
    </div>
  );
}

