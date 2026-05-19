/**
 * Progress Validation — Pure, DB-free validation logic
 */

export interface FinalSubmissionInput {
  quizId: number;
  totalQuestions: number;
  score: number;
  correctAnswers: number;
  timeSpentSeconds?: number;
  responses: {
    questionId: number;
    selectedAnswerIndex: number;
    isCorrect: boolean;
  }[];
}

export function validateCompleteness(
  input: FinalSubmissionInput
): { valid: boolean; reason: string } {
  if (!input.quizId || input.quizId <= 0) {
    return { valid: false, reason: "Invalid quizId." };
  }
  if (!input.totalQuestions || input.totalQuestions <= 0) {
    return { valid: false, reason: "Invalid totalQuestions." };
  }
  if (!Array.isArray(input.responses)) {
    return { valid: false, reason: "Responses must be an array." };
  }
  if (input.responses.length !== input.totalQuestions) {
    return {
      valid: false,
      reason: `Incomplete submission: expected ${input.totalQuestions} answers, received ${input.responses.length}.`,
    };
  }

  const hasInvalid = input.responses.some(
    (r) =>
      typeof r.questionId !== "number" ||
      typeof r.selectedAnswerIndex !== "number" ||
      typeof r.isCorrect !== "boolean"
  );
  if (hasInvalid) {
    return { valid: false, reason: "Each response must have questionId, selectedAnswerIndex, and isCorrect." };
  }

  return { valid: true, reason: "" };
}
