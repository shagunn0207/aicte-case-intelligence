import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchInstitutions } from '../services/institutionApi';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { Search, X } from 'lucide-react';

// Maps URL status slug -> human-readable label and badge styling
const STATUS_META = {
  pending: {
    label: 'Active / Pending',
    icon: '⏳',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    emptyTitle: 'No institutions with active (pending) cases',
    emptyDesc:
      'There are currently no institutions with active (Pending, Under Process, Escalated or Transferred) complaint cases.',
  },
  under_process: {
    label: 'Under Process',
    icon: '⚙️',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    emptyTitle: 'No institutions with Under Process cases',
    emptyDesc: 'There are currently no institutions that have cases under process.',
  },
  disposed: {
    label: 'Disposed',
    icon: '✅',
    badgeClass: 'bg-green-100 text-green-800 border-green-300',
    emptyTitle: 'No institutions with Disposed cases',
    emptyDesc: 'There are currently no institutions with disposed cases.',
  },
  transferred: {
    label: 'Transferred',
    icon: '🔁',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    emptyTitle: 'No institutions with Transferred cases',
    emptyDesc: 'There are currently no institutions with transferred cases.',
  },
  escalated: {
    label: 'Escalated',
    icon: '🚨',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    emptyTitle: 'No institutions with Escalated cases',
    emptyDesc: 'There are currently no institutions with escalated cases.',
  },
  overdue: {
    label: 'Overdue',
    icon: '⏰',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
    emptyTitle: 'No institutions with overdue cases',
    emptyDesc: 'There are currently no institutions with overdue cases.',
  },
};

export default function Institutions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const q = searchParams.get('q') || '';
  const page = Number(searchParams.get('page') || 1);
  const pageSize = Number(searchParams.get('page_size') || 10);
  const statusFilter = searchParams.get('status') || '';

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = { q, page, page_size: pageSize };
        if (statusFilter) params.status = statusFilter;
        const result = await fetchInstitutions(params);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [q, page, pageSize, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    const form = e.target;
    const value = form.elements.search.value.trim();
    const params = {};
    if (value) params.q = value;
    params.page = 1;
    params.page_size = pageSize;
    // Preserve any active status filter when searching
    if (statusFilter) params.status = statusFilter;
    setSearchParams(params);
  };

  const clearStatusFilter = () => {
    const params = {};
    if (q) params.q = q;
    params.page = 1;
    params.page_size = pageSize;
    setSearchParams(params);
  };

  const goToPage = (newPage) => {
    const params = { q, page: newPage, page_size: pageSize };
    if (statusFilter) params.status = statusFilter;
    setSearchParams(params);
  };

  if (loading) return <LoadingState message="Loading institutions..." />;
  if (error) return <ErrorState error={error} onRetry={() => setLoading(true)} />;

  const { items = [], total = 0 } = data || {};
  const totalPages = Math.ceil(total / pageSize);

  const activeMeta = STATUS_META[statusFilter?.toLowerCase()] || null;

  // Empty state: differentiate between "no institutions at all" and "none match the filter"
  if (!data || items.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold mb-4">Institutions</h1>
        {activeMeta && (
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${activeMeta.badgeClass}`}
            >
              {activeMeta.icon} {activeMeta.label} Filter Active
            </span>
            <button
              onClick={clearStatusFilter}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 underline"
            >
              <X className="w-3 h-3" /> Clear filter
            </button>
          </div>
        )}
        <EmptyState
          title={activeMeta ? activeMeta.emptyTitle : 'No institutions found'}
          description={activeMeta ? activeMeta.emptyDesc : 'Try adjusting the search criteria.'}
        />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Institutions</h1>

      {/* Active filter badge */}
      {activeMeta && (
        <div className="flex items-center gap-2 -mt-2 mb-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${activeMeta.badgeClass}`}
          >
            {activeMeta.icon} Showing institutions with {activeMeta.label} cases
          </span>
          <button
            onClick={clearStatusFilter}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 underline"
          >
            <X className="w-3 h-3" /> Clear filter
          </button>
        </div>
      )}

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          name="search"
          defaultValue={q}
          placeholder="Search by name or AICTE ID"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-aicte-navy text-white rounded flex items-center">
          <Search className="w-4 h-4 mr-1" /> Search
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left">Institution</th>
              <th className="px-4 py-2 text-left">AICTE ID</th>
              <th className="px-4 py-2 text-left">State / Region</th>
              <th className="px-4 py-2 text-left">Total Cases</th>
              <th className="px-4 py-2 text-left">Pending / Active</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((inst) => (
              <tr key={inst.institution_id} className="border-t border-slate-200">
                <td className="px-4 py-2">{inst.name || '-'} </td>
                <td className="px-4 py-2">{inst.institution_id || '-'} </td>
                <td className="px-4 py-2">{inst.region || inst.state || '-'} </td>
                <td className="px-4 py-2 text-center">{inst.case_count ?? 0}</td>
                <td className="px-4 py-2 text-center">—</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => navigate(`/institutions/${encodeURIComponent(inst.institution_id)}/relationship-map`)}
                    className="px-3 py-1 bg-aicte-navy text-white rounded text-sm"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
