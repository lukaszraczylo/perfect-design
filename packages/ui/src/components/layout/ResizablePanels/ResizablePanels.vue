<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, shallowRef } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { resizableKey, type ResizableContext, type ResizableItem } from './context'
import { computeLayout, isCollapsedSize, isValidSize, normalizeConfigs, pairRange, resizePair, roundSize } from './layout'
import { resizablePanelsVariants, type ResizableOrientation } from './variants'

export interface ResizablePanelsProps extends BaseProps {
  /** `horizontal` lays panels side by side (handles are vertical bars); `vertical` stacks them. Unknown values fall back to `horizontal`. */
  orientation?: ResizableOrientation
  /** Controlled sizes in percent (`v-model:sizes`), one per panel in DOM order. Ignored while its length differs from the panel count or it holds invalid numbers. Always normalised to sum 100 and clamped. */
  sizes?: number[]
  /** localStorage key; when set the layout is restored after mount and saved after every resize. Unavailable / throwing storage and corrupt JSON are ignored. */
  storageKey?: string
  /** Keyboard step in percent for the arrow keys. Invalid values fall back to 5. */
  step?: number
  /** Keyboard step in percent while Shift is held. Invalid values fall back to 20. */
  largeStep?: number
  /** Disable every handle. */
  disabled?: boolean
}

const props = withDefaults(defineProps<ResizablePanelsProps>(), {
  orientation: 'horizontal',
  sizes: undefined,
  storageKey: undefined,
  step: 5,
  largeStep: 20,
  disabled: false,
})

const emit = defineEmits<{
  'update:sizes': [sizes: number[]]
  resizeStart: []
  resizeEnd: [sizes: number[]]
}>()

const rootRef = ref<HTMLElement | null>(null)
const items = shallowRef<ResizableItem[]>([])
/** Raw per-panel sizes (aligned with panels); `undefined` entries resolve to defaults. */
const state = ref<(number | undefined)[]>([])
const dragging = ref(false)
const ready = ref(false)
let mounted = false
let unmounting = false
const lastSizes = new Map<number, number>()

const orientation = computed<ResizableOrientation>(() => (props.orientation === 'vertical' ? 'vertical' : 'horizontal'))
const panels = computed(() => items.value.filter((i) => i.kind === 'panel'))
const configs = computed(() => panels.value.map((p) => p.config!()))
const normalized = computed(() => normalizeConfigs(configs.value))
const layout = computed(() => {
  const external = props.sizes
  const source = Array.isArray(external) && external.length === panels.value.length ? external : state.value
  return computeLayout(configs.value, source)
})

const stepOf = (large: boolean) => {
  const v = large ? props.largeStep : props.step
  return isValidSize(v) && v > 0 ? v : large ? 20 : 5
}

function sameSizes(a: number[], b: number[]) {
  return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-9)
}

function persist(sizes: number[]) {
  if (!props.storageKey) return
  try {
    window.localStorage.setItem(props.storageKey, JSON.stringify(sizes))
  } catch {
    /* storage unavailable (SSR, private mode, quota) */
  }
}

function restore() {
  if (!props.storageKey || Array.isArray(props.sizes)) return
  try {
    const raw = window.localStorage.getItem(props.storageKey)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed) && parsed.length === panels.value.length && parsed.every(isValidSize)) state.value = parsed
  } catch {
    /* corrupt JSON or storage unavailable */
  }
}

function commit(next: number[], save = true) {
  const current = layout.value
  if (sameSizes(next, current)) return
  next.forEach((size, i) => {
    if (!isCollapsedSize(current[i], normalized.value[i]) && isCollapsedSize(size, normalized.value[i])) lastSizes.set(panels.value[i].id, current[i])
  })
  state.value = next
  emit('update:sizes', next.slice())
  if (save) persist(next)
}

/** Rebuild raw state after the panel set changed: survivors keep their size, newcomers get their default or an equal share. */
function rebuild(previous: Map<number, number>) {
  const list = panels.value
  const n = list.length
  if (!mounted || n === 0) {
    state.value = []
    return
  }
  const known = list.filter((p) => previous.has(p.id))
  const fresh = list.filter((p) => !previous.has(p.id))
  const freshSizes = new Map(
    fresh.map((p) => {
      const d = p.config!().defaultSize
      return [p.id, isValidSize(d) ? d : 100 / n] as const
    }),
  )
  const knownSum = known.reduce((s, p) => s + previous.get(p.id)!, 0)
  const freshSum = [...freshSizes.values()].reduce((s, v) => s + v, 0)
  const factor = Math.max(0, 100 - freshSum) / Math.max(knownSum, 1e-9)
  state.value = list.map((p) => (freshSizes.has(p.id) ? freshSizes.get(p.id) : previous.get(p.id)! * factor))
}

