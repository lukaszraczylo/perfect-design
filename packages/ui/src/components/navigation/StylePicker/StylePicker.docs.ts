import type { ComponentDoc } from '../../../docs-types'
import { THEME_STYLES } from '../../../stores/theme'

const doc: ComponentDoc = {
  name: 'StylePicker',
  group: 'navigation',
  subgroup: 'Theme',
  summary: 'Radio group that switches the style pack (`data-style`) of the whole page.',
  description:
    'Offers every pack in `THEME_STYLES` (or the `styles` you pass) and stores the choice with `useThemeStore().setStyle()`, which sets `data-style` on `<html>` and persists it. The pack CSS (`@perfect-design/ui/packs.css`) must be imported by the app. It is a single tab stop; arrow keys, Home and End move the selection. Pair with `ThemeToggle` and `AccentPicker`. To style only a region, use `StyleScope`.',
  status: 'stable',
  props: [
    { name: 'styles', type: 'ThemeStyle[]', default: 'THEME_STYLES', description: 'Packs to offer, in order. Unknown names are ignored.' },
    { name: 'label', type: 'string', default: "'Style'", description: 'aria-label of the radiogroup.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  examples: [
    { title: 'All packs', code: `<StylePicker />` },
    { title: 'Subset', description: 'Only the first three packs of `THEME_STYLES`.', code: `<StylePicker :styles="subset" label="Interface style" />`, state: () => ({ subset: THEME_STYLES.slice(0, 3) }) },
  ],
  a11y: [
    '`role="radiogroup"` with `role="radio"` options and aria-checked; the group has an aria-label (`label`).',
    'Roving tabindex: Tab enters once on the selected option; Arrow keys, Home and End change the selection and move focus (Left and Right swap in RTL).',
    'Each option has visible text; selection is shown by fill plus aria-checked, never by colour alone. Options are 32px high (44px on coarse pointers) and wrap at narrow widths.',
  ],
  related: ['StyleScope', 'ThemeToggle', 'AccentPicker'],
  requires: [
    'Throws a ContractError when no Pinia instance is active (`app.use(createPinia())`).',
    'Throws a ContractError when `label` is blank, or `styles` has no known pack.',
  ],
  llmNotes: ['Requires an active Pinia instance and the pack CSS import.', 'Offer it only when users should choose; most products pick one pack in code.'],
  replaces: ['hand-rolled density or layout switches'],
}
export default doc
