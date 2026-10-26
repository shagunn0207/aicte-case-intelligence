import { apiConfig } from './overlapApi';

// Reuse the same BASE_URL from overlapApi config
const BASE_URL = apiConfig.baseUrl;

/**
 * Fetch dashboard KPI and chart data.
 * GET /api/dashboard
 */
export async function fetchDashboardData() {
  const url = `${BASE_URL}/dashboard`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const err = new Error(`Failed to load dashboard data: ${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return await res.json();
}
