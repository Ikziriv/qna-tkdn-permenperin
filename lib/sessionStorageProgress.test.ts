import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  saveProgress,
  loadProgress,
  clearProgress,
  saveProgressDebounced,
  flushDebouncedProgress,
} from "./sessionStorageProgress";

const STORAGE_KEY = "tkdn_quiz_session_progress";

beforeEach(() => {
  sessionStorage.clear();
  flushDebouncedProgress();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("sessionStorageProgress", () => {
  describe("saveProgress / loadProgress", () => {
    it("saves and loads a valid checkpoint", () => {
      const checkpoint = {
        shuffledQuestions: [{ id: 1 }],
        currentIndex: 2,
        answers: [{ questionId: 1, answerIndex: 0 }],
        timeRemaining: 120,
      };
      saveProgress(checkpoint);
      const loaded = loadProgress();
      expect(loaded).not.toBeNull();
      expect(loaded!.currentIndex).toBe(2);
      expect(loaded!.answers).toEqual([{ questionId: 1, answerIndex: 0 }]);
    });

    it("returns null when nothing is saved", () => {
      expect(loadProgress()).toBeNull();
    });

    it("clears stale sessions older than 24 hours", () => {
      const stale = {
        shuffledQuestions: [{ id: 1 }],
        currentIndex: 0,
        answers: [],
        timeRemaining: 1800,
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
        version: 1,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stale));
      expect(loadProgress()).toBeNull();
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("keeps recent sessions", () => {
      const recent = {
        shuffledQuestions: [{ id: 1 }],
        currentIndex: 0,
        answers: [],
        timeRemaining: 1800,
        timestamp: Date.now() - 60 * 60 * 1000,
        version: 1,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
      const loaded = loadProgress();
      expect(loaded).not.toBeNull();
      expect(loaded!.currentIndex).toBe(0);
    });
  });

  describe("clearProgress", () => {
    it("removes saved checkpoint from sessionStorage", () => {
      saveProgress({
        shuffledQuestions: [],
        currentIndex: 0,
        answers: [],
        timeRemaining: 0,
      });
      clearProgress();
      expect(loadProgress()).toBeNull();
    });
  });

  describe("saveProgressDebounced", () => {
    it("does not write immediately", () => {
      saveProgressDebounced(
        { shuffledQuestions: [], currentIndex: 0, answers: [], timeRemaining: 0 },
        300
      );
      expect(loadProgress()).toBeNull();
    });

    it("writes after the debounce delay", () => {
      saveProgressDebounced(
        { shuffledQuestions: [{ id: 1 }], currentIndex: 1, answers: [], timeRemaining: 0 },
        300
      );
      vi.advanceTimersByTime(300);
      const loaded = loadProgress();
      expect(loaded).not.toBeNull();
      expect(loaded!.currentIndex).toBe(1);
    });

    it("resets the timer on successive calls", () => {
      saveProgressDebounced(
        { shuffledQuestions: [], currentIndex: 0, answers: [], timeRemaining: 0 },
        300
      );
      vi.advanceTimersByTime(200);
      saveProgressDebounced(
        { shuffledQuestions: [{ id: 1 }], currentIndex: 5, answers: [], timeRemaining: 0 },
        300
      );
      vi.advanceTimersByTime(200);
      // Should still be null because timer was reset
      expect(loadProgress()).toBeNull();
      vi.advanceTimersByTime(100);
      expect(loadProgress()!.currentIndex).toBe(5);
    });
  });
});
