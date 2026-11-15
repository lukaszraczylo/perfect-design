import { reactive } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

interface DemoCard {
  id: string
  title: string
}
interface DemoColumn {
  id: string
  title: string
  cards: DemoCard[]
}
interface DemoMove {
  cardId: string
  from?: string
  to: string
  index: number
}

const makeColumns = (): DemoColumn[] => [
  { id: 'todo', title: 'To do', cards: [{ id: 'c1', title: 'Write docs' }, { id: 'c2', title: 'Fix login bug' }] },
  { id: 'doing', title: 'In progress', cards: [{ id: 'c3', title: 'Review PR' }] },
  { id: 'done', title: 'Done', cards: [] },
]

/** Remove the card from wherever it is and insert it at `index` of column `to`. */
function applyMove(columns: DemoColumn[], { cardId, to, index }: DemoMove) {
  const target = columns.find((c) => c.id === to)
  const source = columns.find((c) => c.cards.some((card) => card.id === cardId))
  const card = source?.cards.find((c) => c.id === cardId)
  if (!target || !source || !card) return
  source.cards.splice(source.cards.indexOf(card), 1)
  target.cards.splice(Math.min(index, target.cards.length), 0, card)
}

function nudge(columns: DemoColumn[], { cardId, direction }: { cardId: string; direction: string }) {
  const ci = columns.findIndex((c) => c.cards.some((card) => card.id === cardId))
  if (ci < 0) return
  const i = columns[ci].cards.findIndex((card) => card.id === cardId)
  if (direction === 'left' || direction === 'right') {
    const to = columns[ci + (direction === 'left' ? -1 : 1)]
    if (to) applyMove(columns, { cardId, to: to.id, index: to.cards.length })
  } else {
    applyMove(columns, { cardId, to: columns[ci].id, index: Math.max(0, i + (direction === 'up' ? -1 : 1)) })
  }
}

const boardScript = `const columns = reactive([
  { id: 'todo', title: 'To do', cards: [{ id: 'c1', title: 'Write docs' }, { id: 'c2', title: 'Fix login bug' }] },
  { id: 'doing', title: 'In progress', cards: [{ id: 'c3', title: 'Review PR' }] },
  { id: 'done', title: 'Done', cards: [] },
])
// \`index\` is the card's final position in the target column
function onMove({ cardId, to, index }) {
  const source = columns.find((c) => c.cards.some((card) => card.id === cardId))
  const card = source.cards.find((c) => c.id === cardId)
  source.cards.splice(source.cards.indexOf(card), 1)
  columns.find((c) => c.id === to).cards.splice(index, 0, card)
}`

