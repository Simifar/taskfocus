# TaskFocus Auth Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current split-screen, tab-based login UI with separate modern `/login` and `/register` experiences while preserving the existing authentication behavior.

**Architecture:** A shared client-side `AuthShell` will own the visual system, branding, OAuth action, and route switcher. `AuthPage` will become a mode-driven form renderer for login or registration, while server page wrappers provide the mode and whether Google OAuth is configured. Existing auth hooks and API functions remain unchanged.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, existing shadcn-style primitives, NextAuth, Node test runner via `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-23-taskfocus-auth-redesign.md`

## Global Constraints

- Preserve the existing credentials and Google authentication contracts.
- Do not add a runtime dependency.
- Use factual Russian copy and keep password recovery explicitly out of scope.
- Support 320px mobile width, 390px mobile width, desktop layout, keyboard focus, and dark mode.
- Do not show Google sign-in when the server has no Google client ID and secret.

## Review Focus

- A 320px viewport must keep the primary submit button and password toggle usable without horizontal overflow.
- Switching from login to registration must navigate to `/register` and not retain the other mode’s field values or error.
- Missing Google OAuth configuration must remove the Google button without leaving an empty divider.
- OAuth and credentials errors must remain visible inline and must not be replaced by a misleading success state.
- The password visibility button must not submit the form and must expose an accessible label.

### Task 1: Auth shell and separate route composition

**Files:**
- Create: `src/features/auth/components/auth-shell.tsx`
- Modify: `src/features/auth/components/auth-page.tsx`
- Modify: `src/app/login/page.tsx`
- Create: `src/app/register/page.tsx`
- Test: `tests/auth-ui-contract.test.ts`

**Interfaces:**
- Consumes: existing `useLogin`, `useRegister`, `signIn`, and `ApiError` behavior.
- Produces: `AuthShell` and `AuthPage` with `mode: "login" | "register"`; route wrappers pass `googleEnabled: boolean`.

- [ ] **Step 1: Write the failing UI contract tests**

  Add source-contract tests asserting that the login and register routes exist, both modes use `AuthShell`, tabs are removed, Google availability is passed from the server wrapper, and password fields expose `autoComplete` and a non-submit visibility control.

- [ ] **Step 2: Run the tests and verify they fail for the old composition**

  Run `npm.cmd test -- tests/auth-ui-contract.test.ts`.

  Expected: FAIL because there is no register route, the old page uses tabs, and the current form has no password visibility contract.

- [ ] **Step 3: Implement the shared modern shell and mode-driven form**

  Build the centered responsive shell with the TaskFocus logo, subtle ambient background, optional desktop preview, Google action, divider, inline route switcher, and mode-specific Russian copy. Replace the tab state with route-driven mode. Add password visibility toggles, autocomplete values, `aria-live`/`role="alert"` error presentation, and separate login/register links. Keep existing mutation calls and redirects.

- [ ] **Step 4: Run the targeted tests and verify they pass**

  Run `npm.cmd test -- tests/auth-ui-contract.test.ts`.

  Expected: PASS with all auth UI contracts satisfied.

- [ ] **Step 5: Commit the implementation**

  Run `git add src/features/auth/components/auth-shell.tsx src/features/auth/components/auth-page.tsx src/app/login/page.tsx src/app/register/page.tsx tests/auth-ui-contract.test.ts docs/superpowers/specs/2026-09-23-taskfocus-auth-redesign.md docs/superpowers/plans/2026-09-23-taskfocus-auth-redesign.md` and commit with `git commit -m "feat: redesign login and registration experience"`.

### Task 2: Full verification and release

**Files:**
- Modify: none unless verification exposes an issue.
- Test: `tests/auth-ui-contract.test.ts` and the full project suite.

**Interfaces:**
- Consumes: Task 1’s route and component structure.
- Produces: verified commit pushed to `main` and a deployment trigger from the existing GitHub/Vercel integration.

- [ ] **Step 1: Run the full quality gate**

  Run `npm.cmd run check` and `git diff --check`.

  Expected: lint, typecheck, all tests pass, and no diff errors.

- [ ] **Step 2: Run the production build**

  Run `$env:DATABASE_URL='postgresql://user:pass@localhost:5432/taskfocus'; npm.cmd run build`.

  Expected: Next.js production build completes successfully.

- [ ] **Step 3: Run browser verification**

  Start `npm.cmd run dev` with dummy local auth environment variables, open `/login` and `/register` in the in-app browser, check the protected `/` redirect, and inspect the 320/390-width behavior as supported by the browser harness.

  Expected: both pages render meaningful content without an error overlay; the protected route redirects to `/login` when unauthenticated.

- [ ] **Step 4: Push the committed phase**

  Run `git push origin main`, then verify `git status --short --branch` is clean and `git ls-remote origin refs/heads/main` points to the new commit.

- [ ] **Step 5: Report deployment status**

  Confirm the existing GitHub/Vercel integration was triggered by the push. If Vercel credentials are unavailable, report that the deployment was triggered but its remote status could not be independently queried.
