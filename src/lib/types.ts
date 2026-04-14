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
