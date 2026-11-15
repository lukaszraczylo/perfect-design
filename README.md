# Perfect Design

One design system and one universal Vue 3 component library for every website and web UI we build.
Stack: **Vue 3.5 · Vite · TypeScript · Pinia · Tailwind CSS 4 · FontAwesome icons · Vitest**. Library runtime dependencies: **reka-ui + tailwind-merge only** (pinia optional).

```
packages/ui     @perfect-design/ui: tokens (theme.css + 5 accent presets), components, Pinia stores, tests
docs            documentation website (Vite + Vue): foundations, guides, every component with live examples
scripts         generate-llms.ts → llms.txt, llms-full.txt, components.manifest.json
AGENTS.md       the contract for humans and LLMs
DESIGN.md       the design direction: colour, type, radius, content rules
LLMSlop.md      patterns that mark UI as LLM-generated, and what to do instead (guarded by slop.test.ts)
```

## Commands (pnpm)
| | |
|---|---|
| `pnpm install` | install workspace |
| `pnpm dev` | docs site with live examples |
| `pnpm test` / `pnpm test:coverage` | unit tests / with enforced thresholds |
| `pnpm typecheck` | vue-tsc for library and docs |
| `pnpm generate:llms` | regenerate the LLM artefacts |
| `pnpm build` | typecheck → generate LLM files → build docs to `docs/dist` |

## Origin
Patterns were extracted from a set of existing Vue admin consoles and product sites. Token names match shadcn/ui so those apps migrate by swapping imports (see the *Migrating* guide on the site).

Read [`AGENTS.md`](./AGENTS.md), [`DESIGN.md`](./DESIGN.md) and [`LLMSlop.md`](./LLMSlop.md) before adding or using components.
