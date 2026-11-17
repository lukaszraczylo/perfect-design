# DESIGN.md

The direction this system is built from. `LLMSlop.md` section 2 requires it before any markup is written. A change to a colour, typeface or scale starts here.

## 1. Audience and job

Engineers building admin consoles, dashboards and small product sites for one owner. The system has one job: let a person or an LLM assemble a consistent, accessible screen from parts without inventing styling. Success means a new screen needs no custom CSS beyond layout.

## 2. Colour

Five named colours, one dominant and one sharp, used unevenly. Values are the light theme; dark theme counterparts are in `packages/ui/src/styles/theme.css`.

| Name | Token | Role | Light |
|---|---|---|---|
| Paper | `--background`, `--card` | Surfaces. Warm-tinted, never pure white or slate | `oklch(0.985 0.004 95)` |
| Ink | `--foreground` | Text and icons | `oklch(0.2 0.01 95)` |
| Petrol | `--primary` | The one accent: primary actions, links, focus | `oklch(0.46 0.09 205)` |
| Signal | `--warning` | Attention and caution only | `oklch(0.75 0.15 75)` |
| Brick | `--destructive` | Errors and irreversible actions | `oklch(0.5 0.17 28)` |

Status colours `--success` and `--info` exist for state, not decoration. Neutral steps (`--muted`, `--border`, `--input`) are tinted toward Paper.

Why petrol: the products are infrastructure tooling. A cool, dark, low-chroma blue-green reads as calm and does not collide with the state colours, which stay green, blue, amber and brick.

Accent presets are brand overrides, not options to try out:

- `indigo` keeps existing apps that use the shadcn indigo visually unchanged while they migrate.
- `lime` is an example of a brand with an ink and acid-lime palette.
- `violet` is for products whose own brand colour is violet. `cyan` is a sky-blue option, distinct from the petrol default by hue and chroma. Both are opt-in, never the default.
- `emerald`, `amber`, `rose` are for products that already have that brand colour.

No gradients, glows or coloured shadows. Contrast is enforced by `packages/ui/src/__tests__/contrast.test.ts` for every theme.

## 3. Type

- **IBM Plex Sans** (400, 500, 600) for interface and prose. One family, real scale and weight contrast: headings 600 and tight, body 400.
- **IBM Plex Mono** for code, identifiers and data only.
- Scale: 11, 12, 13, 14 (default UI), 16 (prose), 18, 20, 24, 30, 36, 48, 60 px. Each heading level steps at least one size.
- Numbers in tables, KPIs and stats use `tabular-nums`.
- Sentence case everywhere. No tracked all-caps labels, no decorative mono strings, no numbered markers on things that are not a sequence.
- Fallback stack: `ui-sans-serif, system-ui` and `ui-monospace`. The library ships no font files; applications load Plex (the docs site does, via `@fontsource`).

## 4. Radius, spacing, elevation

| Scale step | Use |
|---|---|
| `rounded-md` (6px) | Controls: buttons, inputs, badges, menu items |
| `rounded-lg` (8px) | Cards, panels, popovers |
| `rounded-xl` (12px) | Dialogs and sheets only |
| `rounded-full` | Avatars, status dots, switches |

`rounded-2xl` and above are not used. Spacing is the 4px grid. Elevation: cards use a border and no shadow; popovers, menus and dialogs use `shadow-md` or `shadow-lg`; nothing else casts a shadow. No glass or backdrop blur, no stripes on card edges.

## 5. The characteristic element

For a component library this is the specimen: the real component, rendered live, next to the code and the rules that govern it. The docs site leads with the token specimen and the catalogue, not a marketing hero.

## 6. Real content

Allowed on pages and in examples:

