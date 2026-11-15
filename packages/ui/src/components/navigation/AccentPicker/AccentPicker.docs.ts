import type { ComponentDoc } from '../../../docs-types'
import { THEME_ACCENTS } from '../../../stores/theme'

const doc: ComponentDoc = {
  name: 'AccentPicker',
  group: 'navigation',
  subgroup: 'Theme',
  summary: 'Radio group of colour swatches that switches the accent preset (`data-theme`).',
  description:
    'Offers every preset in `THEME_ACCENTS` (or the `accents` you pass) and stores the choice with `useThemeStore().setAccent()`. Swatches show each preset colour regardless of the active theme (they mirror the preset `--primary` hues; this is the one place colours are not live tokens). It is a single tab stop; arrow keys, Home and End move the selection. The accent CSS (`@perfect-design/ui/themes/<name>.css`) must be imported by the app for the preset to take effect. Pair with `ThemeToggle`.',
  status: 'stable',
  props: [
    { name: 'accents', type: 'ThemeAccent[]', default: 'THEME_ACCENTS', description: 'Presets to offer, in order. Unknown names are ignored.' },
    { name: 'label', type: 'string', default: "'Accent colour'", description: 'aria-label of the radiogroup.' },
    { name: 'shape', type: "'circle' | 'rounded' | 'square'", default: "'circle'", description: 'Swatch corners. Unknown values fall back to `circle`.' },
    { name: 'size', type: "'md' | 'lg' | 'xl'", default: "'md'", description: 'Swatch size: 24px, 32px or 40px (coarse pointers get 32px, 40px and 44px). There is no smaller size because the swatches are the click targets. Unknown values fall back to `md`.' },
    { name: 'layout', type: "'inline' | 'grid' | 'list'", default: "'inline'", description: '`inline`: a wrapping row. `grid`: three columns. `list`: one row per preset with the visible name and a check on the chosen one. Unknown values fall back to `inline`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  examples: [
    { title: 'All presets', code: `<AccentPicker />` },
    { title: 'Shapes and sizes', description: 'Gallery of `circle`, `rounded` and `square` swatches at `md`, `lg` and `xl`.', code: `<div class="grid gap-3"><AccentPicker shape="circle" label="Circle swatches" /><AccentPicker shape="rounded" size="lg" label="Rounded swatches" /><AccentPicker shape="square" size="xl" label="Square swatches" /></div>` },
    { title: 'Grid and list layouts', description: 'The list shows each preset name next to its swatch.', code: `<div class="flex flex-wrap items-start gap-8"><AccentPicker layout="grid" label="Grid of accents" /><AccentPicker layout="list" label="Accent list" class="w-48" /></div>` },
    { title: 'Subset', description: 'The first three presets of `THEME_ACCENTS`.', code: `<AccentPicker :accents="subset" label="Brand colour" />`, state: () => ({ subset: THEME_ACCENTS.slice(0, 3) }) },
  ],
  a11y: [
    '`role="radiogroup"` with `role="radio"` swatches and aria-checked; the group has an aria-label (`label`).',
    'Roving tabindex: Tab enters once on the selected swatch; Arrow keys, Home and End change the selection and move focus (Left and Right follow the reading direction, so they swap in RTL).',
    'Each swatch has an accessible name (the preset name) and a title tooltip. Selection is shown by a ring plus the aria-checked state, never by colour alone.',
    'Swatches are 24px (`md`), 32px (`lg`) or 40px (`xl`), at least 32px on coarse pointers, and wrap onto new lines at narrow widths. In the `list` layout each row shows the preset name as text and a check mark on the chosen one, and the whole row is the radio.',
    'In forced-colors mode swatches keep their preset colour (`forced-color-adjust: none`) and the selected one gets a thicker outline.',
  ],
  related: ['ThemeToggle'],
  requires: [
    'Throws a ContractError when no Pinia instance is active (`app.use(createPinia())`).',
    'Throws a ContractError when `label` is blank, or `accents` has no known preset.',
  ],
  llmNotes: ['Requires an active Pinia instance and the accent CSS imports.', 'Do not recolour swatches with `bg-primary`; they intentionally show fixed preset colours.'],
  replaces: ['hand-rolled AccentPicker markup in app code'],
}
export default doc
