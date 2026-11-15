---
paths:
  - "packages/ui/**/*.test.ts"
  - "packages/ui/src/__tests__/**"
  - "docs/**/*.test.ts"
  - "scripts/**"
---

# Testing: complete, including the ugly cases

Vitest + `@vue/test-utils` + jsdom in `packages/ui` (run from that folder: `./node_modules/.bin/vitest run <path>`). Coverage thresholds are enforced at 95% statements, 90% branches, 95% functions, 95% lines (`pnpm test:coverage`); the library currently sits near 99%. Do not lower a threshold to pass.

## What every component's tests cover
- **Good path:** renders, every variant and size, v-model, emits, slots, `as`/`asChild`.
- **Customisation:** `class` merges and wins, attributes fall through, `data-slot` present.
- **Bad path:** invalid or unknown props fall back, disabled/readonly/loading block interaction, empty or null input, rejected values, missing required parts (contract tests).
- **Edge cases:** empty slots, long/unicode/RTL text, boundary numbers, rapid interaction, unmount cleanup of timers/listeners/observers, 0/1/many items.
- **Variations:** the exact expected output per value, default output unchanged, unknown value falls back, two dimensions together.

## Guards that run for every component (do not delete or weaken)
`src/__tests__/`: `structure` (folder complete; every docs example mounts warning-free), `docs-contract` (documented props equal runtime props), `axe` (layout-free axe rules on every docs example), `strict-examples` (examples satisfy the enforced contracts), `requires-tested` (every documented requirement has a strict-mode test), `variants-matrix` (every documented variant value changes the output; `KNOWN_NOOP` is a ratchet, remove entries when fixed), `css-validity` (every rendered class generates CSS in Tailwind), `contract` (`class` reaches the DOM and `data-slot` exists), `contrast` (WCAG contrast for every theme and preset), `dependencies`, `slop`. `docs/src`: registry, router titles, example runner, agent discovery files (`agentic.test.ts`).

## Browser tests (jsdom cannot see stylesheets, layout or real pointers)
`pnpm --filter docs build && pnpm test:browser` runs `scripts/browser-tests.mjs` (local only, not in CI): self tests (the state check must FAIL on a deliberately broken page), `scripts/browser/behaviour.mjs`, the axe + overflow sweep (report written to a temp file via `a11y-sweep.mjs --out`; pass `--out` yourself so concurrent runs do not share `reports/a11y-sweep.json`), and the state check. `--only behaviour|sweep|state` runs one stage; `PORT` and `DIST` choose the port and the served folder (relative to `docs/`).
- **Behaviour tests** (`scripts/browser/behaviour.mjs`, helpers in `scripts/browser/lib.mjs`, puppeteer-core with Google Chrome, no new dependency) cover what jsdom cannot: Tooltip hover/focus/leave/Escape; Popover, HoverCard and DropdownMenu collision at 320 and 1280px near all four corners and edges; Accordion, FAQ and Tabs focus order, arrow roving and focus ring; Dialog focus trap, Escape and focus return; Sheet and Select scroll lock; Slider and ResizablePanels pointer, keyboard and RTL; Combobox typeahead and listbox keys; Toast dismiss, Escape and focus return; ThemeToggle, StylePicker and AccentPicker attributes on `<html>` plus persistence across reload; Button targets in every style pack.
- **Every behaviour test needs a `sabotage`** (a deliberate break, for example swallowing Escape or unlocking `body` scroll). The runner repeats the test on the sabotaged page and fails with `SELF-CHECK FAILED` if it still passes. Tests of one `group` share one self-check.
- Failures print route, test, the selector under check and the reason; the exit code is 1 on any failure. Each test runs in its own browser context (own localStorage), five at a time, and a hung step is cut off after 40 seconds.
- Pitfalls found while writing them: headless pages need focus emulation (`lib.mjs` enables it) or focus events never fire; `scroll-behavior: smooth` makes positions read after `focus()` or `scrollIntoView` unreliable (the helper turns it off); Reka closes a Tooltip on any scroll that contains its trigger, so scroll the trigger into view before focusing it; buttons have `transition-all`, so read sizes only after styles settle; wheel over the page content, not over the docs sidebar, which scrolls on its own.
A control that toggles in jsdom can still render identically in one theme (the dark-mode checkbox bug) or have half its hit area covered by a sibling (the resizable handle); only the browser run proves it.

## Practical notes
- `wrapper.setValue()` on a component root EMITS `update:modelValue` directly; use `wrapper.find('input').setValue()` to exercise the DOM.
- Portalled content: `mount(..., { attachTo: document.body })`, query `document.body`, clean up in `afterEach`.
- Contract tests: turn strict mode on, capture errors with `onErrorCaptured`, `await settle()` before asserting (see `contracts.md`).
- Vitest turns CSS imports into empty strings even with `?raw`; read CSS from disk with `readFileSync` and `process.cwd()` (tests run from `packages/ui`).
- Use `vi.useFakeTimers()` for timing; `vi.waitFor` for lazy chunks. Mock `IntersectionObserver`/`matchMedia`/`ResizeObserver` (already stubbed in `vitest.setup.ts`).
- Performance smoke tests use generous bounds so parallel workers and coverage instrumentation do not flake them.
- Machine load: parallel agents slow the suite; a timing-only failure that passes alone is a flake to widen, not to ignore silently.
