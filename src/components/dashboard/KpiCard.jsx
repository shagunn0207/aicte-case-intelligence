// src/components/dashboard/KpiCard.jsx
import React from 'react';

export default function KpiCard({ title, value, icon, onClick }) {
  const isClickable = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 transition-colors ${
        isClickable
          ? 'cursor-pointer hover:border-aicte-navy hover:shadow-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-aicte-navy'
          : ''
      }`}
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-sm text-slate-500">{title}</div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </div>
    </div>
  );
}
