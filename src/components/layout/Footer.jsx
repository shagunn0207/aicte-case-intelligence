import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-sm mb-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              AICTE Institution 360° Intelligence
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Institutional platform for cross-bureau case intelligence, detecting procedural
              convergences and ensuring synchronized regulatory reviews across technical education bodies.
            </p>
          </div>

          <div>
            <div className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              Statutory Determination Policy
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Potential overlap alerts represent procedural indicators, not confirmed duplication.
              Every proceeding requires human determination by competent bureau officers. Complaints
              are never automatically merged, modified, or closed by the system.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © All India Council for Technical Education (AICTE). All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-slate-400">Institutional Case Intelligence</span>
            <span>•</span>
            <span>Secure Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
