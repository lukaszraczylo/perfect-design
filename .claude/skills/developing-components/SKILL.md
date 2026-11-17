---
name: developing-components
description: Adds a new Perfect Design component, or changes an existing one (a new prop, field, variant value, labels, a bug fix), test first and through to generated docs. Use when the task touches packages/ui/src/components/<group>/<Name>/, when an app needs behaviour a component lacks, or when a component breaks its own docs. Not for running the full check ladder (use validating-components), publishing (use releasing-components) or a library-wide review (use auditing-components).
---

# Developing components

The rules hold the standards: `components.md`, `contracts.md`, `accessibility.md`, `testing.md`, `docs-and-llm.md`, `slop.md`, `tokens-theming.md`, `consumers.md`. This skill is the order of work. Run commands from the repo root unless a step names `packages/ui`.

## 1. Understand the change
- Read the component folder: `<Name>.vue`, parts, `variants.ts`, `<Name>.docs.ts`, `<Name>.test.ts`, `index.ts`.
- For a bug, reproduce it first. Write down the cause in one sentence (for example "reka-ui removes `hidden` when `forceMount` is set").
- For an app request, state the smallest opt-in API that gives the app what it needs. Check if an existing pattern already covers it: `labels` + `useConfigLabels`, a variant value, an optional data field, a slot.
- Other agents can edit the repo at the same time. Re-read a file just before you edit it.

## 2. Write the failing test
- Add the test to `<Name>.test.ts` in the matching `describe` (good path, customisation, bad path, edge cases).
- Assert visible output: text, `data-slot`, `data-state`, attributes, emitted events. Do not assert private refs.
- For a new option, also test that the default output does not change, and that an empty or unknown value falls back.
- Run it and see it fail for the right reason:
  ```sh
  cd packages/ui && ./node_modules/.bin/vitest run src/components/<group>/<Name>/<Name>.test.ts
  ```

## 3. Implement
- New component: follow the folder contract in `components.md` and copy the shape of `primitives/Button`, `forms/Input` or `overlays/Dialog`. Add the group barrel line with a single `echo >>`.
- New text: use the labels pattern in `consumers.md` and add the keys to `ConfigLabelKey` and `ConfigProvider.docs.ts`.
- New required part: enforce it as `contracts.md` says, and add a strict-mode test.
- Export new public types from the folder `index.ts`.

## 4. Document
- `<Name>.docs.ts`: add the prop or field to `props` (the docs-contract test compares it with runtime props), add an example for each new variation, and add one `llmNotes` line that tells an LLM when to use the option.
- Update docs examples so they model the new correct usage.
- Regenerate the LLM files and the nav: `pnpm generate:llms`.

## 5. Check before you hand off
- `cd packages/ui && ./node_modules/.bin/vitest run src/components/<group>/<Name> src/__tests__` (component plus every guard).
- `cd packages/ui && pnpm exec vue-tsc --noEmit`.
- `pnpm --filter docs test`.
- Then use `validating-components` for the level of checks the change needs.

## 6. Commit
- Conventional subject: `feat(<kebab-name>): ...` for a new option, `fix(<kebab-name>): ...` for a bug.
- The body says what was wrong or missing, what changed, and that the default output is unchanged.
- The global pre-commit hook runs plain `tsc`, which cannot read `.vue` files. After `vue-tsc` passes, commit with `SKIP_TSC=1 git commit ...`.
- Commit or push only when the user asks for it.
