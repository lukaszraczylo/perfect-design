import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Pagination',
  group: 'navigation',
  subgroup: 'Paging',
  summary: 'Page navigation with first/prev/next/last, sibling window and ellipses. Compact "Page X of Y" on small screens.',
  description:
    'Give it `total` (item count) and `pageSize`; bind the 1-based page with `v-model:page`. Invalid input is sanitised: the page is clamped into range (and `update:page` re-emitted with the corrected value), a negative/NaN total means one empty page, and a pageSize below 1 falls back to 10. Below the `sm` breakpoint it shows a compact summary between prev/next; `compact` forces that everywhere. For cursor/"load more" lists use a Button instead.',
  status: 'stable',
  props: [
    { name: 'page', type: 'number', description: 'Current page, 1-based (v-model:page). Clamped to [1, totalPages].' },
    { name: 'defaultPage', type: 'number', default: '1', description: 'Initial page when uncontrolled.' },
    { name: 'total', type: 'number', default: '0', description: 'Total item count.' },
    { name: 'pageSize', type: 'number', default: '10', description: 'Items per page.' },
    { name: 'siblings', type: 'number', default: '1', description: 'Page buttons kept each side of the current page.' },
    { name: 'showEdges', type: 'boolean', default: 'true', description: 'Show first/last buttons.' },
    { name: 'variant', type: "'numbered' | 'simple' | 'compact'", default: "'numbered'", description: '`numbered`: page buttons (compact summary below `sm`). `simple`: outline Previous and Next buttons with text and "Page X of Y" between them; page and edge buttons are not rendered. `compact`: "Page X of Y" between icon arrows at every width. Unknown values fall back to `numbered`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Button and text size: 24px, 32px or 44px targets (coarse pointers get at least 40px). Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corner style of every button. Unknown values fall back to `rounded`.' },
    { name: 'compact', type: 'boolean', default: 'false', description: 'Same as `variant="compact"`: always use the "Page X of Y" layout.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable every control.' },
    { name: 'labels', type: 'Partial<PaginationLabels>', description: 'Override nav, first, previous, next, last, page, summary (`{page}`/`{total}` placeholders) for i18n.' },
    { name: 'class', type: 'string | object | array', description: 'Merged onto the nav.' },
  ],
  emits: [{ name: 'update:page', payload: '[page: number]', description: 'Page changed by the user, or corrected after clamping.' }],
  examples: [
    {
      title: 'Basic',
      script: `const page = ref(1)`,
      code: `<div class="space-y-2">
  <Pagination v-model:page="page" :total="235" :page-size="10" :labels="{ nav: 'Basic pagination' }" />
  <p class="text-center text-sm text-muted-foreground">Showing page {{ page }}</p>
</div>`,
      state: () => ({ page: ref(1) }),
    },
    {
      title: 'Many pages, wider window',
      script: `const page = ref(50)`,
      code: `<Pagination v-model:page="page" :total="10000" :page-size="10" :siblings="2" :labels="{ nav: 'Wide pagination' }" />`,
      state: () => ({ page: ref(50) }),
    },
    {
      title: 'Simple variant',
      description: 'Previous and next with text. The labels come from `labels.previous` and `labels.next`.',
      script: `const page = ref(2)`,
      code: `<Pagination v-model:page="page" variant="simple" :total="90" :labels="{ nav: 'Simple pagination' }" />`,
      state: () => ({ page: ref(2) }),
    },
    {
      title: 'Sizes and shapes',
      description: 'Gallery: `sm`, `md` and `lg` with the rounded, pill and square shapes.',
      script: `const page = ref(4)`,
      code: `<div class="grid gap-4">
  <Pagination v-model:page="page" size="sm" shape="rounded" :total="200" :labels="{ nav: 'Small rounded pagination' }" />
  <Pagination v-model:page="page" size="md" shape="pill" :total="200" :labels="{ nav: 'Medium pill pagination' }" />
  <Pagination v-model:page="page" size="lg" shape="square" :total="200" :labels="{ nav: 'Large square pagination' }" />
</div>`,
      state: () => ({ page: ref(4) }),
    },
    {
      title: 'Compact without edges',
      script: `const page = ref(3)`,
      code: `<Pagination v-model:page="page" :total="90" variant="compact" :show-edges="false" :labels="{ nav: 'Compact pagination' }" />`,
      state: () => ({ page: ref(3) }),
    },
  ],
  a11y: [
    '`<nav aria-label="Pagination">`; the current page button has aria-current="page". Pass `labels.nav` when a page holds more than one pager.',
    'Every button has an accessible name ("Page 3", "Next page"...); the visible number is inside it (WCAG 2.5.3). Page numbers use `tabular-nums` so the controls do not jump.',
    'The compact summary is aria-live="polite". Edge buttons are truly disabled; when the pressed button becomes disabled (Next on the last page) focus moves to the opposite arrow instead of falling to the page.',
    'Buttons are 32px (40px on coarse pointers) at `md`, 24px at `sm` (40px on coarse pointers) and 44px at `lg`; the row wraps at narrow widths, and arrows flip in RTL.',
    'The `simple` variant names its buttons from their visible text ("Previous page", "Next page") and keeps the live "Page X of Y" summary; `shape` and `size` never change names or roles.',
  ],
  related: ['Button', 'Tabs'],
  requires: [
    'Throws a ContractError when a `labels` entry (`nav`, `previous`, `next`, `page`, and `first` / `last` while `showEdges` is on) is blank. Invalid `page`, `total` and `pageSize` are still clamped without an error.',
  ],
  llmNotes: [
    'Use `v-model:page` with a 1-based page; pass `total` as an item count, not a page count.',
    'Do not clamp the page yourself; the component does and re-emits.',
    'Pass `labels` when the app is localised.',
  ],
  replaces: ['hand-rolled Pagination markup in app code'],
}
export default doc
