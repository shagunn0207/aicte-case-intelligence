import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function PageHeader({
  breadcrumbs = [],
  title,
  subtitle,
  badge,
  actions,
  className = ''
}) {
  return (
    <div className={`mb-6 pb-4 border-b border-slate-200 ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2.5">
          <Link to="/overlaps" className="hover:text-slate-800 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span>Case Intelligence</span>
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              {crumb.path ? (
                <Link to={crumb.path} className="hover:text-slate-800 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-800 font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