- Numbers that can be produced from this repository: component counts, test counts, token names and values.
- Obviously generic sample content in examples, labelled as sample ("Sample plan", "Customer name"). No invented people, quotes, ratings, uptime figures or logos. When an example needs a company name, use an obviously made-up one that is not a real business (for example Kestrel Freight, Orchard Mill, Brightwater Co) and never present it as a customer or an endorsement.
- Labelled sample rates in pricing examples (PlanPicker, RateCard, TieredPricing, UsageEstimator), so the arithmetic can be shown. Use round numbers in an obviously sample currency context, mark them as sample in the visible text ("Sample rate", "Sample plan A"), and never present them as a real offer.

Everything else does not appear. Missing content is marked `TODO(content)` in the hand-off, never filled with plausible text.

## 7. Deliberate exceptions

Each row trips a pattern in `LLMSlop.md` on purpose. `packages/ui/src/__tests__/slop.test.ts` allow-lists exactly these paths; a new exception needs a row here and an entry there.

| Pattern | Where | Reason |
|---|---|---|
| C1 indigo | `styles/themes/indigo.css` | Existing apps use it as their brand. The preset keeps them visually unchanged while they migrate. It is not the default. |
| C1 violet | `styles/themes/violet.css` | An opt-in preset for products whose own brand is violet. Not the default, not shown as a recommendation; contrast is covered like every preset. |
| N2 dark signal | `styles/themes/lime.css` | An example dark-signal brand (ink and acid lime). Brand presets are for products that already have that brand colour. |
| T4 eyebrow | `Eyebrow` | Available, defaults to a plain small label, documented as "only when it adds information the heading lacks". |
| T5 all caps | `typography/Text` `transform="uppercase"` | An explicit per-use option for short codes and units. Never a default; docs discourage it for headings and labels. |
| M1 fade | `SectionReveal`; `overlays/`, `navigation/`, `feedback/` | Reveal is opt-in and off by default. Overlay, drawer, menu and toast animations mark a state change (open, close, enter, leave), which is what motion is for. |
| H6 hard-coded colour | `forms/ColorPicker` (swatch values), `navigation/AccentPicker` (preset preview swatches), `data-display/_chart` | These components display colour as data, so the value cannot come from a semantic token. |
| T1 platform fonts | `styles/fonts.css` (`system`, and Roboto or Arial as late fallbacks) | Opt-in families are platform stacks so no font file ships. They are never the default, and Inter, Space Grotesk, Geist and Instrument Serif never appear (`slop.test.ts`). |
| H6 hard-coded colour | `styles/code-themes.css` | Each code theme reproduces a published editor palette, so its colours are data. The file is generated, opt-in, and scoped to code surfaces. |
| C2 gradient | `marketing/Marquee` | A `mask-image` fade on the edges hides overflowing items. It is not a visible gradient. |
| N1, N3 editorial | `styles/packs/editorial.css` | Serif display face, square corners and hairlines are the pack's brief: reading-first content (docs, publications). Cool white background, no cream, no clay accent. Never the default. |
| N4 faux-brutalist | `styles/packs/raw.css` | Square corners, ink borders and hard offset shadows, only for products whose brief is a blunt, poster-like tool. It is selected on purpose with `look="raw"` or `data-style="raw"`, never applied as a fallback. |
| M2 press | `styles/packs/tactile.css` | The one-pixel sink on `:active` is feedback for a press, applies only under `prefers-reduced-motion: no-preference`, and there is no hover lift or scale. |

Privacy blur (`blurred` on Avatar, AvatarGroup, TeamGrid, MediaFrame, ImageGrid, Lightbox, BeforeAfter; `ConfigProvider blurMedia` for a region) is a state, not decoration: an opt-in CSS filter blur on the media element only, clipped by its container, with a transition only under `motion-safe:`. It is not `backdrop-blur` (S4) and not a glow (C4), so it needs no exception row. Use it for screen sharing, demos and sensitive uploads.

## 8. Style packs

The core look (`quiet`) is a decision for most products. Some briefs need a different, equally deliberate look. A style pack restyles the whole system by overriding tokens only (`--spacing`, `--radius`, `--shadow-*`, `--text-*`, `--font-*`, `--border`, `--input`, foreground tokens), plus a few rules on the stable `data-slot` hooks. No component changes its markup. Apply a pack on `<html>` (`useThemeStore().setStyle()`, `StylePicker`) or on a region (`StyleScope`). Packs are 2026 looks chosen from a brief, not trends layered on top: each has an audience and a reason.

