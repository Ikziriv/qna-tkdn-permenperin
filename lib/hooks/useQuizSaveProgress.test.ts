import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuizSaveProgress } from './useQuizSaveProgress';
import { UserAnswer } from '@/types';

function makeAnswer(questionId: number, answerIndex: number): UserAnswer {
  return { questionId, answerIndex };
}

describe('useQuizSaveProgress', () => {
  it('returns isSaving false and saveError null initially', () => {
    const { result } = renderHook(() => useQuizSaveProgress());

    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveError).toBeNull();
  });

  it('returns false and sets error when onSaveProgress is not provided', async () => {
    const { result } = renderHook(() => useQuizSaveProgress());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.saveProgress([makeAnswer(1, 0)]);
    });

    expect(success).toBe(false);
    expect(result.current.saveError).toBe('Save progress is not available.');
    expect(result.current.isSaving).toBe(false);
  });

  it('returns false and sets error when answers array is empty', async () => {
    const onSaveProgress = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useQuizSaveProgress(onSaveProgress));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.saveProgress([]);
    });

    expect(success).toBe(false);
    expect(result.current.saveError).toBe('No answers to save yet.');
    expect(onSaveProgress).not.toHaveBeenCalled();
  });

  it('returns true after successful save', async () => {
    const onSaveProgress = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useQuizSaveProgress(onSaveProgress));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.saveProgress([makeAnswer(1, 0)]);
    });

    expect(success).toBe(true);
    expect(result.current.saveError).toBeNull();
    expect(onSaveProgress).toHaveBeenCalledWith([makeAnswer(1, 0)]);
  });

  it('toggles isSaving during the async operation', async () => {
    const onSaveProgress = vi.fn(
      () => new Promise<void>((resolve) => setTimeout(resolve, 50))
    );
    const { result } = renderHook(() => useQuizSaveProgress(onSaveProgress));

    act(() => {
      result.current.saveProgress([makeAnswer(1, 0)]);
    });

    expect(result.current.isSaving).toBe(true);

    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(result.current.saveError).toBeNull();
  });

  it('returns false and sets error when onSaveProgress throws', async () => {
    const onSaveProgress = vi.fn().mockRejectedValue(new Error('Network failure'));
    const { result } = renderHook(() => useQuizSaveProgress(onSaveProgress));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.saveProgress([makeAnswer(1, 0)]);
    });

    expect(success).toBe(false);
    expect(result.current.saveError).toBe('Network failure');
    expect(result.current.isSaving).toBe(false);
  });

  it('uses fallback message when error has no message', async () => {
    const onSaveProgress = vi.fn().mockRejectedValue({});
    const { result } = renderHook(() => useQuizSaveProgress(onSaveProgress));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.saveProgress([makeAnswer(1, 0)]);
    });

    expect(success).toBe(false);
    expect(result.current.saveError).toBe('Failed to save progress. Please try again.');
  });

  it('clears error when clearError is called', async () => {
    const { result } = renderHook(() => useQuizSaveProgress());

    await act(async () => {
      await result.current.saveProgress([makeAnswer(1, 0)]);
    });

    expect(result.current.saveError).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.saveError).toBeNull();
  });
});
