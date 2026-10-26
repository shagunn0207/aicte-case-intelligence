import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Shield,
  Layers,
  GitCompare,
  Building2,
  Menu,
  X,
  Home,
  FileStack
} from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/institutions', label: 'Institutions', icon: FileStack },
    { to: '/cases', label: 'All Cases', icon: Layers },
    { to: '/overlaps', label: 'Overlap Dashboard', icon: Layers },
    { to: '/compare/OVL-2026-0814', label: 'Compare & Review', icon: GitCompare },
  ];

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
          {/* Platform Identity */}
          <Link to="/overlaps" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-aicte-navy text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-aicte-blue transition-colors">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 group-hover:text-aicte-blue transition-colors tracking-tight block leading-tight">
                AICTE Case Intelligence
              </span>
              <span className="text-[11px] text-slate-500 block leading-tight">
                Cross-Bureau Overlap & Coordination Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-aicte-navy shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-2 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold ${
                    isActive
                      ? 'bg-slate-100 text-aicte-navy'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
}
