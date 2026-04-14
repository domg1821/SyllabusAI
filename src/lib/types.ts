export type ItemType = "assignment" | "quiz" | "exam" | "project";
export type Priority = "low" | "medium" | "high";

export interface DeadlineItem {
  id: string;
  title: string;
  type: ItemType;
  dueDate: string;
  points?: number;
  priority: Priority;
  completed: boolean;
}

export interface CourseInfo {
  name: string;
  code: string;
  instructor: string;
  semester: string;
  credits: number;
  schedule: string;
  officeHours: string;
}

export interface StudyTask {
  id: string;
  day: string;
  date: string;
  description: string;
  relatedItem: string;
  completed: boolean;
}

export interface StudyWeek {
  id: string;
  weekLabel: string;
  tasks: StudyTask[];
}

export interface SyllabusAnalysis {
  course: CourseInfo;
  items: DeadlineItem[];
  studyPlan: StudyWeek[];
}

export interface AssignmentAnalysis {
  title: string;
  dueDate: string;
  whatProfessorWants: string;
  deliverables: string[];
  stepByStepPlan: string[];
  suggestedStructure: string[];
  commonMistakes: string[];
  rubricNotes: string[];
}

export type AnalysisMode = "syllabus" | "assignment";

// ─── Practice Test types ───────────────────────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "multiple_choice" | "short_answer" | "mixed";

export interface MCQuestion {
  id: string;
  type: "multiple_choice";
  question: string;
  options: string[];       // ["A. ...", "B. ...", "C. ...", "D. ..."]
  correctAnswer: string;   // "A" | "B" | "C" | "D"
  explanation: string;
  wrongExplanation: string;
}

export interface SAQuestion {
  id: string;
  type: "short_answer";
  question: string;
  sampleAnswer: string;
  explanation: string;
  keyPoints: string[];
}

export type TestQuestion = MCQuestion | SAQuestion;

export interface TestAttempt {
  id: string;
  topic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  date: string;
  score: number;           // 0–100 for MC/mixed, -1 for SA-only (review mode)
  totalQuestions: number;
  correctCount: number;    // MC correct answers only
  mcCount: number;         // total MC questions in the test
  questions: TestQuestion[];
  userAnswers: Record<string, string>;
}

export type DashboardTab = "syllabus" | "assignment" | "practice";
