# Accessibility and responsiveness (WCAG 2.2 AA, Chrome Modern Web Guidance)

The standard for every component and every docs page. The guides used are in `reports/guidance/*.md` (accessibility, dialog, menu, tabs, forms, carousel, responsive-table, navbar, motion, and others); read the relevant one before building a widget.

## Rules
- **Native first.** Use the native element when one exists (`button`, `dialog` semantics through reka, `details`, `input`); add ARIA only for what HTML cannot express, and only valid roles/states. No redundant roles.
- **Accessible name for every control and region:** visible text, `aria-label`, `aria-labelledby` or a `Field` label. Visible text must be contained in the name (WCAG 2.5.3). Icon-only controls always need a name. `placeholder` and `title` are not names.
- **Keyboard:** everything operable with Tab/Shift+Tab/arrows/Home/End/Enter/Space/Esc as its pattern requires; no traps; focus moves into overlays, is trapped, and returns on close. Scrollable regions are focusable (`tabindex="0"`, `role="region"`, named).
- **Focus visible:** use `focusRing` from `lib/styles` (`outline-hidden` + ring). The indicator must also survive forced-colors mode (add `forced-colors:` outline/border where background or shadow carries state).
- **Target size:** at least 24x24 CSS px; primary controls grow to 44px on coarse pointers (`pointer-coarse:`). Form text is 16px below `md` (`text-md md:text-base`) to avoid iOS zoom.
- **Colour:** never the only signal (status needs text or an icon). Use only token pairs covered by `src/__tests__/contrast.test.ts` (text 4.5:1, tinted status text 4.7:1, control borders and focus ring 3:1). Dark and light and every accent preset must pass.
- **Motion:** respect `prefers-reduced-motion` (`motion-safe:` / `motion-reduce:`); anything that moves on its own needs a pause control (WCAG 2.2.2).
- **Status messages:** one polite `role="status"` region per widget that announces changes; `role="alert"` only for errors that need interruption. Do not nest live regions.
- **Responsive:** mobile first; no horizontal page scroll at 320px; wide data (tables, code) scrolls inside a focusable, named region; use `min-w-0`, wrapping, container/viewport breakpoints; logical properties for RTL.
- **Headings and landmarks:** one `h1` per page, no skipped levels, unique landmark names. Heading levels are configurable props on components that render headings.
- **Images:** informative images need `alt`; an explicitly empty `alt` marks decoration. No remote image URLs in docs examples (use inline SVG data URIs).

## How it is checked (run before calling UI work done)
| What | Command |
|---|---|
| axe rules that need no layout, on all docs examples | `./node_modules/.bin/vitest run src/__tests__/axe.test.ts` (in `packages/ui`) |
| Real-browser axe WCAG 2.2 AA + overflow at 320/768/1280, light and dark | `node scripts/a11y-sweep.mjs <url> [--match /components/forms/ \| --routes /,/guides/llm] [--style <pack>]`; run it once per style pack (`--style workbench` ...) when a component's spacing, borders or type change |
| Controls toggle, state is visible, focus is visible | `node scripts/state-check.mjs <url> [--match ...]` |
| Lighthouse, all five categories (mobile and desktop) | `node scripts/lighthouse.mjs <url> [paths...]` |
| Chrome guidance legacy scan (must report 0 findings) | `npx modern-web-guidance@latest legacy-scan packages/ui/src` and `... docs/src` |
| Everything in a real browser against the built site | `pnpm --filter docs build && pnpm test:browser` |
Serve the built docs with `pnpm --filter docs preview` (a static server that behaves like a real host). The sweeps use `?eager` so every live demo is mounted. Give each parallel worker its own browser context (shared localStorage makes light and dark runs overwrite each other).
