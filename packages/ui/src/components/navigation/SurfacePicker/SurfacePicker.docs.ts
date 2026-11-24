import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'SurfacePicker',
  group: 'navigation',
  subgroup: 'Theme',
  summary: 'Radio group that switches the surface (`data-surface`) of the whole page between solid and glass.',
  description:
    'Offers every surface in `THEME_SURFACES` (or the `surfaces` you pass) and stores the choice with `useThemeStore().setSurface()`, which sets `data-surface` on `<html>` and persists it. `solid` is the core look. `glass` lets layers that float over content (menus, popovers, hover cards, tooltips, dialogs, sheets, toasts, the navigation viewport, the mobile menu and sticky headers) show the content behind them, blurred; content cards stay opaque. Glass is a deliberate, opt-in exception to the library\'s no-glass rule and falls back to solid without `backdrop-filter`, under `prefers-reduced-transparency: reduce`, in forced colours and in the `contrast` style pack. Tune it with `--glass-alpha` and `--glass-blur` on the scope. The surface CSS (`@perfect-design/ui/surfaces.css`) must be imported by the app, after `theme.css`, any packs and `fonts.css`. It is a single tab stop; arrow keys, Home and End move the selection. The surface is independent of the style pack, accent, font, corner shape and colour mode. Pair with `StylePicker`, `CornerPicker` and `ThemeToggle`.',
  status: 'stable',
  props: [
    { name: 'surfaces', type: 'ThemeSurface[]', default: 'THEME_SURFACES', description: 'Surfaces to offer, in order. Unknown names are ignored.' },
    { name: 'label', type: 'string', default: "'Surface'", description: 'aria-label of the radiogroup.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  examples: [
    { title: 'Both surfaces', code: `<SurfacePicker />` },
    { title: 'Custom label', description: 'Rename the group for the surrounding settings page.', code: `<SurfacePicker label="Layer style" />` },
  ],
  a11y: [
    '`role="radiogroup"` with `role="radio"` options and aria-checked; the group has an aria-label (`label`).',
    'Roving tabindex: Tab enters once on the selected option; Arrow keys, Home and End change the selection and move focus (Left and Right swap in RTL).',
    'Selection is shown by fill plus aria-checked, never by colour alone. Options are 32px high (44px on coarse pointers) and wrap at narrow widths.',
    'Glass keeps surface text at 4.5:1 over a pure black or pure white backdrop at the shipped opacity; people who set reduced transparency, forced colours or the `contrast` pack always get solid surfaces.',
  ],
  related: ['StylePicker', 'CornerPicker', 'ThemeToggle'],
  requires: [
    'Throws a ContractError when no Pinia instance is active (`app.use(createPinia())`).',
    'Throws a ContractError when `label` is blank, or `surfaces` has no known surface.',
  ],
  llmNotes: ['Requires an active Pinia instance and the `surfaces.css` import.', 'Glass is opt-in and never the default; offer the picker only when users should choose, otherwise set `data-surface="glass"` in code.'],
  replaces: ['hand-rolled translucent or backdrop-blur overlay classes'],
}
export default doc
