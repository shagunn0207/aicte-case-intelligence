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

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-red-600">Error loading dashboard: {error.message}</div>;

  const { totalCases, pending, underProcess, disposed, transferred, escalated, bureauWorkload, regionCases } = data || {};

  return (
    <div className="p-8 space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Cases" value={totalCases} icon="📊" />
        <KpiCard title="Pending" value={pending} icon="⏳" />
        <KpiCard title="Under Process" value={underProcess} icon="⚙️" />
        <KpiCard title="Disposed" value={disposed} icon="✅" />
        <KpiCard title="Transferred" value={transferred} icon="🔁" />
        <KpiCard title="Escalated" value={escalated} icon="🚨" />
      </div>

      {/* Bureau Workload Bar Chart */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Bureau Workload</h2>
        <BarChart data={bureauWorkload} xKey="bureau" yKey="count" />
      </section>

      {/* Case Status Distribution Donut */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Case Status Distribution</h2>
        <DonutChart
          data={[
            { name: 'Pending', value: pending },
            { name: 'Under Process', value: underProcess },
            { name: 'Disposed', value: disposed },
            { name: 'Transferred', value: transferred },
            { name: 'Escalated', value: escalated },
          ]}
        />
      </section>

      {/* Region‑wise Cases Bar Chart */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Region‑wise Cases</h2>
        <BarChart data={regionCases} xKey="region" yKey="count" />
      </section>
    </div>
  );
}

function KpiCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex items-center space-x-3">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-bold">{value ?? '-'}</div>
      </div>
    </div>
  );
}

function BarChart({ data, xKey, yKey }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <pre className="text-sm overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function DonutChart({ data }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <pre className="text-sm overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
