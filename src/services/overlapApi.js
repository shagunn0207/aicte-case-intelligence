/**
 * Centralised API Service for AICTE Cross-Bureau Overlap Intelligence
 *
 * Configurable via:
 * - VITE_API_BASE_URL (defaults to http://localhost:8000/api)
 * - VITE_USE_MOCK_DATA (defaults to true)
 *
 * Critical Architecture Rules:
 * 1. Network calls stay inside this service.
 * 2. Overlap scores and matching algorithms are NOT computed client-side.
 * 3. NO SILENT FALLBACK: If real API mode is enabled and a request fails,
 *    it throws a descriptive error so the UI can display an appropriate error state.
 * 4. Real submissions are never marked successful unless the backend confirms with 2xx.
 */

import { getMockStore, saveMockStore, resetMockStore } from '../mocks/overlapMockData';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export const apiConfig = {
  baseUrl: BASE_URL,
  useMock: USE_MOCK,
  isMockActive: () => USE_MOCK
};

/**
 * Helper to handle fetch responses and throw structured errors in real mode
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson && (errorJson.message || errorJson.detail)) {
        errorDetail = errorJson.message || errorJson.detail;
      }
    } catch (_) {
      // response wasn't JSON
    }
    const err = new Error(errorDetail);
    err.status = response.status;
    throw err;
  }
  return await response.json();
}

/**
 * Fetch list of overlaps with optional search, filter, and sorting
 */