const doc: ComponentDoc = {
  name: 'BoardColumn',
  group: 'data-display',
  subgroup: 'Boards',
  summary: 'Kanban-style column that accepts dragged BoardCards and reports where they were dropped.',
  description:
    'Presentational drop zone built on native HTML5 drag events. `BoardColumn` shows a title, a count badge, optional header/footer and an empty state, highlights while a card hovers over it and emits `move` with `{ cardId, from, to, index }`. It never mutates anything: you own the data and apply the move. Pair it with `BoardCard`, which is the draggable part and also provides a keyboard alternative. Cards dragged from a column know their source column automatically, so `acceptFrom` can restrict flows (for example "Done" only accepts from "In progress"). Drops of files, text or any foreign data are ignored. For sortable lists without columns use a plain list; for touch-first drag and drop add your own pointer-based layer, native HTML5 drag is mouse/desktop oriented.',
  status: 'beta',
  props: [
    { name: 'id', type: 'string', required: true, description: 'Unique column id. Sent as `to` in `move` and provided to child cards as their `from`.' },
    { name: 'title', type: 'string', description: 'Column heading (also labels the group for assistive tech). Required unless the column has `aria-label` or `aria-labelledby`.' },
    { name: 'count', type: 'number', description: 'Number in the badge. Defaults to the number of cards in the default slot; negative/NaN values fall back to that. Set it when the list is paginated or virtualised.' },
    { name: 'showCount', type: 'boolean', default: 'true', description: 'Show the count badge.' },
    { name: 'emptyText', type: 'string', default: "'No cards'", description: 'Empty-state text; override with the `empty` slot.' },
    { name: 'acceptFrom', type: 'string[]', description: 'Only accept cards coming from these column ids. Cards already in this column (reordering) are always accepted; cards of unknown origin are rejected when this is set. Empty/undefined accepts everything.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Reject every drop, never highlight, dim the column.' },
    { name: 'variant', type: "'default' | 'muted' | 'outline'", default: "'default'", description: 'Column surface.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding, gap and text size.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes (set the column width here, e.g. `w-72`).' },
  ],
  slots: [
    { name: 'default', description: '`BoardCard` children.' },
    { name: 'header', props: '{ title: string | undefined; count: number; over: boolean }', description: 'Replaces the title and count badge.' },
    { name: 'footer', props: '{ count: number; over: boolean }', description: 'Rendered below the cards (e.g. an "Add card" button). Omitted when not provided.' },
    { name: 'empty', props: '{ over: boolean }', description: 'Replaces the empty-state text.' },
  ],
  emits: [
    {
      name: 'move',
      payload: '[event: { cardId: string; from?: string; to: string; index: number }]',
      description: 'A card was dropped on this column. `from` is the source column when the card knew it; `index` is the final insertion index among the column cards, excluding the dragged card itself, so `splice(index, 0, card)` after removal is correct.',
    },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'A static column with a count badge.',
      code: `<BoardColumn id="todo" title="To do" class="w-64">
  <BoardCard id="a" title="Write docs" />
  <BoardCard id="b" title="Fix login bug" />
</BoardColumn>`,
    },
    {
      title: 'Drag and drop board',
      description: 'Three columns; drag cards between them. Alt + arrow keys on a focused card move it without a mouse.',
      script: `${boardScript}`,
      code: `<div class="grid gap-3 sm:grid-cols-3">
  <BoardColumn v-for="col in columns" :key="col.id" :id="col.id" :title="col.title" @move="onMove">
    <BoardCard v-for="card in col.cards" :key="card.id" :id="card.id" :title="card.title" @move="onNudge" />
  </BoardColumn>
</div>`,
      state: () => {
        const columns = reactive(makeColumns())
        return { columns, onMove: (e: DemoMove) => applyMove(columns, e), onNudge: (e: { cardId: string; direction: string }) => nudge(columns, e) }
      },
    },
    {
      title: 'Restrict flows with acceptFrom and disabled',
      description: '"Done" only accepts cards from "In progress"; "Archive" is locked.',
      code: `<div class="grid gap-3 sm:grid-cols-3">
  <BoardColumn id="todo" title="To do">
    <BoardCard id="t1" title="Plan sprint" />
  </BoardColumn>
  <BoardColumn id="doing" title="In progress" />
  <BoardColumn id="done" title="Done" :accept-from="['doing']" empty-text="Only finished work lands here" />
  <BoardColumn id="archive" title="Archive" disabled />
</div>`,
    },
    {
      title: 'Header and footer slots',
      code: `<BoardColumn id="backlog" title="Backlog" class="w-64">
  <template #header="{ title, count }">
    <strong class="truncate">{{ title }}</strong>
    <span class="ms-auto text-muted-foreground tabular-nums">{{ count }} open</span>
  </template>
  <BoardCard id="b1" title="Idea" />
  <template #footer>
    <Button size="sm" variant="ghost" class="w-full">Add card</Button>
  </template>
</BoardColumn>`,
    },
    {
      title: 'Empty state and count override',
      code: `<div class="flex flex-wrap gap-3">
  <BoardColumn id="e1" title="Empty" class="w-56" />
  <BoardColumn id="e2" title="Custom empty" class="w-56">
    <template #empty>Drop cards here</template>
  </BoardColumn>
  <BoardColumn id="e3" title="Paginated" :count="48" class="w-56">
    <BoardCard id="p1" title="Showing 1 of 48" />
  </BoardColumn>
</div>`,
    },
    {
      title: 'Variants',
      code: `<div class="flex flex-wrap gap-3">
  <BoardColumn id="v1" title="Default" variant="default" class="w-48" />
  <BoardColumn id="v2" title="Muted" variant="muted" class="w-48" />
  <BoardColumn id="v3" title="Outline" variant="outline" class="w-48" />
</div>`,
    },
    {
      title: 'Sizes',
      code: `<div class="flex flex-wrap items-start gap-3">
  <BoardColumn id="s1" title="Small" size="sm" class="w-48"><BoardCard id="s1a" size="sm" title="Card" /></BoardColumn>
  <BoardColumn id="s2" title="Medium" size="md" class="w-52"><BoardCard id="s2a" size="md" title="Card" /></BoardColumn>
  <BoardColumn id="s3" title="Large" size="lg" class="w-56"><BoardCard id="s3a" size="lg" title="Card" /></BoardColumn>
</div>`,
    },
  ],
  a11y: [
    'Root is `role="group"` labelled by the title; the card area is `role="list"` (cards are `listitem`s) once it has cards.',
    'Native drag and drop is pointer-only. The keyboard alternative lives on `BoardCard`: Alt + Arrow keys emit a `move` request that you apply to your data (see the board example).',
    'The count badge is followed by visually hidden text ("cards"), so it reads "3 cards"; a disabled column sets `aria-disabled`.',
    'Drops are announced: every column holds a polite `role="status"` region that says "Moved <card title> to <column>, position n". Call the exposed `announce(message)` from your keyboard `move` handler to announce keyboard moves the same way.',
    'Columns are fluid and wrap in a grid on a phone; set a fixed width only on wide layouts.',
    'The highlight uses `data-over` plus a ring and background change, not colour alone, and transitions are disabled under `prefers-reduced-motion`.',
  ],
  related: ['BoardCard', 'Card', 'List'],
  requires: [
    'Throws a ContractError when `BoardColumn` has a blank `id`.',
    'Throws a ContractError when `BoardColumn` has no `title` (or `aria-label` / `aria-labelledby`) to name its group.',
  ],
  llmNotes: [
    'BoardColumn only reports drops; always update your own state in the `move` handler, nothing moves by itself.',
    'Give every column a unique `id` and every card a unique `id` across the whole board.',
    'Use `index` with splice after removing the card from its source: `target.splice(index, 0, card)`.',
    'Set the column width via `class` (e.g. `w-72`); the column itself is fluid.',
    'Handle the BoardCard `move` event (Alt+Arrow) too so the board is keyboard accessible.',
    'Use `acceptFrom` for workflow rules and `disabled` for locked columns; do not filter inside the move handler only.',
  ],
}

export default doc
