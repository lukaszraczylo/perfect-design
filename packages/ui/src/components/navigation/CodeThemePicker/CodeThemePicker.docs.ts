import type { ComponentDoc } from '../../../docs-types'
import { THEME_CODE_THEMES } from '../../../stores/theme'

const doc: ComponentDoc = {
  name: 'CodeThemePicker',
  group: 'navigation',
  subgroup: 'Theme',
  summary: 'Radio group that switches the colours of code viewers and code blocks (`data-code-theme`).',
  description:
    'Offers "Follow palette" (`default`) and the ten code themes of `THEME_CODE_THEMES` (or the `themes` you pass), dark ones first, and stores the choice with `useThemeStore().setCodeTheme()`, which sets `data-code-theme` on `<html>` and persists it. The theme mode (dark or light) is shown as text after each name, and each option has a small code swatch drawn with that theme. `default` follows the active palette, or the core tokens when no palette is set. The CSS (`@perfect-design/ui/code-themes.css`) must be imported by the app. It is a single tab stop; arrow keys, Home and End move the selection. Pair with `PalettePicker`.',
  status: 'stable',
  props: [
    { name: 'themes', type: 'ThemeCodeTheme[]', default: 'THEME_CODE_THEMES', description: 'Code themes to offer, in order. Unknown names are ignored.' },
    { name: 'label', type: 'string', default: "'Code theme'", description: 'aria-label of the radiogroup.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  examples: [
    { title: 'All code themes', code: `<CodeThemePicker />` },
    { title: 'Subset', description: 'Follow the palette, or pick one of the first three themes.', code: `<CodeThemePicker :themes="subset" label="Syntax colours" />`, state: () => ({ subset: THEME_CODE_THEMES.slice(0, 4) }) },
  ],
  a11y: [
    '`role="radiogroup"` with `role="radio"` options and aria-checked; the group has an aria-label (`label`).',
    'Roving tabindex: Tab enters once on the selected option; Arrow keys, Home and End change the selection and move focus (Left and Right swap in RTL).',
    'Each option has visible text including its mode; the code swatch is decorative (`aria-hidden`). Selection is shown by fill plus aria-checked, never by colour alone. Options are 32px high (44px on coarse pointers) and wrap at narrow widths.',
    'Every code theme meets 4.5:1 text contrast on its own background.',
  ],
  related: ['PalettePicker', 'StylePicker', 'ThemeToggle'],
  requires: [
    'Throws a ContractError when no Pinia instance is active (`app.use(createPinia())`).',
    'Throws a ContractError when `label` is blank, or `themes` has no known code theme.',
  ],
  llmNotes: ['Requires an active Pinia instance and the `code-themes.css` import.', 'A code theme overrides the palette code colours; leave it on `default` unless users should choose.'],
  replaces: ['hand-rolled syntax highlight theme switches'],
}
export default doc
