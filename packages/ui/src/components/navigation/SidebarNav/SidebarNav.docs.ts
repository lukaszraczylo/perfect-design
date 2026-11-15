import { ref } from 'vue'
import { faBell, faChartLine, faGear, faHouse, faUsers } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const groups = [
  {
    label: 'Overview',
    items: [
      { label: 'Overview', href: '/components', icon: faHouse },
      { label: 'Reports', href: '/components/data-display', icon: faChartLine },
      { label: 'Alerts', href: '/components/feedback', icon: faBell, badge: 3 },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Team', href: '/components/layout', icon: faUsers },
      {
        label: 'Settings',
        icon: faGear,
        children: [
          { label: 'Profile', href: '/components/forms' },
          { label: 'Billing', href: '/components/primitives' },
        ],
      },
    ],
  },
]

const doc: ComponentDoc = {
  name: 'SidebarNav',
  group: 'navigation',
  subgroup: 'App shell',
  summary: 'Grouped application sidebar navigation with icons, badges, nested items and an icon-only collapsed mode.',
  description:
    'Pass `groups` (`{ label?, items }`) where each item is `{ label, href | to, icon?, badge?, active?, disabled?, children? }`. Set `current` to the current path/href, or provide `NAV_IS_ACTIVE_KEY` once for router-driven state. Items with `children` become expandable (auto-open when a child is active). `collapsed` shows icons only with the label as a `title` tooltip; clicking a parent in the collapsed rail emits `update:collapsed=false` so the parent can expand it. Links emit `navigate`; for vue-router pass `link-as` a RouterLink. Uses the `sidebar-*` tokens. For a docs-style text list use `DocsSidebar`.',
  status: 'stable',
  props: [
    { name: 'groups', type: 'SidebarNavGroup[]', required: true, description: 'Groups `{ id?, label?, items: SidebarNavItem[] }`. Malformed groups/items are skipped.' },
    { name: 'collapsed', type: 'boolean', default: 'false', description: 'Icon-only rail (w-14); labels become sr-only + title.' },
    { name: 'current', type: 'string', description: 'Current path/href; the item with the same `to`/`href` is active unless it sets `active`.' },
    { name: 'linkAs', type: 'string | Component', default: "'a'", description: 'Link element/component, e.g. RouterLink (receives `to`).' },
    { name: 'label', type: 'string', default: "'Sidebar'", description: 'aria-label of the nav landmark.' },
    { name: 'variant', type: "'default' | 'compact' | 'rail'", default: "'default'", description: '`default`: 240px list. `compact`: denser spacing, 208px. `rail`: an 80px strip of tiles with the icon above a short label (sub-items open below their parent tile). `collapsed` always wins and shows icons only. Unknown values fall back to `default`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Link height: 32px, 36px or 44px; sub-items are one step smaller. Unknown values fall back to `md`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last (override width with `w-72` etc.).' },
  ],
  slots: [
    { name: 'header', description: 'Brand/logo area above the groups.', props: '{ collapsed: boolean }' },
    { name: 'footer', description: 'Pinned to the bottom (user menu, collapse button).', props: '{ collapsed: boolean }' },
  ],
  emits: [
    { name: 'navigate', payload: '[item: SidebarNavItem, event: MouseEvent]', description: 'A link was clicked (not emitted for disabled items).' },
    { name: 'update:collapsed', payload: '[collapsed: boolean]', description: 'Emitted with false when a parent item is clicked in collapsed mode.' },
  ],
  examples: [
    {
      title: 'Grouped with nested items',
      script: `const current = ref('/components')`,
      code: `<SidebarNav :groups="groups" :current="current" label="Sample app" class="h-96 rounded-lg border" @navigate="(item, e) => { e.preventDefault(); if (item.href) current = item.href }">
  <template #header><p class="px-3 py-2 text-sm font-semibold">Sample app</p></template>
</SidebarNav>`,
      state: () => ({ groups, current: ref('/components') }),
    },
    {
      title: 'Compact and rail',
      description: 'Gallery of the `compact` and `rail` variants with the same groups.',
      code: `<div class="flex flex-wrap gap-4">
  <SidebarNav :groups="groups" current="/components" variant="compact" size="sm" label="Compact sample" class="h-96 rounded-lg border" @navigate="(i, e) => e.preventDefault()" />
  <SidebarNav :groups="groups" current="/components/data-display" variant="rail" label="Rail sample" class="h-96 rounded-lg border" @navigate="(i, e) => e.preventDefault()" />
</div>`,
      state: () => ({ groups }),
    },
    {
      title: 'Collapsible rail',
      script: `const collapsed = ref(false)`,
      code: `<div class="flex flex-wrap gap-4">
  <SidebarNav v-model:collapsed="collapsed" :groups="groups" current="/components/data-display" label="Collapsible sample" class="h-96 rounded-lg border" @navigate="(i, e) => e.preventDefault()">
    <template #footer="{ collapsed }">
      <p class="px-2 text-xs text-sidebar-foreground">{{ collapsed ? 'Sample' : 'Sample footer' }}</p>
    </template>
  </SidebarNav>
  <Button variant="outline" size="sm" class="self-start" @click="collapsed = !collapsed">Toggle collapsed</Button>
</div>`,
      state: () => ({ groups, collapsed: ref(false) }),
    },
  ],
  a11y: [
    '`<nav aria-label>` (default "Sidebar"): give each sidebar on a page its own label, because landmarks must be unique.',
    'Each group is `role="group"` named by its heading. Group headings use `text-sidebar-foreground`, a token pair that passes AA.',
    'The active link has aria-current="page"; parent buttons expose aria-expanded/aria-controls and toggle with Enter or Space.',
    'Tab moves through every link; there is no arrow-key roving, so the order stays predictable.',
    '`variant` and `size` only change spacing, width and link height: landmarks, groups, aria-current and aria-expanded are the same. In `rail` the label stays visible under the icon (and is also the `title`), and `collapsed` still turns every variant into icons with sr-only text.',
    'Collapsed mode keeps labels as sr-only text and adds a title tooltip. Targets are at least 32px high (40px on coarse pointers).',
    'Uses logical properties (`border-e`, `ms-*`, `ps-*`) so it mirrors in RTL; the width transition runs only under `motion-safe`. Active items also get an underline in forced-colors mode.',
    'The nav is `max-w-full`, so it never forces horizontal scroll at 320px.',
  ],
  related: ['NavLink', 'DocsSidebar', 'AppHeader', 'MobileNav'],
  requires: [
    'Throws a ContractError when `groups` is empty, or a group has no `items`.',
    'Throws a ContractError when an item has no non-empty `label`.',
    'Throws a ContractError when a leaf item has neither `href` nor `to` and is not `disabled`, unless `@navigate` handles it as an action (it then renders as a button).',
    'Throws a ContractError when `label` is blank, because it names the nav landmark.',
  ],
  llmNotes: [
    'Every item needs a `label` and an `href` or `to`; an item with neither is an action, handled with `@navigate`, and renders as a button.',
    'Icons are FontAwesome IconDefinition objects in `item.icon`.',
    'Control collapse with `v-model:collapsed`; render the toggle button yourself (footer slot).',
    'Use `link-as` with RouterLink or `@navigate` + preventDefault for programmatic routing.',
    'Do not nest groups more than one level; `children` is a single sub-list level.',
  ],
  replaces: ['hand-rolled SidebarNav markup in app code'],
}
export default doc
