# TaskFocus product redesign implementation plan

> This plan is executed inline in the current local checkout. No commit, push, deployment, database mutation, or new dependency is included.

**Goal:** Make the existing TaskFocus flow reliable and calm from quick capture through choosing, focusing, completing, and reviewing today's tasks.

**Architecture:** Keep the current feature-based Next.js App Router and authenticated API. Connect existing search support to a small global search dialog, keep focus state in the dashboard shell, repair persisted day-view state, and distinguish failed data loads from empty plans. Apply the new design through existing Tailwind v4 and CSS tokens.

**Tech Stack:** Next.js 16.3.6, React 19, TypeScript, Tailwind CSS 4, Radix UI, TanStack Query, Zustand, Prisma 6, PostgreSQL.

**Design:** [`/DESIGN.md`](../../../DESIGN.md)

## Global constraints

- Preserve the existing database schema and user data; do not run `db:push`, migrations, or seed commands.
- Use existing dependencies and shared UI components.
- Keep Inbox quick capture title-first and maintain the five-active-task daily limit.
- Keep project support and password reset outside scope because neither has a complete implementation in the current data model or services.
- Do not commit or push without approval.

## Review focus

- A task list request fails: render a retry state, never an empty-plan message.
- A user reloads while viewing a selected day: restore that day or safely return to Today.
- A timer is throttled in the background: derive remaining time from a deadline, not interval tick count.
- Search terms match a one-level subtask: show its parent and the matched subtask context.
- A long title is viewed on a 320 px screen: keep actions reachable and text wrapped.

## Tasks

### 1. Make Today recommendations reflect priority

**Files:** `src/features/dashboard/lib/today.ts`, `tests/today-workspace.test.ts`.

- Add a failing test for urgency/importance tie-breaking after the existing date-range sort.
- Verify the test fails before changing the comparator.
- Use the existing Eisenhower order before the optional effort filter and manual position.
- Run the focused test, then the existing test suite.

### 2. Make focus timing stable and preserve the session across dashboard views

**Files:** `src/features/dashboard/lib/focus.ts`, `src/features/dashboard/components/focus-mode-dialog.tsx`, `src/features/dashboard/components/today-view.tsx`, `src/features/dashboard/components/dashboard-layout.tsx`, `src/features/dashboard/hooks/use-dashboard-actions.ts`, `tests/focus-timer.test.ts`.

- Add failing tests for remaining-time calculations at a deadline, during the final second, and after expiry.
- Derive timer state from a deadline timestamp and pause it on close.
- Mount the dialog in the dashboard shell so changing views does not discard its state.
- Only close the focus dialog after task completion saves successfully; retain the current session after a failed save.

### 3. Connect global search to the existing API

**Files:** `src/features/dashboard/components/task-search-dialog.tsx`, `src/features/dashboard/components/dashboard-layout.tsx`, `src/features/dashboard/components/dashboard-sidebar.tsx`, `src/features/dashboard/components/mobile-navigation.tsx`, `src/features/tasks/hooks.ts`, `src/server/tasks/search-filter.ts`, `src/server/tasks/service.ts`, `tests/task-search-filter.test.ts`.

- Add failing tests for whitespace normalization, title/description matching, and one-level subtask matching.
- Add optional query enablement to `useTasks` so an unopened search dialog makes no request.
- Reuse the authenticated task query, task row, and existing edit/completion/archive/delete actions.
- Give search loading, no-result, and retry-on-error states.

### 4. Preserve navigation state and show honest load errors

**Files:** `src/features/dashboard/store.ts`, `src/features/dashboard/components/dashboard-layout.tsx`, `src/features/dashboard/lib/view-state.ts`, `tests/dashboard-view-state.test.ts`.

- Add failing tests for restoring a saved day and repairing legacy persisted `day` state with no selected date.
- Persist `selectedDateIso` and safely normalize invalid legacy state.
- Replace the task-load toast-plus-empty-list behavior with an inline retry state.
- Keep the dashboard navigation visible while task data loads or fails.

### 5. Apply the product design system

**Files:** `DESIGN.md`, `src/app/globals.css`, `src/features/auth/components/auth-shell.tsx`, `src/features/dashboard/components/today-view.tsx`, `src/features/dashboard/components/task-row.tsx`, `src/features/dashboard/components/dashboard-sidebar.tsx`, `src/features/dashboard/components/mobile-navigation.tsx`, and task create/edit controls as needed.

- Replace pure white/black and glowing decorative login surfaces with a shared pine-and-neutral light/dark palette.
- Remove nested task cards in the recommended area and reduce repeated card framing in the task list.
- Surface priority and effort as readable metadata; add explicit pressed states to importance and urgency controls.
- Keep the Today action usable at capacity by saving a new task without a date.
- Check long titles, empty states, focus-visible states, reduced motion, and safe-area spacing.

### 6. Verify the requested user paths

- Run `npm run check` and `npm run build`.
- Revisit public auth pages and available views in the ChatGPT in-app browser.
- Use Console/Network/CDP and 320/390 px viewport checks only if the user grants the requested permission and the capability is available.
- Do not claim authenticated CRUD or persistence browser verification without a configured local database and usable local account.
