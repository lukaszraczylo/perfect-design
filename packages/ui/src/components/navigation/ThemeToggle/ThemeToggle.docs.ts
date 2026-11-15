import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'ThemeToggle',
  group: 'navigation',
  subgroup: 'Theme',
  summary: 'Button that cycles the colour mode light → dark → system and shows the matching icon.',
  description:
    'Reads and writes `useThemeStore()` (Pinia). Each click calls `cycleMode()`; the icon shows the CURRENT mode (sun, moon, desktop) and the accessible name starts with the current mode and then names the NEXT one ("Theme: Light. Switch to dark."). `variant="button"` additionally shows the current mode name. The store must be initialised once (`useThemeStore().init()` at app start or via a ThemeProvider) so the choice is applied to `<html>` and persisted; the toggle itself only changes state. Pair with `AccentPicker` to choose the accent preset.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'icon' | 'button' | 'switch' | 'segmented'", default: "'icon'", description: '`icon`: square ghost icon button. `button`: outline button with the current mode name. `switch`: a light and dark switch (a sun or moon thumb), for apps that offer no system mode. `segmented`: a radio group of light, dark and system, each choosable directly. Unknown values fall back to `icon`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control size. The `icon` button is 24px, 36px or 44px square, the `button` 32px, 36px or 44px high, the `segmented` options 24px, 32px or 40px, and the `switch` track 20px, 24px or 28px high; coarse pointers get at least 40px targets. Unknown values fall back to `md`.' },
    { name: 'label', type: 'string', description: 'Accessible name of the `switch` (default "Dark mode") and of the `segmented` group (default "Theme"). The `icon` and `button` variants name themselves from the current mode.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  examples: [
    { title: 'Icon', code: `<ThemeToggle />` },
    { title: 'Button with label, in a toolbar', code: `<div class="flex items-center gap-2"><ThemeToggle variant="button" /><ThemeToggle /></div>` },
    { title: 'Switch', description: 'Two states: light or dark. Pressing it sets the mode explicitly, so it leaves `system`.', code: `<div class="flex items-center gap-3"><ThemeToggle variant="switch" size="sm" /><ThemeToggle variant="switch" /><ThemeToggle variant="switch" size="lg" label="Use dark theme" /></div>` },
    { title: 'Segmented', description: 'All three modes visible at once; arrow keys move the selection.', code: `<div class="flex flex-wrap items-center gap-3"><ThemeToggle variant="segmented" size="sm" label="Theme small" /><ThemeToggle variant="segmented" label="Theme medium" /><ThemeToggle variant="segmented" size="lg" label="Theme large" /></div>` },
  ],
  a11y: [
    '`variant="switch"` is `role="switch"` named "Dark mode" with aria-checked for the resolved dark state; the sun or moon on the thumb and its position carry the state besides colour. It sets light or dark and never `system`.',
    '`variant="segmented"` is a `role="radiogroup"` (named "Theme") of three `role="radio"` buttons named Light, Dark and System. It is a single tab stop on the selected mode; arrow keys (swapped in RTL), Home and End select and move focus. The selected one is raised and underlined in forced colors.',
    'aria-label and title read "Theme: Light. Switch to dark." The name begins with the visible mode text, so `variant="button"` satisfies WCAG 2.5.3 label in name.',
    'It cycles through three modes, so it is a plain button, not a toggle button: aria-pressed would be wrong for three states.',
    'Native button; Space/Enter cycle. The icon is decorative (aria-hidden). Targets are 24px (`sm`), 36px (`md`) or 44px (`lg`) square, and at least 40px on coarse pointers.',
  ],
  related: ['AccentPicker', 'AppHeader', 'Button'],
  requires: [
    'Throws a ContractError when no Pinia instance is active (`app.use(createPinia())`).',
  ],
  llmNotes: ['Requires an active Pinia instance.', 'Call useThemeStore().init() once at app start; the toggle does not.', 'Do not override aria-label; it already states the current mode and what the next click does.'],
  replaces: ['hand-rolled ThemeToggle markup in app code'],
}
export default doc
