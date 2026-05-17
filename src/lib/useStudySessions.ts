import { StudySession } from "@/lib/types";

const KEY = "sai_study_sessions";

export function getStudySessions(): StudySession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveStudySession(session: StudySession): void {
  const sessions = getStudySessions();
  sessions.unshift(session);
  if (sessions.length > 100) sessions.splice(100);
  localStorage.setItem(KEY, JSON.stringify(sessions));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sai_session_saved"));
  }
}

export function getWeeklyStudyMinutes(): number {
  const sessions = getStudySessions();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return sessions
    .filter((s) => new Date(s.date).getTime() >= cutoff)
    .reduce((sum, s) => sum + s.duration, 0) / 60_000;
}
