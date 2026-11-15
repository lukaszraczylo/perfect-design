<script setup lang="ts" generic="T">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { VIRTUAL_LIST_VARIANTS, virtualListRowVariants, virtualListVariants, type VirtualListVariant } from './variants'
import { classText, hasAriaName, hasText, useMountedCheck } from '../_shared/contract'

export interface VirtualListRange {
  /** First rendered index (inclusive, overscan included). */
  start: number
  /** Last rendered index (exclusive, overscan included). */
  end: number
}

export type VirtualListAlign = 'start' | 'center' | 'end' | 'auto'

export interface VirtualListProps<T> extends BaseProps {
  items: readonly T[]
  /** Fixed row height in px. Non-finite or <= 0 falls back to 32. */
  itemHeight: number
  /** Viewport height: a number (px) or any CSS length. When omitted, size the list with `class` (e.g. `h-96`). */
  height?: number | string
  /** Extra rows rendered above and below the viewport. */
  overscan?: number
  /** Stable key per row: property name of the item or a function. Defaults to the row index. */
  itemKey?: string | ((item: T, index: number) => string | number)
  /** Accessible name of the list. */
  label?: string
  /** `plain` (default), `bordered` rounded border, `divided` rule under each row, `striped` tinted even rows. Unknown values fall back to `plain`. */
  variant?: VirtualListVariant
}

const props = withDefaults(defineProps<VirtualListProps<T>>(), { overscan: 4, variant: 'plain' })
const emit = defineEmits<{
  /** Scroll offset in px, throttled to one emit per animation frame. */
  scroll: [scrollTop: number]
  /** Rendered range changed. */
  range: [range: VirtualListRange]
}>()

defineSlots<{
  default(props: { item: T; index: number }): unknown
  empty(): unknown
}>()

const FALLBACK_HEIGHT = 32
const rowHeight = computed(() => (Number.isFinite(props.itemHeight) && props.itemHeight > 0 ? props.itemHeight : FALLBACK_HEIGHT))
const count = computed(() => props.items?.length ?? 0)
const totalHeight = computed(() => count.value * rowHeight.value)
const over = computed(() => (Number.isFinite(props.overscan) && props.overscan > 0 ? Math.floor(props.overscan) : 0))

// A height from the `height` prop, a height utility on `class`, or an inline height on `style`.
const HEIGHT_CLASS = /(?:^|[\s:!])(?:h|max-h|size)-|(?:^|[\s:!])(?:flex-1|flex-auto|grow)(?:$|\s)/
const attrs = useAttrs()
function checkContract() {
  if (typeof props.itemHeight !== 'number' || !Number.isFinite(props.itemHeight) || props.itemHeight <= 0) {
    violation('VirtualList', 'requires-itemHeight', `needs \`itemHeight\`, a positive number of pixels (got ${String(props.itemHeight)}). Every row must have this height.`)
  }
  const hasHeight = (typeof props.height === 'number' && props.height > 0) || hasText(props.height)
  const styles = [attrs.style].flat(2)
  const styleHeight = styles.some((v) => (typeof v === 'string' ? /(?:^|;)\s*(?:max-)?height\s*:/.test(v) : !!v && typeof v === 'object' && ('height' in v || 'maxHeight' in v || 'max-height' in v)))
  if (!hasHeight && !styleHeight && !HEIGHT_CLASS.test(classText(props.class))) {
    violation('VirtualList', 'requires-height', 'needs a bounded height, otherwise it grows to full size and nothing is windowed. Set `height` (for example `:height="320"`) or a height class such as `class="h-80"` (use `height="100%"` when a parent sizes it).')
  }
  if (!hasText(props.label) && !hasAriaName(attrs)) {
    violation('VirtualList', 'requires-accessible-name', 'needs an accessible name. Set `label`, `aria-label` or `aria-labelledby`.')
  }
}
useMountedCheck(checkContract)

const el = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const measured = ref(0)
const viewport = computed(() => (typeof props.height === 'number' && props.height > 0 ? props.height : measured.value))

const range = computed<VirtualListRange>(() => {
  const h = rowHeight.value
  const first = Math.floor(scrollTop.value / h)
  const last = Math.ceil((scrollTop.value + viewport.value) / h)
  const start = Math.min(count.value, Math.max(0, first - over.value))
  const end = Math.min(count.value, Math.max(start, last + over.value))
  return { start, end }
})

