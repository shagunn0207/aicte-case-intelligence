import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ModuleLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Main portal navigation and header */}
      <Navbar />

      {/* Main page content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer with statutory notices */}
      <Footer />
    </div>
  );
}
