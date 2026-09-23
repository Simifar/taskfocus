# TaskFocus GitHub Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the public TaskFocus repository a polished bilingual README and the concise documentation, collaboration files, and automation needed to support it.

**Architecture:** The root README will be an English landing page with a complete Russian counterpart. Both will link to the existing focused docs and genuine screenshots. Small GitHub contribution/security files and one read-only CI workflow will make the repository easier to understand and maintain without changing application behavior.

**Tech Stack:** Markdown, GitHub Actions YAML, npm, Node.js 22 in CI (project engine floor is Node.js `>=20.9.0`), existing Next.js/Prisma application.

**Spec:** `docs/superpowers/specs/2026-09-23-taskfocus-github-showcase-design.md`

## Global Constraints

- Keep README.md as the English landing page and README.ru.md as a complete Russian counterpart.
- Describe the UI as Russian-only and password reset as unavailable until the implementation changes.
- Use real, current screenshots with synthetic data; do not fabricate a demo URL, metrics, releases, or user data.
- Do not add runtime dependencies, mutate any database, deploy from CI, or change branch protections or repository visibility.
- Keep supporting documents concise and practical.
- Do not add or run local tests during this task; the GitHub workflow should run only existing project quality/build commands on its own future events.

## Review Focus

- The two README versions must have matching feature claims and setup requirements.
- Screenshots must not expose credentials or personal data and must visibly match current UI.
- Seed instructions must identify the demo account as local-only and warn against reusing its password.
- CI must use the committed npm lockfile, a throwaway database URL, read-only repository permissions, and no deployment step.
- Security guidance must point to a verified private reporting channel and must not encourage public disclosure.

---

### Task 1: Bilingual product README and imagery

**Files:**
- Modify: `README.md`
- Create: `README.ru.md`
- Create: `docs/images/` genuine screenshots of currently available UI

**Interfaces:**
- Consumes: current product facts, existing documentation paths, and the current application UI.
- Produces: parallel English/Russian README structures with matching sections and verified relative links.

- [ ] **Step 1: Confirm the current app screens and available screenshot source**

  Inspect the current GitHub/Vercel links and browser state; check whether a local environment file exists without printing its contents. Use an authenticated app only if an already configured, non-production-safe session is available. Otherwise capture the public auth pages and do not fabricate dashboard content.

- [ ] **Step 2: Prepare genuine screenshots**

  Save legible desktop and mobile screenshots under `docs/images/`, using synthetic sample data only. If the dashboard cannot be safely accessed, omit that screenshot and keep the README focused on screens that can be verified.

- [ ] **Step 3: Rewrite the English landing README**

  Organize it as: hero/short description, language switch, compact factual badges, product screenshots, product principles and features, stack, a small Mermaid architecture flow, quick start, environment variables, scripts, security/privacy, current limitations, documentation, contribution, and license. Use only links checked against files in this repository.

- [ ] **Step 4: Create the matching Russian README**

  Translate all user-facing claims and setup instructions, preserve the same section order, and add reciprocal language links.

- [ ] **Step 5: Commit and push this phase**

  Review the two documents side-by-side for claim parity and check every relative link and image path. Commit with `docs: create polished bilingual project README` and push `main`.

### Task 2: Practical contributor and security guidance

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`
- Create: `SUPPORT.md`
- Modify as needed: `docs/ARCHITECTURE.md`, `docs/SETUP.md`, `docs/DEPENDENCIES.md`, `docs/RELEASES.md`, `docs/THESIS.md`
- Create only if history supports it: `CHANGELOG.md`

**Interfaces:**
- Consumes: Task 1 README section links and verified current product/setup facts.
- Produces: concise, mutually consistent project guidance linked by both README versions.

- [ ] **Step 1: Update factual documentation**

  Fix stale claims, including the former single login/register route, test coverage wording, reset-password status, and draft-versus-published releases. Retain useful thesis and migration context, but make its scope clear.

- [ ] **Step 2: Write concise contribution, security, and support guides**

  Include local prerequisites and existing commands in CONTRIBUTING; document a private vulnerability reporting route only after confirming repository support/settings; route ordinary bugs and questions to the appropriate GitHub facilities in SUPPORT. Do not invent an email contact.

- [ ] **Step 3: Link and review guidance from both READMEs**

  Confirm each link resolves and that the two language versions describe the same policies. Do not create a changelog if verified release history is unavailable.

- [ ] **Step 4: Commit and push this phase**

  Commit as `docs: add concise contributor and security guidance` and push `main`.

### Task 3: GitHub collaboration files, CI, and repository metadata

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Modify: `package.json` project name/description metadata
- Modify: `package-lock.json` root package name/metadata
- GitHub About: repository description and relevant topics, preserving other settings

**Interfaces:**
- Consumes: Task 1 README claims and Task 2 support/security guidance.
- Produces: automated quality/build checks for pull requests and pushes to `main`, plus accurate repository metadata.

- [ ] **Step 1: Add concise pull request and issue templates**

  Ask for reproduction steps, expected/actual behavior, environment, and relevant sanitized logs; explicitly tell reporters not to include secrets or personal data.

- [ ] **Step 2: Add a non-deploying GitHub Actions workflow**

  Trigger on pull requests and pushes to `main`; set minimal read-only permissions and a job timeout; check out the repository, set up Node.js 22 with npm cache, run `npm ci`, `npm run check`, then `npm run build` with a clearly dummy `DATABASE_URL`. Do not pass any GitHub/Vercel secrets or run migration/seed/deployment commands.

- [ ] **Step 3: Update package and GitHub About metadata**

  Set the npm package name and description to TaskFocus values. Update the existing public GitHub repository description and choose a compact set of accurate topics. Do not change visibility, collaborators, branch rules, or merge options.

- [ ] **Step 4: Review the complete repository presentation**

  Inspect the diff and check README links/images, issue template fields, workflow triggers/permissions, package lock consistency, and About metadata. Do not claim CI or deployment success until GitHub reports a result for the pushed commit.

- [ ] **Step 5: Commit and push this phase**

  Commit as `chore: polish GitHub collaboration and CI` and push `main`.

### Completion report

Report the final README paths, the supporting files added or corrected, each phase commit, push state, and the separately observed GitHub Actions/deployment status. State plainly if authenticated dashboard screenshots or remote metadata editing were unavailable.
