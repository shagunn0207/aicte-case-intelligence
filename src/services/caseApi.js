import { apiConfig } from './overlapApi';

const BASE_URL = apiConfig.baseUrl;

/**
 * Fetch list of cases with optional filters.
 * GET /api/cases?param=value
 */
export async function fetchCases(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const url = `${BASE_URL}/cases${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const err = new Error(`Failed to load cases: ${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return await res.json();
}
