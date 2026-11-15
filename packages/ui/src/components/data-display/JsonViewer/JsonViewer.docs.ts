import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const sample = {
  id: 'sample-1',
  status: 'paid',
  total: 129.9,
  paid: true,
  note: null,
  customer: { name: 'Sample customer', email: 'customer@example.com', tags: ['tag-a', 'tag-b'] },
  items: [
    { sku: 'item-a', qty: 1, price: 89.9 },
    { sku: 'item-b', qty: 2, price: 20 },
  ],
}

const doc: ComponentDoc = {
  name: 'JsonViewer',
  group: 'data-display',
  subgroup: 'Code and data',
  summary: 'Collapsible, keyboard-navigable tree for inspecting any JS/JSON value with type-coloured leaves and copy-path.',
  description:
    'Use `JsonViewer` to inspect API responses, config objects, logs and debug state. It renders objects, arrays, Map, Set, Date, BigInt, functions, symbols, `undefined` and `null`, marks circular references with `[Circular]` instead of looping, truncates huge arrays (`maxItems`, with a "Show N more" row) and long strings (`maxStringLength`), and caps total output at 10 000 rows. Every row has a copy-path button (`$.users[0].name`). Replace `value` to update the view (in-place mutation of a non-reactive object is not detected). It is a read-only viewer: for editable JSON use a code editor, for syntax highlighted source text use `CodeBlock`.',
  status: 'beta',
  props: [
    { name: 'value', type: 'unknown', description: 'Any value to display. Replace it (do not mutate) to update.' },
    { name: 'defaultExpandDepth', type: 'number', default: '1', description: 'Levels open initially: 0 = collapsed, 1 = root only, 2 = root and its children... Capped at 32; invalid values fall back to 1. Ignored once `v-model:expanded` holds a list.' },
    { name: 'expanded', type: 'string[]', description: '`v-model:expanded`: JSON paths of open containers (`"$"` is the root). Controlled when bound, uncontrolled otherwise.' },
    { name: 'maxItems', type: 'number', default: '100', description: 'Children shown per container before a "Show N more" row (each click reveals up to this many more). Invalid values fall back to 100.' },
    { name: 'maxStringLength', type: 'number', default: '120', description: 'Longer strings are cut with an ellipsis; the full text (up to 1000 chars) is in the tooltip. Invalid values fall back to 120.' },
    { name: 'rootLabel', type: 'string', description: 'Label shown before the root value.' },
    { name: 'showCopy', type: 'boolean', default: 'true', description: 'Show a copy-path button on each row (the `c` key copies the focused row\'s path either way).' },
    { name: 'variant', type: "'default' | 'plain' | 'flush'", default: "'default'", description: '`default` is a bordered card surface, `plain` has no chrome, `flush` is full-bleed with top and bottom rules only. Unknown values fall back to `default`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size: 12px, 14px or 16px. Unknown values fall back to `md`.' },
    { name: 'label', type: 'string', default: "'JSON'", description: 'Accessible name of the tree (`aria-label`).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  emits: [
    { name: 'update:expanded', payload: '[paths: string[]]', description: 'Open containers changed (click or keyboard).' },
    { name: 'copy', payload: '[event: { path: string; ok: boolean }]', description: 'A path copy finished; `ok` is false when the clipboard was unavailable or rejected.' },
  ],
  examples: [
    {
      title: 'Minimal',
      code: `<JsonViewer :value="data" class="max-w-lg" />`,
      script: `const data = { id: 'sample-1', paid: true, total: 129.9, note: null, tags: ['tag-a', 'tag-b'] }`,
      state: () => ({ data: { id: 'sample-1', paid: true, total: 129.9, note: null, tags: ['tag-a', 'tag-b'] } }),
    },
    {
      title: 'Expand depth and v-model:expanded',
      description: 'Start fully expanded, or control which paths are open.',
      script: `const order = { /* ... */ }\nconst open = ref(['$', '$.customer'])`,
      code: `<div class="flex flex-col gap-3 max-w-lg">
  <JsonViewer :value="order" v-model:expanded="open" root-label="order" />
  <p class="text-xs text-muted-foreground">Open paths: {{ open.join(', ') }}</p>
  <JsonViewer :value="order" :default-expand-depth="3" size="sm" variant="plain" />
</div>`,
      state: () => ({ order: sample, open: ref(['$', '$.customer']) }),
    },
    {
      title: 'Exotic and unsafe values',
      description: 'Circular references, Map/Set, Date, BigInt, functions and long strings are all handled.',
      script: `const node = { name: 'root', when: new Date(Date.UTC(2024, 1, 29)), big: 9007199254740993n, run() {}, tags: new Set(['a', 'b']), meta: new Map([['k', 1]]), text: 'sample '.repeat(60) }
node.self = node // circular`,
      code: `<JsonViewer :value="node" :default-expand-depth="2" :max-string-length="60" class="max-w-lg" />`,
      state: () => {
        const node: Record<string, unknown> = { name: 'root', when: new Date(Date.UTC(2024, 1, 29)), big: 9007199254740993n, run() {}, tags: new Set(['a', 'b']), meta: new Map([['k', 1]]), text: 'sample '.repeat(60) }
        node.self = node
        return { node }
      },
    },
    {
      title: 'Huge arrays are truncated',
      description: '10 000 items render 25 at a time with a "Show N more" row.',
      script: `const big = Array.from({ length: 10000 }, (_, i) => ({ id: i }))`,
      code: `<JsonViewer :value="big" :max-items="25" class="max-w-lg" />`,
      state: () => ({ big: Array.from({ length: 10_000 }, (_, i) => ({ id: i })) }),
    },
    {
      title: 'Copy path feedback',
      script: `const last = ref('nothing yet')\nfunction onCopy(e) { last.value = e.ok ? e.path : 'clipboard unavailable' }`,
      code: `<div class="flex flex-col gap-2 max-w-lg">
  <JsonViewer :value="order" :default-expand-depth="3" @copy="onCopy" />
  <p class="text-xs text-muted-foreground">Last copied: {{ last }}</p>
</div>`,
      state: () => {
        const last = ref('nothing yet')
        return { order: sample, last, onCopy: (e: { path: string; ok: boolean }) => (last.value = e.ok ? e.path : 'clipboard unavailable') }
      },
    },
    {
      title: 'Sizes',
      code: `<div class="flex flex-wrap gap-3">
  <JsonViewer :value="{ a: 1 }" size="sm" />
  <JsonViewer :value="{ a: 1 }" size="md" />
  <JsonViewer :value="{ a: 1 }" size="lg" />
</div>`,
    },
    {
      title: 'Variants',
      code: `<div class="flex flex-wrap gap-3">
  <JsonViewer :value="{ a: [1, 2] }" variant="default" />
  <JsonViewer :value="{ a: [1, 2] }" variant="plain" />
  <JsonViewer :value="{ a: [1, 2] }" variant="flush" />
</div>`,
    },
  ],
  a11y: [
    'Follows the ARIA tree pattern: `role="tree"` with flat `treeitem`s carrying `aria-level`, `aria-posinset`, `aria-setsize` and `aria-expanded` (containers with children only). Name the tree with `label` or `aria-label` (defaults to "JSON"; falls through to the root).',
    'Roving tabindex: one tab stop. Up/Down move, Home/End jump, Right expands or enters, Left collapses or goes to the parent, Enter/Space toggle (or reveal more), `c` copies the path of the focused row.',
    'Copy buttons are mouse/touch affordances (`tabindex="-1"`, 24px, labelled "Copy path ..."); keyboard users use the `c` key. They appear on hover and focus-within.',
    'Value types are distinguished by colour and by their text (quotes, `n` suffix, `ƒ`, `[Circular]`), never by colour alone. Chevron animation is disabled under `prefers-reduced-motion`.',
  ],
  related: ['CodeBlock', 'Tree', 'DescriptionList'],
  llmNotes: [
    'Pass the raw value (object/array/anything), not a JSON string; call JSON.parse first for strings.',
    'Replace `value` with a new object to refresh; in-place mutation of non-reactive data will not re-render.',
    'Use `v-model:expanded` with JSON paths such as `$` and `$.items[0]` to control or persist expansion.',
    'Raise `maxItems` only when needed: rows are capped at 10 000 regardless.',
    'It is read-only; do not use it as an editor.',
    'Set `aria-label` when several viewers are on one page.',
  ],
}

export default doc
