/**
 * Activity Batch Tracker
 *
 * Minimizes API traffic by batching, throttling, sampling, and offline queuing.
 * Recommended configuration:
 *   - Batch size: 50 events
 *   - Flush interval: 30 seconds
 *   - Max offline storage: 1000 events
 *   - Throttle interval (high-freq): 5000ms
 *   - Sampling rate (non-critical): 0.1 (10%)
 *   - Retry: exponential backoff, max 3 retries
 */

interface TrackingEvent {
  eventType: string;
  userId?: number | null;
  sessionId?: string;
  payload?: Record<string, unknown>;
  timestamp: number;
  url?: string;
  referrer?: string;
  screenWidth?: number;
  screenHeight?: number;
}

interface BatchTrackerConfig {
  batchSize: number;
  flushIntervalMs: number;
  maxOfflineEvents: number;
  throttleMs: number;
  samplingRate: number;
  maxRetries: number;
  baseRetryDelayMs: number;
}

const DEFAULT_CONFIG: BatchTrackerConfig = {
  batchSize: 50,
  flushIntervalMs: 30000,
  maxOfflineEvents: 1000,
  throttleMs: 5000,
  samplingRate: 0.1,
  maxRetries: 3,
  baseRetryDelayMs: 500,
};

const QUEUE_KEY = "tkdn_activity_batch_queue";
const CRITICAL_EVENTS = new Set([
  "quiz_complete",
  "quiz_start",
  "onboarding_complete",
  "onboarding_abandon",
  "auth_login",
  "auth_register",
]);

let config: BatchTrackerConfig = { ...DEFAULT_CONFIG };
let queue: TrackingEvent[] = [];
let offlineQueue: TrackingEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let lastThrottleMap: Map<string, number> = new Map();
let sendInProgress = false;

function initOfflineQueue(): void {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    if (raw) offlineQueue = JSON.parse(raw);
  } catch {
    offlineQueue = [];
  }
}

function persistOfflineQueue(): void {
  try {
    const trimmed = offlineQueue.slice(-config.maxOfflineEvents);
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
    offlineQueue = trimmed;
  } catch {
    // quota exceeded — drop oldest half
    offlineQueue = offlineQueue.slice(offlineQueue.length / 2);
  }
}

function isCritical(eventType: string): boolean {
  return CRITICAL_EVENTS.has(eventType);
}

function shouldSample(eventType: string): boolean {
  if (isCritical(eventType)) return true;
  return Math.random() < config.samplingRate;
}

function isThrottled(eventType: string): boolean {
  if (isCritical(eventType)) return false;
  const now = Date.now();
  const last = lastThrottleMap.get(eventType) || 0;
  if (now - last < config.throttleMs) return true;
  lastThrottleMap.set(eventType, now);
  return false;
}

function enrichEvent(event: Omit<TrackingEvent, "timestamp">): TrackingEvent {
  return {
    ...event,
    timestamp: Date.now(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    referrer: typeof document !== "undefined" ? document.referrer : undefined,
    screenWidth: typeof window !== "undefined" ? window.innerWidth : undefined,
    screenHeight: typeof window !== "undefined" ? window.innerHeight : undefined,
  };
}

export function configureBatchTracker(overrides: Partial<BatchTrackerConfig>): void {
  config = { ...config, ...overrides };
}

export function trackEvent(event: Omit<TrackingEvent, "timestamp">): void {
  if (!shouldSample(event.eventType)) return;
  if (isThrottled(event.eventType)) return;

  const enriched = enrichEvent(event);
  queue.push(enriched);

  if (queue.length >= config.batchSize) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flush, config.flushIntervalMs);
  }
}

export function flush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (queue.length === 0) return;

  const batch = queue.splice(0, queue.length);

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    offlineQueue.push(...batch);
    persistOfflineQueue();
    return;
  }

  sendBatch(batch);
}

async function sendBatch(batch: TrackingEvent[], attempt = 0): Promise<void> {
  if (sendInProgress && attempt === 0) {
    // Another batch is sending; queue this one back
    queue.unshift(...batch);
    return;
  }

  sendInProgress = true;

  try {
    const res = await fetch("/api/activity/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      credentials: "same-origin",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    // On success, also try to drain offline queue
    drainOfflineQueue();
  } catch (err) {
    if (attempt < config.maxRetries) {
      const delay = config.baseRetryDelayMs * Math.pow(2, attempt);
      setTimeout(() => sendBatch(batch, attempt + 1), delay);
    } else {
      // Exhausted retries — move to offline queue
      offlineQueue.push(...batch);
      persistOfflineQueue();
    }
  } finally {
    sendInProgress = false;
  }
}

async function drainOfflineQueue(): Promise<void> {
  if (offlineQueue.length === 0) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const batch = offlineQueue.splice(0, config.batchSize);
  persistOfflineQueue();

  try {
    const res = await fetch("/api/activity/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      credentials: "same-origin",
    });
    if (!res.ok) {
      offlineQueue.unshift(...batch);
      persistOfflineQueue();
    }
  } catch {
    offlineQueue.unshift(...batch);
    persistOfflineQueue();
  }
}

export function getQueueStats(): { queued: number; offline: number; inProgress: boolean } {
  return { queued: queue.length, offline: offlineQueue.length, inProgress: sendInProgress };
}

// Auto-drain offline queue when connectivity is restored
if (typeof window !== "undefined") {
  initOfflineQueue();
  window.addEventListener("online", () => {
    drainOfflineQueue();
  });
}
