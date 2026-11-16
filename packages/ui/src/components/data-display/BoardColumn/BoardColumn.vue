<script setup lang="ts">
import { Comment, Fragment, Text, computed, nextTick, onBeforeUnmount, onMounted, onUpdated, provide, ref, toRef, useAttrs, useId, useSlots, type VNode } from 'vue'
import { requireOneOf, requireText } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { useMountedCheck } from '../_shared/contract'
import { BOARD_CARD_MIME, BoardColumnIdKey, getActiveBoardDrag, parseBoardDragPayload, type BoardDragPayload } from '../BoardCard/boardDrag'
import { boardColumnVariants, type BoardColumnSize, type BoardColumnVariant } from './variants'

/** Emitted when a card is dropped on the column. */
export interface BoardColumnMoveEvent {
  cardId: string
  /** Column the card came from, when the card knew it. */
  from?: string
  /** This column's id. */
  to: string
  /** Insertion index among this column's cards, ignoring the dragged card itself (so it is the card's final index). */
  index: number
}

export interface BoardColumnProps extends BaseProps {
  /** Unique column id; used as `to` in `move` and provided to child cards as their `from`. */
  id: string
  title?: string
  /** Number shown in the badge. Defaults to the number of cards in the default slot. Negative/NaN falls back to the default. */
  count?: number
  /** Hide the count badge. */
  showCount?: boolean
  /** Text shown when the column has no cards (override with the `empty` slot). */
  emptyText?: string
  /** Only accept cards coming from these column ids. Cards already in this column (reordering) are always accepted. Empty/undefined accepts everything. */
  acceptFrom?: string[]
  /** Reject all drops and dim the column. */
  disabled?: boolean
  variant?: BoardColumnVariant
  size?: BoardColumnSize
  /** Heading level of the column title, 2 to 6. */
  headingLevel?: number
}

