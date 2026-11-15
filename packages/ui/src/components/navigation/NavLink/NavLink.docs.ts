import { ref } from 'vue'
import { faBell, faGear, faHouse } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'NavLink',
  group: 'navigation',
  subgroup: 'Links',
  summary: 'Navigation link with an active state (aria-current), optional icon and badge. Router-agnostic.',
  description:
    'Renders an `<a>`. Set `active` explicitly, or provide an app-wide predicate once with `provide(NAV_IS_ACTIVE_KEY, (target) => boolean)` and NavLink derives `aria-current="page"` from its `href`/string `to`. Works without vue-router: for client-side routing pass `as` a RouterLink (it receives `to`) or wrap one with `as-child`. `variant` selects the active treatment: `default` (text colour), `pill` (accent background), `sidebar` (sidebar tokens), `underline` (bottom border), `plain` (body text, bold when current), `solid` (primary chip) and `outline` (bordered chip). `size` runs from `xs` (24px) to `lg` (44px) and `shape` rounds the corners (`rounded`, `pill`, `square`). Use `Link` from primitives for inline text links; use NavLink for navigation lists.',
  status: 'stable',
  props: [
    { name: 'href', type: 'string', description: 'Plain URL for the anchor.' },
    { name: 'to', type: 'string | object', description: 'Router target. A string doubles as the target for the injected isActive predicate; forwarded as `to` when `as` is a component.' },
    { name: 'active', type: 'boolean', description: 'Explicit active state. When omitted, the injected NAV_IS_ACTIVE_KEY predicate decides (inactive if none).' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Removes href, sets aria-disabled, blocks clicks.' },
    { name: 'variant', type: "'default' | 'pill' | 'sidebar' | 'underline' | 'plain' | 'solid' | 'outline'", default: "'default'", description: 'Active/hover treatment. `plain` has no hover fill and is bold when current, `solid` fills the current link with the primary colour, `outline` borders it.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Height and padding (24px, 32px, 36px, 44px). Coarse pointers get at least 40px. Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corner style. `rounded` keeps the variant radius; `underline` has no corners. Unknown values fall back to `rounded`.' },
    { name: 'icon', type: 'IconDefinition', description: 'FontAwesome icon before the label.' },
    { name: 'badge', type: 'string | number', description: 'Trailing badge text.' },
    { name: 'collapsed', type: 'boolean', default: 'false', description: 'Icon-only: label becomes sr-only and the badge is hidden.' },
    { name: 'as', type: 'string | Component', default: "'a'", description: 'Element or component (e.g. RouterLink).' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single child instead of an anchor.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge.' },
  ],
  slots: [
    { name: 'default', description: 'Label.' },
    { name: 'icon', description: 'Custom icon content (overrides the icon prop).' },
    { name: 'badge', description: 'Custom trailing content (overrides the badge prop).' },
  ],
  examples: [
    {
      title: 'Variants and active state',
      code: `<div class="flex flex-wrap items-center gap-2" @click.prevent>
  <NavLink href="/components" active>Components</NavLink>
  <NavLink href="/guides/getting-started">Guides</NavLink>
  <NavLink href="/components" variant="pill" active>Pill</NavLink>
  <NavLink href="/components" variant="underline" active>Underline</NavLink>
  <NavLink href="/components" disabled>Disabled</NavLink>
</div>`,
    },
    {
      title: 'More variants',
      description: 'Gallery of `plain`, `solid` and `outline`, each with the first link current.',
      code: `<div class="grid gap-3" @click.prevent>
  <div class="flex flex-wrap gap-2"><NavLink href="/components" variant="plain" active>Plain</NavLink><NavLink href="/guides/getting-started" variant="plain">Guides</NavLink></div>
  <div class="flex flex-wrap gap-2"><NavLink href="/components" variant="solid" active>Solid</NavLink><NavLink href="/guides/getting-started" variant="solid">Guides</NavLink></div>
  <div class="flex flex-wrap gap-2"><NavLink href="/components" variant="outline" active>Outline</NavLink><NavLink href="/guides/getting-started" variant="outline">Guides</NavLink></div>
</div>`,
    },
    {
      title: 'Sizes and shapes',
      description: 'Gallery: `xs` to `lg` with `rounded`, `pill` and `square` corners (current link shown with `solid`).',
      code: `<div class="grid gap-3" @click.prevent>
  <div class="flex flex-wrap items-center gap-2"><NavLink v-for="size in ['xs', 'sm', 'md', 'lg']" :key="size" href="/components" variant="solid" :size="size" active>Size {{ size }}</NavLink></div>
  <div class="flex flex-wrap items-center gap-2"><NavLink v-for="shape in ['rounded', 'pill', 'square']" :key="shape" href="/components" variant="solid" :shape="shape" active>{{ shape }}</NavLink></div>
</div>`,
    },
    {
      title: 'Icon and badge, sidebar style',
      code: `<div class="w-56 max-w-full space-y-1 rounded-lg bg-sidebar p-2" @click.prevent>
  <NavLink href="/components" variant="sidebar" :icon="faHouse" active>Overview</NavLink>
  <NavLink href="/components/feedback" variant="sidebar" :icon="faBell" badge="3">Alerts</NavLink>
  <NavLink href="/guides/customisation" variant="sidebar" :icon="faGear" collapsed title="Settings">Settings</NavLink>
</div>`,
      state: () => ({ faHouse, faBell, faGear }),
    },
    {
      title: 'Active from an injected predicate',
      description: 'In an app, provide once: `app.provide(NAV_IS_ACTIVE_KEY, (to) => route.path === to)`. Here `active` is driven by state.',
      script: `const current = ref('/a')`,
      code: `<div class="flex gap-2">
  <NavLink href="/components" variant="pill" :active="current === '/a'" @click.prevent="current = '/a'">First</NavLink>
  <NavLink href="/guides/getting-started" variant="pill" :active="current === '/b'" @click.prevent="current = '/b'">Second</NavLink>
</div>`,
      state: () => ({ current: ref('/a') }),
    },
  ],
  a11y: [
    'Active link gets aria-current="page" and, in forced-colors mode, an underline (backgrounds are dropped there). Every variant marks the current page by more than colour: a fill, a border, a bottom rule or bold text.',
    'Disabled links drop href, get aria-disabled and tabindex=-1.',
    'Collapsed mode keeps the label as sr-only text; add a `title` for a tooltip. The badge is hidden when collapsed.',
    'Targets are 24px (`xs`), 32px (`sm`), 36px (`md`) and 44px (`lg`) high, at least 40px on coarse pointers. The badge uses `ms-auto`, so it mirrors in RTL.',
    'Focus is shown with the shared focus ring; transitions only run under `motion-safe`.',
  ],
  related: ['SidebarNav', 'DocsSidebar', 'Tabs'],
  requires: [
    'Throws a ContractError when a `NavLink` rendered as an anchor or a router component has no `href` or `to` (unless `disabled`, `as-child` or `as="button"`).',
    'Throws a ContractError when a `NavLink` has no accessible name (text or `aria-label`).',
  ],
  llmNotes: [
    'Do not hard-code router logic; pass `as` a RouterLink or use `as-child`.',
    'Prefer providing NAV_IS_ACTIVE_KEY once over setting `active` on each link.',
    'Use `collapsed` together with a `title` for icon-only links.',
    'Icons are FontAwesome IconDefinition objects, not strings.',
  ],
  replaces: ['hand-rolled NavLink markup in app code'],
}
export default doc
