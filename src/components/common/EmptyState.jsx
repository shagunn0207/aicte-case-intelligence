import React from 'react';
import { SearchX, FilterX } from 'lucide-react';

export default function EmptyState({
  icon: Icon = SearchX,
  title = "No Overlap Records Found",
  description = "No cross-bureau case similarities matched your current search criteria or active filters.",
  actionLabel = "Clear Filters",
  onAction,
  className = ""
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-4 border border-slate-200">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1.5 max-w-md">{description}</p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          <FilterX className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
