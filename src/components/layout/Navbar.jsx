import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Building2,
} from 'lucide-react';

export default function Navbar() {
  // Navigation tabs have been removed. Users navigate to Institutions, All Cases,
  // and the Overlap Dashboard via the Executive Dashboard KPI cards.
  // The logo link continues to provide a way back to the Dashboard from any page.

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Institutional Identity Strip */}
      <div className="bg-aicte-navy text-white text-xs px-4 py-1.5 border-b border-aicte-navy-dark">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center font-bold text-amber-400 text-[10px] border border-white/20">
              <Building2 className="w-2.5 h-2.5" />
            </span>
            <span className="font-semibold tracking-wider text-[11px] text-slate-100 uppercase">
              All India Council for Technical Education
            </span>
          </div>

          <div className="text-[11px] text-slate-300 font-medium hidden sm:block">
            Institution 360° Portal
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Platform Identity — links to Dashboard */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-aicte-navy text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-aicte-blue transition-colors">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 group-hover:text-aicte-blue transition-colors tracking-tight block leading-tight">
                AICTE Case Intelligence
              </span>
              <span className="text-[11px] text-slate-500 block leading-tight">
                Cross-Bureau Overlap &amp; Coordination Platform
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
