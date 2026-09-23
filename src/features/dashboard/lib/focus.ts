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