export async function getOverlaps(params = {}) {
  if (!USE_MOCK) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.bureau && params.bureau !== 'ALL') query.append('bureau', params.bureau);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.minScore) query.append('min_score', params.minScore);
    if (params.sortBy) query.append('sort_by', params.sortBy);

    const url = `${BASE_URL}/overlaps${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    return await handleResponse(res);
  }

  // --- MOCK MODE EXECUTION ---
  // Simulate 200ms network latency for authentic UI feel
  await new Promise(r => setTimeout(r, 180));

  const store = getMockStore();
  let list = [...store.overlaps];

  // Search filter
  if (params.search) {
    const term = params.search.toLowerCase().trim();
    list = list.filter(item =>
      item.id.toLowerCase().includes(term) ||
      item.institutionName.toLowerCase().includes(term) ||
      item.institutionId.toLowerCase().includes(term) ||
      item.caseAId.toLowerCase().includes(term) ||
      item.caseBId.toLowerCase().includes(term) ||
      item.summary.toLowerCase().includes(term) ||
      (item.keySignals && item.keySignals.some(s => s.toLowerCase().includes(term)))
    );
  }

  // Bureau filter (checks either Case A or Case B bureau)
  if (params.bureau && params.bureau !== 'ALL') {
    list = list.filter(item =>
      item.caseABureau === params.bureau || item.caseBBureau === params.bureau
    );
  }

  // Status filter
  if (params.status && params.status !== 'ALL') {
    list = list.filter(item => item.status === params.status);
  }

  // Min Score filter
  if (params.minScore) {
    const min = Number(params.minScore);
    list = list.filter(item => item.matchScore >= min);
  }

  // Sorting
  if (params.sortBy === 'score_desc') {
    list.sort((a, b) => b.matchScore - a.matchScore);
  } else if (params.sortBy === 'score_asc') {
    list.sort((a, b) => a.matchScore - b.matchScore);
  } else if (params.sortBy === 'date_asc') {
    list.sort((a, b) => new Date(a.detectedDate) - new Date(b.detectedDate));
  } else if (params.sortBy === 'institution') {
    list.sort((a, b) => a.institutionName.localeCompare(b.institutionName));
  } else {
    // Default: date_desc
    list.sort((a, b) => new Date(b.detectedDate) - new Date(a.detectedDate));
  }

  return {
    items: list,
    total: list.length,
    isMock: true
  };
}

/**
 * Fetch a single overlap by ID
 */
export async function getOverlapById(overlapId) {
  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/overlaps/${encodeURIComponent(overlapId)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    return await handleResponse(res);
  }

  await new Promise(r => setTimeout(r, 120));
  const store = getMockStore();
  const found = store.overlaps.find(o => o.id === overlapId);
  if (!found) {
    const err = new Error(`Overlap record "${overlapId}" not found in demo database.`);
    err.status = 404;
    throw err;
  }
  return { ...found, isMock: true };
}

/**
 * Fetch a single case by caseId
 */
export async function getCaseById(caseId) {
  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(caseId)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    return await handleResponse(res);
  }

  await new Promise(r => setTimeout(r, 150));
  const store = getMockStore();
  const caseData = store.cases[caseId];
  if (!caseData) {
    const err = new Error(`Case file "${caseId}" not found in demo database.`);
    err.status = 404;
    throw err;
  }
  return { ...caseData, isMock: true };
}

/**
 * Fetch pair of cases for side-by-side comparison
 */
export async function getCaseComparison(caseIdA, caseIdB) {
  const [caseA, caseB] = await Promise.all([
    getCaseById(caseIdA),
    getCaseById(caseIdB)
  ]);
  return {
    caseA,
    caseB,
    comparedAt: new Date().toISOString(),
    isMock: USE_MOCK
  };
}

/**
 * Submit Coordination Review decision
 *
 * Payload:
 * {
 *   decision: "Coordination Required" | "Continue Independently" | "Not Related" | "Further Review Required",
 *   reviewerName: string,
 *   reviewerDesignation: string,
 *   reviewerEmail: string,
 *   remarks: string,
 *   priorityAction: boolean,
 *   recommendedActionDate?: string
 * }
 */
export async function submitCoordinationReview(overlapId, reviewPayload) {
  // Input validations
  if (!reviewPayload.decision) {
    throw new Error("Validation Error: Please select a coordination decision.");
  }
  if (!reviewPayload.reviewerName || !reviewPayload.reviewerName.trim()) {
    throw new Error("Validation Error: Reviewer Full Name is required.");
  }
  if (!reviewPayload.reviewerDesignation || !reviewPayload.reviewerDesignation.trim()) {
    throw new Error("Validation Error: Reviewer Designation / Bureau is required.");
  }
  if (!reviewPayload.remarks || reviewPayload.remarks.trim().length < 15) {
    throw new Error("Validation Error: Review remarks must be at least 15 characters long to ensure adequate audit justification.");
  }

  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/overlaps/${encodeURIComponent(overlapId)}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(reviewPayload)
    });
    return await handleResponse(res);
  }

  // --- MOCK MODE SUBMISSION ---
  // Simulate 600ms network processing time
  await new Promise(r => setTimeout(r, 600));

  const store = getMockStore();
  const overlapIndex = store.overlaps.findIndex(o => o.id === overlapId);
  if (overlapIndex === -1) {
    const err = new Error(`Cannot submit review: Overlap "${overlapId}" does not exist.`);
    err.status = 404;
    throw err;
  }

  const currentOverlap = store.overlaps[overlapIndex];

  const newReviewEntry = {
    id: `rev-${Date.now()}`,
    timestamp: new Date().toISOString(),
    reviewerName: reviewPayload.reviewerName.trim(),
    reviewerDesignation: reviewPayload.reviewerDesignation.trim(),
    reviewerEmail: (reviewPayload.reviewerEmail || '').trim() || 'officer@aicte-india.org',
    decision: reviewPayload.decision,
    remarks: reviewPayload.remarks.trim(),
    priorityAction: !!reviewPayload.priorityAction,
    isSystem: false,
    isDemoSubmission: true
  };

  const updatedOverlap = {
    ...currentOverlap,
    status: reviewPayload.decision,
    lastUpdated: new Date().toISOString().split('T')[0],
    reviewHistory: [newReviewEntry, ...(currentOverlap.reviewHistory || [])]
  };

  store.overlaps[overlapIndex] = updatedOverlap;
  saveMockStore(store);

  return {
    success: true,
    message: `Coordination decision "${reviewPayload.decision}" recorded successfully (Session Demo Store).`,
    overlap: updatedOverlap,
    isMock: true
  };
}

/**
 * Add an action event to a case timeline
 */
export async function addCaseAction(caseId, actionData) {
  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(caseId)}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(actionData)
    });
    return await handleResponse(res);
  }

  await new Promise(r => setTimeout(r, 300));
  const store = getMockStore();
  const targetCase = store.cases[caseId];
  if (!targetCase) {
    const err = new Error(`Case "${caseId}" not found.`);
    err.status = 404;
    throw err;
  }

  const newAction = {
    id: `act-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    bureau: actionData.bureau || targetCase.bureauCode,
    actor: actionData.actor || "Reviewing Officer",
    type: actionData.type || "Coordination Note",
    description: actionData.description
  };

  targetCase.timeline = [newAction, ...(targetCase.timeline || [])];
  store.cases[caseId] = targetCase;
  saveMockStore(store);

  return {
    success: true,
    action: newAction,
    isMock: true
  };
}

/**
 * Reset local demo state back to default fixtures
 */
export function resetMockData() {
  return resetMockStore();
}
