import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-4">
        <FileQuestion className="w-8 h-8 text-aicte-navy" />
      </div>
      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
        Error 404 • Dossier Not Found
      </span>
      <h2 className="text-xl font-bold text-slate-900 mt-3">
        Requested Case File or Overlap Does Not Exist
      </h2>
      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
        The specified case reference, overlap identifier, or portal route could not be located in the AICTE case registries.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/overlaps"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-aicte-navy text-white text-xs font-bold hover:bg-aicte-navy-light transition-colors shadow-sm"
        >
          <Home className="w-3.5 h-3.5" />
          Return to Overlap Intelligence
        </Link>
      </div>
    </div>
  );
}
