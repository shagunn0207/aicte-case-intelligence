import React, { useEffect, useState } from 'react';
import { fetchDashboardData } from '../services/dashboardApi';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const result = await fetchDashboardData();
                setData(result);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    if (loading) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-red-600">
                Error loading dashboard: {error.message}
            </div>
        );
    }

    const stats = [
        { title: 'Total Cases', value: data?.total_cases ?? 0, icon: '📊' },
        { title: 'Pending', value: data?.pending_cases ?? 0, icon: '⏳' },
        { title: 'Under Process', value: data?.under_process_cases ?? 0, icon: '⚙️' },
        { title: 'Disposed', value: data?.disposed_cases ?? 0, icon: '✅' },
        { title: 'Transferred', value: data?.transferred_cases ?? 0, icon: '🔁' },
        { title: 'Escalated', value: data?.escalated_cases ?? 0, icon: '🚨' },
    ];

    const bureauWorkload = (data?.bureau_wise_workload ?? []).map((item) => ({
        bureau: item.bureau,
        count: item.case_count,
    }));

    const statusDistribution = (data?.status_distribution ?? []).map((item) => ({
        name: item.status,
        value: item.count,
    }));

    const regionCases = (data?.region_wise_cases ?? []).map((item) => ({
        region: item.region,
        count: item.case_count,
    }));

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Executive Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Overview of complaint cases across AICTE bureaus and regions.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <KpiCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                    />
                ))}
            </div>

            <section>
                <h2 className="text-xl font-semibold mb-4">Bureau Workload</h2>
                <BarChart data={bureauWorkload} xKey="bureau" yKey="count" />
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">
                    Case Status Distribution
                </h2>
                <DonutChart data={statusDistribution} />
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Region-wise Cases</h2>
                <BarChart data={regionCases} xKey="region" yKey="count" />
            </section>
        </div>
    );
}

function KpiCard({ title, value, icon }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className="text-3xl">{icon}</div>
            <div>
                <div className="text-sm text-slate-500">{title}</div>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
            </div>
        </div>
    );
}

function BarChart({ data, xKey, yKey }) {
    const maxValue = Math.max(1, ...data.map((item) => Number(item[yKey]) || 0));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-5">
            {data.map((item) => {
                const value = Number(item[yKey]) || 0;
                const width = (value / maxValue) * 100;

                return (
                    <div key={item[xKey]}>
                        <div className="flex justify-between gap-4 text-sm mb-2">
                            <span className="text-slate-700">{item[xKey]}</span>
                            <span className="font-semibold text-slate-900">{value}</span>
                        </div>

                        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-blue-600 transition-all"
                                style={{ width: `${width}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function DonutChart({ data }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = [
        'bg-amber-500',
        'bg-blue-600',
        'bg-emerald-500',
        'bg-purple-500',
        'bg-rose-500',
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            {total === 0 ? (
                <p className="text-sm text-slate-500">No case status data available.</p>
            ) : (
                <>
                    <div className="flex h-5 w-full overflow-hidden rounded-full mb-5">
                        {data.map((item, index) => (
                            <div
                                key={item.name}
                                title={`${item.name}: ${item.value}`}
                                className={colors[index % colors.length]}
                                style={{ width: `${(item.value / total) * 100}%` }}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.map((item, index) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <span
                                    className={`w-3 h-3 rounded-sm ${colors[index % colors.length]}`}
                                />
                                <span className="text-sm text-slate-600">{item.name}</span>
                                <span className="ml-auto text-sm font-semibold">
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
