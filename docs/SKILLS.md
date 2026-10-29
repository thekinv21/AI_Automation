# Agent Skills

Skills give the AI agent (Claude Code etc.) expert rules for a specific topic. They load **automatically** when your request matches, or **manually** via `/skill-name`. Installed in `.claude/skills/`, versions locked in `skills-lock.json`.

| Skill                            | Purpose                             |
| -------------------------------- | ----------------------------------- |
| `vercel-react-best-practices`    | React 19 / Next.js performance      |
| `vercel-composition-patterns`    | Component API design, React 19 APIs |
| `next-cache-components-adoption` | Next.js 16 Cache Components         |
| `tailwind-design-system`         | Tailwind CSS v4 tokens & components |
| `feature-sliced-design`          | FSD architecture                    |
| `find-skills`                    | Find & install new skills           |

---

### `vercel-react-best-practices`

Vercel's rules for data fetching, bundle size, re-renders and hydration.

> "Review the data fetching in `_pages/dashboard` and fix performance issues."

```tsx
// Before: sequential
const user = await getUser(id)
const posts = await getPosts(id)
// After: parallel
const [user, posts] = await Promise.all([getUser(id), getPosts(id)])
```

### `vercel-composition-patterns`

Composition over boolean props, compound components, React 19 APIs (no `forwardRef`, `use()` instead of `useContext()`).

> "Refactor `Modal` into a compound component."

```tsx
// Before: <Modal showHeader showFooter isFullscreen />
// After:
<Modal.Root>
	<Modal.Header>Settings</Modal.Header>
	<Modal.Footer>
		<Button>Save</Button>
	</Modal.Footer>
</Modal.Root>
```

### `next-cache-components-adoption`

Enables `cacheComponents: true` and fixes blocking routes one by one (`"use cache"`, `cacheLife`, `<Suspense>`). Requires Next.js 16.3+.

> "Enable Cache Components and fix the errors route by route."

```tsx
async function getCategories() {
	'use cache'
	cacheLife('hours')
	return db.category.findMany()
}
```

### `tailwind-design-system`

Tailwind v4 design system: `@theme` tokens instead of `tailwind.config.ts`, CSS-based dark mode, variants.

> "Set up a theme with primary #4F46E5 and dark mode."

```css
@import 'tailwindcss';
@custom-variant dark (&:where(.dark, .dark *));
@theme {
	--color-primary: oklch(0.51 0.23 277);
}
```

### `feature-sliced-design`

Official FSD v2.1: where code belongs (`app → pages → widgets → features → entities → shared`), public APIs, import rules, Next.js integration.

> "Add email login following FSD."

```text
app/login/page.tsx        → export { LoginPage as default } from '@/_pages/login'
src/_pages/login/
src/features/auth-by-email/{ui,api,index.ts}
src/entities/session/
src/shared/
```

### `find-skills`

Searches [skills.sh](https://skills.sh/) and installs skills.

```bash
npx skills find playwright
npx skills add <owner/repo@skill>
```
