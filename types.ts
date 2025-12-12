
export enum AppState {
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizConfig {
  file: File | null;
  fileData: string | null; // Base64
  difficulty: Difficulty;
}

export interface QuizResult {
  score: number;
  total: number;
  userAnswers: number[]; // Index of selected answer per question
  questions: Question[];
}

export interface GeneratedQuizResponse {
  questions: {
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
  }[];
}

export type AIProvider = 'gemini' | 'openai';

export interface AISettings {
  provider: AIProvider;
  gemini: {
    apiKey: string;
  };
  openai: {
    baseUrl: string;
    apiKey: string;
    model: string;
  };
}

export interface QuizHistoryItem {
  id: string;
  fileName: string;
  date: string;
  difficulty: Difficulty;
  questions: Question[];
}
