// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { fetchDashboardData } from '../services/dashboardApi';
import KpiCard from '../components/dashboard/KpiCard';
import BarChart from '../components/dashboard/BarChart';
import DonutChart from '../components/dashboard/DonutChart';

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
    { title: 'Overdue', value: data?.overdue_cases ?? 0, icon: '⏰' },
    { title: 'Potential Overlaps', value: data?.potential_overlaps ?? 0, icon: '🔗' },
    { title: 'Approaching Deadline', value: data?.cases_approaching_deadline ?? 0, icon: '⌛' },
  ];

  const bureauWorkload = (data?.bureau_wise_workload ?? []).map(item => ({ bureau: item.bureau, count: item.case_count }));
  const statusDistribution = (data?.status_distribution ?? []).map(item => ({ name: item.status, value: item.count }));
  const regionCases = (data?.region_wise_cases ?? []).map(item => ({ region: item.region, count: item.case_count }));

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of complaint cases across AICTE bureaus and regions.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(stat => (
          <KpiCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} />
        ))}
      </div>
      <section>
        <h2 className="text-xl font-semibold mb-4">Bureau Workload</h2>
        <BarChart data={bureauWorkload} xKey="bureau" yKey="count" />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Case Status Distribution</h2>
        <DonutChart data={statusDistribution} />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Region-wise Cases</h2>
        <BarChart data={regionCases} xKey="region" yKey="count" />
      </section>
    </div>
  );
}
