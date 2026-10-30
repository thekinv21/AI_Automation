# Testing

The project has two kinds of tests:

| Kind             | Tools                                          | Location                  | Command            |
| ---------------- | ---------------------------------------------- | ------------------------- | ------------------ |
| Unit / component | `bun test` + React Testing Library + happy-dom | next to the code in `src` | `bun run test`     |
| End-to-end (E2E) | Playwright (Chromium, desktop + mobile)        | `tests/e2e/*.spec.ts`     | `bun run test:e2e` |

New behavior ships with its tests in the same change.

---

## 1. Commands

| Command               | What it does                                      |
| --------------------- | ------------------------------------------------- |
| `bun run test`        | Run unit/component tests once                     |
| `bun run test:watch`  | Re-run unit tests when files change               |
| `bun run test:e2e`    | Run E2E tests (starts `bun dev` automatically)    |
| `bun run test:e2e:ui` | Open the Playwright UI to run and debug E2E tests |

Open the last E2E HTML report with `bunx playwright show-report tests/playwright/report`.

After a fresh clone, install the browser once: `bunx playwright install chromium`.

---

## 2. Unit / component tests

### How it works

1. `bun test` reads [`bunfig.toml`](../bunfig.toml). It only looks for tests under `src/`, so the Playwright
   specs in `tests/e2e` are never picked up.
2. Before the tests run, two setup files are preloaded:
   - [`tests/setup/happy-dom.ts`](../tests/setup/happy-dom.ts) registers a fake browser (`window`, `document`)
     at `http://localhost:3000`. A real URL is needed because `next/image` and `next/link` resolve URLs
     against `location`.
   - [`tests/setup/testing-library.ts`](../tests/setup/testing-library.ts) adds the jest-dom matchers
     (`toBeInTheDocument`, `toHaveAttribute`, …) to `expect` and calls `cleanup()` after each test.
3. [`tests/setup/matchers.d.ts`](../tests/setup/matchers.d.ts) only holds types: it tells TypeScript that the
   jest-dom matchers exist on `bun:test`'s `expect`.

### Writing a test

Put the test file next to the file it tests: `login-form.tsx` → `login-form.test.tsx`. Import test functions
from `bun:test`.

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'bun:test'

import { LoginForm } from './login-form'

describe('LoginForm', () => {
	it('shows an error for an invalid email', async () => {
		const user = userEvent.setup()
		render(<LoginForm />)

		await user.type(screen.getByLabelText('Email'), 'not-an-email')
		await user.click(screen.getByRole('button', { name: 'Sign in' }))

		expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
	})
})
```

Guidelines:

- Test what the user sees. Query with `getByRole` / `getByLabelText` first; use `data-testid` only when
  nothing else fits.
- Test Zod schemas, `lib` functions, Server Action logic and client components.
- Async Server Components can't be rendered by Testing Library. Cover them with E2E tests.
- Don't test framework code, styling classes or trivial pass-through components.

---

## 3. E2E tests

### How it works

[`playwright.config.ts`](../playwright.config.ts) controls the run:

- Tests live in `tests/e2e/*.spec.ts`.
- Playwright starts `bun dev` on port 3000. Locally it reuses a dev server that is already running; on CI it
  always starts a fresh one.
- Every test runs twice: in the `desktop` project (Desktop Chrome) and the `mobile` project (Pixel 7).
- Results go to `tests/playwright/results` and the HTML report to `tests/playwright/report`. The whole
  `tests/playwright/` folder is git-ignored.
- On CI (`CI` env var set): failed tests are retried twice, tests run in a single worker, the report uses the
  GitHub format, and a forgotten `test.only` fails the run. A trace is recorded on the first retry.

### Writing a test

Write one test per user-visible flow: the happy path plus the main error case. Also assert that the page logs
no console errors.

```ts
import { expect, test } from '@playwright/test'

test('home page renders without console errors', async ({ page }) => {
	const errors: string[] = []
	page.on('console', message => {
		if (message.type() === 'error') errors.push(message.text())
	})
	page.on('pageerror', error => errors.push(error.message))

	await page.goto('/')

	await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
	expect(errors).toEqual([])
})
```

---

## 4. Before finishing a task

Run all checks and read the output. A task is not done while any of them fails:

```bash
bun run lint
bun run typecheck
bun run test
bun run test:e2e
```

The `pre-commit` hook runs only lint, so run typecheck and tests yourself.

---

## 5. Troubleshooting

**`Cannot find module 'bun:test'` in VS Code, but `bun run typecheck` passes.** VS Code is using its bundled
TypeScript instead of the project's. Run **TypeScript: Select TypeScript Version → Use Workspace Version**,
then **TypeScript: Restart TS Server**.

**`TypeError: Invalid URL` when rendering a component.** happy-dom has no URL. Make sure
`tests/setup/happy-dom.ts` is preloaded (check `bunfig.toml`).

**E2E tests fail with "Executable doesn't exist".** The Playwright browser is missing. Run
`bunx playwright install chromium`.
