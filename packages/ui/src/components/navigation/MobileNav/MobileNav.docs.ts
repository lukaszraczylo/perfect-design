import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'MobileNav',
  group: 'navigation',
  subgroup: 'App shell',
  summary: 'Small-screen navigation panel: slides down under a header or opens as a side sheet. Esc closes and focus is managed.',
  description:
    'Control with `v-model:open`. The `dropdown` variant is absolutely positioned under its nearest positioned ancestor (AppHeader does this for you); `sheet` is a fixed left panel with an overlay and a Tab focus trap. On open focus moves to the first focusable element (or the panel); on close it returns to the previously focused element. Clicking a link, or an element with `data-mobile-nav-close`, closes it unless `close-on-navigate` is false. It is not portalled and renders nothing while closed. For modal dialogs in general use `Dialog`/`Sheet`.',
  status: 'stable',
  props: [
    { name: 'open', type: 'boolean', description: 'Open state (v-model:open).' },
    { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
    { name: 'variant', type: "'dropdown' | 'sheet'", default: "'dropdown'", description: 'Slide-down panel or fixed side sheet.' },
    { name: 'label', type: 'string', default: "'Navigation'", description: 'Accessible name of the panel.' },
    { name: 'closeOnNavigate', type: 'boolean', default: 'true', description: 'Close when a link or [data-mobile-nav-close] inside is clicked.' },
    { name: 'id', type: 'string', description: 'Panel id (target of aria-controls on the toggle).' },
    { name: 'class', type: 'string | object | array', description: 'Merged onto the panel.' },
  ],
  slots: [{ name: 'default', description: 'Panel content (links).', props: '{ close: () => void }' }],
  emits: [{ name: 'update:open', payload: '[open: boolean]', description: 'The panel asked to open/close (Escape, overlay, link click).' }],
  examples: [
    {
      title: 'Sheet',
      script: `const open = ref(false)`,
      code: `<div @click.prevent>
  <Button variant="outline" @click="open = true">Open menu</Button>
  <MobileNav v-model:open="open" variant="sheet" label="Sample menu">
    <nav aria-label="Sample pages" class="flex flex-col gap-1">
      <NavLink href="/components" variant="pill" active>Components</NavLink>
      <NavLink href="/guides/getting-started" variant="pill">Guides</NavLink>
      <Button variant="ghost" data-mobile-nav-close>Close</Button>
    </nav>
  </MobileNav>
</div>`,
      state: () => ({ open: ref(false) }),
    },
    {
      title: 'Dropdown under a positioned container',
      script: `const open = ref(true)`,
      code: `<div class="relative h-56 rounded-lg border" @click.prevent>
  <div class="flex h-12 items-center justify-between px-3">
    <span class="text-sm font-medium">Sample site</span>
    <Button size="sm" variant="ghost" :aria-expanded="open" @click="open = !open">Menu</Button>
  </div>
  <MobileNav v-model:open="open" label="Sample dropdown">
    <div class="flex flex-col gap-1">
      <NavLink href="/components" variant="pill">Components</NavLink>
      <NavLink href="/guides/getting-started" variant="pill">Guides</NavLink>
    </div>
  </MobileNav>
</div>`,
      state: () => ({ open: ref(true) }),
    },
  ],
  a11y: [
    'Escape closes; focus moves to the first focusable element on open and returns to the opener on close. A panel that renders already open does not take focus on load.',
    'The sheet is role="dialog" aria-modal with Tab/Shift+Tab trapped, an overlay that closes on click, and `overscroll-contain` so the page behind does not scroll. The dropdown is a non-modal role="navigation" panel, so put a `div` (not another `nav`) inside it.',
    'Every panel needs its own `label`; a nav placed inside a sheet needs a different `aria-label` from the sheet.',
    'Opaque `bg-background` with a border, no blur. The slide-in mirrors in RTL and animations are off under `motion-reduce`.',
    'Pair the opener with aria-expanded and aria-controls (AppHeader wires this).',
  ],
  related: ['AppHeader', 'SidebarNav', 'Dialog'],
  requires: [
    'Throws a ContractError when `label` is blank, because every panel needs its own name.',
    'Throws a ContractError when nothing can open the panel: neither `v-model:open` (`open`) nor `default-open` is set.',
  ],
  llmNotes: ['Use inside AppHeader via its `mobile` slot instead of wiring the toggle yourself.', 'The dropdown variant needs a positioned ancestor (relative/sticky).', 'Hide the opener above the desktop breakpoint with `md:hidden`.'],
  replaces: ['hand-rolled MobileNav markup in app code'],
}
export default doc
