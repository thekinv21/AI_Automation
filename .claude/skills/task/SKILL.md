---
name: task
description: Runs a task end to end through a fixed 7-phase workflow — clarify & research, spec + plan, implement, verify against the spec, security review, unit + E2E tests, live Playwright check, then simplify and UI review. Use for every development task (feature, bug fix, refactor, UI change), whether or not the user typed /task.
argument-hint: <task description>
---

# Task workflow

Run the task in `$ARGUMENTS` through the phases below, in order. Each phase ends with a **gate**: do not start
the next phase until the gate passes. Talk to the user in the language they write in.

All artifacts for one task live in one folder:

```text
docs/tasks/YYYY-MM-DD-<slug>/
  spec.md   what and why (phase 1)
  plan.md   sub-tasks as checkboxes + a phase log (phase 2, updated in every later phase)
```

`plan.md` ends with a `## Phase log` section. After every gate, append one line: phase, result, and the commands
that proved it (e.g. `4. Security: 0 findings — /security-review, security-audit CLIENT-SIDE`). If the session is
interrupted, resume from the first phase without a passed gate.

These rules override the sub-skills you load:

- **No commits** until the final step, and only when the user says so. Ignore commit steps in sub-skills.
- **Tests come in phase 5**, not before. Plans have no test steps and no TDD.
- Use `docs/tasks/...` paths, not `docs/superpowers/...`.
- Follow [AGENTS.md](../../../AGENTS.md): read the relevant guide in `node_modules/next/dist/docs/` before
  writing Next.js code. Follow [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) (FSD) and
  [docs/TEST.md](../../../docs/TEST.md).

---

## 1. Understand, ask, research

Load the `brainstorming` skill and follow it, with these additions:

- Read the code the task touches before asking anything. Never ask what the repo already answers.
- **Research**: before laying out approaches, check how this is usually done. Look in `node_modules/next/dist/docs/`,
  the project's installed skills (`feature-sliced-design`, `vercel-react-best-practices`, ...), and the web
  when the topic needs it. Add a short **"Önerilerim / Suggestions"** list: things the user did not ask for but
  should consider (edge cases, accessibility, loading/error states, security, a simpler alternative). Each item
  has one line on why and a source when there is one. The user picks which ones go into scope.
- Ask questions with `AskUserQuestion`, a few at a time, each one standing on its own.
- Write the result to `spec.md`: goal, scope, out of scope, accepted suggestions, acceptance criteria (each one
  testable), affected FSD slices.

**Gate:** the user approved `spec.md`.

## 2. Plan and implement

Load the `writing-plans` skill and write `plan.md` from `spec.md`. Skip its test, commit and "execution
approach" steps. Each sub-task is a checkbox with the files it touches and how to check it (lint, typecheck, what
to look at).

Show the plan to the user. After approval, implement it yourself, one sub-task at a time:

1. Do the sub-task.
2. Run `bun run lint` and `bun run typecheck`; fix what fails.
3. Tick the checkbox in `plan.md`.

If the plan turns out wrong, stop, update `plan.md`, and tell the user what changed and why.

**Gate:** every checkbox ticked, lint and typecheck pass.

## 3. Verify against the spec

1. Load `verification-before-completion`: no claim without command output.
2. Load `validate-changes-match-specs` and validate against `docs/tasks/<this task>/spec.md`. The work is
   uncommitted, so compare against `git diff` plus untracked files, not `base...HEAD`. Skip its cloud
   computer-use and commit/push steps.
3. Walk every acceptance criterion in `spec.md` and mark it met / not met with evidence (file:line or command
   output).

Resolve mismatches as that skill describes (the user decides implementation vs. spec), then re-check.

**Gate:** every acceptance criterion is met, or the user accepted the gap in writing.

## 4. Security

1. Run the `security-review` skill on the pending changes.
2. Load `security-audit` in **guidance mode** (a focused review, no full audit, no output directory). Pick the
   attack-class files that match what changed: `CLIENT-SIDE.md` for UI, `WEB-PROTOCOL-AND-AUTH.md` for routes,
   Server Actions, auth or cookies, `AI-AND-LLM.md` for LLM calls, `SUPPLY-CHAIN-AND-RELEASE.md` for new
   dependencies, `DATA-ISOLATION-AND-LIFECYCLE.md` for user data. Check the diff against them.
3. Every candidate needs a concrete source trace (input → sink) before it counts. Fix confirmed findings, then
   re-run both reviews on the new diff.

Run the full six-phase `security-audit` only if the user asks for it.

**Gate:** zero confirmed findings. List anything left as "needs validation" with the exact open question.

## 5. Unit and E2E tests

Follow [docs/TEST.md](../../../docs/TEST.md):

- Unit/component tests next to the code (`*.test.tsx`, `bun:test`, Testing Library). Cover schemas, `lib`
  functions, Server Action logic and client components.
- E2E specs in `tests/e2e/*.spec.ts`. Load `playwright-best-practices`. One test per acceptance-criterion flow:
  happy path, main error case, and no console errors.
- Every acceptance criterion in `spec.md` maps to at least one test. Write the mapping in `plan.md`.

Run `bun run test` and `bun run test:e2e` and read the output. A failing test means fix the code, unless the
test itself is wrong; say which one it was.

**Gate:** both commands pass.

## 6. Live check with Playwright

Load `playwright-cli`. Use `npx playwright cli` (installed locally). Start `bun dev` in the background if it is
not running.

For each acceptance criterion, click through the flow as a user would, in a desktop viewport and in a mobile one
(about 390×844). Check console errors, network failures, keyboard navigation and focus, and empty, loading and
error states. Take screenshots of the key screens, save them in the scratchpad, and look at them.

Fix what you find, add a test for it in the phase 5 files, and re-run `bun run test:e2e`.

**Gate:** every flow works on both viewports with no console errors.

## 7. Simplify and UI review

1. Run the `simplify` skill on the changes. For every piece of new code, ask whether the task needs it. Delete
   dead code, unused props and exports, and abstractions with one caller.
2. Run `code-review` at `medium` on the changes and fix confirmed findings.
3. For UI changes, load `web-design-guidelines` (and `ui-ux-pro-max` when visual quality is in question). Review
   spacing, typography, contrast, states, responsiveness and accessibility against the phase 6 screenshots.
   Fix what matters and re-screenshot.
4. Re-run everything, since this phase changed code:

```bash
bun run lint && bun run typecheck && bun run test && bun run test:e2e
```

**Gate:** all four pass.

---

## Finish

Give the user a short report:

- what was built, and the `spec.md` / `plan.md` paths
- each phase's result from the phase log
- open items (accepted gaps, "needs validation" security notes)

Then ask whether to commit. The commit header must match the repo's `commit-msg` hook:
`type:[branch][developer]: description` with type in `feat|fix|chore|docs|ci|test|refactor`, e.g.
`feat:[master][Vadim]: ...`. Match the language and style of recent commits (`git log --oneline -10`).
