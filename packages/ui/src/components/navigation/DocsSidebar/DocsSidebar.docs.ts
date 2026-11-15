import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const sections = [
  { title: 'Getting started', items: [{ label: 'Introduction', href: '/guides/getting-started' }, { label: 'Customisation', href: '/guides/customisation' }] },
  { title: 'Guides', items: [{ label: 'Testing', href: '/guides/testing' }, { label: 'LLM usage', href: '/guides/llm', badge: 'new' }, { label: 'Components', href: '/components' }] },
]

const doc: ComponentDoc = {
  name: 'DocsSidebar',
  group: 'navigation',
  subgroup: 'Docs',
  summary: 'Documentation-style grouped link list with section titles and an active page indicator.',
  description:
    'Pass `sections` (`{ title, items: { label, href | to, badge?, active? }[] }`). The link equal to `current` is highlighted with `aria-current="page"`. Lighter and text-only compared with `SidebarNav` (no icons, no collapsing). Router-agnostic: use `link-as` with RouterLink or react to `navigate`. Pair with `TableOfContents` for a docs layout.',
  status: 'stable',
  props: [
    { name: 'sections', type: 'DocsSidebarSection[]', required: true, description: 'Sections `{ id?, title, items: DocsSidebarLink[] }`. Malformed entries are skipped.' },
    { name: 'current', type: 'string', description: 'Current path/href; the matching link is active unless it sets `active`.' },
    { name: 'linkAs', type: 'string | Component', default: "'a'", description: 'Link element/component, e.g. RouterLink (receives `to`).' },
    { name: 'variant', type: "'default' | 'compact' | 'rail'", default: "'default'", description: '`default`: pill links. `compact`: tighter spacing. `rail`: plain links on a vertical rule with a marker on the current page. Unknown values fall back to `default`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Link height: 24px, 32px or 36px. Unknown values fall back to `md`.' },
    { name: 'label', type: 'string', default: "'Documentation'", description: 'aria-label of the nav landmark.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  emits: [{ name: 'navigate', payload: '[link: DocsSidebarLink, event: MouseEvent]', description: 'A link was clicked.' }],
  examples: [
    {
      title: 'Basic',
      code: `<div @click.prevent>
  <DocsSidebar :sections="sections" current="/guides/testing" label="Sample guides" class="w-56 max-w-full" />
</div>`,
      state: () => ({ sections }),
    },
    {
      title: 'Compact and rail',
      description: 'Gallery of the `compact` and `rail` variants.',
      code: `<div class="flex flex-wrap items-start gap-8">
  <DocsSidebar :sections="sections" current="/guides/getting-started" variant="compact" size="sm" label="Compact guides" class="w-48 max-w-full" @navigate="(l, e) => e.preventDefault()" />
  <DocsSidebar :sections="sections" current="/guides/getting-started" variant="rail" label="Rail guides" class="w-48 max-w-full" @navigate="(l, e) => e.preventDefault()" />
</div>`,
      state: () => ({ sections }),
    },
    {
      title: 'Driven by state',
      script: `const current = ref('/guides/getting-started')`,
      code: `<div class="flex flex-wrap items-start gap-6">
  <DocsSidebar :sections="sections" :current="current" label="Interactive guides" class="w-56 max-w-full" @navigate="(l, e) => { e.preventDefault(); current = l.href }" />
  <p class="text-sm text-muted-foreground">Current: {{ current }}</p>
</div>`,
      state: () => ({ sections, current: ref('/guides/getting-started') }),
    },
  ],
  a11y: [
    '`<nav aria-label>` (default "Documentation"): pass a distinct `label` when another navigation landmark with that name is on the page.',
    'Section titles are plain text (no heading level) so the sidebar never breaks the page heading order; each list is named by its title with aria-labelledby.',
    'Active link has aria-current="page". Links are at least 32px high (40px on coarse pointers).',
    'Tab moves through the links in order. Logical properties keep it correct in RTL.',
    'Every variant keeps the same lists, names and aria-current. In `rail` the current page is also marked by an inline-start border (not colour alone) and the usual forced-colors underline.',
  ],
  related: ['SidebarNav', 'TableOfContents', 'NavLink'],
  requires: [
    'Throws a ContractError when `sections` is empty, or a section has no `title` or no `items`.',
    'Throws a ContractError when a link has no non-empty `label`.',
    'Throws a ContractError when a link has neither `href` nor `to`, unless `@navigate` handles it as an action (it then renders as a button).',
    'Throws a ContractError when `label` is blank, because it names the nav landmark.',
  ],
  llmNotes: ['Use for documentation navigation; use SidebarNav for app navigation with icons.', 'Pass `current` instead of per-link `active` flags.'],
  replaces: ['hand-rolled DocsSidebar markup in app code'],
}
export default doc
