# TaskFocus UI/UX redesign — implementation plan

Scope: existing application only, approved Brand Kit v1.0. Preserve routes, APIs, persistence, task capacity, date ranges, autosave, undo and focus timer. No schema, authentication or real data changes.

Direction: quiet blue workspace, restrained white/navy surfaces, one prominent next action, spacious lists, consistent 44px phone controls. Keep Tailwind 4, Radix, Geist and feature/shared boundaries.

1. Inspect all routes, dashboard views, shared UI and task/account interactions — completed.
2. Implement semantic light/dark tokens and common controls, focus treatment, reduced motion — completed.
3. Recompose navigation, Today, Inbox, week/month/priority/day/archive views — completed.
4. Update creation/edit/search/focus dialogs, authentication and account pages, recovery/error/404 states — completed.
5. Check real public pages and isolated interactive synthetic workspace at 320/390/768/1440 in both themes; inspect keyboard, contrast, long strings, empty/error/loading states; fix findings — completed. 112 screen/theme/width states passed; task-menu accessibility finding fixed and rechecked.
6. Run npm run check and production build; document evidence and remaining external verification boundaries in docs/UI_REDESIGN.md — completed. 54 tests, ESLint, TypeScript and production build passed; authenticated database and OAuth boundaries remain explicit.

All design decisions are covered by the user’s instruction to work autonomously. No intermediate design approval, deployment or commits are part of this plan.
