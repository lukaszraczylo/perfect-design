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

## Font families
`styles/fonts.css` (`default`, `system`, `humanist`, `geometric`, `grotesque`, `rounded`, `serif`, `slab`, `mono`) is a font axis separate from packs and accents, selected by `data-font` on `<html>` (`useThemeStore().setFont()`, `FontPicker`) or on a region. `THEME_FONTS` in `stores/theme.ts` is the list. Rules, enforced by `src/__tests__/fonts.test.ts`: platform stacks only (no `@font-face`, `url()`, `@import`); each rule sets exactly `font-family`, `--font-sans` and `--font-display`; every stack ends in a generic family; `default` mirrors `theme.css`. A new family needs the rule, an entry in `THEME_FONTS`, a `FontPicker` name, a `DESIGN.md` section 9 row. `fonts.css` is imported after `packs.css` so an explicit font choice wins over a pack's font.

## Corner shapes
`styles/corners.css` (`round`, `squircle`) is a corner axis separate from packs and fonts, selected by `data-corner` on `<html>` (`useThemeStore().setCorner()`, `CornerPicker`) or on a region. `THEME_CORNERS` in `stores/theme.ts` is the list. `squircle` sets `corner-shape: squircle` on the scope and every descendant (inherited `--corner-shape`, applied by one `:where()` rule) and `--radius-scale: 1.5`; the derived radius tokens in `theme.css` multiply `--radius` by `--radius-scale` (default 1), so the scale reaches every `rounded-*` utility and composes with every pack. Rules, enforced by `src/__tests__/corners.test.ts`: every rule inside `@supports (corner-shape: squircle)` (no support keeps plain corners); selectors scoped to `[data-corner]`; only `corner-shape`, `--corner-shape` and `--radius-scale`; no `clip-path` or `mask`, colour, blur or transition; every `rounded-*-full` form used by the components is reset to `round`, and `rounded-[inherit]` inherits. Never write a radius that bypasses the `rounded-*` tokens. A new shape needs the rule, an entry in `THEME_CORNERS`, a `CornerPicker` name and a `DESIGN.md` section 12 row.

## Glass surface
`styles/surfaces.css` (`solid`, `glass`) is a surface axis selected by `data-surface` on `<html>` (`useThemeStore().setSurface()`, `SurfacePicker`) or on a region. `THEME_SURFACES` in `stores/theme.ts` is the list. It is the one allowed exception to the no-glass rule (S4, DESIGN.md sections 7 and 13): floating layers only (menus, listboxes, popovers, hover cards, tooltips, dialogs, sheets, toasts, the navigation viewport, the mobile menu, sticky headers), targeted by `data-slot`, never content cards. Fill and border are `color-mix()` of semantic tokens at `--glass-alpha`; `backdrop-filter` (with `-webkit-`) is `blur(var(--glass-blur)) saturate(1.5)`. Rules, enforced by `src/__tests__/surfaces.test.ts`: everything inside `@supports (backdrop-filter ...)`; painting rules start with `[data-surface="glass"]`; no colour literal, shadow or motion; `prefers-reduced-transparency`, forced colours and the `contrast` pack return solid; the shipped alpha is the lowest at which surface text keeps 4.5:1 over pure black and pure white in every theme, palette and mode (a token change that breaks it fails the suite; raise the alpha, never loosen the gate). `slop.test.ts` allows `backdrop-filter` in this one file. A new target needs its `data-slot` in the right tone group and a legibility check; a new surface needs the rule, a `THEME_SURFACES` entry, a `SurfacePicker` name and a `DESIGN.md` section 13 row.

## Palettes and code themes
`styles/palettes/*.css` (`graphite`, `saffron`, `glacier`, `nocturne`, `harbor`) recolour every semantic token from a VS Code theme, with a light block and a `.dark` block, applied with `data-palette` (`useThemeStore().setPalette()`, `PalettePicker`). They are generated by `scripts/gen-palettes.mjs`; never edit them by hand. `contrast.test.ts` runs every palette through the same gates as the core theme, so a regenerated palette that fails a pair fails the suite. A palette and an accent preset are exclusive in the store. `styles/code-themes.css` (`data-code-theme`, `CodeThemePicker`) recolours code surfaces only and overrides the palette's code colours. Import order: `theme.css`, `themes/*.css`, `palettes.css`, `packs.css`, `code-themes.css`, `fonts.css`, `corners.css`, `surfaces.css`. See DESIGN.md sections 9 and 11.
