import { ref } from 'vue'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const SLOT_PROPS = '{ collapsed: boolean, open: boolean, toggle: () => void, sidebarId: string, expanded: boolean, triggerProps: { \'aria-controls\': string, \'aria-expanded\': \'true\' | \'false\' }, collapsedEnd: boolean, openEnd: boolean, toggleEnd: () => void }'

const doc: ComponentDoc = {
  name: 'AppShell',
  group: 'layout',
  subgroup: 'Page structure',
  summary: 'Application frame with header, collapsible sidebar (drawer on mobile), main content and footer slots.',
  description:
    'Use `AppShell` as the root layout of dashboards and admin apps. Pick a `layout`: `top-nav-sidebar` (default; full-width header above sidebar and content), `sidebar-left` / `sidebar-right` (full-height sidebar, header over the content column only), `top-nav` (header and content, no sidebar) or `dual-sidebar` (`sidebar` slot on the start side plus a `sidebar-end` slot, e.g. a details panel). Sidebars render in `<aside>` landmarks with the `sidebar-*` tokens; their content is yours. From the drawer breakpoint up (`md` by default, `lg` via `drawerBreakpoint`) a sidebar is always visible and collapses to an icon rail (`railWidth` sm/md/lg, `collapseMode="rail"`) or disappears (`collapseMode="hidden"`) with `v-model:collapsed` (`v-model:collapsed-end` for the end sidebar); `sidebarWidth` sets the expanded width. Below the breakpoint the sidebar is an off-canvas drawer: hidden unless `v-model:open` (`v-model:open-end`) is true, then it is a modal dialog over the page above a backdrop that closes on click and Escape: everything behind it is `inert` (so focus cannot leave the drawer), page scrolling is locked (`lockScroll`), focus moves into the drawer and returns on close, and closes by itself when the viewport grows past the breakpoint. `contentMaxWidth` centres and constrains the page content (`sm` … `7xl`, `prose`, `full`) with responsive padding. Slot props `{ collapsed, open, toggle, sidebarId, expanded, triggerProps, collapsedEnd, openEnd, toggleEnd }` are available in every slot; `toggle` collapses on desktop and opens/closes the drawer on mobile, and `v-bind="triggerProps"` on the menu button adds `aria-controls` and `aria-expanded`. The default slot is the `<main>` content (set `:main="false"` to render a `div` when the shell is embedded in a page that already has a `main`). No extra dependencies: it is plain CSS classes plus a media query listener.',
  status: 'stable',
  props: [
    { name: 'layout', type: "'top-nav-sidebar' | 'sidebar-left' | 'sidebar-right' | 'top-nav' | 'dual-sidebar'", default: "'top-nav-sidebar'", description: '`top-nav-sidebar`: header spans the full width above sidebar + content. `sidebar-left` / `sidebar-right`: full-height (sticky h-dvh) sidebar on that side, header over the content column. `top-nav`: no sidebar (slots ignored). `dual-sidebar`: `sidebar` at the start + `sidebar-end` at the end. Unknown values fall back to the default. Sets `data-layout` when not default.' },
    { name: 'collapsed', type: 'boolean', default: 'false', description: 'v-model:collapsed. Primary sidebar becomes a rail (or hides, see collapseMode) on desktop when true. Works uncontrolled.' },
    { name: 'open', type: 'boolean', default: 'false', description: 'v-model:open. Primary sidebar drawer visibility below the drawer breakpoint. Works uncontrolled.' },
    { name: 'collapsedEnd', type: 'boolean', default: 'false', description: 'v-model:collapsedEnd. Collapsed state of the `sidebar-end` (dual-sidebar).' },
    { name: 'openEnd', type: 'boolean', default: 'false', description: 'v-model:openEnd. Drawer visibility of the `sidebar-end` (dual-sidebar).' },
    { name: 'sidebarWidth', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Expanded sidebar width (and drawer width): w-56 / w-64 / w-72. Unknown values fall back to md.' },
    { name: 'railWidth', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Collapsed rail width: w-12 / w-14 / w-16. Unknown values fall back to md.' },
    { name: 'collapseMode', type: "'rail' | 'hidden'", default: "'rail'", description: '`rail` shrinks to an icon rail; `hidden` removes the sidebar on desktop while collapsed. Unknown values fall back to rail.' },
    { name: 'drawerBreakpoint', type: "'md' | 'lg'", default: "'md'", description: 'Viewport below which sidebars are off-canvas drawers (768px / 1024px). Unknown values fall back to md.' },
    { name: 'contentMaxWidth', type: "'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'prose' | 'full'", description: 'Wrap the page content in a centred, max-width container (same presets as Container). Unset renders the content edge to edge. Unknown values are ignored.' },
    { name: 'contentPadded', type: 'boolean', default: 'true', description: 'With contentMaxWidth: responsive horizontal padding (px-4 sm:px-6 lg:px-8).' },
    { name: 'lockScroll', type: 'boolean', default: 'true', description: 'Set overflow:hidden on <body> while a drawer is open (below the breakpoint only); the previous value is restored on close and unmount.' },
    { name: 'mainId', type: 'string', default: "'main-content'", description: 'id of the <main> element (skip-link target).' },
    { name: 'sidebarLabel', type: 'string', default: "'Sidebar'", description: 'aria-label of the primary sidebar <aside>.' },
    { name: 'sidebarEndLabel', type: 'string', default: "'Secondary sidebar'", description: 'aria-label of the end sidebar <aside> (dual-sidebar).' },
    { name: 'main', type: 'boolean', default: 'true', description: 'Render the page region as a `<main>` landmark. Set `false` to render a `div` when the shell is embedded in a page that already has a main landmark (live demos, nested apps).' },
    { name: 'skipLink', type: 'boolean', default: 'false', description: 'Render a skip link to the main content (visible on focus).' },
    { name: 'skipLinkLabel', type: 'string', default: "'Skip to main content'", description: 'Text of the skip link.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Root element.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'header', description: 'Sticky top bar (<header>). Not rendered when empty.', props: SLOT_PROPS },
    { name: 'sidebar', description: 'Primary sidebar content inside <aside> (start side; end side with layout sidebar-right). Not rendered when empty or with layout top-nav (and no drawer/backdrop).', props: SLOT_PROPS },
    { name: 'sidebar-end', description: 'Second sidebar for layout dual-sidebar, on the end side. Ignored in other layouts.', props: SLOT_PROPS },
    { name: 'default', description: 'Main page content inside <main>.', props: SLOT_PROPS },
    { name: 'footer', description: 'Footer (<footer>) under main. Not rendered when empty.', props: SLOT_PROPS },
  ],
  emits: [
    { name: 'update:collapsed', payload: '[value: boolean]', description: 'Sidebar collapsed state changed (v-model:collapsed).' },
    { name: 'update:open', payload: '[value: boolean]', description: 'Primary drawer opened/closed, including backdrop click, Escape and growing past the drawer breakpoint (v-model:open).' },
    { name: 'update:collapsedEnd', payload: '[value: boolean]', description: 'End sidebar collapsed state changed (v-model:collapsedEnd).' },
    { name: 'update:openEnd', payload: '[value: boolean]', description: 'End drawer opened/closed (v-model:openEnd).' },
  ],
  examples: [
    {
      title: 'Basic shell',
      code: `<div class="h-72 overflow-hidden rounded-md border">
  <AppShell :main="false" class="min-h-full" sidebar-label="Basic shell sidebar">
    <template #header><div class="px-4 py-2 text-sm font-medium">App</div></template>
    <template #sidebar><div class="p-3 text-sm">Sidebar nav</div></template>
    <div class="p-4 text-sm">Main content</div>
  </AppShell>
</div>`,
    },
    {
      title: 'Layout: sidebar-left',
      description: 'Full-height sidebar; the header sits over the content column.',
      code: `<div class="h-72 overflow-hidden rounded-md border">
  <AppShell :main="false" layout="sidebar-left" class="min-h-full" sidebar-label="Left sidebar">
    <template #header><div class="px-4 py-2 text-sm font-medium">Page header</div></template>
    <template #sidebar><div class="p-3 text-sm">Left nav</div></template>
    <div class="p-4 text-sm">Main content</div>
  </AppShell>
</div>`,
    },
    {
      title: 'Layout: sidebar-right',
      description: 'The sidebar slot is placed on the end side (right in LTR), e.g. a settings or details panel.',
      code: `<div class="h-72 overflow-hidden rounded-md border">
  <AppShell :main="false" layout="sidebar-right" class="min-h-full" sidebar-label="Right details panel">
    <template #header><div class="px-4 py-2 text-sm font-medium">Page header</div></template>
    <template #sidebar><div class="p-3 text-sm">Details panel</div></template>
    <div class="p-4 text-sm">Main content</div>
  </AppShell>
</div>`,
    },
    {
      title: 'Layout: top-nav only',
      description: 'No sidebar: a header (put your top navigation in it) over the content.',
      code: `<div class="h-72 overflow-hidden rounded-md border">
  <AppShell :main="false" layout="top-nav" class="min-h-full">
    <template #header><nav class="flex gap-4 px-4 py-2 text-sm" aria-label="Primary"><a href="/components/layout/container">Container</a><a href="/components/layout/grid">Grid</a><a href="/components/layout/stack">Stack</a></nav></template>
    <div class="p-4 text-sm">Main content</div>
  </AppShell>
</div>`,
    },
    {
      title: 'Layout: top-nav + sidebar',
      description: 'The default: a full-width header above the sidebar and the content.',
      code: `<div class="h-72 overflow-hidden rounded-md border">
  <AppShell :main="false" layout="top-nav-sidebar" class="min-h-full" sidebar-label="Top and side navigation">
    <template #header><div class="px-4 py-2 text-sm font-medium">Top navigation</div></template>
    <template #sidebar><div class="p-3 text-sm">Sidebar</div></template>
    <div class="p-4 text-sm">Main content</div>
  </AppShell>
</div>`,
    },
    {
      title: 'Layout: dual sidebar',
      description: 'Navigation on the start side (`sidebar`) and a details panel on the end side (`sidebar-end`). Each has its own collapsed/open state.',
      code: `<div class="h-72 overflow-hidden rounded-md border">
  <AppShell :main="false" layout="dual-sidebar" class="min-h-full" sidebar-label="Dual navigation" sidebar-end-label="Dual details">
    <template #header><div class="px-4 py-2 text-sm font-medium">Dual sidebar</div></template>
    <template #sidebar><div class="p-3 text-sm">Navigation</div></template>
    <template #sidebar-end><div class="p-3 text-sm">Details</div></template>
    <div class="p-4 text-sm">Main content</div>
  </AppShell>
</div>`,
    },
    {
      title: 'Rail width and widths',
      description: '`collapsed` with a wide rail (`rail-width="lg"`) and a narrow expanded sidebar (`sidebar-width="sm"`).',
      script: `const collapsed = ref(true)`,
      code: `<div class="h-60 overflow-hidden rounded-md border">
  <AppShell :main="false" v-model:collapsed="collapsed" layout="sidebar-left" rail-width="lg" sidebar-width="sm" class="min-h-full" sidebar-label="Rail sidebar">
    <template #sidebar="{ collapsed: isCollapsed }"><div class="p-3 text-sm">{{ isCollapsed ? 'N' : 'Navigation' }}</div></template>
    <div class="p-4 text-sm"><Button size="sm" variant="outline" @click="collapsed = !collapsed">Toggle rail</Button></div>
  </AppShell>
</div>`,
      state: () => ({ collapsed: ref(true) }),
    },
    {
      title: 'Collapse mode: hidden',
      description: '`collapse-mode="hidden"` removes the sidebar on desktop while collapsed (full-width content).',
      script: `const collapsed = ref(false)`,
      code: `<div class="h-60 overflow-hidden rounded-md border">
  <AppShell :main="false" v-model:collapsed="collapsed" collapse-mode="hidden" layout="sidebar-left" class="min-h-full" sidebar-label="Hideable sidebar">
    <template #sidebar><div class="p-3 text-sm">Navigation</div></template>
    <div class="p-4 text-sm"><Button size="sm" variant="outline" @click="collapsed = !collapsed">{{ collapsed ? 'Show' : 'Hide' }} sidebar</Button></div>
  </AppShell>
</div>`,
      state: () => ({ collapsed: ref(false) }),
    },
    {
      title: 'Content max width',
      description: '`content-max-width` centres the page content in a Container-style wrapper.',
      code: `<div class="h-60 overflow-hidden rounded-md border">
  <AppShell :main="false" layout="sidebar-left" content-max-width="2xl" class="min-h-full" sidebar-label="Constrained sidebar">
    <template #sidebar><div class="p-3 text-sm">Sidebar</div></template>
    <div class="py-4 text-sm">Content is centred and limited to max-w-2xl.</div>
  </AppShell>
</div>`,
    },
    {
      title: 'Mobile drawer (below lg)',
      description: '`drawer-breakpoint="lg"` keeps the sidebar off-canvas below 1024px. Open it with the header button; Escape or the backdrop closes it. Resize the window to see both modes.',
      script: `const open = ref(false)`,
      code: `<div class="h-72 overflow-hidden rounded-md border">
  <AppShell :main="false" v-model:open="open" drawer-breakpoint="lg" class="min-h-full" sidebar-label="Drawer navigation">
    <template #header="{ toggle, triggerProps }">
      <div class="flex items-center gap-2 px-3 py-2">
        <Button size="icon-sm" variant="ghost" aria-label="Open navigation" v-bind="triggerProps" @click="toggle"><Icon :icon="faBars" /></Button>
        <span class="text-sm font-medium">Sample app</span>
      </div>
    </template>
    <template #sidebar><div class="p-3 text-sm">Navigation</div></template>
    <div class="p-4 text-sm">Drawer open: {{ open }}</div>
  </AppShell>
</div>`,
      state: () => ({ open: ref(false), faBars }),
    },
    {
      title: 'Collapsible sidebar with toggle',
      script: `const collapsed = ref(false)\nconst open = ref(false)`,
      code: `<div class="h-72 overflow-hidden rounded-md border">
  <AppShell :main="false" v-model:collapsed="collapsed" v-model:open="open" class="min-h-full" sidebar-label="Main navigation">
    <template #header="{ toggle, triggerProps }">
      <div class="flex items-center gap-2 px-3 py-2">
        <Button size="icon-sm" variant="ghost" aria-label="Toggle sidebar" v-bind="triggerProps" @click="toggle"><Icon :icon="faBars" /></Button>
        <span class="text-sm font-medium">Dashboard</span>
      </div>
    </template>
    <template #sidebar="{ collapsed: isCollapsed }">
      <div class="p-3 text-sm">{{ isCollapsed ? 'N' : 'Navigation' }}</div>
    </template>
    <div class="p-4 text-sm">Collapsed: {{ collapsed }}, drawer open: {{ open }}</div>
  </AppShell>
</div>`,
      state: () => ({ collapsed: ref(false), open: ref(false), faBars }),
    },
  ],
  a11y: [
    'Sidebar is an <aside> landmark with `aria-label` (sidebarLabel); header, main and footer are native landmarks.',
    '<main> has an id and tabindex="-1" so skip links and programmatic focus work; enable `skipLink` for a built-in skip link.',
    'Mobile drawer: while open the sidebar is `role="dialog"` with `aria-modal="true"` and its `aria-label`; the header, content and the other sidebar are `inert`, so Tab cannot leave the drawer and screen readers cannot reach the page behind it. The backdrop is aria-hidden and closes on click; Escape closes it; focus moves into the drawer on open and returns to the previously focused control on close; page scroll is locked while it is open.',
    'Menu button: give it an `aria-label` and spread the `triggerProps` slot prop on it (`aria-controls` points at the sidebar id, `aria-expanded` follows the drawer on mobile and the collapsed state on desktop).',
    'Responsive: below the drawer breakpoint the content column is full width (no sidebar column), so nothing scrolls horizontally at 320px; the drawer is capped to the viewport width.',
    'Only one `<main>` per page: pass `:main="false"` when the shell is embedded.',
    'Give each sidebar a distinct accessible name (`sidebarLabel`, `sidebarEndLabel`) when there are two.',
    'With `layout="sidebar-right"` or `dual-sidebar` the end sidebar comes after the main content in the DOM, which is its reading and tab order.',
    'Collapsing only changes width; make sure collapsed sidebar items keep accessible names (aria-label on icon-only links).',
  ],
  related: ['PageHeader', 'Container', 'SplitLayout', 'CenteredLayout'],
  requires: [
    'Throws a ContractError when a rendered sidebar has a blank `sidebarLabel` (or `sidebarEndLabel` for the end sidebar).',
    'Throws a ContractError when `skipLink` is set and `mainId` or `skipLinkLabel` is blank.',
    'Throws a ContractError when `main` is false and the page has no `<main>` (or `role="main"`) landmark elsewhere.',
  ],
  llmNotes: [
    'Sidebar content is the consumer\'s; AppShell only provides the frame, width, drawer behaviour and tokens.',
    'Bind both v-model:collapsed and v-model:open if you need to persist state; otherwise they work uncontrolled.',
    'Use the slot prop `toggle` for the hamburger button (`toggleEnd` for the end sidebar).',
    'Choose layout by structure: top-nav-sidebar (header over everything), sidebar-left/right (full-height sidebar), top-nav (no sidebar), dual-sidebar (two sidebars; use the sidebar-end slot).',
    'Use contentMaxWidth instead of wrapping the default slot in a Container; use drawerBreakpoint="lg" for dense sidebars that need more room.',
    'Do not mix collapsed with `open`: collapsed is desktop-only (rail/hidden), open is the mobile drawer.',
    'Pair with PageHeader inside the default slot for page titles.',
  ],
  replaces: ['hand-rolled AppShell markup in app code'],
}
export default doc
