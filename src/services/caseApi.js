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
function mapCaseResponse(data) {
  if (!data) return data;
  return {
    caseId: data.case_id,
    institutionId: data.institution_id,
    institutionName: data.institution?.name,
    category: data.category,
    description: data.description,
    bureau: data.bureau,
    status: data.status,
    assignedOfficer: data.assigned_officer,
    receivedDate: data.received_date,
    dueDate: data.due_date,
    lastAction: data.last_action,
    nextAction: data.next_action,
    lastActionAt: data.last_action_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    institution: data.institution,
    actionHistory: data.action_history,
    // Raw snake_case payload — passed to EditCaseModal which expects original field names
    _raw: data,
  };
}

export async function getCaseById(caseId) {
  const raw = await apiRequest(`/cases/${encodeURIComponent(caseId)}`);
  return mapCaseResponse(raw);
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
