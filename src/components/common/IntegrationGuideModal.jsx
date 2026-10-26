import React from 'react';
import { X, Code2, Layers, CheckCircle2, Server, GitMerge, FileText } from 'lucide-react';
import { apiConfig } from '../../services/overlapApi';

export default function IntegrationGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-aicte-navy text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base">Person 2 Module Integration Blueprint</h3>
              <p className="text-xs text-slate-300">
                Guide for Person 1 (Shared Dashboard & Nav) and Backend Team (FastAPI)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-sm text-slate-700">
          {/* Quick Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              Clean Modular Architecture (Zero Tightly-Coupled State)
            </h4>
            <p className="text-xs text-blue-900/90 leading-relaxed">
              Person 2's components are completely decoupled. Person 1 can import the pages directly
              into a shared React Router setup or embed components like <code className="bg-white px-1 py-0.5 rounded font-mono">&lt;RelationshipGraph /&gt;</code> and <code className="bg-white px-1 py-0.5 rounded font-mono">&lt;OverlapCard /&gt;</code> inside the Institution 360° Profile page.
            </p>
          </div>

          {/* Section 1: Route Handshake for Person 1 */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-aicte-navy" />
              1. Routing Contract for Person 1
            </h4>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto space-y-1">
              <div className="text-slate-400">// Routes provided by Person 2's module:</div>
              <div>&lt;Route path="/overlaps" element=&#123;&lt;OverlapIntelligence /&gt;&#125; /&gt;</div>
              <div>&lt;Route path="/compare/:overlapId" element=&#123;&lt;CaseDetails mode="compare" /&gt;&#125; /&gt;</div>
              <div>&lt;Route path="/cases/:caseId" element=&#123;&lt;CaseDetails mode="single" /&gt;&#125; /&gt;</div>
              <div>&lt;Route path="/coordination-review/:overlapId" element=&#123;&lt;CoordinationReview /&gt;&#125; /&gt;</div>
            </div>
          </div>

          {/* Section 2: Embedding in Institution 360° Profile */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
              <GitMerge className="w-4 h-4 text-aicte-navy" />
              2. Embedding in Institution 360° Profile
            </h4>
            <p className="text-xs text-slate-600 mb-2">
              When Person 1 builds the Institution Profile, they can drop in the relationship graph and overlap cards for any specific institution:
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto space-y-1">
              <div>import &#123; RelationshipGraph, OverlapCard, MatchReasons &#125; from './components/overlaps';</div>
              <div>import &#123; getOverlaps &#125; from './services/overlapApi';</div>
            </div>
          </div>

          {/* Section 3: FastAPI Backend Contract */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-aicte-navy" />
              3. FastAPI Contract for Teammates
            </h4>
            <p className="text-xs text-slate-600 mb-2">
              All backend calls route through <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">src/services/overlapApi.js</code>. The FastAPI endpoints to implement:
            </p>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5">Endpoint</th>
                    <th className="p-2.5">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 font-mono font-bold text-blue-700">GET</td>
                    <td className="p-2.5 font-mono">/api/overlaps?search=&bureau=&status=</td>
                    <td className="p-2.5">Returns list of detected overlaps</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-bold text-blue-700">GET</td>
                    <td className="p-2.5 font-mono">/api/overlaps/{'{overlap_id}'}</td>
                    <td className="p-2.5">Returns single overlap with evidence signals</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-bold text-blue-700">GET</td>
                    <td className="p-2.5 font-mono">/api/cases/{'{case_id}'}</td>
                    <td className="p-2.5">Returns full case file, documents & timeline</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-bold text-emerald-700">POST</td>
                    <td className="p-2.5 font-mono">/api/overlaps/{'{overlap_id}'}/review</td>
                    <td className="p-2.5">Records coordination decision & remarks</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono font-bold text-emerald-700">POST</td>
                    <td className="p-2.5 font-mono">/api/cases/{'{case_id}'}/actions</td>
                    <td className="p-2.5">Logs timeline event / joint note</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-aicte-navy text-white text-xs font-semibold hover:bg-aicte-navy-light"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
