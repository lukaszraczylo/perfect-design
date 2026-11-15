import { ref } from 'vue'
import { faFileCode, faFolder } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const items = [
  { id: 'src', label: 'src', icon: faFolder, children: [{ id: 'main', label: 'main.ts', icon: faFileCode }, { id: 'lib', label: 'lib', icon: faFolder, children: [{ id: 'utils', label: 'utils.ts', icon: faFileCode }] }] },
  { id: 'docs', label: 'docs', icon: faFolder, children: [{ id: 'readme', label: 'README.md' }] },
  { id: 'pkg', label: 'package.json' },
]

const doc: ComponentDoc = {
  name: 'Tree',
  group: 'data-display',
  subgroup: 'Hierarchy',
  summary: 'Keyboard-navigable expandable tree with single selection, sizes, compact density, checkboxes, connector lines and a boxed variant.',
  description:
    'Use `Tree` for hierarchical data such as file explorers, category pickers and nested navigation inside a page. Items are `{ id, label, children?, icon?, disabled? }`. Expansion (`v-model:expanded`, array of ids) and selection (`v-model:selected`, one id or null) both work controlled and uncontrolled. Clicking a branch row selects and toggles it; clicking its chevron only toggles. Customise rows with the `item` slot. Variations: `density="compact"` for dense sidebars and file explorers; `checkboxes` (+ `v-model:checked`, ids of checked leaves) for pickers where several nodes are chosen: branches show checked / indeterminate derived from their leaves and toggling a branch toggles all its enabled leaves; `lines` draws connector lines (vertical rules with elbows) to make deep hierarchies easier to scan. `size` (`sm`, `md`, `lg`) sets the type scale, toggle and checkbox size and indentation, while `density` sets the vertical rhythm; `compact` alone still means the small scale. `variant` is `default`, `lines` (the same as the `lines` prop) or `boxed` (a bordered card surface; the selected row is also set in a heavier weight). They combine. For site navigation use the navigation components; for tabular data use `Table`.',
  status: 'stable',
  props: [
    { name: 'items', type: 'TreeItem[]', required: true, description: 'Root nodes: `{ id: string; label: string; children?: TreeItem[]; icon?: IconDefinition; disabled?: boolean }`. Ids must be non-empty and unique across the whole tree; a missing or repeated id throws a ContractError (rendering drops later duplicates when strict mode is off).' },
    { name: 'expanded', type: 'string[]', default: '[]', description: '`v-model:expanded`. Ids of expanded branches; unknown ids are ignored.' },
    { name: 'selected', type: 'string | null', default: 'null', description: '`v-model:selected`. Id of the selected node.' },
    { name: 'density', type: "'default' | 'compact'", default: "'default'", description: 'Row height, indentation, toggle size and font size. Unknown values fall back to default.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", description: 'Type scale (12px, 14px, 16px), toggle and checkbox size and indentation step. Defaults to `md`, or `sm` when `density="compact"`. An explicit value wins. Unknown values behave as unset.' },
    { name: 'variant', type: "'default' | 'lines' | 'boxed'", default: "'default'", description: '`lines` draws connector lines (same as the `lines` prop); `boxed` frames the tree in a bordered card surface and sets the selected row in a heavier weight. Combine `boxed` with `lines`. Unknown values fall back to default.' },
    { name: 'checkboxes', type: 'boolean', default: 'false', description: 'Show a visual checkbox per node (aria-hidden; the treeitem exposes `aria-checked` true/false/mixed). Space toggles the focused node; Enter still selects/expands.' },
    { name: 'checked', type: 'string[]', default: '[]', description: '`v-model:checked`. Ids of checked LEAF nodes (branches derive their state). Unknown ids are ignored. Only used with `checkboxes`.' },
    { name: 'label', type: 'string', description: 'Accessible name of the tree (`aria-label`). Required: set `label`, or pass `aria-label` or `aria-labelledby` as an attribute.' },
    { name: 'lines', type: 'boolean', default: 'false', description: 'Draw connector lines (also set by `variant="lines"`): a vertical rule per ancestor level that ends in an elbow at the last child.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'item', props: '{ item: TreeItem; level: number; expanded: boolean; selected: boolean }', description: 'Replace the icon + label inside a row.' }],
  emits: [
    { name: 'update:expanded', payload: '[ids: string[]]', description: 'Expanded ids changed.' },
    { name: 'update:selected', payload: '[id: string | null]', description: 'Selection changed.' },
    { name: 'update:checked', payload: '[ids: string[]]', description: 'Checked leaf ids changed (`checkboxes` only).' },
    { name: 'select', payload: '[item: TreeItem]', description: 'A node was activated (click / Enter / Space).' },
  ],
  examples: [
    {
      title: 'Uncontrolled',
      code: `<Tree aria-label="Project files" :items="items" class="max-w-xs" />`,
      script: `const items = [{ id: 'src', label: 'src', children: [{ id: 'main', label: 'main.ts' }] }, { id: 'pkg', label: 'package.json' }]`,
      state: () => ({ items: [{ id: 'src', label: 'src', children: [{ id: 'main', label: 'main.ts' }] }, { id: 'pkg', label: 'package.json' }] }),
    },
    {
      title: 'Controlled with icons',
      script: `const expanded = ref(['src'])\nconst selected = ref('main')`,
      code: `<div class="flex flex-col gap-3">
  <Tree aria-label="Files" v-model:expanded="expanded" v-model:selected="selected" :items="items" class="max-w-xs" />
  <p class="text-sm text-muted-foreground">Selected: {{ selected ?? 'none' }}</p>
  <Button size="sm" variant="outline" @click="expanded = []">Collapse all</Button>
</div>`,
      state: () => ({ items, expanded: ref(['src']), selected: ref<string | null>('main') }),
    },
    {
      title: 'Compact',
      description: '`density="compact"` for dense sidebars.',
      script: `const expanded = ref(['src'])`,
      code: `<Tree aria-label="Compact files" density="compact" v-model:expanded="expanded" :items="items" class="max-w-xs" />`,
      state: () => ({ items, expanded: ref(['src']) }),
    },
    {
      title: 'Checkboxes',
      description: 'Branches derive checked / indeterminate from their leaves; `v-model:checked` holds the checked leaf ids.',
      script: `const expanded = ref(['src'])\nconst checked = ref(['main'])`,
      code: `<div class="flex flex-col gap-3">
  <Tree aria-label="Choose files" checkboxes v-model:expanded="expanded" v-model:checked="checked" :items="items" class="max-w-xs" />
  <p class="text-sm text-muted-foreground">Checked: {{ checked.join(', ') || 'none' }}</p>
</div>`,
      state: () => ({ items, expanded: ref(['src']), checked: ref(['main']) }),
    },
    {
      title: 'Connector lines',
      description: '`lines` draws vertical rules with elbows; works with `density="compact"` and `checkboxes`.',
      script: `const expanded = ref(['src', 'lib', 'docs'])`,
      code: `<Tree aria-label="Files with connectors" lines v-model:expanded="expanded" :items="items" class="max-w-xs" />`,
      state: () => ({ items, expanded: ref(['src', 'lib', 'docs']) }),
    },
    {
      title: 'Size gallery: sm, md, lg',
      description: '`size` sets type, toggles and indentation; `density` still controls row spacing.',
      script: `const expanded = ref(['src'])`,
      code: `<div class="flex flex-wrap items-start gap-6">
  <Tree aria-label="Small files" size="sm" v-model:expanded="expanded" :items="items" class="w-48" />
  <Tree aria-label="Medium files" size="md" v-model:expanded="expanded" :items="items" class="w-48" />
  <Tree aria-label="Large files" size="lg" v-model:expanded="expanded" :items="items" class="w-48" />
</div>`,
      state: () => ({ items, expanded: ref(['src']) }),
    },
    {
      title: 'Variant gallery: default, lines, boxed',
      description: '`variant="lines"` equals the `lines` prop. `boxed` frames the tree and weights the selected row; it combines with `lines`.',
      script: `const expanded = ref(['src', 'lib'])\nconst selected = ref('main')`,
      code: `<div class="flex flex-wrap items-start gap-6">
  <Tree aria-label="Default tree" variant="default" v-model:expanded="expanded" v-model:selected="selected" :items="items" class="w-52" />
  <Tree aria-label="Tree with lines" variant="lines" v-model:expanded="expanded" v-model:selected="selected" :items="items" class="w-52" />
  <Tree aria-label="Boxed tree" variant="boxed" v-model:expanded="expanded" v-model:selected="selected" :items="items" class="w-52" />
  <Tree aria-label="Boxed tree with lines" variant="boxed" lines v-model:expanded="expanded" v-model:selected="selected" :items="items" class="w-52" />
</div>`,
      state: () => ({ items, expanded: ref(['src', 'lib']), selected: ref<string | null>('main') }),
    },
    {
      title: 'Everything combined',
      script: `const expanded = ref(['src', 'lib'])\nconst checked = ref([])`,
      code: `<Tree aria-label="Combined" density="compact" lines checkboxes v-model:expanded="expanded" v-model:checked="checked" :items="items" class="max-w-xs" />`,
      state: () => ({ items, expanded: ref(['src', 'lib']), checked: ref<string[]>([]) }),
    },
  ],
  a11y: [
    'Follows the ARIA tree pattern: `role="tree"` with flat `treeitem`s carrying `aria-level`, `aria-posinset`, `aria-setsize`, `aria-expanded` (branches only) and `aria-selected`.',
    'Roving tabindex: one tab stop; Up/Down move, Home/End jump, Right expands or enters, Left collapses or goes to the parent, Enter/Space select.',
    'With `checkboxes` every treeitem has `aria-checked` (`mixed` for partially checked branches); the visual box and the connector lines are `aria-hidden`.',
    'Give the tree a name with `label` or `aria-label` (falls through to the root). The selected node also gets an outline in forced-colors mode, and the chevron rotation respects reduced motion.',
    'Rows use logical padding, so RTL mirrors the indentation. Long labels truncate inside the row instead of widening the page.',
    'Disabled nodes stay focusable but cannot be selected or toggled.',
    '`size`, `variant` and `density` change only appearance: the roles, `aria-*` attributes, roving tabindex and the key map are the same in every combination. In `boxed` the selected row keeps `aria-selected` and the forced-colors outline and is also set in a heavier weight, so selection is not shown by tint alone.',
  ],
  related: ['List', 'Table'],
  requires: [
    'Throws a ContractError when the tree has no name (`label`, `aria-label` or `aria-labelledby`).',
    'Throws a ContractError when a node has no non-empty string `id`, or two nodes anywhere in the tree (collapsed branches included) share an `id`.',
  ],
  llmNotes: [
    'Always give nodes stable unique string ids; v-model values are ids, not objects.',
    'Always set `aria-label` on Tree.',
    'Use `checkboxes` + `v-model:checked` for multi-pick trees; checked values are leaf ids only, branch state is derived.',
    'Use `size` for the type scale and `variant="boxed"` for a framed tree; `variant="lines"` is the same as `lines`.',
    'Use `density="compact"` for sidebars and `lines` for deep hierarchies; they combine with checkboxes.',
    'Use the `item` slot for badges/actions, not extra buttons that steal keyboard focus.',
  ],
  replaces: ['hand-rolled Tree markup in app code'],
}
export default doc
