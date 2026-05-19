import { describe, it, expect } from "vitest";
import { validateCompleteness } from "./progressValidation";

function makeInput(overrides: Partial<{
  quizId: number;
  totalQuestions: number;
  score: number;
  correctAnswers: number;
  responses: { questionId: number; selectedAnswerIndex: number; isCorrect: boolean }[];
}> = {}) {
  return {
    quizId: 1,
    totalQuestions: 3,
    score: 100,
    correctAnswers: 3,
    timeSpentSeconds: 0,
    responses: [
      { questionId: 1, selectedAnswerIndex: 0, isCorrect: true },
      { questionId: 2, selectedAnswerIndex: 1, isCorrect: true },
      { questionId: 3, selectedAnswerIndex: 2, isCorrect: true },
    ],
    ...overrides,
  };
}

describe("validateCompleteness", () => {
  it("accepts a complete submission", () => {
    const result = validateCompleteness(makeInput());
    expect(result.valid).toBe(true);
  });

  it("rejects when quizId is missing", () => {
    const result = validateCompleteness(makeInput({ quizId: 0 }));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("quizId");
  });

  it("rejects when totalQuestions is missing", () => {
    const result = validateCompleteness(makeInput({ totalQuestions: 0 }));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("totalQuestions");
  });

  it("rejects when responses is not an array", () => {
    const result = validateCompleteness(makeInput({ responses: undefined as any }));
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("array");
  });

  it("rejects partial submissions (fewer answers than totalQuestions)", () => {
    const result = validateCompleteness(
      makeInput({
        responses: [
          { questionId: 1, selectedAnswerIndex: 0, isCorrect: true },
        ],
      })
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Incomplete submission");
    expect(result.reason).toContain("expected 3 answers, received 1");
  });

  it("rejects responses with invalid shape", () => {
    const result = validateCompleteness(
      makeInput({
        responses: [
          { questionId: 1, selectedAnswerIndex: 0, isCorrect: true },
          { questionId: 2, selectedAnswerIndex: 1, isCorrect: "yes" as any },
          { questionId: 3, selectedAnswerIndex: 2, isCorrect: true },
        ],
      })
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Each response must have");
  });
});
