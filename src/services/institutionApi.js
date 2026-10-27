// src/services/institutionApi.js
// Centralized API helper for institution endpoints.

import { apiRequest } from './api';

/**
 * Fetch a paginated list of institutions.
 * GET /api/institutions
 * Supports query params: q (search), page, page_size.
 */
export async function fetchInstitutions(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.page) query.append('page', params.page);
  if (params.page_size) query.append('page_size', params.page_size);
  const endpoint = `/institutions${query.toString() ? `?${query.toString()}` : ''}`;
  return await apiRequest(endpoint);
}

/**
 * Fetch details for a single institution.
 * GET /api/institutions/{institution_id}
 */
export async function fetchInstitution(id) {
  if (!id) throw new Error('Institution ID is required');
  const endpoint = `/institutions/${encodeURIComponent(id)}`;
  return await apiRequest(endpoint);
}
