// src/services/caseApi.js
// Centralised API helper for case endpoints.

import { apiRequest } from './api';

/**
 * Fetch list of cases with optional filters.
 * GET /api/cases
 */
export async function fetchCases(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const endpoint = `/cases${query.toString() ? `?${query.toString()}` : ''}`;
  return await apiRequest(endpoint);
}

/**
 * Get case details.
 * GET /api/cases/{case_id}
 */
export async function getCaseById(caseId) {
  return await apiRequest(`/cases/${encodeURIComponent(caseId)}`);
}

/**
 * Patch case fields.
 * PATCH /api/cases/{case_id}
 */
export async function updateCase(caseId, payload) {
  return await apiRequest(`/cases/${encodeURIComponent(caseId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Record a procedural action.
 * POST /api/cases/{case_id}/actions
 */
export async function postCaseAction(caseId, payload) {
  return await apiRequest(`/cases/${encodeURIComponent(caseId)}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Retrieve linked cases.
 * GET /api/cases/{case_id}/links
 */
export async function getCaseLinks(caseId) {
  return await apiRequest(`/cases/${encodeURIComponent(caseId)}/links`);
}
