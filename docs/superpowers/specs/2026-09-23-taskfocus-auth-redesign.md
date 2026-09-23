# TaskFocus Auth Redesign Specification

## Goal

Replace the current split-screen, tab-based authentication screen with a polished, calm, modern experience for signing in and creating an account.

## Experience

- `/login` and `/register` are separate routes and separate user intents.
- Both routes share one responsive `AuthShell` with TaskFocus branding, a centered form surface, subtle ambient decoration, and a small desktop-only product preview.
- The design uses the existing brand green as an accent, not as a full-screen panel.
- The form remains usable at 320px wide, 390px mobile width, and desktop widths.
- Google sign-in is rendered only when Google OAuth is configured by the server page.
- Password fields have show/hide controls, correct autocomplete attributes, and touch-friendly controls.
- API errors remain generic and are shown inline with `role="alert"`; existing server contracts and session behavior are preserved.
- Login and registration provide clear links to one another instead of tabs.
- The redesign does not claim that password recovery works; the existing recovery implementation remains out of scope for this phase.

## Copy direction

- Login: “С возвращением”, “Войдите, чтобы продолжить свой план.”
- Registration: “Новый день — новый фокус”, “Создайте аккаунт и начните с небольшого плана на сегодня.”
- Use factual Russian labels and avoid exaggerated productivity promises.

## Non-goals

- No changes to NextAuth providers, Prisma models, password policy, registration API, or session strategy.
- No implementation of email delivery or password reset.
- No new runtime dependency.
