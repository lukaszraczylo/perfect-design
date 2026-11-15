import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'BoardCard',
  group: 'data-display',
  subgroup: 'Boards',
  summary: 'Draggable card for a BoardColumn, with a keyboard alternative (Alt + arrow keys) to dragging.',
  description:
    'Presentational card that starts a native HTML5 drag. On `dragstart` it writes `{ id, from }` (JSON, custom MIME type) to `dataTransfer` and marks itself `dragging`; `BoardColumn` reads that on drop. Inside a `BoardColumn` it learns its source column automatically, or set `columnId` yourself. Because dragging is pointer-only, a focused card also emits `move` with a direction when you press Alt + an arrow key: apply it to your data (left/right = other column, up/down = reorder). `disabled` blocks both. The card has no drag logic beyond this and no state of its own: you keep the board data.',
  status: 'beta',
  props: [
    { name: 'id', type: 'string', required: true, description: 'Unique card id, sent in the drag payload and `move` events.' },
    { name: 'columnId', type: 'string', description: 'Column the card lives in. Defaults to the id of the enclosing `BoardColumn`.' },
    { name: 'title', type: 'string', description: 'Optional heading above the default slot.' },
    { name: 'variant', type: "'default' | 'outline' | 'flat'", default: "'default'", description: 'Card surface.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding and text size.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Not draggable, no keyboard move, dimmed, `aria-disabled`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', props: '{ dragging: boolean }', description: 'Card body; `dragging` is true between dragstart and dragend.' }],
  emits: [
    { name: 'dragstart', payload: '[cardId: string]', description: 'Drag started (not emitted when disabled).' },
    { name: 'dragend', payload: '[cardId: string]', description: 'Drag finished, dropped or cancelled.' },
    {
      name: 'move',
      payload: '[request: { cardId: string; direction: "up" | "down" | "left" | "right"; from?: string }]',
      description: 'Alt + Arrow key pressed on the focused card (keyboard alternative to dragging). Not emitted when disabled or when the key comes from a nested control.',
    },
  ],
  examples: [
    {
      title: 'Minimal',
      code: `<BoardColumn id="todo" title="To do" class="w-64">
  <BoardCard id="a" title="Write docs">Cover the keyboard flow.</BoardCard>
</BoardColumn>`,
    },
    {
      title: 'Keyboard move requests',
      description: 'Focus a card and press Alt + Arrow keys; the last request is shown below.',
      script: `const last = ref('none')
function onMove(r) { last.value = r.direction + ' from ' + r.from }`,
      code: `<div class="flex flex-col gap-2">
  <BoardColumn id="todo" title="To do" class="w-64">
    <BoardCard id="k1" title="Focus me" @move="onMove" />
  </BoardColumn>
  <p class="text-sm text-muted-foreground">Last request: {{ last }}</p>
</div>`,
      state: () => {
        const last = ref('none')
        return { last, onMove: (r: { direction: string; from?: string }) => (last.value = `${r.direction} from ${r.from}`) }
      },
    },
    {
      title: 'Variants',
      code: `<div role="list" aria-label="Card variants" class="flex flex-wrap gap-3">
  <BoardCard id="v1" variant="default" title="Default" class="w-40" />
  <BoardCard id="v2" variant="outline" title="Outline" class="w-40" />
  <BoardCard id="v3" variant="flat" title="Flat" class="w-40" />
</div>`,
    },
    {
      title: 'Sizes',
      code: `<div role="list" aria-label="Card sizes" class="flex flex-wrap items-start gap-3">
  <BoardCard id="s1" size="sm" title="Small" class="w-36" />
  <BoardCard id="s2" size="md" title="Medium" class="w-40" />
  <BoardCard id="s3" size="lg" title="Large" class="w-44" />
</div>`,
    },
    {
      title: 'Disabled and dragging slot prop',
      code: `<div role="list" aria-label="Disabled and movable cards" class="flex flex-wrap gap-3">
  <BoardCard id="d1" title="Locked" disabled class="w-44">Cannot be moved.</BoardCard>
  <BoardCard id="d2" title="Movable" class="w-44">
    <template #default="{ dragging }">{{ dragging ? 'Moving...' : 'Drag me' }}</template>
  </BoardCard>
</div>`,
    },
  ],
  a11y: [
    'Each card is a focusable `listitem` (`tabindex="0"`) that must live inside a list: `BoardColumn` provides `role="list"`, and a standalone card needs a `role="list"` parent (axe `aria-required-parent`).',
    'Keyboard alternative to dragging: Alt + Arrow keys emit `move`; `aria-keyshortcuts` advertises it and a visually hidden description ("Hold Alt and press an arrow key to move this card.") is linked with `aria-describedby`. Keys typed inside nested inputs/buttons are ignored.',
    'After applying a move, return focus to the card (cards re-mount when they change column) and announce the result with the column `announce(message)` method.',
    'Disabled cards set `draggable="false"` and `aria-disabled`.',
    'Dragging is indicated with `data-dragging` plus opacity, shadow and ring, not colour alone.',
  ],
  related: ['BoardColumn', 'Card'],
  requires: [
    'Throws a ContractError when `BoardCard` has a blank `id`.',
    'Throws a ContractError when a `BoardCard` is not inside a list: use a `BoardColumn`, or a parent with `role="list"` (a `ul` or `ol` also counts).',
    'Throws a ContractError when two cards on the same board share an `id` (the board is the element that holds the columns).',
  ],
  llmNotes: [
    'Always handle the `move` event (Alt+Arrow) in addition to the column `move`, otherwise keyboard users cannot reorder.',
    'Card ids must be unique across the whole board, not just within a column.',
    'Place BoardCard only inside BoardColumn (or another `role="list"`).',
    'Put interactive content (buttons, links) in the body freely; keyboard shortcuts only fire when the card itself is focused.',
  ],
}

export default doc
