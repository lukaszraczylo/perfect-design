import type { ComponentDoc } from '../../../docs-types'
import { THEME_FONTS } from '../../../stores/theme'

const doc: ComponentDoc = {
  name: 'FontPicker',
  group: 'navigation',
  subgroup: 'Theme',
  summary: 'Radio group that switches the font family (`data-font`) of the whole page.',
  description:
    'Offers every family in `THEME_FONTS` (or the `fonts` you pass) and stores the choice with `useThemeStore().setFont()`, which sets `data-font` on `<html>` and persists it. Each option is drawn in its own family, so the choice previews itself. The font CSS (`@perfect-design/ui/fonts.css`) must be imported by the app, after `theme.css` and any packs. Every family is a platform font stack, so no font file ships; point a family at a loaded web font by overriding `--font-sans` in your own `[data-font]` rule. It is a single tab stop; arrow keys, Home and End move the selection. The font is independent of the style pack, accent and colour mode. Pair with `StylePicker`, `AccentPicker` and `ThemeToggle`.',
  status: 'stable',
  props: [
    { name: 'fonts', type: 'ThemeFont[]', default: 'THEME_FONTS', description: 'Font families to offer, in order. Unknown names are ignored.' },
    { name: 'label', type: 'string', default: "'Font'", description: 'aria-label of the radiogroup.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  examples: [
    { title: 'All families', code: `<FontPicker />` },
    { title: 'Subset', description: 'Only the first three families of `THEME_FONTS`.', code: `<FontPicker :fonts="subset" label="Typeface" />`, state: () => ({ subset: THEME_FONTS.slice(0, 3) }) },
  ],
  a11y: [
    '`role="radiogroup"` with `role="radio"` options and aria-checked; the group has an aria-label (`label`).',
    'Roving tabindex: Tab enters once on the selected option; Arrow keys, Home and End change the selection and move focus (Left and Right swap in RTL).',
    'Each option has visible text in its own family; selection is shown by fill plus aria-checked, never by colour alone. Options are 32px high (44px on coarse pointers) and wrap at narrow widths.',
    'The shipped stacks are all readable text faces; users who need a specific face (for example for dyslexia) can set it with their own `[data-font]` rule or browser override.',
  ],
  related: ['StylePicker', 'AccentPicker', 'ThemeToggle'],
  requires: [
    'Throws a ContractError when no Pinia instance is active (`app.use(createPinia())`).',
    'Throws a ContractError when `label` is blank, or `fonts` has no known family.',
  ],
  llmNotes: ['Requires an active Pinia instance and the `fonts.css` import.', 'Offer it only when users should choose; most products pick one family in code.'],
  replaces: ['hand-rolled font-family switches'],
}
export default doc
