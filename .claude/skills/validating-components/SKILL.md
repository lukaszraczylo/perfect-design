---
name: validating-components
description: Runs and reports the Perfect Design check ladder for a component change, from unit and guard tests to real-browser axe, overflow, behaviour and Lighthouse checks, and an optional check inside a consuming app. Use before calling component work done, before a release, or when asked to verify, validate or check a component. Not for writing the change (use developing-components) or publishing it (use releasing-components).
---

# Validating components

Pick the level from the change. Run every step of that level and of the levels below it. Report each command with its counts, and name each step you did not run.

| Level | When | Steps |
|---|---|---|
| 1. Unit | Every change | A, B, C |
| 2. Library | Shared code (`lib/`, `styles/`, `stores/`, `ConfigProvider`), many components, or a release | A to E |
| 3. Browser | Visible change: layout, spacing, focus, overlays, pointer, colour, theme | A to H |
| 4. App | The change exists for an app, or an app showed the bug | A to I |

## Steps
- **A. Component and guards:** `cd packages/ui && ./node_modules/.bin/vitest run src/components/<group>/<Name> src/__tests__`. The guards cover structure, docs contract, axe without layout, strict examples, required parts, variants matrix, CSS validity, contrast and slop.
- **B. Types:** `cd packages/ui && pnpm exec vue-tsc --noEmit`.
- **C. Generated files and docs tests:** `pnpm generate:llms`, then `pnpm --filter docs test`. If `git status` shows changed generated files, commit them with the change.
- **D. Full suite with coverage:** `pnpm test:coverage`. Thresholds are 95/90/95/95. Do not lower a threshold.
- **E. Legacy scan:** `npx modern-web-guidance@latest legacy-scan packages/ui/src` must report 0 findings.
- **F. Docs build:** `pnpm --filter docs build`.
- **G. Browser run:** `pnpm test:browser` (behaviour tests with sabotage self-checks, axe and overflow sweep at 320, 768 and 1280px in light and dark, state check). Use `-- --only behaviour|sweep|state` to rerun one stage. For a spacing, border or type change, also run `node scripts/a11y-sweep.mjs <url> --style workbench` and `--style terminal` against a served build.
- **H. Lighthouse (docs pages changed):** `node scripts/lighthouse.mjs <url> [paths...]`.
- **I. In the app:** see below.

## I. Check the change in a consuming app
jsdom cannot see layout, and the docs site does not show the app's own grids, data or translations.
1. Install the released version in the app (see `releasing-components`), or link the local build for a quick look.
2. Build the app for production and serve the build. A dev server can point at a different backend, so real data may not load.
3. Open the page at 375px and 1280px with puppeteer-core from `scripts/browser/lib.mjs` (`launch()`). Check:
   - `document.documentElement.scrollWidth` equals the viewport width (no horizontal scroll).
   - The changed element shows the expected text and state (read it with `page.evaluate`).
   - At least two locales, one of them right to left, when the change touches text.
4. Take screenshots of the changed section for the report. Stop the preview server when you finish.

## Report
State the level, every command with its pass and fail counts, coverage numbers for step D, what you checked in a browser and at which widths, and what you did not cover (screen readers, Safari and Firefox, real phones).
