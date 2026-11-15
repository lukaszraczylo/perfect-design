import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const rows = Array.from({ length: 10000 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }))

const doc: ComponentDoc = {
  name: 'VirtualList',
  group: 'data-display',
  subgroup: 'Lists',
  summary: 'Fixed-row-height windowed list that renders only the visible rows, for 10 000+ items.',
  description:
    'Use `VirtualList` when a plain `v-for` would create thousands of DOM nodes (logs, long pickers, big result sets). Every row must have the same `itemHeight` (px); rows are absolutely positioned inside a spacer of the full height, so scrolling stays native. Give the list a height with `height` or a class (`h-96`). `overscan` rows are rendered beyond the viewport to avoid blank flashes. Scroll handling is throttled to one update per animation frame. For variable row heights or table semantics use `DataTable`; for short lists use `List`. Browsers cap element height (about 33 million px, less in Firefox), which limits very tall lists.',
  status: 'stable',
  props: [
    { name: 'items', type: 'readonly T[]', required: true, description: 'All items. Null is treated as an empty list.' },
    { name: 'itemHeight', type: 'number', required: true, description: 'Row height in px. Must be a positive finite number; otherwise a ContractError is thrown (rendering falls back to 32 when strict mode is off).' },
    { name: 'height', type: 'number | string', description: 'Viewport height (px number or CSS length). Without it, size the element with a height class (`h-96`, `max-h-*`, `size-*`, `flex-1`, `grow`) or an inline height; one of the two is required. Use `height="100%"` when a parent sizes the list.' },
    { name: 'overscan', type: 'number', default: '4', description: 'Extra rows rendered above and below the viewport. Negative / NaN mean 0.' },
    { name: 'itemKey', type: 'string | ((item: T, index: number) => string | number)', description: 'Stable key: property name or function. Defaults to the row index.' },
    { name: 'variant', type: "'plain' | 'bordered' | 'divided' | 'striped'", default: "'plain'", description: '`plain` is the unframed list, `bordered` adds a rounded border, `divided` draws a rule under each row and `striped` tints every second row (by index, so the stripes stay put while scrolling). Unknown values fall back to `plain`.' },
    { name: 'label', type: 'string', description: 'Accessible name of the list. Required: set `label`, `aria-label` or `aria-labelledby`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', props: '{ item: T; index: number }', description: 'Row content; the row box is `itemHeight` tall and clips overflow.' },
    { name: 'empty', description: 'Shown when `items` is empty (default "No items").' },
  ],
  emits: [
    { name: 'scroll', payload: '[scrollTop: number]', description: 'Scroll offset in px, at most once per animation frame.' },
    { name: 'range', payload: '[range: { start: number; end: number }]', description: 'Rendered index range (end exclusive, overscan included) whenever it changes.' },
  ],
  examples: [
    {
      title: '10 000 rows',
      description: 'Only the visible rows exist in the DOM.',
      code: `<VirtualList :items="rows" :item-height="36" :height="240" label="Rows" class="rounded-md border">
  <template #default="{ item, index }">
    <div class="flex h-full items-center justify-between px-3 text-sm">
      <span>{{ item.name }}</span>
      <span class="text-muted-foreground tabular-nums">#{{ index + 1 }}</span>
    </div>
  </template>
</VirtualList>`,
      script: `const rows = Array.from({ length: 10000 }, (_, i) => ({ id: i + 1, name: 'Row ' + (i + 1) }))`,
      state: () => ({ rows }),
    },
    {
      title: 'Jump to a row and read the range',
      code: `<div class="flex flex-col gap-2">
  <div class="flex items-center gap-2">
    <Button size="sm" variant="outline" @click="list.scrollToIndex(5000, 'center')">Go to row 5001</Button>
    <span class="text-sm text-muted-foreground">Rendered {{ range.start }} - {{ range.end }}</span>
  </div>
  <VirtualList ref="list" :items="rows" :item-height="32" :height="192" item-key="id" label="Jump list" class="rounded-md border" @range="range = $event">
    <template #default="{ item }"><div class="flex h-full items-center px-3 text-sm">{{ item.name }}</div></template>
  </VirtualList>
</div>`,
      script: `const rows = Array.from({ length: 10000 }, (_, i) => ({ id: i + 1, name: 'Row ' + (i + 1) }))
const list = ref(null)
const range = ref({ start: 0, end: 0 })`,
      state: () => ({ rows, list: ref(null), range: ref({ start: 0, end: 0 }) }),
    },
    {
      title: 'Variants',
      description: 'Gallery of `bordered`, `divided` and `striped` (sample rows).',
      script: `const rows = Array.from({ length: 200 }, (_, i) => ({ id: i + 1, name: 'Row ' + (i + 1) }))`,
      code: `<div class="flex flex-col gap-4">
  <VirtualList :items="rows" :item-height="32" :height="96" label="Bordered rows" variant="bordered" item-key="id"><template #default="{ item }"><span class="px-3 text-sm leading-8">{{ item.name }}</span></template></VirtualList>
  <VirtualList :items="rows" :item-height="32" :height="96" label="Divided rows" variant="divided" item-key="id"><template #default="{ item }"><span class="px-3 text-sm leading-8">{{ item.name }}</span></template></VirtualList>
  <VirtualList :items="rows" :item-height="32" :height="96" label="Striped rows" variant="striped" item-key="id"><template #default="{ item }"><span class="px-3 text-sm leading-8">{{ item.name }}</span></template></VirtualList>
</div>`,
      state: () => ({ rows: Array.from({ length: 200 }, (_, i) => ({ id: i + 1, name: 'Row ' + (i + 1) })) }),
    },
    {
      title: 'Empty state',
      code: `<VirtualList :items="[]" :item-height="32" :height="80" label="Empty list" class="rounded-md border">
  <template #empty>Nothing to show</template>
</VirtualList>`,
    },
  ],
  a11y: [
    'Root is `role="list"` and focusable (`tabindex=0`, shared focus ring) so keyboard users can scroll it with the arrow keys, Page Up / Page Down, Home and End; rows are `role="listitem"` with `aria-setsize` (total) and `aria-posinset` (1-based position), so assistive tech reports the real position even though most rows are not in the DOM.',
    'With no items the root becomes `role="group"` (an empty `role="list"` is invalid ARIA) and drops out of the tab order, because nothing scrolls.',
    'Give the list an accessible name with `label` or `aria-labelledby`.',
    'Interactive rows (buttons, links) only exist while rendered; keep roving focus logic outside the list or call `scrollToIndex` before focusing.',
  ],
  related: ['List', 'DataTable', 'Table', 'Tree'],
  requires: [
    'Throws a ContractError when `itemHeight` is not a positive finite number.',
    'Throws a ContractError when the list has no bounded height: set `height`, a height class (`h-*`, `max-h-*`, `size-*`, `flex-1`, `grow`) or an inline height. Use `height="100%"` when a parent sizes it.',
    'Throws a ContractError when the list has no accessible name (`label`, `aria-label` or `aria-labelledby`).',
  ],
  llmNotes: [
    'Every row must have the same height: set `item-height` to it and keep row content within that box.',
    'Always give the list a height (`height` prop or a `h-*` class); without one it grows to full size and nothing is windowed.',
    'Use `scrollToIndex(index, align)` through a template ref (`start | center | end | auto`).',
    'Pass `item-key` when items can be reordered or filtered so row state is preserved.',
  ],
}
export default doc
