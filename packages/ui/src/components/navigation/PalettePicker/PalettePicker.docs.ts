import type { ComponentDoc } from '../../../docs-types'
import { THEME_PALETTES } from '../../../lib/palettes'

const doc: ComponentDoc = {
  name: 'PalettePicker',
  group: 'navigation',
  subgroup: 'Theme',
  summary: 'Radio group that switches the whole-interface palette (`data-palette`) of the page.',
  description:
    'Offers every palette in `THEME_PALETTES` (or the `palettes` you pass) and stores the choice with `useThemeStore().setPalette()`, which sets `data-palette` on `<html>` and persists it. The palettes adapt the GitHub, Ayu, Winter is Coming, Night Owl and Tokyo Night VS Code themes (all MIT-licensed). They follow the light/dark colour mode, and choosing one replaces the accent preset, because both set the primary colour. `default` is the core petrol look. The palette CSS (`@perfect-design/ui/palettes.css`) must be imported by the app, after `theme.css` and the accent presets and before `packs.css`. Each option shows a small swatch strip beside its name. It is a single tab stop; arrow keys, Home and End move the selection. Pair with `CodeThemePicker`, `StylePicker`, `FontPicker` and `ThemeToggle`.',
  status: 'stable',
  props: [
    { name: 'palettes', type: 'ThemePalette[]', default: 'THEME_PALETTES', description: 'Palettes to offer, in order. Unknown names are ignored.' },
    { name: 'label', type: 'string', default: "'Palette'", description: 'aria-label of the radiogroup.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  examples: [
    { title: 'All palettes', code: `<PalettePicker />` },
    { title: 'Subset', description: 'Only the first three palettes of `THEME_PALETTES`.', code: `<PalettePicker :palettes="subset" label="Colour set" />`, state: () => ({ subset: THEME_PALETTES.slice(0, 3) }) },
  ],
  a11y: [
    '`role="radiogroup"` with `role="radio"` options and aria-checked; the group has an aria-label (`label`).',
    'Roving tabindex: Tab enters once on the selected option; Arrow keys, Home and End change the selection and move focus (Left and Right swap in RTL).',
    'Each option has visible text; the swatch strip is decorative (`aria-hidden`). Selection is shown by fill plus aria-checked, never by colour alone. Options are 32px high (44px on coarse pointers) and wrap at narrow widths.',
    'Every palette is checked for WCAG contrast in light and dark by the contrast tests.',
  ],
  related: ['CodeThemePicker', 'AccentPicker', 'StylePicker', 'FontPicker', 'ThemeToggle'],
  requires: [
    'Throws a ContractError when no Pinia instance is active (`app.use(createPinia())`).',
    'Throws a ContractError when `label` is blank, or `palettes` has no known palette.',
  ],
  llmNotes: ['Requires an active Pinia instance and the `palettes.css` import.', 'A palette replaces the accent preset; do not offer both pickers for the same choice.', 'Offer it only when users should choose; most products pick one palette in code.'],
  replaces: ['hand-rolled theme colour switches'],
}
export default doc
