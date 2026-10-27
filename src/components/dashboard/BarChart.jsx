// src/components/dashboard/BarChart.jsx
import React from 'react';
import { BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function BarChart({ data, xKey, yKey }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-500">No data available.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RBarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey={yKey} fill="#4f46e5" />
      </RBarChart>
    </ResponsiveContainer>
  );
}
