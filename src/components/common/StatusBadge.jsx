import React from 'react';
import { BUREAU_DEFINITIONS, STATUS_DEFINITIONS } from '../../utils/formatters';

export function BureauBadge({ code, showFullName = false, className = '' }) {
  const meta = BUREAU_DEFINITIONS[code] || {
    code: code || 'UNK',
    name: code || 'Unknown Bureau',
    shortName: code || 'Unknown',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    dotColor: 'bg-slate-500'
  };

  return (
    <span
      title={meta.name}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.badgeColor} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`} />
      <span>{code}</span>
      {showFullName && <span className="font-normal text-[11px] opacity-85">({meta.shortName})</span>}
    </span>
  );
}

export function StatusBadge({ status, className = '' }) {
  const meta = STATUS_DEFINITIONS[status] || {
    label: status || 'Unknown',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.color} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`} />
      <span>{meta.label}</span>
    </span>
  );
}

export function PriorityBadge({ priority, className = '' }) {
  const p = (priority || '').toLowerCase();
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (p === 'critical') {
    badgeStyle = 'bg-red-50 text-red-800 border-red-300 font-semibold';
  } else if (p === 'high') {
    badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200 font-medium';
  } else if (p === 'medium') {
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (p === 'low') {
    badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] uppercase tracking-wider border ${badgeStyle} ${className}`}
    >
      {priority || 'Standard'}
    </span>
  );
}