const snapshot = () => new Map(panels.value.map((p, i) => [p.id, layout.value[i]] as const))

function register(item: ResizableItem) {
  const before = snapshot()
  items.value = [...items.value, item]
  if (item.kind === 'panel') rebuild(before)
}

function unregister(id: number) {
  if (unmounting) return
  const before = snapshot()
  const gone = items.value.find((i) => i.id === id)
  items.value = items.value.filter((i) => i.id !== id)
  lastSizes.delete(id)
  if (gone?.kind === 'panel') {
    before.delete(id)
    rebuild(before)
  }
}

function sort() {
  const list = items.value
  /* v8 ignore next -- defensive: an item whose element is not mounted yet */
  if (list.some((i) => !i.el.value)) return
  const sorted = list.slice().sort((a, b) => (a.el.value!.compareDocumentPosition(b.el.value!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
  if (sorted.some((it, i) => it !== list[i])) {
    const before = snapshot()
    items.value = sorted
    rebuild(before)
  }
}

const panelIndex = (id: number) => panels.value.findIndex((p) => p.id === id)

function handleIndex(id: number) {
  let count = 0
  for (const it of items.value) {
    if (it.id === id) return count - 1
    if (it.kind === 'panel') count++
  }
  return -2
}

const handleItem = (id: number) => items.value.find((i) => i.id === id)
const handleBlocked = (id: number) => props.disabled || !!handleItem(id)?.disabled?.()
const usable = (idx: number) => idx >= 0 && idx + 1 < panels.value.length

function isCollapsed(panelId: number) {
  const i = panelIndex(panelId)
  return i >= 0 && isCollapsedSize(layout.value[i], normalized.value[i])
}

function collapse(panelId: number) {
  const i = panelIndex(panelId)
  const c = normalized.value[i]
  if (i < 0 || !c.collapsible || isCollapsed(panelId) || panels.value.length < 2) return
  const size = layout.value[i]
  lastSizes.set(panelId, size)
  const neighbour = i + 1 < panels.value.length ? i + 1 : i - 1
  const requested = layout.value.slice()
  requested[i] = c.collapsedSize
  requested[neighbour] += size - c.collapsedSize
  commit(computeLayout(configs.value, requested))
}

function expand(panelId: number) {
  const i = panelIndex(panelId)
  if (i < 0 || !isCollapsed(panelId)) return
  const c = normalized.value[i]
  const target = Math.max(c.min, lastSizes.get(panelId) ?? (c.defaultSize || 25))
  const current = layout.value
  const collapsedIdx = current.map((_, k) => k !== i && isCollapsedSize(current[k], normalized.value[k]))
  const fixed = target + current.reduce((s, v, k) => s + (collapsedIdx[k] ? v : 0), 0)
  const open = current.reduce((s, v, k) => s + (k !== i && !collapsedIdx[k] ? v : 0), 0)
  const factor = Math.max(0, 100 - fixed) / Math.max(open, 1e-9)
  commit(computeLayout(configs.value, current.map((v, k) => (k === i ? target : collapsedIdx[k] ? v : v * factor))))
}

const toggle = (panelId: number) => (isCollapsed(panelId) ? expand(panelId) : collapse(panelId))

function isRtl() {
  return !!rootRef.value && orientation.value === 'horizontal' && typeof getComputedStyle === 'function' && getComputedStyle(rootRef.value).direction === 'rtl'
}

function handleValues(handleId: number) {
  const idx = handleIndex(handleId)
  if (!usable(idx)) return { now: 0, min: 0, max: 0, usable: false }
  const [min, max] = pairRange(layout.value, configs.value, idx)
  return { now: roundSize(layout.value[idx]), min: roundSize(min), max: roundSize(max), usable: true }
}

function keyDown(handleId: number, e: KeyboardEvent) {
  const idx = handleIndex(handleId)
  if (handleBlocked(handleId) || !usable(idx)) return
  const horizontal = orientation.value === 'horizontal'
  const flip = isRtl() ? -1 : 1
  let delta: number | undefined
  if (e.key === (horizontal ? 'ArrowRight' : 'ArrowDown')) delta = stepOf(e.shiftKey) * flip
  else if (e.key === (horizontal ? 'ArrowLeft' : 'ArrowUp')) delta = -stepOf(e.shiftKey) * flip
  else if (e.key === 'Home') delta = pairRange(layout.value, configs.value, idx)[0] - layout.value[idx]
  else if (e.key === 'End') delta = pairRange(layout.value, configs.value, idx)[1] - layout.value[idx]
  else if (e.key === 'Enter') {
    const target = normalized.value[idx].collapsible ? panels.value[idx] : normalized.value[idx + 1].collapsible ? panels.value[idx + 1] : undefined
    if (!target) return
    e.preventDefault()
    toggle(target.id)
    return
  } else return
  e.preventDefault()
  commit(resizePair(layout.value, configs.value, idx, delta))
}

// ---- pointer drag -------------------------------------------------------------------------------------------
let drag: { idx: number; start: number; sizes: number[]; flip: number; el: Element | null; pointerId: number } | null = null

function available() {
  const root = rootRef.value!
  const key = orientation.value === 'horizontal' ? 'width' : 'height'
  const handles = items.value.reduce((s, i) => s + (i.kind === 'handle' && i.el.value ? i.el.value.getBoundingClientRect()[key] : 0), 0)
  return root.getBoundingClientRect()[key] - handles
}

function onMove(e: PointerEvent) {
  const size = available()
  if (!(size > 0)) return
  const pos = orientation.value === 'horizontal' ? e.clientX : e.clientY
  const delta = (((pos - drag!.start) / size) * 100) * drag!.flip
  if (!Number.isFinite(delta)) return
  commit(resizePair(drag!.sizes, configs.value, drag!.idx, delta), false)
}

function removeListeners() {
  document.removeEventListener('pointermove', onMove)
  document.removeEventListener('pointerup', endDrag)
  document.removeEventListener('pointercancel', endDrag)
}

function endDrag() {
  const { el, pointerId } = drag!
  drag = null
  removeListeners()
  try {
    el?.releasePointerCapture?.(pointerId)
  } catch {
    /* capture already gone */
  }
  dragging.value = false
  persist(layout.value)
  emit('resizeEnd', layout.value.slice())
}

function startDrag(handleId: number, e: PointerEvent) {
  const idx = handleIndex(handleId)
  if (handleBlocked(handleId) || !usable(idx) || !rootRef.value || e.button > 0 || typeof document === 'undefined') return
  if (drag) endDrag()
  e.preventDefault()
  const el = e.currentTarget as Element | null
  try {
    el?.setPointerCapture?.(e.pointerId)
  } catch {
    /* jsdom / detached element */
  }
  drag = {
    idx,
    start: orientation.value === 'horizontal' ? e.clientX : e.clientY,
    sizes: layout.value.slice(),
    flip: isRtl() ? -1 : 1,
    el,
    pointerId: e.pointerId,
  }
  dragging.value = true
  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', endDrag)
  document.addEventListener('pointercancel', endDrag)
  emit('resizeStart')
}

onMounted(() => {
  mounted = true
  restore()
  ready.value = true
})

// Children must alternate panel, handle, panel ... (a handle resizes the two panels around it).
onMounted(async () => {
  await nextTick()
  const order = items.value.map((i) => i.kind)
  const names = { panel: 'ResizablePanel', handle: 'ResizableHandle' }
  const fix = 'Children must alternate ResizablePanel, ResizableHandle, ResizablePanel ...'
  if (order.length === 0) return violation('ResizablePanels', 'requires-panels', `requires ResizablePanel children. ${fix}`)
  if (order[0] === 'handle') return violation('ResizablePanels', 'alternate-parts', `starts with a ResizableHandle, which has no panel before it. ${fix}`)
  if (order[order.length - 1] === 'handle') return violation('ResizablePanels', 'alternate-parts', `ends with a ResizableHandle, which has no panel after it. ${fix}`)
  for (let i = 1; i < order.length; i++) {
    if (order[i] === order[i - 1]) {
      return violation('ResizablePanels', 'alternate-parts', `has two ${names[order[i]]}s in a row (children ${i} and ${i + 1}). ${fix}`)
    }
  }
})

onBeforeUnmount(() => {
  unmounting = true
  drag = null
  if (typeof document !== 'undefined') removeListeners()
})

const context: ResizableContext = {
  orientation,
  disabled: computed(() => props.disabled),
  dragging,
  ready,
  layout: computed(() => layout.value),
  register,
  unregister,
  sort,
  panelIndex,
  handleIndex,
  isCollapsed,
  collapse,
  expand,
  handleValues,
  startDrag,
  keyDown,
}
provide(resizableKey, context)

defineExpose({
  /** Current layout in percent. */
  sizes: layout,
  /** Programmatically set sizes (validated, clamped, normalised). */
  setSizes(next: number[]) {
    commit(computeLayout(configs.value, next))
  },
})
</script>

<template>
  <div
    ref="rootRef"
    data-slot="resizable-panels"
    :data-orientation="orientation"
    :data-dragging="dragging ? '' : undefined"
    :class="cn(resizablePanelsVariants({ orientation }), props.class)"
  >
    <slot />
  </div>
</template>
