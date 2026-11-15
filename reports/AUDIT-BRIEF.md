# Accessibility / responsiveness / modern-web audit brief (shared by all audit agents)

Repo: <repo root> (pnpm workspace; library packages/ui, docs site docs/). Run library commands from packages/ui with `pnpm exec ...`; never `npm`.
READ FIRST: AGENTS.md (conventions), packages/ui/src/docs-types.ts, packages/ui/src/lib/*, the group's report in reports/by-group/<group>.md, and the Chrome "Modern Web Guidance" guide files listed in your assignment under reports/guidance/*.md (read them fully — they are the standard we are held to).

## Hard rules (unchanged)
- Minimal dependencies: library source may import ONLY `vue`, `reka-ui`, `tailwind-merge`, `pinia`, relative paths. Use lib/cva, lib/cn, lib/use-helpers, lib/icons (see AGENTS.md). A repo test enforces this.
- Tokens only (no raw colours; the token pairs are WCAG-tested in src/__tests__/contrast.test.ts — do not edit theme/token CSS).
- Do NOT edit shared files: src/index.ts, src/lib/*, src/styles/*, src/stores/*, vite.config.ts, docs/src/** (except you may edit docs examples inside component `*.docs.ts` files), scripts/*. Other agents edit other groups concurrently. New helpers go in NEW files inside your own folders.
- Keep backward compatibility of props; add, don't break. Keep all existing tests green; update tests that pinned buggy behaviour and say so.

## Standard to meet (every component in your groups, not only those flagged)
WCAG 2.2 Level AA + the Chrome guidance: semantic HTML first; one correct role/name/state per widget; valid ARIA only (axe-clean); keyboard operable (Tab/Shift+Tab/Arrows/Home/End/Esc/Enter/Space as the pattern requires), visible focus (focusRing from lib/styles), no keyboard traps, focus management for overlays (move in, trap, restore); accessible names (visible text included in name — WCAG 2.5.3), descriptions via aria-describedby, errors announced (aria-invalid + described message / live region), status messages via role=status/alert; target size ≥ 24×24 CSS px (and `pointer-coarse:min-h-11`-style 44px on touch for primary controls); scrollable regions must be keyboard-focusable and labelled (tabindex=0 + role=region/aria-label); decorative icons aria-hidden; reduced motion respected (`motion-safe:`/`motion-reduce:`); works in forced-colors mode (do not rely on box-shadow/background alone for state — add border/outline fallbacks); colour never the only signal; text can be resized/zoomed to 200% and reflows at 320px width without horizontal scrolling of the page (no fixed px widths that overflow; use min-w-0, flex-wrap, responsive max-w, container/media queries; wide data (tables, code) scrolls inside a focusable labelled region); mobile-first responsive behaviour with sensible breakpoints; logical properties (ms-/me-/ps-/pe-/start-/end-) so RTL works; no remote/external URLs in docs examples (use inline SVG data URIs or generated gradients) — the sweep runs offline.

## Verify with the real sweep (this is the acceptance test)
1. Start your own dev server on YOUR assigned port from the docs folder (run in background, keep it running until you finish, then kill it):
   `cd docs && nohup pnpm exec vite --port <PORT> --strictPort > /tmp/audit-<PORT>.log 2>&1 &`
2. From the repo root run the sweep for your routes (it checks axe WCAG 2.0/2.1/2.2 A+AA + best-practice at 320/768/1280px × light/dark, with every live demo mounted via `?eager`, plus horizontal overflow and console errors):
   `node scripts/a11y-sweep.mjs http://localhost:<PORT> --match /components/<group>/`  (add --match for individual components while iterating, e.g. `--match /components/forms/rating`)
   Goal: ZERO violations, ZERO overflow, ZERO console errors/warnings, ZERO navigation errors for all your routes. The sweep exits 1 on any finding. Fix the cause in the component (preferred) or, when the problem is only the way a docs example is composed (e.g. nested `<main>` landmarks, heading jumps, duplicate unnamed landmarks), fix the example in the component's `*.docs.ts` (e.g. `as="div"`, labelled navs, correct heading levels).
3. In jsdom, add regression tests for every fix you make (role/name/aria/tabindex/target classes etc.) and keep coverage ≥95% for your folders. Also run: `pnpm exec vitest run src/components/<group> src/__tests__` and `pnpm exec vue-tsc --noEmit 2>&1 | grep components/<group>` (must be empty).
4. Update each component's docs `a11y` array so it states the real keyboard map, roles and responsive behaviour.
5. Beyond what the sweep can see, do a code review of EVERY component in your groups against the guidance files and the standard above (names, keyboard map, focus return, live regions, touch target sizes, forced-colors, reflow, reduced-motion) and fix what you find; list what you changed.

## Report back (concise, no file contents)
Per component: issues found → fixed. Sweep result for your routes (counts). Tests added, coverage. Anything you could not fix and why. Kill your dev server at the end.
