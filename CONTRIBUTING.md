# Contributing to TaskFocus

Thanks for taking an interest in TaskFocus. The project is maintained as a focused personal-planning application and an academic project; small, well-scoped improvements are the best fit.

## Before you start

- Open an issue for a bug or proposed feature so the scope can be discussed first.
- For larger changes, wait for maintainer agreement before investing in implementation.
- Keep changes focused and avoid unrelated formatting or dependency churn.
- Do not include credentials, production data, or personal information in commits, issues, screenshots, or logs.

## Local development

Use Node.js `20.9` or newer, npm, and a disposable PostgreSQL database. Follow [`docs/SETUP.md`](docs/SETUP.md) to configure `.env` and prepare the local schema. Never run the seed or schema-sync commands against production or data you need to retain.

Before opening a pull request, run the existing project checks locally when practical:

```bash
npm run check
npm run build
```

The check command includes ESLint, TypeScript, and the existing unit/domain tests. There is not yet an automated authenticated browser/E2E suite. Do not claim a check passed unless you ran it or can see its successful CI result.

## Pull requests

- Use a short, descriptive title and explain the user-visible or maintenance impact.
- Include context, implementation notes, and the verification you actually performed.
- Add before/after screenshots for visual changes when safe and useful; use synthetic data only.
- Link the issue or discussion when one exists.
- Keep the change compatible with the current architecture unless an architectural change was discussed first.

The pull request template helps capture this information. Maintainers may request changes or close proposals that fall outside the project's scope.

## Project boundaries

The current interface is Russian-only. Password recovery/email delivery, team workspaces, and an authenticated browser test suite are not implemented. Changes must not imply those features exist, and must preserve server-side user-data ownership checks.

## License

By contributing, you agree that your contributions are provided under the repository's [MIT License](LICENSE).
