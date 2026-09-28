/**
 * InfraGrid Real-Time Telemetry & Loader Analytics Service
 * Tracks HTTP network round-trip timings, SWR cache hits, bandwidth, and system latency.
 */

class TelemetryEngine extends EventTarget {
  constructor() {
    super();
    this.requests = [];
    this.maxLogs = 40;
    this.totalRequests = 0;
    this.cacheHits = 0;
    this.bytesTransferred = 0;
    this.activeRequests = 0;
    this.turboMode = true; // Turbo caching enabled by default for maximum speed
  }

  setTurboMode(enabled) {
    this.turboMode = Boolean(enabled);
    this.dispatchEvent(new CustomEvent('change'));
  }

  recordStart() {
    this.activeRequests++;
    this.dispatchEvent(new CustomEvent('change'));
  }

  recordEnd(entry) {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.totalRequests++;

    if (entry.cached) {
      this.cacheHits++;
    }

    const payloadSize = entry.size || Math.floor(Math.random() * 800 + 400); // approximate bytes if not provided
    this.bytesTransferred += payloadSize;

    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date(),
      endpoint: entry.endpoint,
      method: entry.method || 'GET',
      status: entry.status || 200,
      durationMs: Math.round(entry.durationMs * 10) / 10,
      cached: Boolean(entry.cached),
      sizeBytes: payloadSize,
      success: entry.success !== false
    };

    this.requests.unshift(logEntry);
    if (this.requests.length > this.maxLogs) {
      this.requests.pop();
    }

    this.dispatchEvent(new CustomEvent('change'));
    return logEntry;
  }

  getMetrics() {
    const nonCachedRequests = this.requests.filter(r => !r.cached);
    const avgLatency = nonCachedRequests.length > 0
      ? Math.round(nonCachedRequests.slice(0, 10).reduce((acc, r) => acc + r.durationMs, 0) / Math.min(10, nonCachedRequests.length))
      : (this.requests[0]?.durationMs || 12);

    const fastest = this.requests.length > 0
      ? Math.min(...this.requests.map(r => r.durationMs))
      : 0;

    const cacheHitRatio = this.totalRequests > 0
      ? Math.round((this.cacheHits / this.totalRequests) * 100)
      : 0;

    const fastRequestsPct = this.requests.length > 0
      ? Math.round((this.requests.filter(r => r.durationMs < 120).length / this.requests.length) * 100)
      : 100;

    return {
      activeRequests: this.activeRequests,
      totalRequests: this.totalRequests,
      cacheHits: this.cacheHits,
      cacheHitRatio,
      avgLatencyMs: avgLatency,
      fastestMs: fastest,
      fastRequestsPct,
      bytesTransferred: this.bytesTransferred,
      turboMode: this.turboMode,
      recentRequests: [...this.requests]
    };
  }

  clearLogs() {
    this.requests = [];
    this.totalRequests = 0;
    this.cacheHits = 0;
    this.bytesTransferred = 0;
    this.dispatchEvent(new CustomEvent('change'));
  }
}

export const telemetry = new TelemetryEngine();
export default telemetry;
