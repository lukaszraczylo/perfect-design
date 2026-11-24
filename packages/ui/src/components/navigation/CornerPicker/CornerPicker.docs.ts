import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'CornerPicker',
  group: 'navigation',
  subgroup: 'Theme',
  summary: 'Radio group that switches the corner shape (`data-corner`) of the whole page.',
  description:
    'Offers every shape in `THEME_CORNERS` (or the `corners` you pass) and stores the choice with `useThemeStore().setCorner()`, which sets `data-corner` on `<html>` and persists it. `round` is the core look; `squircle` gives continuous, Apple-style corners through CSS `corner-shape` and scales every radius up, because a squircle at the same radius looks smaller. Browsers without `corner-shape` keep plain rounded corners, so the option has no visible effect there. Fully round shapes (avatars, switches, pills) stay round. Each option is drawn in its own shape, so the choice previews itself. The corner CSS (`@perfect-design/ui/corners.css`) must be imported by the app, after `theme.css` and any packs. It is a single tab stop; arrow keys, Home and End move the selection. The corner shape is independent of the style pack, accent, font and colour mode. Pair with `StylePicker`, `FontPicker` and `ThemeToggle`.',
  status: 'stable',
  props: [
    { name: 'corners', type: 'ThemeCorner[]', default: 'THEME_CORNERS', description: 'Corner shapes to offer, in order. Unknown names are ignored.' },
    { name: 'label', type: 'string', default: "'Corner'", description: 'aria-label of the radiogroup.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  examples: [
    { title: 'All shapes', code: `<CornerPicker />` },
    { title: 'Custom label', description: 'Rename the group for the surrounding settings page.', code: `<CornerPicker label="Corner style" />` },
  ],
  a11y: [
    '`role="radiogroup"` with `role="radio"` options and aria-checked; the group has an aria-label (`label`).',
    'Roving tabindex: Tab enters once on the selected option; Arrow keys, Home and End change the selection and move focus (Left and Right swap in RTL).',
    'Selection is shown by fill plus aria-checked, never by colour alone. Options are 32px high (44px on coarse pointers) and wrap at narrow widths.',
    'Corner shape changes no colour, size of text or focus ring, so contrast and focus visibility are unchanged.',
  ],
  related: ['StylePicker', 'FontPicker', 'ThemeToggle'],
  requires: [
    'Throws a ContractError when no Pinia instance is active (`app.use(createPinia())`).',
    'Throws a ContractError when `label` is blank, or `corners` has no known shape.',
  ],
  llmNotes: ['Requires an active Pinia instance and the `corners.css` import.', 'Offer it only when users should choose; most products pick one shape in code (`data-corner="squircle"` on a region).'],
  replaces: ['hand-rolled corner-radius switches'],
}
export default doc
