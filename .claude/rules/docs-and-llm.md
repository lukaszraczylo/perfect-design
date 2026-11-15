---
paths:
  - "**/*.docs.ts"
  - "docs/**"
  - "scripts/generate-llms.ts"
  - "AGENTS.md"
  - "llms*.txt"
---

# Documentation site and LLM files

## Component docs (`<Name>.docs.ts`, default export `ComponentDoc` from `src/docs-types.ts`)
- `name`, `group` (equals the folder), `subgroup`, `summary` (one sentence), `description` (when to use / not use; Markdown allowed), `props` (complete and accurate: `docs-contract.test.ts` compares with the runtime props), `slots`, `emits`, `parts` (compound sub-components), `a11y` (real keyboard map, roles, responsive behaviour), `requires` (enforced requirements, one sentence each), `llmNotes` (terse imperative rules), `related`, `replaces`.
- **At least two examples**: a minimal one and a realistic one, plus one per variation. An example is a Vue template string (no `<template>` wrapper) mounted with every library component registered; use `state()` (and a display-only `script`) for reactive demos. Examples must mount warning-free, pass axe, satisfy the strict-mode contracts, and use only generic sample content, real routes (never `href="#"`), no remote images, and the right heading levels for a page that already has an `h1`/`h2`/`h3`.
- Copy follows `slop.md`. Apostrophes inside single-quoted strings must be escaped (a bad quote has broken generation before).
- After adding or renaming a docs file run `pnpm generate:llms`: it rewrites `llms.txt` (H1 + a Markdown link for every component), `llms-full.txt`, `components.manifest.json`, `docs/src/generated/nav.json` (the lean index the site loads) and `docs/public/.well-known/ard.json`/`ai-catalog.json`. `docs/src/lib/registry.test.ts` fails if `nav.json` is stale.

## Agent discovery (Lighthouse "Agentic Browsing")
`llms.txt` must have an H1, links and real length; the ARD manifest must pass Lighthouse's own conformance tester with no warnings (entries use inline `data`, `application/vnd.*` types). `docs/src/agentic.test.ts` runs that validator. The `docs` Vite config serves `/.well-known/*` in dev and preview (Vite skips dot-folders).

## The docs site (`docs/`)
- It is **server-rendered at build time and hydrated**: `vite build`, then `vite build --ssr src/entry-server.ts`, then `docs/scripts/prerender.mjs` writes `dist/<route>/index.html`. The first client render must equal the server render: no `window`/`document`/storage reads in setup or render, visitor-specific state (saved theme) applies after mount (`onMounted`), the router guard preloads a component's docs before the page renders.
- **Performance budget (Lighthouse 100 on mobile and desktop):** the shell stylesheet (`src/style.css`) contains only what the chrome needs; library utilities for live demos come from `src/demo.css`, loaded with the lazy `ExampleLive` chunk (template compiler + whole library). Demos load on first input or a few seconds after load, never at startup. Fonts are latin subsets only. Keep new shell dependencies out of the first paint.
- Code samples shown in guides live in `docs/src/lib/snippets.ts`, never inside SFC strings (`</script>` breaks the parser).
- Tailwind only emits literal class names: no `` `animate-${x}` `` in docs pages either (the motion page broke this way).
- Every route sets a unique title and description (`pageMeta` in `router/index.ts`) and moves focus to `<main>` on client navigation.
- Run the docs: `pnpm dev` (dev server; restart it after editing files under `packages/ui`, its watcher does not always pick them up), `pnpm --filter docs build`, `pnpm --filter docs preview`, `pnpm --filter docs test`.
