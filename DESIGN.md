# TaskFocus design direction

Updated: 2026-09-26

## Product promise

TaskFocus helps a person get thoughts out of their head, choose a small amount of meaningful work, and make progress without turning planning into another project.

The main path is:

1. **Capture** a task in Inbox with only a title.
2. **Choose** up to five active tasks for today; use importance, urgency, effort, and soft dates to decide what comes first.
3. **Start** one task with an optional focus timer.
4. **Keep progress** by saving task changes through the existing authenticated API.
5. **Close the day** with a clear view of what is complete and what is still open.

Today is the working surface. Inbox is for capture and later sorting. Week and Calendar support planning; Matrix and Archive stay secondary. Search is available from the dashboard without changing the selected planning view.

## Design read

Personal planning product for people who want a calm pace and a clear next action. The visual language is quiet and editorial, built from warm, low-contrast neutrals and a single pine-green accent. Density stays low; motion only confirms a state change or draws attention to the next action.

## Visual system

- Keep Geist Sans for interface text and Geist Mono for timer digits. Use sentence case, moderate heading sizes, and tabular numbers for counts and time.
- Use a soft neutral canvas with slightly raised surfaces. Let spacing and dividers group ordinary tasks; reserve a filled surface for the recommended next task and modal content.
- Use pine green for the primary action, keyboard focus, and selected navigation. Use destructive red only for destructive actions and error states. Priority must also be named in text so color never carries the meaning alone.
- Light and dark themes share the same roles and hierarchy. Dark mode uses tinted charcoal rather than black; the sign-in story panel uses a deeper charcoal surface in dark mode instead of inverting to a bright block.
- Avoid decorative grids, glows, unsupported productivity scores, and placeholder task content. Do not add images where task content is clearer without them.

### Core color roles

| Role | Light theme | Dark theme |
| --- | --- | --- |
| Page canvas | soft neutral with a slight green tint | deep tinted charcoal |
| Raised surface | near-white | lifted charcoal |
| Main text | dark green-grey | soft off-white |
| Secondary text | muted green-grey with readable contrast | light muted green-grey |
| Brand accent | restrained pine | light sage-pine |
| Borders | warm-grey green | quiet charcoal-green |

The values live in `src/app/globals.css` so components use the shared theme tokens instead of local color guesses.

## Screen structure

### Today

- Put the date, plan count, and add action in one compact header.
- Show one recommended next task, chosen by the nearest soft-date end, then Eisenhower priority, then the selected effort filter, then manual order.
- Keep the remaining plan in a simple list. Completed tasks stay collapsed until requested; when the plan is finished, say so and keep the completed work available.
- If the five-task limit is reached, keep capture possible by offering an undated task in Inbox instead of presenting a dead disabled action.
- Explain an empty or filtered list with a direct action to clear the filter or open Inbox.

### Inbox and search

- Inbox opens with a single title field and Enter-to-save behavior. Optional planning details remain secondary.
- Global search uses the existing task API, matches task titles and descriptions including one-level subtasks, and reports loading, empty, and error states distinctly.
- Search results do not replace the current view or alter task data. Selecting a result opens the existing edit flow.

### Tasks and focus

- Long task names wrap; metadata and actions stay reachable on narrow screens.
- Importance, urgency, date range, effort, and subtask progress appear as concise text or labels.
- Completing a task is reversible. Permanent deletion still requires confirmation.
- The focus timer uses elapsed wall time, pauses when the dialog closes, and keeps its remaining time while navigating between dashboard views. Task completion feedback appears only after the save succeeds.

## Navigation and responsive behavior

- Desktop keeps the existing narrow sidebar. Mobile keeps the established bottom navigation with safe-area padding and a central create action.
- Today, Inbox, and Plan remain primary. Calendar, Matrix, Archive, and Profile remain secondary.
- At 320 px, controls wrap without clipping, task titles remain readable, and the bottom navigation does not cover scrollable content.
- Dialogs use a bounded viewport height with independently scrollable content and a visible action row.

## States and accessibility

- Loading, empty, filtered-empty, and failed requests are different states. A failed task request must never look like an empty plan.
- Every failed load has a local retry action. Forms keep their values after a failed save.
- Controls have visible focus, descriptive accessible names, and pressed/current state. State is not communicated with color alone.
- Respect reduced-motion preferences and keep interactions usable by keyboard.

## Scope boundaries

- Keep the existing Next.js, React, Tailwind, Radix, TanStack Query, Zustand, Prisma, and PostgreSQL stack. Do not add a design-system dependency.
- Do not alter the Prisma schema, run database pushes, or migrate stored task data as part of this redesign.
- Projects are not represented in the current data model. They remain outside this change rather than being simulated with labels or local-only records.
- Password reset and email delivery remain unavailable until a real token, delivery, and recovery flow is designed.
