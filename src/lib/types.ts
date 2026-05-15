export type ItemType = "assignment" | "quiz" | "exam" | "project";
export type Priority = "low" | "medium" | "high";
export type SubmissionStatus = "not_started" | "in_progress" | "submitted" | "graded";

export interface DeadlineItem {
  id: string;
  title: string;
  type: ItemType;
  dueDate: string;
  points?: number;
  priority: Priority;
  completed: boolean;
  status?: SubmissionStatus;
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
  notes?: string;              // Additional study tips or context for this task
  estimatedMinutes?: number;   // Rough time estimate
}

export interface StudyWeek {
  id: string;
  weekLabel: string;
  tasks: StudyTask[];
}

// Weekly topic/chapter schedule extracted from syllabus
export interface WeeklyTopic {
  week: number;
  topic: string;     // e.g. "Process Scheduling"
  chapters?: string; // e.g. "Ch. 5–6"
}

export interface SyllabusAnalysis {
  course: CourseInfo;
  items: DeadlineItem[];
  studyPlan: StudyWeek[];
  weeklyTopics?: WeeklyTopic[];
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
  duration?: number;       // milliseconds
}

export type DashboardTab = "week" | "courses" | "analyze" | "practice" | "calendar";

// ─── Flashcard types ───────────────────────────────────────────────────────────

export interface Flashcard {
  front: string;
  back: string;
  difficulty: "easy" | "medium" | "hard";
}

// ─── Study session types ───────────────────────────────────────────────────────

export interface StudySession {
  id: string;
  date: string;       // ISO date string
  chapter: string;    // name of the chapter/exam group studied
  courseName: string;
  duration: number;   // milliseconds
  score?: number;     // 0-100 if a quiz was taken
}

// ─── Multi-class types ─────────────────────────────────────────────────────────

export interface GradeEntry {
  itemId: string;
  earned: number;   // points earned
  max: number;      // max possible points
}

export interface SavedClass {
  id: string;
  name: string;          // course name (from courseInfo.name)
  code: string;          // course code
  createdAt: string;     // ISO date string
  courseInfo: CourseInfo;
  items: DeadlineItem[];
  studyPlan: StudyWeek[];
  grades: GradeEntry[];
  weeklyTopics?: WeeklyTopic[];
  rawText?: string;      // original syllabus text — used for Phase 8 rescan
}
