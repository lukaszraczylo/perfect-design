<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, useId } from 'vue'
import { requireText, violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { useMountedCheck } from '../_shared/contract'
import { BOARD_CARD_MIME, BoardColumnIdKey, getActiveBoardDrag, setActiveBoardDrag } from './boardDrag'
import { boardCardVariants, type BoardCardSize, type BoardCardVariant } from './variants'

export type BoardCardDirection = 'up' | 'down' | 'left' | 'right'

/** Keyboard alternative to dragging: Alt + arrow key asks the parent to move the card. */
export interface BoardCardMoveRequest {
  cardId: string
  direction: BoardCardDirection
  /** Id of the column the card is in, when known. */
  from?: string
}

export interface BoardCardProps extends BaseProps {
  /** Unique card id; sent in the drag payload and `move` events. */
  id: string
  /** Column the card lives in. Defaults to the id of the enclosing `BoardColumn`. */
  columnId?: string
  /** Optional heading rendered above the default slot. */
  title?: string
  variant?: BoardCardVariant
  size?: BoardCardSize
  /** Blocks dragging and the keyboard move shortcut. */
  disabled?: boolean
}

const props = withDefaults(defineProps<BoardCardProps>(), { variant: 'default', size: 'md' })
const emit = defineEmits<{
  /** Drag started. */
  dragstart: [cardId: string]
  /** Drag finished (dropped or cancelled). */
  dragend: [cardId: string]
  /** Alt + arrow key pressed on the focused card. */
  move: [request: BoardCardMoveRequest]
}>()
defineSlots<{ default?: (p: { dragging: boolean }) => unknown }>()

const injectedColumn = inject(BoardColumnIdKey, null)
const from = computed(() => props.columnId ?? injectedColumn?.value)
const dragging = ref(false)
const hintId = useId()

const el = ref<HTMLElement | null>(null)
useMountedCheck(() => {
  requireText('BoardCard', 'id', props.id, 'It is sent in the drag payload and `move` events, so give every card a unique id.')
  const card = el.value
  if (!card) return
  if (!card.parentElement?.closest('[role="list"],ul,ol')) {
    violation('BoardCard', 'requires-list', 'must be rendered inside a list. Put it in a BoardColumn (which provides `role="list"`), or in a parent with `role="list"`.')
  }
  // The board is the element that holds the columns (or, for a standalone card, its own parent).
  const board = card.closest('[data-slot="board-column"]')?.parentElement ?? card.parentElement
  const same = board?.querySelectorAll<HTMLElement>(`[data-slot="board-card"][data-card-id="${props.id.replace(/["\\]/g, '\\$&')}"]`)
  if (same && same.length > 1 && same[0] !== card) {
    violation('BoardCard', 'unique-card-ids', `card ids must be unique across the whole board, but "${props.id}" is used more than once. Give each card its own id.`)
  }
})

function onDragstart(e: DragEvent) {
  if (props.disabled) {
    e.preventDefault()
    return
  }
  const payload = { id: props.id, ...(from.value ? { from: from.value } : {}) }
  const dt = e.dataTransfer
  if (dt) {
    dt.effectAllowed = 'move'
    try {
      dt.setData(BOARD_CARD_MIME, JSON.stringify(payload))
      dt.setData('text/plain', props.id)
    } catch {
      // Some browsers throw for unknown MIME types; the module-level record still lets columns accept the drop.
    }
  }
  setActiveBoardDrag(payload)
  dragging.value = true
  emit('dragstart', props.id)
}

function onDragend() {
  if (!dragging.value) return
  dragging.value = false
  if (getActiveBoardDrag()?.id === props.id) setActiveBoardDrag(null)
  emit('dragend', props.id)
}

const KEYS: Record<string, BoardCardDirection> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }
function onKeydown(e: KeyboardEvent) {
  const direction = KEYS[e.key]
  if (!direction || !e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
  if (e.target !== e.currentTarget) return // ignore keys typed inside nested inputs/buttons
  e.preventDefault()
  if (props.disabled) return
  emit('move', { cardId: props.id, direction, from: from.value })
}

// An unmounted card never receives dragend; do not leave a stale record behind.
onBeforeUnmount(() => {
  if (dragging.value && getActiveBoardDrag()?.id === props.id) setActiveBoardDrag(null)
})

const classes = computed(() =>
  cn(
    boardCardVariants({ variant: props.variant, size: props.size, draggable: !props.disabled, dragging: dragging.value, disabled: !!props.disabled }),
    props.class,
  ),
)
</script>

<template>
  <div
    ref="el"
    data-slot="board-card"
    role="listitem"
    tabindex="0"
    :data-card-id="id"
    :data-dragging="dragging ? 'true' : undefined"
    :data-disabled="disabled ? 'true' : undefined"
    :draggable="disabled ? 'false' : 'true'"
    :aria-disabled="disabled ? 'true' : undefined"
    :aria-keyshortcuts="disabled ? undefined : 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight'"
    :aria-describedby="disabled ? undefined : hintId"
    :class="classes"
    @dragstart="onDragstart"
    @dragend="onDragend"
    @keydown="onKeydown"
  >
    <span v-if="title" data-slot="board-card-title" class="font-medium leading-snug">{{ title }}</span>
    <slot :dragging="dragging" />
    <span v-if="!disabled" :id="hintId" data-slot="board-card-hint" class="sr-only">Hold Alt and press an arrow key to move this card.</span>
  </div>
</template>
