---
paths:
  - "packages/ui/src/styles/**"
  - "scripts/tune-tokens.mjs"
  - "DESIGN.md"
---

# Tokens, themes and typography

`packages/ui/src/styles/theme.css` is the single source of truth: shadcn-compatible token names (`--background`, `--primary`, ...), plus `--success`, `--warning`, `--info`, `--destructive`, `--scrim`, `--chart-1..5`, `--sidebar-*`. Dark mode is `class="dark"` on `<html>`; accent presets are `:root[data-theme="<name>"]` files in `styles/themes/`.

## Changing a colour
1. Decide in `DESIGN.md` first (named colours and roles). Do not pick colours inside a component.
2. Edit the token in `theme.css` (or a preset), then run `node scripts/tune-tokens.mjs` (add `--write` to apply). It nudges lightness to the nearest value that passes WCAG in every theme, including a safety margin for tinted status text (Tailwind blends tints in oklab, the test in sRGB).
3. Run `./node_modules/.bin/vitest run src/__tests__/contrast.test.ts src/__tests__/slop.test.ts` (in `packages/ui`). Every theme x mode x token pair must pass: text 4.5:1, tinted status text 4.7:1, control border and focus ring 3:1.
4. Update `AccentPicker` swatch values if a preset colour changed.

## Presets
Default is petrol. `indigo` (existing apps), `violet` (brand), `cyan`, `emerald`, `amber`, `rose` and `lime` (example brand) are brand overrides, not options to try out. `THEME_ACCENTS` in `stores/theme.ts` is the list; tests read it instead of hard-coding names. Adding a preset needs a `DESIGN.md` section 7 row if it trips `slop.test.ts`.

## Style packs
`styles/packs/<name>.css` (`quiet`, `workbench`, `tactile`, `editorial`, `raw`, `contrast`, `terminal`) restyle the system through tokens only, selected by `data-style` on `<html>` (`useThemeStore().setStyle()`, `StylePicker`) or on a region (`StyleScope`). `THEME_STYLES` in `stores/theme.ts` is the list. Rules, enforced by `src/__tests__/packs.test.ts`: every rule scoped to its own `[data-style]`; tokens that exist in `theme.css` plus `--spacing` only; no gradient, blur, glow or hard-coded colour; transform/transition only inside `prefers-reduced-motion: no-preference`; radius <= 12px; dense packs restore `--spacing: 0.25rem` under `(pointer: coarse)`; the `contrast` pack keeps text pairs at 7:1 and borders at 4.5:1 in light and dark; `quiet.css` mirrors the `theme.css` values. A custom property set on a scope does not change the inherited `font-family`, so a pack that changes `--font-sans` also sets `font-family` on its scope. A new pack needs the CSS file, an entry in `packs.css`, `THEME_STYLES`, `StylePicker` names, a `DESIGN.md` section 8 row (brief, what changes, guard rails), a `StyleScope` docs example and a docs `Style packs` page entry. Audit a pack site-wide with `node scripts/a11y-sweep.mjs <url> --style <pack>`.

## Typography and scale
IBM Plex Sans (one family, real weight/size contrast) and IBM Plex Mono for code and data only; the library ships no font files (apps and docs load them; docs use latin subsets). `text-base` is 14px (dense UI), `text-md` is 16px (prose and mobile form text). Numbers in tables, KPIs and stats use `tabular-nums`. Radius by role: `rounded-md` controls, `rounded-lg` cards/popovers, `rounded-xl` dialogs/sheets only. Shadows only on popovers, menus and dialogs. No gradients, glass or coloured shadows.

## Animations and shared CSS
Keyframes and `--animate-ds-*` live in `theme.css`; component-owned rules that utilities cannot express (Marquee, progress stripes) live there too, not in `<style>` blocks. Tailwind v4 reminders: `z-(--z-modal)`, literal class names only, `outline-hidden` for focus.
