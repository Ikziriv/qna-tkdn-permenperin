/**
 * SessionStorage Progress Manager
 *
 * Debounced, validated client-side progress persistence for quiz sessions.
 * Falls back to in-memory storage if sessionStorage is unavailable or full.
 */

export interface QuizProgressCheckpoint {
  shuffledQuestions: unknown[];
  currentIndex: number;
  answers: { questionId: number; answerIndex: number }[];
  timeRemaining: number;
  timestamp: number;
  version: number;
}

const STORAGE_KEY = "tkdn_quiz_session_progress";
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
const CURRENT_VERSION = 1;

/* ── In-Memory Fallback ──────────────────────────────────────────── */

let memoryFallback: QuizProgressCheckpoint | null = null;

function isSessionStorageAvailable(): boolean {
  try {
    const testKey = "__tkdn_test__";
    sessionStorage.setItem(testKey, "1");
    sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/* ── Read ────────────────────────────────────────────────────────── */

export function loadProgress(): QuizProgressCheckpoint | null {
  // Clear stale sessions first
  clearIfStale();

  if (!isSessionStorageAvailable()) {
    return memoryFallback;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidCheckpoint(parsed)) return null;

    return parsed as QuizProgressCheckpoint;
  } catch {
    return null;
  }
}

/* ── Write ───────────────────────────────────────────────────────── */

export function saveProgress(checkpoint: Omit<QuizProgressCheckpoint, "timestamp" | "version">): void {
  const payload: QuizProgressCheckpoint = {
    ...checkpoint,
    timestamp: Date.now(),
    version: CURRENT_VERSION,
  };

  if (!isSessionStorageAvailable()) {
    memoryFallback = payload;
    return;
  }

  try {
    const serialized = JSON.stringify(payload);

    // Guard against quota exceeded
    if (serialized.length > 5 * 1024 * 1024) {
      // 5MB safety cap
      console.warn("[SessionProgress] Checkpoint too large, skipping sessionStorage write.");
      memoryFallback = payload;
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, serialized);
  } catch (err: any) {
    if (err.name === "QuotaExceededError" || err.code === 22) {
      console.warn("[SessionProgress] sessionStorage quota exceeded, falling back to memory.");
    } else {
      console.warn("[SessionProgress] sessionStorage write failed:", err);
    }
    memoryFallback = payload;
  }
}

/* ── Debounced Write ─────────────────────────────────────────────── */

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function saveProgressDebounced(
  checkpoint: Omit<QuizProgressCheckpoint, "timestamp" | "version">,
  delayMs = 300
): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveProgress(checkpoint);
    debounceTimer = null;
  }, delayMs);
}

export function flushDebouncedProgress(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

/* ── Clear ───────────────────────────────────────────────────────── */

export function clearProgress(): void {
  flushDebouncedProgress();
  memoryFallback = null;

  if (isSessionStorageAvailable()) {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

/* ── Stale Session Cleanup ──────────────────────────────────────── */

function clearIfStale(): void {
  if (!isSessionStorageAvailable()) {
    if (memoryFallback && Date.now() - memoryFallback.timestamp > STALE_THRESHOLD_MS) {
      memoryFallback = null;
    }
    return;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidCheckpoint(parsed)) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (Date.now() - (parsed as QuizProgressCheckpoint).timestamp > STALE_THRESHOLD_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      console.info("[SessionProgress] Stale session cleared (>24h).");
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

/* ── Validation ───────────────────────────────────────────────────── */

function isValidCheckpoint(value: unknown): value is QuizProgressCheckpoint {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  if (!Array.isArray(v.shuffledQuestions)) return false;
  if (typeof v.currentIndex !== "number") return false;
  if (!Array.isArray(v.answers)) return false;
  if (typeof v.timeRemaining !== "number") return false;
  if (typeof v.timestamp !== "number") return false;
  if (typeof v.version !== "number") return false;

  return true;
}
