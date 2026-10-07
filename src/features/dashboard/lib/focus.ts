export const FOCUS_DURATION_SECONDS = 25 * 60;

export function formatFocusTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function getFocusProgress(remainingSeconds: number) {
  const elapsed = FOCUS_DURATION_SECONDS - Math.max(0, remainingSeconds);
  return Math.min(100, Math.max(0, (elapsed / FOCUS_DURATION_SECONDS) * 100));
}

export function getFocusRemainingSeconds(deadlineMs: number, nowMs: number) {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}

export interface FocusSession {
  taskId: string;
  taskTitle: string;
  /** Seconds left when the timer was last paused. */
  remainingSeconds: number;
  /** Set while the timer runs; remaining time is derived from it. */
  deadlineMs: number | null;
  completedSessions: number;
}

export function startFocusSession(task: { id: string; title: string }, nowMs: number): FocusSession {
  return {
    taskId: task.id,
    taskTitle: task.title,
    remainingSeconds: FOCUS_DURATION_SECONDS,
    deadlineMs: nowMs + FOCUS_DURATION_SECONDS * 1000,
    completedSessions: 0,
  };
}

export function getSessionRemainingSeconds(session: FocusSession, nowMs: number) {
  return session.deadlineMs === null
    ? session.remainingSeconds
    : getFocusRemainingSeconds(session.deadlineMs, nowMs);
}

export function toggleFocusSession(session: FocusSession, nowMs: number): FocusSession {
  if (session.deadlineMs !== null) {
    return { ...session, remainingSeconds: getSessionRemainingSeconds(session, nowMs), deadlineMs: null };
  }
  const remainingSeconds = session.remainingSeconds > 0 ? session.remainingSeconds : FOCUS_DURATION_SECONDS;
  return { ...session, remainingSeconds, deadlineMs: nowMs + remainingSeconds * 1000 };
}

export function resetFocusSession(session: FocusSession): FocusSession {
  return { ...session, remainingSeconds: FOCUS_DURATION_SECONDS, deadlineMs: null };
}

/** Returns the finished session when the running timer has reached zero, otherwise null. */
export function finishElapsedFocusSession(session: FocusSession, nowMs: number): FocusSession | null {
  if (session.deadlineMs === null || getSessionRemainingSeconds(session, nowMs) > 0) return null;
  return { ...session, remainingSeconds: 0, deadlineMs: null, completedSessions: session.completedSessions + 1 };
}
