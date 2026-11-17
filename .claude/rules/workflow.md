# Workflow and definition of done

## Before you change anything
Read `AGENTS.md`, `DESIGN.md`, `LLMSlop.md` and the rule file that matches the area (`components`, `contracts`, `accessibility`, `slop`, `testing`, `docs-and-llm`, `tokens-theming`). Other agents often edit the repository at the same time: re-read a file just before editing it, put new helpers in new files inside your own folder, never rewrite a shared barrel, and do not touch shared files (`src/index.ts`, `src/lib/*`, `src/styles/*`, `src/stores/*`, `vite.config.ts`, `vitest.setup.ts`, `scripts/*`, shared tests) unless the task is about them.

## Skills
The procedures live in `.claude/skills/`: `developing-components` (add or change a component, test first), `validating-components` (the check ladder and how to report it), `releasing-components` (tag, npm, update an app) and `auditing-components` (find gaps the guard tests miss). `consumers.md` holds the rules for changes that apps depend on.

## Adding a component
1. Folder + `.vue` + `variants.ts` + `index.ts` + barrel line (`components.md`).
2. Enforce what is required (`contracts.md`), accessible by construction (`accessibility.md`), tokens only, no slop (`slop.md`).
3. Docs file with props, examples per variation, `a11y`, `requires`, `llmNotes` (`docs-and-llm.md`).
4. Tests: good, bad, edge, variations, contracts (`testing.md`).
5. `pnpm generate:llms`.
6. Run the checks below.

## Adding a variation to an existing component
Add a value or dimension with the standard prop names; keep default output unchanged; document it with an example; test every value; the variation matrix and contrast tests must stay green.

## Definition of done (run these, report what you could not run)
From `packages/ui`: `./node_modules/.bin/vitest run <your folders> src/__tests__` (all guard tests), then the full suite with `pnpm test:coverage` (from the repo root) when your change is broad, and `pnpm exec vue-tsc --noEmit`. From the repo root: `pnpm generate:llms`, `pnpm --filter docs test`, `pnpm --filter docs build`, then `node scripts/a11y-sweep.mjs` and `node scripts/state-check.mjs` against a served build (or `pnpm test:browser`), and `node scripts/lighthouse.mjs` for docs changes. Also `npx modern-web-guidance@latest legacy-scan packages/ui/src` (0 findings).
Report honestly: tests run and counts, coverage, anything skipped, and what a real browser or device check did not cover (screen readers, Safari/Firefox, real phones are not covered by the automated checks).

## Hygiene
- Delete scratch scripts and temp servers you start (`/tmp` logs are fine); do not leave `_probe*.mjs` files in `scripts/`.
- No commits, pushes or deploys unless asked. Public hosting needs the user's approval.
- Keep `AGENTS.md` and these rules in sync when a principle changes; the tests enforce the principles, the rules explain them.
