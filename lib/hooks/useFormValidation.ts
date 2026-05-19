import { useMemo } from 'react';
import { Question, UserAnswer } from '@/types';

export interface ValidationResult {
  isComplete: boolean;
  unansweredIndices: number[];
  unansweredCount: number;
  answeredCount: number;
  totalCount: number;
}

/**
 * Validates quiz form completion.
 * All questions are treated as required by default.
 */
export function useFormValidation(
  questions: Question[],
  answers: UserAnswer[]
): ValidationResult {
  return useMemo(() => {
    const totalCount = questions.length;
    if (totalCount === 0) {
      return {
        isComplete: false,
        unansweredIndices: [],
        unansweredCount: 0,
        answeredCount: 0,
        totalCount: 0,
      };
    }

    const answeredQuestionIds = new Set(answers.map((a) => a.questionId));
    const unansweredIndices: number[] = [];

    questions.forEach((q, idx) => {
      if (!answeredQuestionIds.has(q.id)) {
        unansweredIndices.push(idx);
      }
    });

    const answeredCount = totalCount - unansweredIndices.length;

    return {
      isComplete: unansweredIndices.length === 0,
      unansweredIndices,
      unansweredCount: unansweredIndices.length,
      answeredCount,
      totalCount,
    };
  }, [questions, answers]);
}
