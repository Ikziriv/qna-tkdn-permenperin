
export type Language = 'en' | 'id';

export interface UserProfile {
  name: string;
  role: string;
}

export interface Question {
  id: number;
  text: {
    en: string;
    id: string;
  };
  options: {
    en: string[];
    id: string[];
  };
  category: {
    en: string;
    id: string;
  };
  correctAnswerIndex: number; // Use index to track correctness across languages
}

export interface UserAnswer {
  questionId: number;
  answerIndex: number;
}

export enum AppState {
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS',
  HISTORY = 'HISTORY',
  ADMIN = 'ADMIN'
}

export interface AssessmentResult {
  score: number;
  feedback: string;
  categoryBreakdown: Record<string, number>;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}
