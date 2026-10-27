// src/services/api.js
// Centralised API helper for the AICTE Case Intelligence frontend.
// Handles base URL configuration, JSON parsing, error handling, and optional auth headers.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');

/**
 * Generic request wrapper.
 * @param {string} endpoint - API endpoint relative to base (e.g. '/dashboard')
 * @param {Object} options - fetch options (method, headers, body etc.)
 * @returns {Promise<any>} Parsed JSON response.
 * @throws {Error} with .status property on HTTP error.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const defaults = {
    headers: {
      Accept: 'application/json',
      // Add auth header placeholder if needed later.
    },
  };
  const response = await fetch(url, { ...defaults, ...options });
  if (!response.ok) {
    let message = `HTTP ${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      if (data && (data.message || data.detail)) {
        message = data.message || data.detail;
      }
    } catch (_) {
      // ignore JSON parse errors
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  // If no content (204), return null.
  if (response.status === 204) return null;
  return await response.json();
}

export const apiConfig = {
  baseUrl: BASE_URL,
};
