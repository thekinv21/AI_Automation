# Architecture

This project is built on Next.js (App Router) and organizes its code according to **Feature-Sliced Design (FSD) v2.1**. This document describes the folder structure, the rules between layers, how the tooling enforces those rules, and what you can and cannot do in day-to-day development.

Most of these rules are not just recommendations: they are checked by ESLint, and since `bun run lint` runs before every commit, code that breaks them cannot be committed.

---

## 1. Tech stack

| Area                    | Tool                                                         |
| ----------------------- | ------------------------------------------------------------ |
| Framework               | Next.js 16 (App Router, Turbopack)                           |
| UI                      | React 19                                                     |
| Language                | TypeScript (strict)                                          |
| Styling                 | Tailwind CSS v4 (via `@theme`, no `tailwind.config` file)    |
| Package manager / tests | Bun (`bun test`)                                             |
| Lint                    | ESLint 9 + `eslint-config-next` + `eslint-plugin-boundaries` |
| Format                  | Prettier + `@trivago/prettier-plugin-sort-imports`           |
| Git hooks               | Husky (`pre-commit`, `commit-msg`)                           |

---

## 2. Folder structure

```text
app/                    Next.js router (route files only)
  layout.tsx
  page.tsx
src/
  _app/                 FSD app layer: providers, global styles, fonts
    providers/
    styles/
  _pages/               FSD pages layer: each page is a slice
    home/
      ui/home-page.tsx
      index.ts          public API of the page
  features/             User interactions (login, add-to-cart, ...)
  entities/             Business objects (user, session, product, ...)
  shared/               Reusable code that is not specific to this project
    api/
    config/
    lib/
    ui/
public/                 Static files
docs/                   Project documentation
```

### Why `_app` and `_pages`?

Next.js treats the root `app/` and `pages/` folders as routers. To avoid a name clash, the FSD `app` and `pages` layers are named `src/_app` and `src/_pages`. The root `app/` folder is only the Next.js routing layer and contains no business logic.

---

## 3. Layers

Layers are ordered from top to bottom. A layer may import **only from layers below it**.

```text
routes    (app/)          top
app       (src/_app)
pages     (src/_pages)
features  (src/features)
entities  (src/entities)
shared    (src/shared)    bottom
```

### routes (`app/`)

Next.js route files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`, and so on.

- This is only a thin wiring layer. The page itself lives in `src/_pages`, and the route file re-exports it:

  ```tsx
  // app/page.tsx
  export { HomePage as default } from '@/_pages/home'
  ```

- Next.js-specific exports such as `metadata`, `generateStaticParams` and `generateMetadata` can stay here.
- `layout.tsx` gets global styles and fonts from `@/_app/styles`.

### app (`src/_app`)

Initialization code that concerns the whole application.

- Global providers (theme, query client, store, auth provider)
- Global CSS and Tailwind theme tokens (`styles/globals.css`)
- Font definitions (`styles/fonts.ts`)

It is not split into slices; it consists of segments directly (`providers`, `styles`, ...).

### pages (`src/_pages`)

Each page is its own slice (`home`, `login`, `dashboard`, ...).

- Page layout, page-specific components and page-specific data fetching live here.
- If something is used by only one page, it stays inside that page. It moves to another layer only when it is used in more than one place.
- There is no separate `widgets` layer in this project. FSD v2.1 discourages it; large UI blocks are kept inside the page first.

### features (`src/features`)

Reusable interactions that bring value to the user, such as `auth-by-email`, `add-to-cart`, `toggle-theme`.

- A feature is moved here when it is used by more than one page.
- A feature cannot import another feature. If two features need to be combined, that happens in a higher layer (a page).

### entities (`src/entities`)

Business domain objects: `user`, `session`, `product`, `order`.

- Type definitions, small UI pieces belonging to the object (for example `UserAvatar`), API calls and state for that object live here.
- An entity cannot import another entity.
- Creating entities is not mandatory. If there is no business object that is really used in multiple places, this layer can stay empty.

### shared (`src/shared`)

Code that is independent of the business domain and can be used anywhere.

| Segment         | Contents                                             |
| --------------- | ---------------------------------------------------- |
| `shared/ui`     | Basic components such as Button, Input, Modal        |
| `shared/api`    | HTTP client, common request helpers                  |
| `shared/lib`    | Helper functions and hooks (`cn`, `formatDate`, ...) |
| `shared/config` | Environment variables, constants, route constants    |

- It is not split into slices; it consists of segments.
- `shared` can only import from `shared`. Business concepts such as `user` or `order` do not belong here.

---

## 4. Slices and segments

A **slice** is a business-domain partition inside a layer (`features/auth-by-email`, `entities/user`). The `app` and `shared` layers have no slices.

A **segment** is a technical partition inside a slice. Common segments:

| Segment  | Contents                             |
| -------- | ------------------------------------ |
| `ui`     | Components, styles                   |
| `api`    | Backend requests, server actions     |
| `model`  | Types, state, business logic         |
| `lib`    | Helpers used inside the slice        |
| `config` | Constants and settings for the slice |

An example feature:

```text
src/features/auth-by-email/
  ui/
    login-form.tsx
  api/
    login.ts
  model/
    schema.ts
  index.ts
