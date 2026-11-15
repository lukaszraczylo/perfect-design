# Perfect Design: what this repository is

A Vue 3 + TypeScript component library (`packages/ui`, published as `@perfect-design/ui`) and its documentation site (`docs/`). It replaces the per-project shadcn-style components in the owner's Vue apps. Read `AGENTS.md` (usage and contracts), `DESIGN.md` (the direction: colours, type, radius, content policy) and `LLMSlop.md` (patterns that make a UI look machine-made) before changing anything visual.

## Non-negotiables
- **Stack:** Vue 3.5 `<script setup lang="ts">`, Tailwind CSS v4, reka-ui (headless primitives), Pinia (optional), FontAwesome-shaped icon data, Vitest, pnpm workspaces. Use `pnpm`, never `npm`.
- **Dependency budget:** library source may import only `vue`, `reka-ui`, `tailwind-merge`, `pinia` and relative paths. Use the in-house helpers instead of other packages: `lib/cva` (variants), `lib/cn` (class merge), `lib/use-helpers` (debounce, clipboard, online, scroll), `lib/icons` (icon data), `lib/contract` (required parts). `src/__tests__/dependencies.test.ts` fails on anything else. Do not add a runtime dependency to make a task easier; ask first.
- **Tokens only.** No raw colours, no arbitrary pixel values, no `<style>` blocks in components (shared keyframes live in `styles/theme.css`). Semantic tokens: `bg-background text-foreground bg-primary text-primary-foreground border-border ring-ring`, plus `success`, `warning`, `info`, `destructive`, `muted`, `accent`, `sidebar-*`, `chart-1..5`.
- **One customisation contract** for every component (see `components.md`).
- **Everything is tested, documented and accessible** (see `testing.md`, `docs-and-llm.md`, `accessibility.md`). A component without tests, a docs file and a barrel export does not exist.
- **Do not commit, push or deploy** unless the user asks. Do not run git commands that change history in a shared working tree.

## Layout
```
packages/ui/src/components/<group>/<Name>/   <Name>.vue, variants.ts?, <Name>.test.ts, <Name>.docs.ts, index.ts
packages/ui/src/{lib,stores,styles,composables,__tests__}
docs/                                         Vite + Vue site, server-rendered at build time, hydrated in the browser
scripts/                                      generate-llms.ts, gen-icons.ts, tune-tokens.mjs, a11y-sweep.mjs, state-check.mjs, lighthouse.mjs, browser-tests.mjs
reports/                                      briefs used to brief audit agents (AUDIT, CONTRACT, VARIATIONS) and audit output
```
Groups: `primitives typography layout forms feedback overlays navigation data-display marketing`.

## Generated files: never edit by hand
`llms.txt`, `llms-full.txt`, `components.manifest.json`, `docs/public/*` copies of those, `docs/public/.well-known/ard.json` and `ai-catalog.json`, `docs/src/generated/nav.json`, `packages/ui/src/lib/icons.ts`. Regenerate with `pnpm generate:llms` (and `pnpm tsx scripts/gen-icons.ts` after adding an internal icon).
