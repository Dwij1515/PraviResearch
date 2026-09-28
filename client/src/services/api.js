/**
 * Centralized High-Performance API Service for InfraGrid
 * Features:
 * - Ultra-Fast SWR (Stale-While-Revalidate) In-Memory Cache
 * - Real-Time Telemetry & Loader Analytics Hooks
 * - Automatic Bearer JWT Injection
 * - Prefetching Engine for Instant Sub-millisecond Transitions
 */

import telemetry from './telemetry';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    // In-Memory cache map: key -> { data, timestamp, ttl }
    this.cache = new Map();
    this.defaultTTL = 45 * 1000; // 45 seconds TTL
  }

  getAuthToken() {
    return localStorage.getItem('iams_token');
  }

  setAuthSession(token, user) {
    localStorage.setItem('iams_token', token);
    localStorage.setItem('iams_user', JSON.stringify(user));
  }

  clearAuthSession() {
    localStorage.removeItem('iams_token');
    localStorage.removeItem('iams_user');
    this.clearCache();
  }

  clearCache() {
    this.cache.clear();
  }

  invalidateCachePrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.includes(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();
    const startTime = performance.now();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const config = {
      ...options,
      headers
    };

    telemetry.recordStart();

    try {
      const response = await fetch(url, config);
      const durationMs = performance.now() - startTime;

      // Handle 401 Unauthorized globally
      if (response.status === 401) {
        this.clearAuthSession();
        window.dispatchEvent(new CustomEvent('iams:unauthorized'));
      }

      const json = await response.json().catch(() => ({}));

      telemetry.recordEnd({
        endpoint,
        method: options.method || 'GET',
        status: response.status,
        durationMs,
        cached: false,
        size: JSON.stringify(json).length,
        success: response.ok
      });

      if (!response.ok) {
        const error = new Error(json.error?.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.code = json.error?.code || 'API_ERROR';
        error.details = json.error?.details || null;
        throw error;
      }

      return json;
    } catch (err) {
      const durationMs = performance.now() - startTime;
      telemetry.recordEnd({
        endpoint,
        method: options.method || 'GET',
        status: err.status || 500,
        durationMs,
        cached: false,
        size: 0,
        success: false
      });

      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const networkError = new Error('Cannot connect to AMC backend server. Ensure API is running.');
        networkError.code = 'NETWORK_ERROR';
        throw networkError;
      }
      throw err;
    }
  }

  /**
   * Fast GET request with optional SWR In-Memory Caching
   */
  async get(endpoint, params = {}, options = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const fullEndpoint = `${endpoint}${queryString}`;
    const cacheKey = `GET:${fullEndpoint}`;

    const useCache = options.useCache !== false && telemetry.turboMode;
    const forceRefresh = options.forceRefresh === true;

    // Check SWR cache
    if (useCache && !forceRefresh && this.cache.has(cacheKey)) {
      const cachedEntry = this.cache.get(cacheKey);
      const age = Date.now() - cachedEntry.timestamp;

      if (age < cachedEntry.ttl) {
        // Instant 0ms return from cache!
        telemetry.recordEnd({
          endpoint: fullEndpoint,
          method: 'GET',
          status: 200,
          durationMs: 0.8,
          cached: true,
          size: cachedEntry.size || 500,
          success: true
        });

        // Background revalidation if older than half TTL
        if (age > cachedEntry.ttl / 2) {
          this.request(fullEndpoint, { method: 'GET' }).then((freshData) => {
            if (freshData?.success) {
              this.cache.set(cacheKey, {
                data: freshData,
                timestamp: Date.now(),
                ttl: options.ttl || this.defaultTTL,
                size: JSON.stringify(freshData).length
              });
            }
          }).catch(() => {});
        }

        return cachedEntry.data;
      }
    }

    // Network request
    const freshData = await this.request(fullEndpoint, { method: 'GET' });

    if (useCache && freshData?.success) {
      this.cache.set(cacheKey, {
        data: freshData,
        timestamp: Date.now(),
        ttl: options.ttl || this.defaultTTL,
        size: JSON.stringify(freshData).length
      });
    }

    return freshData;
  }

  /**
   * Hover prefetch for instantaneous UI page loads
   */
  prefetch(endpoint, params = {}) {
    if (!telemetry.turboMode) return;
    this.get(endpoint, params, { useCache: true }).catch(() => {});
  }

  async post(endpoint, data = {}) {
    const res = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    // Invalidate caches that might be affected
    this.clearCache();
    return res;
  }

  async patch(endpoint, data = {}) {
    const res = await this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    this.clearCache();
    return res;
  }

  async delete(endpoint) {
    const res = await this.request(endpoint, { method: 'DELETE' });
    this.clearCache();
    return res;
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