```

Segment names should describe what the code is for, not what it is. Use the segment names above instead of names like `components`, `hooks`, `types` or `utils`.

---

## 5. Public API (`index.ts`)

Every slice is exposed to the outside only through its own `index.ts`. The `index.ts` file provides what may be used from outside via named exports:

```ts
// src/features/auth-by-email/index.ts
export { LoginForm } from './ui/login-form'
export { login } from './api/login'
```

All other files inside the slice are considered private and cannot be imported directly by another slice.

The same idea applies to `shared`, just one level deeper: each segment or component folder has its own `index.ts`.

```text
src/shared/ui/button/
  button.tsx
  index.ts        export { Button } from './button'
```

---

## 6. Import rules

### Path aliases

Aliases defined in `tsconfig.json`:

| Alias          | Folder           |
| -------------- | ---------------- |
| `@/_app/*`     | `src/_app/*`     |
| `@/_pages/*`   | `src/_pages/*`   |
| `@/features/*` | `src/features/*` |
| `@/entities/*` | `src/entities/*` |
| `@/shared/*`   | `src/shared/*`   |

There is no alias for the root `app/` folder. No layer should import route files.

### Who can import what

| Source          | Allowed                                            |
| --------------- | -------------------------------------------------- |
| routes (`app/`) | `_app`, `_pages`, `shared`                         |
| `_app`          | `_app`, `_pages`, `features`, `entities`, `shared` |
| `_pages`        | same page slice, `features`, `entities`, `shared`  |
| `features`      | same feature slice, `entities`, `shared`           |
| `entities`      | same entity slice, `shared`                        |
| `shared`        | `shared`                                           |

Note: route files cannot import `features` or `entities` directly. If a route needs a feature, the feature is used inside a page and the route re-exports that page.

### Depth rules

| Import                                   | Status | Reason                                       |
| ---------------------------------------- | ------ | -------------------------------------------- |
| `@/features/auth-by-email`               | valid  | public API                                   |
| `@/features/auth-by-email/ui/login-form` | error  | reaches into the slice                       |
| `@/_pages/home/ui/home-page`             | error  | reaches into the slice                       |
| `@/shared/ui/button`                     | valid  | component folder index                       |
| `@/shared/lib`                           | valid  | segment index                                |
| `@/shared/ui/button/button`              | error  | reaches into the component                   |
| `./ui/login-form`                        | valid  | relative import within the same slice        |
| `../model/schema`                        | valid  | one level up                                 |
| `../../shared/lib`                       | error  | two or more levels up, use the alias instead |

### Imports inside a slice

Files within the same slice import each other with **relative paths** (`./`, `../`). A slice should not import its own `index.ts` through the alias; lint does not block this, but it leads to circular imports.

```ts
// src/features/auth-by-email/ui/login-form.tsx
import { login } from '../api/login'             // correct
import { login } from '@/features/auth-by-email' // wrong
```

### Circular imports

The `import/no-cycle` rule is enabled. If module A imports B and B imports A (directly or indirectly), lint reports an error.

### Import order

Prettier automatically groups and sorts imports in this order:

1. `react`
2. `next`
3. Other npm packages
4. `@/_app`
5. `@/_pages`
6. `@/features`
7. `@/entities`
8. `@/shared`
9. Relative imports (`./`, `../`)

There is no need to maintain this order by hand; `bun run format` takes care of it.

---

## 7. Communication between slices on the same layer

Two features or two entities cannot import each other directly. This is not a limitation to work around but a deliberate constraint. When a slice needs something from another slice on the same layer:

1. **Combine them in a higher layer.** Use both features side by side in a page and let the page manage the data flow between them.
2. **Pass it in via props or slots.** Let the feature accept what it needs as `children` or a prop, and let the page provide it from another feature.
3. **Move the shared part down.** If the shared part belongs to the business domain, move it to `entities`; if it is domain-independent, move it to `shared`.

FSD's `@x` notation (controlled cross-imports between entities) is not set up in this project yet. If it is needed, the ESLint rules must be updated accordingly.

---

## 8. Do's and don'ts

### Allowed

- Adding a new page: create a slice under `src/_pages/<name>/` and re-export it from `app/<route>/page.tsx`.
- Keeping as many components, hooks and helpers inside a page as it needs.
- Moving a piece to `features`, `entities` or `shared` once it starts being used by more than one page.
- Using `entities` and `shared` from `features`.
- Using `shared` from `entities`.
- Using relative imports inside a slice (`./`, `../`).
- Defining Next.js-specific exports in `app/` route files (`metadata`, `generateStaticParams`, `revalidate`, etc.).
- Defining global providers in `src/_app/providers` and using them in `app/layout.tsx`.
- Adding Tailwind theme tokens to the `@theme` block in `src/_app/styles/globals.css`.
- Writing Server Components, Client Components (`'use client'`) and Server Actions inside the relevant slice.

### Not allowed (lint error)

- Importing upwards: `features` from `entities`, `_pages` from `features`, and so on.
- Importing another slice on the same layer: `features/b` from `features/a`.
- Importing `features` or `entities` directly from route files (`app/`).
- Importing any layer other than `shared` from `shared`.
- Importing a slice through anything other than its `index.ts`: `@/entities/user/model/types`.
- Importing internal files of `shared` components: `@/shared/ui/button/button`.
- Relative imports going up two or more levels: `../../`.
- Circular imports.
- Bypassing rules with `eslint-disable` comments. Because `noInlineConfig` is enabled, these comments have no effect and produce a warning; with `--max-warnings 0`, that warning fails lint as well.

### Should not (lint does not catch it, but it breaks the architecture)

- Putting business logic or large JSX in `app/` route files. The page belongs in `src/_pages`.
- Putting code used in only one place into `shared`, `entities` or `features` "in case it is needed later".
- Putting business-specific code in `shared` (for example `shared/ui/user-card`).
- Using segment names like `components`, `hooks`, `utils`, `types`.
- Using `export *` in `index.ts`. What a slice exposes should be explicit.
- Importing a slice's own `index.ts` through the alias from inside the slice.
- Creating layers that are not defined in this project, such as `widgets` or `processes`. There are no aliases or ESLint rules for them.

---

## 9. Where does code go?

When writing new code, decide in this order:

1. Is it a Next.js route file? `app/`
2. Does it wrap the whole application (provider, global style, font)? `src/_app`
3. Is it used by only one page? That page's slice: `src/_pages/<page>`
4. Is it a user interaction used by more than one page? `src/features/<feature>`
5. Is it a business object used in more than one place? `src/entities/<entity>`
6. Is it general-purpose and independent of the business domain? `src/shared/<segment>`

When unsure, keep the code inside the page first. Moving code down later is much easier than pulling it back out of the wrong layer.

---

## 10. Example: adding a new page and feature

A login page with email sign-in:

```text
app/login/page.tsx
src/_pages/login/
  ui/login-page.tsx
  index.ts
src/features/auth-by-email/
  ui/login-form.tsx
  api/login.ts
  index.ts
src/entities/session/
  model/types.ts
  index.ts
src/shared/ui/button/
  button.tsx
  index.ts
```

```tsx
// app/login/page.tsx
export { LoginPage as default } from '@/_pages/login'
```

```tsx
// src/_pages/login/ui/login-page.tsx
import { LoginForm } from '@/features/auth-by-email'

export function LoginPage() {
	return <LoginForm />
}
```

```tsx
// src/features/auth-by-email/ui/login-form.tsx
import { type Session } from '@/entities/session'

import { Button } from '@/shared/ui/button'

import { login } from '../api/login'
```

Dependencies always point downward: `app/login` → `_pages/login` → `features/auth-by-email` → `entities/session` → `shared/ui`.

---

## 11. Tooling and workflow

### Commands

| Command                | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `bun dev`              | Development server                             |
| `bun run build`        | Production build                               |
| `bun start`            | Runs the built application                     |
| `bun run lint`         | ESLint; no problems allowed, warnings included |
| `bun run typecheck`    | TypeScript type check                          |
| `bun run test`         | Tests (`bun test`)                             |
| `bun run format`       | Formats `app/` and `src/` with Prettier        |
| `bun run format:check` | Checks formatting                              |

### Git hooks

**pre-commit:** runs `bun run lint`. If lint fails, the commit is rejected. Type checking and tests do not run in the hook, so run them manually before committing.

**commit-msg:** the first line of the commit message must follow this format:

```text
type:[branchName][developerName]: description
```

`type` must be one of: `feat`, `fix`, `chore`, `docs`, `ci`, `test`, `refactor`.

```text
feat:[master][Vadim]: add email login
fix:[auth-bug][Vadim]: fix session expiry bug
```

### Code style

Prettier settings: tab indentation, no semicolons, single quotes (JSX included), trailing commas, no parentheses around a single arrow function parameter.

### Styling and theme

Tailwind v4 is used and there is no `tailwind.config` file. Tokens such as colors and fonts are defined with `:root` variables and the `@theme inline` block in `src/_app/styles/globals.css`. Fonts are loaded with `next/font` in `src/_app/styles/fonts.ts` and applied as CSS variables through `app/layout.tsx`.

---

## 12. References

- Feature-Sliced Design: https://feature-sliced.design
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS v4: https://tailwindcss.com/docs
- Agent skills used in this project: [SKILLS.md](./SKILLS.md)
