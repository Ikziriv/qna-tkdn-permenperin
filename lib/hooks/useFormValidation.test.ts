import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFormValidation } from './useFormValidation';
import { Question, UserAnswer } from '@/types';

function makeQuestion(id: number): Question {
  return {
    id,
    category: { en: 'Test', id: 'Tes' },
    text: { en: `Question ${id}`, id: `Pertanyaan ${id}` },
    options: { en: ['A', 'B', 'C', 'D'], id: ['A', 'B', 'C', 'D'] },
    correctAnswerIndex: 0,
  };
}

function makeAnswer(questionId: number, answerIndex: number): UserAnswer {
  return { questionId, answerIndex };
}

describe('useFormValidation', () => {
  it('returns all-zero result when questions array is empty', () => {
    const { result } = renderHook(() => useFormValidation([], []));
    expect(result.current).toEqual({
      isComplete: false,
      unansweredIndices: [],
      unansweredCount: 0,
      answeredCount: 0,
      totalCount: 0,
    });
  });

  it('marks quiz incomplete when no answers are provided', () => {
    const questions = [makeQuestion(1), makeQuestion(2), makeQuestion(3)];
    const { result } = renderHook(() => useFormValidation(questions, []));

    expect(result.current.isComplete).toBe(false);
    expect(result.current.unansweredIndices).toEqual([0, 1, 2]);
    expect(result.current.unansweredCount).toBe(3);
    expect(result.current.answeredCount).toBe(0);
    expect(result.current.totalCount).toBe(3);
  });

  it('marks quiz complete when all questions are answered', () => {
    const questions = [makeQuestion(1), makeQuestion(2)];
    const answers = [makeAnswer(1, 0), makeAnswer(2, 1)];
    const { result } = renderHook(() => useFormValidation(questions, answers));

    expect(result.current.isComplete).toBe(true);
    expect(result.current.unansweredIndices).toEqual([]);
    expect(result.current.unansweredCount).toBe(0);
    expect(result.current.answeredCount).toBe(2);
  });

  it('identifies only unanswered question indices', () => {
    const questions = [makeQuestion(10), makeQuestion(20), makeQuestion(30), makeQuestion(40)];
    const answers = [makeAnswer(10, 0), makeAnswer(30, 2)];
    const { result } = renderHook(() => useFormValidation(questions, answers));

    expect(result.current.isComplete).toBe(false);
    expect(result.current.unansweredIndices).toEqual([1, 3]);
    expect(result.current.answeredCount).toBe(2);
    expect(result.current.unansweredCount).toBe(2);
  });

  it('ignores extra answers not matching any question', () => {
    const questions = [makeQuestion(1)];
    const answers = [makeAnswer(1, 0), makeAnswer(99, 2)];
    const { result } = renderHook(() => useFormValidation(questions, answers));

    expect(result.current.isComplete).toBe(true);
    expect(result.current.unansweredIndices).toEqual([]);
  });

  it('recomputes when answers change', () => {
    const questions = [makeQuestion(1), makeQuestion(2)];
    let answers: UserAnswer[] = [makeAnswer(1, 0)];

    const { result, rerender } = renderHook(
      ({ questions, answers }) => useFormValidation(questions, answers),
      { initialProps: { questions, answers } }
    );

    expect(result.current.isComplete).toBe(false);
    expect(result.current.unansweredIndices).toEqual([1]);

    answers = [makeAnswer(1, 0), makeAnswer(2, 1)];
    rerender({ questions, answers });

    expect(result.current.isComplete).toBe(true);
    expect(result.current.unansweredIndices).toEqual([]);
  });
});
