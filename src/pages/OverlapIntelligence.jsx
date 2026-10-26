import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { getOverlaps } from '../services/overlapApi';
import PageHeader from '../components/common/PageHeader';
import { BureauBadge, StatusBadge } from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';

export default function OverlapIntelligence() {
  const [overlaps, setOverlaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simplified Search and Single Status Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchOverlapsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOverlaps({
        search: searchTerm,
        status: statusFilter
      });
      setOverlaps(data.items || []);
    } catch (err) {
      console.error("Error retrieving overlaps:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchOverlapsData();
  }, [fetchOverlapsData]);

  // Three essential counts
  const totalCount = overlaps.length;
  const pendingCount = overlaps.filter(o => o.status === 'Pending Review').length;
  const coordinatedCount = overlaps.filter(o => o.status === 'Coordination Required').length;

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Cross-Bureau Overlap Intelligence"
        subtitle="Detect procedural overlaps and shared institutions across AICTE Bureaus for human review."
        actions={
          <button
            type="button"
            onClick={fetchOverlapsData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Overlaps */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Potential Overlaps</span>
            <div className="w-7 h-7 rounded bg-blue-50 text-aicte-blue flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {totalCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Registered institution cases
          </p>
        </div>

        {/* Pending Review */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Review</span>
            <div className="w-7 h-7 rounded bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-2">
            {pendingCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Awaiting officer determination
          </p>
        </div>

        {/* Coordination Required */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Coordination Required</span>
            <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-2">
            {coordinatedCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cross-bureau aligned actions
          </p>
        </div>
      </div>

      {/* Simple Search and One Useful Status Filter */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by institution name, PID, or case ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-aicte-blue"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by review status"
            className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-aicte-blue"
          >
            <option value="ALL">All Review Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Coordination Required">Coordination Required</option>
            <option value="Not Related">Not Related</option>
            <option value="Further Review Required">Further Review Required</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-rose-700 hover:text-rose-900 font-medium px-2 py-1 rounded hover:bg-rose-50"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Clean Table */}
      {loading ? (
        <LoadingState message="Loading AICTE cross-bureau overlap records..." />
      ) : error ? (
        <ErrorState error={error} onRetry={fetchOverlapsData} />
      ) : overlaps.length === 0 ? (
        <EmptyState
          title="No Overlaps Match Your Criteria"
          description="Try adjusting your search query or selecting 'All Review Statuses'."
          onAction={handleClearFilters}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Related Cases & Bureaus</th>
                  <th className="py-3 px-4 text-center">Match Score</th>
                  <th className="py-3 px-4">Key Overlap Reason</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {overlaps.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Institution */}
                    <td className="py-3 px-4 align-top">
                      <div className="font-bold text-slate-900 text-xs">
                        {item.institutionName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                        {item.institutionId}
                      </div>
                      {item.institutionCity && (
                        <div className="text-[11px] text-slate-400">
                          {item.institutionCity}
                        </div>
                      )}
                    </td>

                    {/* Related Cases */}
                    <td className="py-3 px-4 align-top">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <BureauBadge code={item.caseABureau} />
                          <span className="font-mono font-semibold text-slate-900">
                            {item.caseAId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BureauBadge code={item.caseBBureau} />
                          <span className="font-mono font-semibold text-slate-900">
                            {item.caseBId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Match Score */}
                    <td className="py-3 px-4 align-top text-center">
                      <span className="inline-block px-2 py-0.5 rounded font-bold text-xs bg-blue-50 text-aicte-blue border border-blue-200">
                        {item.matchScore}%
                      </span>
                    </td>

                    {/* Short Matching Reason */}
                    <td className="py-3 px-4 align-top max-w-xs">
                      <p className="text-slate-600 line-clamp-2 leading-relaxed">
                        {item.summary || item.keySignals?.join(', ')}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 align-top">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 align-top text-right">
                      <Link
                        to={`/compare/${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-aicte-navy text-white text-xs font-semibold hover:bg-aicte-navy-light transition-colors shadow-xs"
                      >
                        View Details
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
