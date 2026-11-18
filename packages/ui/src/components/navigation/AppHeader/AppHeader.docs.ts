import { faBell } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'AppHeader',
  group: 'navigation',
  subgroup: 'App shell',
  summary: 'Top bar with brand, navigation and action slots, an optional sticky mode and a built-in mobile menu.',
  description:
    'Fill the `brand`, `nav` (desktop, hidden below `md`), `actions` and `mobile` slots. A `nav` slot requires a `mobile` slot, otherwise the links are unreachable on small screens. When the `mobile` slot is present a menu button appears below `md` that toggles a `MobileNav` panel (dropdown by default, `mobile-variant="sheet"` for a side sheet); its open state is `v-model:mobileOpen`. `sticky` pins the bar to the top. The slots are layout-only: put `NavLink`s, `ThemeToggle`, buttons etc. inside. Use `SidebarNav` for app-level vertical navigation.',
  status: 'stable',
  props: [
    { name: 'sticky', type: 'boolean', default: 'false', description: 'Stick to the top of the viewport (`position: sticky`).' },
    { name: 'bordered', type: 'boolean', default: 'true', description: 'Bottom border.' },
    { name: 'mobileOpen', type: 'boolean', description: 'Mobile menu open state (v-model:mobileOpen).' },
    { name: 'mobileVariant', type: "'dropdown' | 'sheet'", default: "'dropdown'", description: 'Presentation of the mobile panel.' },
    { name: 'navLabel', type: 'string', default: "'Main'", description: 'aria-label of the desktop nav landmark. Use a different value for each header on a page.' },
    { name: 'menuLabel', type: 'string', default: "'Menu'", description: 'Accessible name of the mobile menu button. Constant; aria-expanded carries the open state.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  slots: [
    { name: 'brand', description: 'Logo / site name.' },
    { name: 'nav', description: 'Desktop navigation links (hidden below `md`).' },
    { name: 'actions', description: 'Right-aligned controls (search, theme toggle, sign in).' },
    { name: 'mobile', description: 'Mobile menu content; enables the menu button.', props: '{ close: () => void }' },
  ],
  emits: [{ name: 'update:mobileOpen', payload: '[open: boolean]', description: 'The mobile menu opened or closed.' }],
  examples: [
    {
      title: 'Brand, nav, actions',
      code: `<div @click.prevent>
  <AppHeader nav-label="Sample main" class="rounded-lg border">
    <template #brand><span class="text-sm font-semibold">Sample app</span></template>
    <template #nav>
      <NavLink href="/components" variant="pill" active>Components</NavLink>
      <NavLink href="/guides/getting-started" variant="pill">Guides</NavLink>
    </template>
    <template #actions><Button size="sm">Sign in</Button></template>
    <template #mobile>
      <div class="flex flex-col gap-1">
        <NavLink href="/components" variant="pill" active>Components</NavLink>
        <NavLink href="/guides/getting-started" variant="pill">Guides</NavLink>
      </div>
    </template>
  </AppHeader>
</div>`,
    },
    {
      title: 'With mobile menu',
      description: 'Below the `md` breakpoint the nav slot is replaced by a menu button that opens the `mobile` slot.',
      code: `<div class="h-64 overflow-hidden rounded-lg border" @click.prevent>
  <AppHeader sticky :bordered="false" nav-label="Compact main">
    <template #brand><span class="text-sm font-semibold">Sample app</span></template>
    <template #nav><NavLink href="/components" variant="pill">Components</NavLink></template>
    <template #actions><Button variant="ghost" size="icon" aria-label="Notifications"><Icon :icon="faBell" /></Button></template>
    <template #mobile>
      <div class="flex flex-col gap-1">
        <NavLink href="/components" variant="pill">Components</NavLink>
        <NavLink href="/guides/getting-started" variant="pill">Guides</NavLink>
      </div>
    </template>
  </AppHeader>
</div>`,
      state: () => ({ faBell }),
    },
  ],
  a11y: [
    '`<header>` landmark with an opaque `bg-background` surface and a bottom border (no blur). The desktop links sit in `<nav aria-label>` (default "Main"): give every header on a page its own `nav-label`.',
    'The menu button has a constant accessible name (`menuLabel`, default "Menu") plus aria-expanded and aria-controls; the name does not flip between open and close.',
    'Opening the panel moves focus into it; Esc closes it and returns focus to the button. Tab order follows the DOM: brand, nav, actions, menu button.',
    'The nav is hidden below `md` and the menu button above it. If the viewport grows past `md` while the panel is open, it closes.',
    'Buttons keep their own 36px target (44px on coarse pointers). Logical properties (`ms-auto`) keep the actions on the correct side in RTL.',
  ],
  related: ['MobileNav', 'NavLink', 'ThemeToggle', 'SidebarNav', 'BrandLink'],
  requires: [
    'Throws a ContractError when a `nav` slot is given without a `mobile` slot, because the nav is hidden below `md` and its links would be unreachable.',
    'Throws a ContractError when `menuLabel` is blank while a `mobile` slot is given, or `navLabel` is blank while a `nav` slot is given.',
  ],
  llmNotes: ['Always provide the `mobile` slot when you give a `nav` slot (it throws otherwise).', 'Do not render the same links twice in nav and mobile without keeping them in sync.', 'Use `sticky`, not custom position classes.'],
  replaces: ['hand-rolled AppHeader markup in app code'],
}
export default doc