const rows = computed(() => {
  const { start, end } = range.value
  const out: { item: T; index: number; key: string | number }[] = []
  for (let i = start; i < end; i++) {
    const item = props.items[i]
    out.push({ item, index: i, key: keyOf(item, i) })
  }
  return out
})

function keyOf(item: T, index: number): string | number {
  const k = props.itemKey
  if (typeof k === 'function') return k(item, index)
  if (typeof k === 'string' && item !== null && typeof item === 'object') {
    const v = (item as Record<string, unknown>)[k]
    if (typeof v === 'string' || typeof v === 'number') return v
  }
  return index
}

watch(range, (r, old) => {
  if (!old || r.start !== old.start || r.end !== old.end) emit('range', { ...r })
}, { immediate: true })

// rAF-throttled scroll handling: many scroll events per frame collapse into one read + emit.
let raf: number | undefined
function flush() {
  raf = undefined
  if (!el.value) return
  scrollTop.value = el.value.scrollTop
  emit('scroll', scrollTop.value)
}
function onScroll() {
  if (raf !== undefined) return
  if (typeof requestAnimationFrame !== 'function') return flush()
  raf = requestAnimationFrame(flush)
}

let ro: ResizeObserver | undefined
function measure() {
  if (el.value) measured.value = el.value.clientHeight
}
onMounted(() => {
  measure()
  scrollTop.value = el.value?.scrollTop ?? 0
  if (typeof ResizeObserver !== 'undefined' && el.value) {
    ro = new ResizeObserver(measure)
    ro.observe(el.value)
  }
})
onBeforeUnmount(() => {
  if (raf !== undefined && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf)
  raf = undefined
  ro?.disconnect()
  ro = undefined
})

/** Scroll so row `index` is at the given alignment. Out-of-range / NaN indexes are clamped. */
function scrollToIndex(index: number, align: VirtualListAlign = 'start') {
  if (!el.value || count.value === 0) return
  const i = Math.min(count.value - 1, Math.max(0, Number.isFinite(index) ? Math.floor(index) : 0))
  const h = rowHeight.value
  const vh = viewport.value
  const top = i * h
  const bottom = top + h
  const cur = el.value.scrollTop
  let target = top
  if (align === 'end') target = bottom - vh
  else if (align === 'center') target = top - (vh - h) / 2
  else if (align === 'auto') target = top < cur ? top : bottom > cur + vh ? bottom - vh : cur
  const max = Math.max(0, totalHeight.value - vh)
  target = Math.min(max, Math.max(0, target))
  el.value.scrollTop = target
  scrollTop.value = target
}

defineExpose({ scrollToIndex, range })

const style = computed(() => {
  const h = props.height
  if (h === undefined || h === null || h === '') return undefined
  return { height: typeof h === 'number' ? (h > 0 ? `${h}px` : undefined) : h }
})
const variant = computed<VirtualListVariant>(() => (VIRTUAL_LIST_VARIANTS.includes(props.variant) ? props.variant : 'plain'))
const classes = computed(() => cn(virtualListVariants({ variant: variant.value }), 'focus-visible:ring-inset', focusRing, props.class))
</script>

<template>
  <div
    ref="el"
    data-slot="virtual-list"
    :role="count === 0 ? 'group' : 'list'"
    :tabindex="count === 0 ? undefined : 0"
    :aria-label="label"
    :style="style"
    :data-count="count"
    :data-variant="variant === 'plain' ? undefined : variant"
    :class="classes"
    @scroll.passive="onScroll"
  >
    <div v-if="count === 0" data-slot="virtual-list-empty" class="p-4 text-center text-sm text-muted-foreground">
      <slot name="empty">No items</slot>
    </div>
    <div v-else data-slot="virtual-list-spacer" role="presentation" class="relative w-full" :style="{ height: `${totalHeight}px` }">
      <div
        v-for="row in rows"
        :key="row.key"
        data-slot="virtual-list-item"
        role="listitem"
        :aria-setsize="count"
        :aria-posinset="row.index + 1"
        :data-index="row.index"
        :class="virtualListRowVariants({ variant, odd: row.index % 2 === 1 })"
        :style="{ top: `${row.index * rowHeight}px`, height: `${rowHeight}px` }"
      >
        <slot :item="row.item" :index="row.index" />
      </div>
    </div>
  </div>
</template>
