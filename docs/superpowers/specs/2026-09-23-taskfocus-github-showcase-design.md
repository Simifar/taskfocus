# TaskFocus GitHub Showcase Design

## Goal

Make the public TaskFocus repository clear, trustworthy, visually polished, and straightforward to explore, run, and contribute to.

## Audience and success criteria

The repository serves three audiences: people evaluating the product, developers who want to run or contribute to it, and readers reviewing it as an academic project. A first-time visitor should quickly understand what TaskFocus does, what is implemented, how the system is structured, how to start it locally, and where to find project and security guidance.

The repository is successful when:

- the first screen of the README identifies the product, language, status, license, and documentation languages;
- English and Russian project descriptions remain equivalent and describe the current application accurately;
- setup instructions can be followed from a clean clone without undocumented prerequisites;
- architecture, security, contribution, release, and support guidance agree with the code and each other;
- screenshots are genuine captures of the current application and do not imply unavailable functionality;
- GitHub checks provide a useful automated signal for pull requests and changes to `main`;
- repository description and topics accurately describe the project.

## Current facts to preserve

- The repository is public and its default branch is `main`.
- The product interface is Russian-only.
- TaskFocus is a Next.js App Router full-stack application using React, TypeScript, PostgreSQL/Neon, Prisma, NextAuth, TanStack Query, Zustand, and Tailwind CSS.
- Email/password authentication is implemented; Google OAuth is optional and depends on deployment configuration.
- Password reset pages are explanatory placeholders; email delivery and password reset are not implemented.
- The application includes Inbox capture, a limited Today plan, task planning views, subtasks, archive actions, profile/statistics, and a local focus timer. Descriptions must be reconciled with current code before publishing.
- Domain/unit tests exist. There is no automated authenticated browser/E2E suite at this time.
- `LICENSE` is MIT. `package-lock.json` is the npm lockfile.
- A demo URL must not be invented. Link one only after checking that it is the intended public application and is reachable.
- Do not describe the historical draft release notes as published GitHub Releases unless the tags and releases are verified.

## Repository presentation

### README files

- `README.md` is the primary English landing page and links to `README.ru.md`.
- `README.ru.md` is a complete Russian-language counterpart and links back to `README.md`.
- Both versions share the same structure and factual product information.
- The opening area includes the project logo, a short plain-language product statement, a concise status line, navigation links, and small badges limited to verifiable facts such as license and CI status.
- The body includes: product overview, selected genuine screenshots, feature summary, technology summary, architecture overview, requirements, local setup, environment configuration, seed/demo-account warning, useful scripts, testing/build commands, deployment notes, security and privacy notes, known limitations, contribution links, and license.
- Product copy must not claim medical efficacy, AI features, teams, cloud synchronization beyond the actual account-backed application, or any other unsupported capability.
- README screenshots must be current, legible, and use synthetic or non-sensitive content. They must not contain credentials, private user data, or misleading fabricated controls.

### Documentation

- Refresh `docs/ARCHITECTURE.md`, `docs/SETUP.md`, `docs/DEPENDENCIES.md`, `docs/RELEASES.md`, and `docs/THESIS.md` where current implementation or stale claims require correction.
- Add `CONTRIBUTING.md` with prerequisites, local setup, branch/commit expectations, quality gates, and pull request guidance suitable for this repository.
- Add `SECURITY.md` with supported-version scope and a verified private vulnerability reporting path. Do not request sensitive details in public issues.
- Add `SUPPORT.md` with appropriate GitHub-based support routes and known project boundaries.
- Add a short `CHANGELOG.md` only if it can be grounded in committed changes and verified release state; otherwise use the existing release notes as drafts and explain their status.
- Do not add policies requiring a personal contact address unless a real, approved contact channel is available.

### GitHub collaboration and automation

- Add a GitHub Actions workflow for pull requests and pushes to `main` that uses the lockfile, runs the existing quality command, and performs a production build with safe dummy build-time environment values where needed.
- The workflow must not connect to or mutate a real database, deploy, publish secrets, or run destructive Prisma commands.
- Add concise pull request guidance and issue forms/templates for bug reports and feature proposals. Forms should request reproducible information without asking for private data.
- Update repository description and topics through GitHub settings or a supported connector when the authenticated account permits it. Preserve unrelated repository settings.
- Do not alter branch protections, merge policy, visibility, collaborators, or repository ownership as part of this work.

## Visual direction

The repository should feel intentional and mature while staying recognizable as TaskFocus: restrained green accents, clear section hierarchy, carefully chosen whitespace, a compact badge row, and real product imagery. Keep the README scannable; detailed material belongs in linked documents. Use tables only for compact comparisons and Mermaid for architecture where it materially improves understanding.

## Boundaries

- No product feature changes, schema changes, or database operations.
- No new application runtime dependency.
- No fabricated metrics, release tags, download counts, uptime claims, or endorsements.
- No deployment or demo link until verified.
- No public issue or discussion creation during repository preparation.
- No claim that checks or deployments passed unless their current results have been observed.

## Delivery

Prepare the documentation, GitHub templates, workflow, package metadata, screenshots where accessible, and repository About metadata as one coherent repository-showcase effort. Review the complete diff for factual consistency and broken relative links. The user has already authorized committing and pushing completed phases; report local verification separately from remote CI and deployment status.
