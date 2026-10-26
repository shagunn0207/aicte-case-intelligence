import { apiConfig } from './overlapApi';

const BASE_URL = apiConfig.baseUrl;

/**
 * Fetch a paginated list of institutions.
 * GET /api/institutions?q=&page=&page_size=
 * @param {Object} params - Query params (q, page, page_size)
 */
export async function fetchInstitutions(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.page) query.append('page', params.page);
  if (params.page_size) query.append('page_size', params.page_size);

  const url = `${BASE_URL}/institutions${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const err = new Error(`Failed to load institutions: ${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

/**
 * Fetch details for a single institution.
 * GET /api/institutions/{institution_id}
 */
export async function fetchInstitution(id) {
  if (!id) throw new Error('Institution ID is required');
  const url = `${BASE_URL}/institutions/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const err = new Error(`Failed to load institution ${id}: ${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return await res.json();
}