| Pack | Brief it answers | What changes | Guard rails |
|---|---|---|---|
| `quiet` | Most products. The default. | Nothing; the file only lets a nested scope restore the core. | |
| `workbench` | Tools used all day: consoles, admin, dashboards. Information density beats air. | `--spacing` 0.2rem (20% tighter), 13px base text, 4px radius, tabular figures, hairline depth. | Coarse pointers get normal spacing back so touch targets stay 44px; buttons, icon buttons and toggles never fall below 24px. |
| `tactile` | Consumer and prosumer products where touch and feel matter. | 10px radius, raised surfaces: inset top highlight plus a contact shadow; buttons sink 1px when pressed. | No gradient, blur or glow; press motion only under `no-preference`; radius stays below the 2xl limit. |
| `editorial` | Reading: documentation, publications, long-form. | Platform serif for headings and prose, 2px radius, hairline rules instead of shadows, 17px prose at 1.7. | Platform fonts only (no file shipped); cool white, never cream. |
| `raw` | Products whose brief is blunt and utilitarian. | 0 radius, ink borders, 2px structural borders, hard offset shadows without blur. | Chosen deliberately, never as an escape from another look. |
| `contrast` | Low vision, glare, public services, field tools. | Text pairs at 7:1 or better, borders at 4.5:1, 3px focus outline, 15px base text. | `packs.test.ts` verifies the 7:1 and 4.5:1 ratios in light and dark. |
| `terminal` | Developer tools. | Mono interface font, dense spacing, 3px radius, hairline depth. | Normal spacing on coarse pointers; same 24px floor for buttons, icon buttons and toggles. |

Rules for packs: tokens and `data-slot` selectors only; no gradient, blur, glow or glass; no hard-coded hex or rgb (the single translucent white highlight in `tactile` is an `oklch()` with alpha); motion only under `prefers-reduced-motion: no-preference`; every pack works in light and dark and in every accent. `packs.test.ts` enforces these and requires every pack to be documented here. A new pack needs a row in this table, a docs example in `StyleScope`, and the CSS file.

## 9. Code themes

Code is the one place where developers expect editor colours, so code surfaces have their own, opt-in palette axis. Import `@perfect-design/ui/code-themes.css` after `theme.css` and set `data-code-theme` on `<html>`, on a region or on a CodeViewer or CodeBlock. The rest of the interface keeps the semantic tokens: a theme recolours the code surface, its tokens, its line numbers and the labels and focus ring inside it, nothing else.

The themes adapt the most-installed colour themes on the VS Code Marketplace (queried 2026-11-16; icon packs, the deprecated Material Theme and the paid Monokai Pro excluded). All sources are MIT licensed. `node scripts/gen-code-themes.mjs` reads the published extension files, so a refresh is one command.

| Name | Mode | Adapted from | Colours moved to reach 4.5:1 |
|---|---|---|---|
| `midnight` | dark | GitHub Dark Default | line numbers |
| `dusk` | dark | One Dark Pro | line numbers, comments, keys, tags, anchors |
| `orchid` | dark | Dracula | line numbers, comments |
| `ember` | dark | Ayu Dark | line numbers, comments |
| `fjord` | dark | Winter is Coming (Dark Blue) | none |
| `daylight` | light | GitHub Light Default | line numbers, comments |
| `citrus` | light | Ayu Light | nearly all: the original is pastel |
| `frost` | light | Winter is Coming (Light) | line numbers, keywords, keys, anchors |
| `dawn` | light | Night Owl Light | line numbers and most token colours |
| `mist` | light | Tokyo Night Light | line numbers, comments |

