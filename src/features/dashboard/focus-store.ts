import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  finishElapsedFocusSession,
  resetFocusSession,
  startFocusSession,
  toggleFocusSession,
  type FocusSession,
} from "@/features/dashboard/lib/focus";

interface FocusState {
  session: FocusSession | null;
  expanded: boolean;
  start: (task: { id: string; title: string }) => void;
  toggle: () => void;
  reset: () => void;
  stop: () => void;
  setExpanded: (expanded: boolean) => void;
  /** Marks an elapsed session as finished; returns true when it just finished. */
  settle: () => boolean;
}

// The focus session lives above every view, so leaving the dialog or switching
// sections never pauses the timer; a reload restores it from the deadline.
export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      session: null,
      expanded: false,
      start: (task) => {
        const current = get().session;
        if (current?.taskId === task.id) {
          set({ expanded: true });
          return;
        }
        set({ session: startFocusSession(task, Date.now()), expanded: true });
      },
      toggle: () => {
        const { session } = get();
        if (session) set({ session: toggleFocusSession(session, Date.now()) });
      },
      reset: () => {
        const { session } = get();
        if (session) set({ session: resetFocusSession(session) });
      },
      stop: () => set({ session: null, expanded: false }),
      setExpanded: (expanded) => set({ expanded }),
      settle: () => {
        const { session } = get();
        const finished = session ? finishElapsedFocusSession(session, Date.now()) : null;
        if (!finished) return false;
        set({ session: finished });
        return true;
      },
    }),
    {
      name: "taskfocus.focus",
      partialize: (state) => ({ session: state.session }),
    },
  ),
);
