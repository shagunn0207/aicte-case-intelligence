import React from 'react';
import CaseDetails from './CaseDetails';

/**
 * CoordinationReview Page
 * In the simplified prototype, review is seamlessly integrated with
 * the case comparison dossier so officers evaluate evidence and decide in one view.
 */
export default function CoordinationReview() {
  return <CaseDetails mode="compare" />;
}
