import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchCases } from '../services/caseApi';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

const PAGE_SIZE = 20;

const STATUSES = [
    'Pending',
    'Under Process',
    'Disposed',
    'Transferred',
    'Escalated',
];

export default function AllCases() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const status = searchParams.get('status') || '';
    const bureau = searchParams.get('bureau') || '';

    useEffect(() => {
        let cancelled = false;

        async function loadCases() {
            setLoading(true);
            setError(null);

            try {
                const result = await fetchCases({
                    page,
                    page_size: PAGE_SIZE,
                    status,
                    bureau,
                });

                if (!cancelled) {
                    setData(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadCases();

        return () => {
            cancelled = true;
        };
    }, [page, status, bureau, retryCount]);

    function updateFilters(nextStatus, nextBureau) {
        const params = {};

        if (nextStatus) params.status = nextStatus;
        if (nextBureau) params.bureau = nextBureau;

        params.page = '1';
        setSearchParams(params);
    }

    function goToPage(nextPage) {
        const params = {};

        if (status) params.status = status;
        if (bureau) params.bureau = bureau;

        params.page = String(nextPage);
        setSearchParams(params);
    }

    if (loading && !data) {
        return <LoadingState message="Loading complaint cases..." />;
    }

    if (error && !data) {
        return (
            <ErrorState
                error={error}
                onRetry={() => setRetryCount((count) => count + 1)}
            />
        );
    }

    const cases = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    All Cases
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Browse and filter complaint records across AICTE bureaus.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label
                        htmlFor="case-status"
                        className="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Filter by status
                    </label>

                    <select
                        id="case-status"
                        value={status}
                        onChange={(event) =>
                            updateFilters(event.target.value, bureau)
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                    >
                        <option value="">All statuses</option>
                        {STATUSES.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="case-bureau"
                        className="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Filter by bureau
                    </label>

                    <input
                        id="case-bureau"
                        value={bureau}
                        onChange={(event) =>
                            updateFilters(status, event.target.value.trim())
                        }
                        placeholder="e.g. PGRC or RB"
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                    />
                </div>
            </div>

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Could not refresh the cases. Showing the previously loaded results.
                    <button
                        onClick={() => setRetryCount((count) => count + 1)}
                        className="ml-2 underline font-medium"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200">
                    <p className="text-sm text-slate-600">
                        Total cases: <strong>{total}</strong>
                    </p>
                </div>

                {cases.length === 0 ? (
                    <EmptyState
                        title="No cases found"
                        description="Try changing the selected filters."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="px-4 py-3 text-left">Case ID</th>
                                    <th className="px-4 py-3 text-left">Institution ID</th>
                                    <th className="px-4 py-3 text-left">Category</th>
                                    <th className="px-4 py-3 text-left">Bureau</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Received</th>
                                    <th className="px-4 py-3 text-left">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-200">
                                {cases.map((item) => (
                                    <tr
                                        key={item.case_id}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {item.case_id}
                                        </td>

                                        <td className="px-4 py-3">
                                            {item.institution_id || '—'}
                                        </td>

                                        <td className="px-4 py-3">
                                            {item.category || '—'}
                                        </td>

                                        <td className="px-4 py-3">
                                            {item.bureau || '—'}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                                {item.status || 'Unknown'}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3">
                                            {item.received_date
                                                ? new Date(item.received_date).toLocaleDateString()
                                                : '—'}
                                        </td>

                                        <td className="px-4 py-3">
                                            <Link
                                                to={`/cases/${encodeURIComponent(item.case_id)}`}
                                                className="font-medium text-blue-700 hover:underline"
                                            >
                                                View details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
                    <button
                        type="button"
                        disabled={page <= 1 || loading}
                        onClick={() => goToPage(page - 1)}
                        className="rounded-md border px-3 py-2 disabled:opacity-40"
                    >
                        Previous
                    </button>

                    <span className="text-sm text-slate-600">
                        Page {page} of {totalPages}
                    </span>

                    <button
                        type="button"
                        disabled={page >= totalPages || loading}
                        onClick={() => goToPage(page + 1)}
                        className="rounded-md border px-3 py-2 disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}