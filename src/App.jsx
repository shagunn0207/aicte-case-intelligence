import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ModuleLayout from './components/layout/ModuleLayout';
import OverlapIntelligence from './pages/OverlapIntelligence';
import CaseDetails from './pages/CaseDetails';
import CoordinationReview from './pages/CoordinationReview';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ModuleLayout>
      <Routes>
        {/* Default route redirects to Overlap Intelligence */}
        <Route path="/" element={<Navigate to="/overlaps" replace />} />

        {/* Master Overlap Intelligence Page */}
        <Route path="/overlaps" element={<OverlapIntelligence />} />

        {/* Case Comparison Page (Side-by-Side Dual Dossier) */}
        <Route path="/compare/:overlapId" element={<CaseDetails mode="compare" />} />

        {/* Single Case Dossier View */}
        <Route path="/cases/:caseId" element={<CaseDetails mode="single" />} />

        {/* Coordination Determination & Review Form */}
        <Route path="/coordination-review/:overlapId" element={<CoordinationReview />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ModuleLayout>
  );
}
