// src/services/dashboardApi.js
// Fetch dashboard KPI and chart data using the central API helper.
import { apiRequest } from '../services/api';

/**
 * Fetch dashboard KPI and chart data.
 * GET /api/dashboard
 */
export async function fetchDashboardData() {
  return await apiRequest('/dashboard');
}
