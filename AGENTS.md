## Workflow rule

Every development task (feature, bug fix, refactor, UI change) goes through the `task` skill
([`.claude/skills/task/SKILL.md`](.claude/skills/task/SKILL.md)), even when the user does not type `/task`.
Load it before reading code or writing anything, and run its 7 phases in order:

1. Understand the task, ask questions, research, suggest additions → `spec.md`
2. Split into sub-tasks → `plan.md`, implement step by step
3. Verify that every acceptance criterion in `spec.md` is met
4. Security review of the changes
5. Unit + E2E tests, both passing
6. Live check in the browser with Playwright (desktop + mobile)
7. Simplify the code, review the UI, re-run all checks

Do not skip a phase or start the next one before its gate passes. Do not say a task is done without the command
output that proves it.

Exceptions: questions, explanations, and one-line changes whose whole intent is in the request (a typo, a
color, a renamed variable). Do these directly.

## Project rules

- Architecture: Feature-Sliced Design, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). ESLint enforces the layer
  boundaries.
- Tests: see [docs/TEST.md](docs/TEST.md). Before finishing: `bun run lint`, `bun run typecheck`, `bun run test`,
  `bun run test:e2e`.
- Package manager: Bun. Do not use npm or yarn to install packages.
- Commits only when the user asks. The header must be `type:[branch][developer]: description`, with type in
  `feat|fix|chore|docs|ci|test|refactor`, e.g. `feat:[master][Vadim]: ...`. Never bypass the hooks with
  `--no-verify`.
