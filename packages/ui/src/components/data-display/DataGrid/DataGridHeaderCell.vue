<script setup lang="ts">
import { computed, ref } from 'vue'
import { faArrowDown, faArrowUp, faSort } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import Icon from '../../primitives/Icon/Icon.vue'
import { DEFAULT_MAX_WIDTH, DEFAULT_MIN_WIDTH, RESIZE_STEP, RESIZE_STEP_LARGE, resizeBy } from './column-sizing'
import type { DataGridColumn } from './types'

const props = defineProps<{
  column: DataGridColumn<never>
  /** 1-based column index for aria-colindex. */
  colIndex: number
  /** Position in the roving-focus model (the cell's `data-col`). */
  pos: number
  width: number
  direction: 'asc' | 'desc' | null
  /** Roving tabindex: true for the one cell of the grid that is in the tab order. */
  tabbable: boolean
  /** Pinned columns stick to the inline edge (the grid sets the offset). */
  pinned?: boolean
  rtl: boolean
  label: string
  /** Horizontal padding class from the grid density. */
  paddingClass?: string
}>()

const emit = defineEmits<{
  sort: []
  /** Live width while dragging or stepping with the keyboard. */
  resize: [width: number]
  /** The resize gesture ended: the final width. */
  'resize-end': [width: number]
  /** Escape on the handle: put focus back on the header cell. */
  'handle-escape': []
}>()

const align = computed(() => props.column.align ?? (props.column.type === 'number' ? 'end' : 'start'))
const ALIGN = { start: 'justify-start text-start', center: 'justify-center text-center', end: 'justify-end text-end' } as const
const resizable = computed(() => props.column.resizable !== false)
const ariaSort = computed(() => (props.direction === 'asc' ? 'ascending' : props.direction === 'desc' ? 'descending' : undefined))
const icon = computed(() => (props.direction === 'asc' ? faArrowUp : props.direction === 'desc' ? faArrowDown : faSort))
const min = computed(() => props.column.minWidth ?? DEFAULT_MIN_WIDTH)
const max = computed(() => props.column.maxWidth ?? Math.max(DEFAULT_MAX_WIDTH, min.value))

// ---- pointer drag
const dragging = ref(false)
let startX = 0
let startWidth = 0
let last = 0
function onPointerDown(event: PointerEvent) {
  if (event.button !== undefined && event.button !== 0) return
  event.preventDefault()
  event.stopPropagation()
  const target = event.currentTarget as HTMLElement
  try {
    target.setPointerCapture?.(event.pointerId)
  } catch {
    /* capture is an enhancement: dragging still works while the pointer stays over the handle */
  }
  target.focus?.()
  dragging.value = true
  startX = event.clientX
  startWidth = props.width
  last = props.width
}
function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  const delta = (event.clientX - startX) * (props.rtl ? -1 : 1)
  last = resizeBy(startWidth, delta, props.column)
  emit('resize', last)
}
function onPointerUp(event: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  try {
    ;(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId)
  } catch {
    /* already released */
  }
  emit('resize-end', last)
}

// ---- keyboard
function onHandleKeydown(event: KeyboardEvent) {
  const widen = props.rtl ? 'ArrowLeft' : 'ArrowRight'
  const narrow = props.rtl ? 'ArrowRight' : 'ArrowLeft'
  const step = event.shiftKey ? RESIZE_STEP_LARGE : RESIZE_STEP
  let next: number
  if (event.key === widen) next = resizeBy(props.width, step, props.column)
  else if (event.key === narrow) next = resizeBy(props.width, -step, props.column)
  else if (event.key === 'Home') next = resizeBy(props.width, -Infinity, props.column)
  else if (event.key === 'End') next = resizeBy(props.width, Infinity, props.column)
  else if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    emit('handle-escape')
    return
  } else {
    // Tab keeps its meaning; the other navigation keys stay local to the handle so grid navigation cannot move focus from here.
    if (event.key.startsWith('Arrow') || event.key === 'PageUp' || event.key === 'PageDown') event.stopPropagation()
    return
  }
  event.preventDefault()
  event.stopPropagation()
  if (next !== props.width) {
    emit('resize', next)
    emit('resize-end', next)
  }
}

const cellClasses = computed(() =>
  cn(
    props.pinned ? 'sticky z-10' : 'relative',
    'flex h-full min-w-0 items-center gap-1 bg-muted font-medium text-foreground outline-hidden select-none',
    'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
    ALIGN[align.value],
    props.paddingClass,
  ),
)
</script>

<template>
  <div
    role="columnheader"
    data-slot="data-grid-header-cell"
    :data-row="0"
    :data-col="pos"
    :data-column="column.key"
    :aria-colindex="colIndex"
    :aria-sort="ariaSort"
    :tabindex="tabbable ? 0 : -1"
    :class="cellClasses"
  >
    <button
      v-if="column.sortable"
      type="button"
      tabindex="-1"
      data-slot="data-grid-sort"
      :data-direction="direction ?? 'none'"
      :class="cn('flex h-full min-w-0 flex-1 items-center gap-1.5 outline-hidden', ALIGN[align], direction ? 'text-foreground' : 'text-muted-foreground')"
      @click.stop="emit('sort')"
    >
      <span class="min-w-0 truncate"><slot>{{ label }}</slot></span>
      <Icon :icon="icon" size="xs" :class="direction ? '' : 'opacity-50'" />
    </button>
    <span v-else class="min-w-0 flex-1 truncate" :class="ALIGN[align]"><slot>{{ label }}</slot></span>
    <div
      v-if="resizable"
      role="separator"
      aria-orientation="vertical"
      data-slot="data-grid-resize-handle"
      :data-dragging="dragging ? 'true' : undefined"
      :aria-label="`Resize ${label} column`"
      :aria-valuenow="width"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :tabindex="tabbable ? 0 : -1"
      style="width: 24px; touch-action: none"
      class="group/handle absolute inset-y-0 end-0 z-10 flex cursor-col-resize items-center justify-end outline-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onHandleKeydown"
      @click.stop
    >
      <span aria-hidden="true" class="h-4 border-e-2 border-input group-hover/handle:border-ring group-focus-visible/handle:border-ring group-data-[dragging=true]/handle:border-ring" />
    </div>
  </div>
</template>
