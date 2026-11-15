import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const items = [
  { id: 'toc-demo-overview', label: 'Overview', level: 2 },
  { id: 'toc-demo-install', label: 'Installation', level: 2 },
  { id: 'toc-demo-usage', label: 'Usage', level: 3 },
  { id: 'toc-demo-api', label: 'API', level: 2 },
]

const doc: ComponentDoc = {
  name: 'TableOfContents',
  group: 'navigation',
  subgroup: 'Docs',
  summary: 'In-page "On this page" list that highlights the section being read and scrolls to a section on click.',
  description:
    'Pass `items` (`{ id, label, level? }`) whose `id`s match heading/section elements in the page. The active entry is tracked with an `IntersectionObserver` (first visible section in document order wins; the last one stays active while none is visible) and is exposed with `v-model`. Without IntersectionObserver (or when no target element exists) it degrades gracefully: links still navigate natively, clicks set the active entry and the initial entry comes from the URL hash. `offset` reserves space for a sticky header. Indentation is relative to the shallowest level present. Use `Breadcrumb` for site hierarchy and `Tabs` for switching views.',
  status: 'stable',
  props: [
    { name: 'items', type: 'TocItem[]', required: true, description: 'Entries `{ id, label, level? }`. Items with a missing id or non-string label are skipped.' },
    { name: 'modelValue', type: 'string', description: 'Active section id (v-model). Tracked internally when omitted.' },
    { name: 'title', type: 'string', default: "'On this page'", description: 'Heading above the list; empty string hides it.' },
    { name: 'offset', type: 'number', default: '80', description: 'Pixels at the top of the viewport reserved for a sticky header.' },
    { name: 'variant', type: "'line' | 'rail' | 'boxed'", default: "'line'", description: '`line`: a thin rule with a marker on the current entry. `rail`: a thicker rule. `boxed`: a bordered card where the current entry is filled. Unknown values fall back to `line`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size of the title and entries. Unknown values fall back to `md`.' },
    { name: 'smooth', type: 'boolean', default: 'true', description: 'Smooth scroll on click (ignored under prefers-reduced-motion).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[id: string]', description: 'The active section changed (scroll tracking or click).' },
    { name: 'select', payload: '[id: string]', description: 'A link was clicked.' },
  ],
  examples: [
    {
      title: 'Basic',
      code: `<div class="w-56">
  <h2 id="toc-demo-overview" class="sr-only">Overview</h2>
  <h2 id="toc-demo-install" class="sr-only">Installation</h2>
  <h3 id="toc-demo-usage" class="sr-only">Usage</h3>
  <h2 id="toc-demo-api" class="sr-only">API</h2>
  <TableOfContents :items="items" />
</div>`,
      state: () => ({ items }),
    },
    {
      title: 'Variants',
      description: 'Gallery of `line`, `rail` and `boxed` with the second entry current.',
      code: `<div class="flex flex-wrap items-start gap-6">
  <TableOfContents v-for="variant in ['line', 'rail', 'boxed']" :key="variant" :items="items" model-value="toc-demo-install" :variant="variant" :title="'Variant ' + variant" class="w-52" />
</div>`,
      state: () => ({ items }),
    },
    {
      title: 'Sizes',
      description: 'Gallery of `sm`, `md` and `lg`.',
      code: `<div class="flex flex-wrap items-start gap-6">
  <TableOfContents v-for="size in ['sm', 'md', 'lg']" :key="size" :items="items" model-value="toc-demo-usage" :size="size" :title="'Size ' + size" class="w-52" />
</div>`,
      state: () => ({ items }),
    },
    {
      title: 'Controlled active section',
      script: `const active = ref('toc-demo-install')`,
      code: `<div class="space-y-3">
  <TableOfContents v-model="active" :items="items" title="Contents" class="w-56" />
  <p class="text-sm text-muted-foreground">Active: {{ active }}</p>
</div>`,
      state: () => ({ items, active: ref('toc-demo-install') }),
    },
  ],
  a11y: [
    '`<nav aria-label>` (the title, or "Table of contents"): use a different `title` for each TableOfContents on a page.',
    'The active link has aria-current="location" and, besides the colour change, a border marker and a medium font weight (underline in forced-colors mode).',
    'Links are native anchors, so Tab and Enter work; each is at least 24px high. Indentation uses `ps-*` and the rail uses `border-s`, so it mirrors in RTL.',
    'In `boxed` the current entry is filled with the accent surface and keeps the medium weight; in `line` and `rail` it gets the border marker. Both are underlined in forced colors, so the state never relies on colour alone.',
    'Clicking moves the viewport and updates the URL hash without a page reload; reduced motion disables smooth scrolling.',
  ],
  related: ['DocsSidebar', 'Breadcrumb', 'Tabs'],
  requires: [
    'Throws a ContractError when `items` is empty or not an array.',
    'Throws a ContractError when an item has a blank `id` or `label`, or two items share an `id`. Whether an id exists in the page is not checked, because routes render later.',
  ],
  llmNotes: ['Every `id` must exist on an element in the page, otherwise that entry is not tracked.', 'Render it once the heading list is known: empty `items` throws.', 'Set `offset` to your sticky header height.', 'Make it sticky with a class (`sticky top-20`), not inside the component.'],
  replaces: ['hand-rolled TableOfContents markup in app code'],
}
export default doc
