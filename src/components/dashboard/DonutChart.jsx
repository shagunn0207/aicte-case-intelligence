// src/components/dashboard/DonutChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#fbbf24', '#2563eb', '#10b981', '#a855f7', '#f43f5e']; // amber, blue, emerald, purple, rose

export default function DonutChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-500">No data available.</p>;
  }
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          labelLine={false}
          label={({ percent, name }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value, 'Count']} />
      </PieChart>
    </ResponsiveContainer>
  );
}
