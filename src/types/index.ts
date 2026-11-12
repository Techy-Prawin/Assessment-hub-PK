export type Role = 'ADMIN' | 'USER';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type TestStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface QuestionData {
  id: string;
  question: string;
  topic: string;
  difficulty: Difficulty;
  options: string[]; // parsed from JSON string
  correctAnswer: string;
  explanation?: string | null;
  marks: number;
  createdAt: string;
}

export interface TestData {
  id: string;
  title: string;
  description?: string | null;
  duration: number; // in minutes
  totalMarks: number;
  status: TestStatus;
  createdAt: string;
  questionsCount?: number;
  questions?: QuestionData[];
}

export interface AttemptAnswer {
  questionId: string;
  selectedAnswer: string | null;
  isCorrect?: boolean;
  marksAwarded?: number;
  aiFeedback?: string | null;
  question?: QuestionData;
}

export interface TestAttemptData {
  id: string;
  userId: string;
  testId: string;
  startedAt: string;
  submittedAt?: string | null;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  percentage: number;
  status: AttemptStatus;
  test?: TestData;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  answers?: AttemptAnswer[];
}