Rules for code themes: names are neutral (the credit lives here and in the generated CSS header, never in the attribute value); every text colour is at least 4.5:1 on its surface, enforced by `src/__tests__/code-themes.test.ts`; colours that fail move in OKLCH lightness only, so hue and chroma stay recognisable; the file loads nothing and ships no font. A dark code theme in a light page is allowed: the surface redefines its own tokens.

## 10. Font families

The font family is its own axis, separate from the style pack, the accent and the colour mode. Select it on `<html>` (`useThemeStore().setFont()`, `FontPicker`) or on a region with `data-font`; import `@perfect-design/ui/fonts.css` after `theme.css` and the packs so an explicit choice wins over the font a pack sets. Every family is a platform font stack: no font file ships, switching needs no network, and an app that wants a loaded web font overrides `--font-sans` in its own `[data-font]` rule. A family sets `font-family`, `--font-sans` and `--font-display` and nothing else.

| Family | Brief it answers | Stack starts with | Guard rails |
|---|---|---|---|
| `default` | The core look. | IBM Plex Sans (the app loads the file), then the system sans. | The attribute is removed on `<html>`; the rule exists so a nested scope or picker option can restore it. |
| `system` | Native feel, zero font cost. | `system-ui`. | |
| `humanist` | Warm, readable interfaces and long text. | Seravek, Gill Sans Nova, Calibri. | |
| `geometric` | Marketing and brand-forward screens. | Avenir, Montserrat, Corbel. | |
| `grotesque` | Neutral, product-style UI. | Helvetica Neue, Helvetica, Nimbus Sans. | Inter is never used: it is the most common machine-made default (LLMSlop T1). |
| `rounded` | Friendly, consumer, approachable tone. | `ui-rounded`, Hiragino Maru Gothic, Quicksand. | |
| `serif` | Reading and editorial tone. | Iowan Old Style, Palatino Linotype. | |
| `slab` | Distinct headings and print-like character. | Rockwell, Roboto Slab. | |
| `mono` | Developer tools and data-heavy screens. | `ui-monospace`, Cascadia Code, Menlo. | |

Rules for families: platform stacks only (no `@font-face`, `url()` or `@import` in `fonts.css`); every stack ends in a generic family; no colour, effect or other property; `default` mirrors the `theme.css` stack. `src/__tests__/fonts.test.ts` enforces these and requires every family to be documented here. A new family needs a rule in `fonts.css`, an entry in `THEME_FONTS` and `FontPicker` names, and a row in this table.

## 11. Palettes

A palette recolours the whole interface (surfaces, text, primary actions, status colours, borders, focus ring, charts and code) from one of the most-installed VS Code themes. It is a setting of its own: import `@perfect-design/ui/palettes.css` after the accent presets and before `packs.css`, and set `data-palette` on `<html>` (`useThemeStore().setPalette()`, `PalettePicker`). Each palette has a light and a dark variant and follows the colour mode, so it works with `ThemeToggle` unchanged. A palette replaces the accent preset: choosing one resets the other. Style packs still apply on top, so `contrast` keeps its 7:1 text.

The families are the five most-installed colour themes on the VS Code Marketplace that ship both a light and a dark variant (queried 2026-11-16). All are MIT licensed. `node scripts/gen-palettes.mjs` reads the published extension files.

| Name | Adapted from |
|---|---|
| `graphite` | GitHub Theme (Light Default, Dark Default) |
| `saffron` | Ayu (Light, Dark) |
| `glacier` | Winter is Coming (Light, Dark Blue) |
| `nocturne` | Night Owl (Night Owl Light, Night Owl) |
| `harbor` | Tokyo Night (Tokyo Night Light, Tokyo Night) |

Rules for palettes: surfaces keep the editor's colours, held within 0.1 OKLCH lightness of the page so cards and panels stay subtle; text, accents, borders and the ring move in lightness only until every pair in `contrast.test.ts` passes, which also runs every palette in light and dark; names are neutral and the credit lives here and in each file header; code surfaces use the palette's own syntax colours unless a `data-code-theme` is set. A palette is never the default.