const props = withDefaults(defineProps<BoardColumnProps>(), { showCount: true, emptyText: 'No cards', variant: 'default', size: 'md', headingLevel: 3 })
const emit = defineEmits<{
  /** A card was dropped here. */
  move: [event: BoardColumnMoveEvent]
}>()
const slots = useSlots()
const attrs = useAttrs()
useMountedCheck(() => {
  requireText('BoardColumn', 'id', props.id, 'It is sent as `to` in `move` and given to its cards, so give every column a unique id.')
  requireOneOf('BoardColumn', { title: props.title, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, 'The column is a group and needs a name, e.g. `title="To do"`.')
})
defineSlots<{
  default?: () => unknown
  header?: (p: { title: string | undefined; count: number; over: boolean }) => unknown
  footer?: (p: { count: number; over: boolean }) => unknown
  empty?: (p: { over: boolean }) => unknown
}>()

provide(BoardColumnIdKey, toRef(props, 'id'))
const titleId = useId()
const rootEl = ref<HTMLElement | null>(null)
const over = ref(false)
let depth = 0 // dragenter/dragleave fire for every child element; count them so `over` does not flicker

function countNodes(nodes: VNode[] | undefined): number {
  let n = 0
  for (const node of nodes ?? []) {
    if (node.type === Comment) continue
    if (node.type === Text) {
      if (typeof node.children === 'string' && node.children.trim() !== '') n++
    } else if (node.type === Fragment) n += countNodes(Array.isArray(node.children) ? (node.children as VNode[]) : undefined)
    else n++
  }
  return n
}
function cardCount(): number {
  return typeof props.count === 'number' && Number.isFinite(props.count) && props.count >= 0 ? Math.floor(props.count) : countNodes(slots.default?.())
}

function resetOver() {
  depth = 0
  over.value = false
}

/** Cards must be draggable board cards: tracked in-page, or (cross-window) carrying our MIME type. */
function accepts(e: DragEvent): boolean {
  if (props.disabled) return false
  const active = getActiveBoardDrag()
  if (active) return sourceAllowed(active)
  const types = e.dataTransfer?.types
  return !!types && Array.prototype.includes.call(types, BOARD_CARD_MIME)
}
function sourceAllowed(p: BoardDragPayload): boolean {
  if (!props.acceptFrom || props.acceptFrom.length === 0) return true
  return p.from !== undefined && (p.from === props.id || props.acceptFrom.includes(p.from))
}

function onDragenter(e: DragEvent) {
  if (!accepts(e)) return
  e.preventDefault()
  depth++
  over.value = true
}
function onDragover(e: DragEvent) {
  if (!accepts(e)) return
  e.preventDefault() // required for the element to be a valid drop target
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  over.value = true
}
function onDragleave() {
  if (!over.value) return
  depth = Math.max(0, depth - 1)
  if (depth === 0) over.value = false
}

function readPayload(e: DragEvent): BoardDragPayload | null {
  let raw: string | undefined
  try {
    raw = e.dataTransfer?.getData(BOARD_CARD_MIME)
  } catch {
    raw = undefined
  }
  return parseBoardDragPayload(raw) ?? getActiveBoardDrag()
}

function dropIndex(e: DragEvent, cardId: string): number {
  const cards = Array.from(rootEl.value?.querySelectorAll<HTMLElement>('[data-slot="board-card"]') ?? []).filter((c) => c.dataset.cardId !== cardId)
  const y = e.clientY
  if (typeof y !== 'number' || Number.isNaN(y)) return cards.length
  let index = 0
  for (const card of cards) {
    const r = card.getBoundingClientRect()
    if (y > r.top + r.height / 2) index++
  }
  return index
}

// Polite announcement for assistive tech: a dropped card changes the page without moving focus.
// A drop is only a request. The move is announced once the card is rendered at the dropped position in this column,
// so a rejected move (the consumer ignored `move`) is never announced.
const announcement = ref('')
const PENDING_MS = 10_000
let pending: { id: string; index: number; timer: ReturnType<typeof setTimeout> } | null = null
function boardCards(): HTMLElement[] {
  return Array.from(rootEl.value?.querySelectorAll<HTMLElement>('[data-slot="board-card"]') ?? [])
}
function clearPending() {
  if (pending) clearTimeout(pending.timer)
  pending = null
}
function confirmPending() {
  if (!pending) return
  const cards = boardCards()
  const at = cards.findIndex((c) => c.dataset.cardId === pending!.id)
  if (at !== pending.index) return
  const name = cards[at]!.querySelector('[data-slot="board-card-title"]')?.textContent?.trim() || pending.id
  announce(`Moved ${name} to ${props.title ?? props.id}, position ${at + 1}`)
  clearPending()
}
/** Announce a result (for example after handling a keyboard `move` request). Replaces the previous message. */
function announce(message: string) {
  announcement.value = ''
  void nextTick(() => (announcement.value = message))
}
defineExpose({ announce })
onUpdated(confirmPending)

function onDrop(e: DragEvent) {
  resetOver()
  if (props.disabled) return
  const payload = readPayload(e)
  if (!payload || !sourceAllowed(payload)) return // foreign data (files, text, other apps): leave to the browser
  e.preventDefault()
  const index = dropIndex(e, payload.id)
  clearPending()
  pending = { id: payload.id, index, timer: setTimeout(clearPending, PENDING_MS) }
  emit('move', { cardId: payload.id, from: payload.from, to: props.id, index })
  void nextTick(confirmPending)
}

// A cancelled drag (Escape) or a drop elsewhere never reaches this column; these keep the highlight honest.
const stop = () => resetOver()
onMounted(() => {
  window.addEventListener('dragend', stop)
  window.addEventListener('drop', stop)
})
onBeforeUnmount(() => {
  clearPending()
  window.removeEventListener('dragend', stop)
  window.removeEventListener('drop', stop)
})

const level = computed(() => (Number.isInteger(props.headingLevel) && props.headingLevel >= 2 && props.headingLevel <= 6 ? props.headingLevel : 3))
const classes = computed(() => cn(boardColumnVariants({ variant: props.variant, size: props.size, over: over.value, disabled: !!props.disabled }), props.class))
</script>

<template>
  <section
    ref="rootEl"
    data-slot="board-column"
    role="group"
    :aria-labelledby="title ? titleId : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :data-column-id="id"
    :data-over="over ? 'true' : undefined"
    :data-disabled="disabled ? 'true' : undefined"
    :class="classes"
    @dragenter="onDragenter"
    @dragover="onDragover"
    @dragleave="onDragleave"
    @drop="onDrop"
  >
    <template v-for="n in [cardCount()]" :key="0">
    <header data-slot="board-column-header" class="flex items-center justify-between gap-2 px-1">
      <slot name="header" :title="title" :count="n" :over="over">
        <component :is="`h${level}`" v-if="title" :id="titleId" data-slot="board-column-title" class="min-w-0 truncate font-semibold">{{ title }}</component>
        <span
          v-if="showCount"
          data-slot="board-column-count"
          class="ms-auto inline-flex min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-medium tabular-nums text-secondary-foreground"
        >
          {{ n }}
        </span>
        <span data-slot="board-column-count-label" class="sr-only">{{ n === 1 ? 'card' : 'cards' }}</span>
      </slot>
    </header>
    <div
      data-slot="board-column-body"
      :role="n === 0 ? undefined : 'list'"
      :aria-labelledby="title && n !== 0 ? titleId : undefined"
      class="flex min-h-12 flex-1 flex-col gap-2"
    >
      <slot />
      <div v-if="n === 0" data-slot="board-column-empty" class="flex flex-1 items-center justify-center rounded-md border border-dashed px-2 py-4 text-center text-muted-foreground">
        <slot name="empty" :over="over">{{ emptyText }}</slot>
      </div>
    </div>
    <footer v-if="$slots.footer" data-slot="board-column-footer" class="px-1">
      <slot name="footer" :count="n" :over="over" />
    </footer>
    </template>
    <p data-slot="board-column-status" role="status" class="sr-only">{{ announcement }}</p>
  </section>
</template>
