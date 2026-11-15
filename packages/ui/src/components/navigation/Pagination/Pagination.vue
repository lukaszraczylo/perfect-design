<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { faAngleLeft, faAngleRight, faAnglesLeft, faAnglesRight } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { useConfig, useConfigLabels } from '../../layout/ConfigProvider/config'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import { clampInt, getPaginationRange } from './range'
import {
  PAGINATION_SHAPES,
  PAGINATION_SIZES,
  PAGINATION_VARIANTS,
  paginationEllipsisVariants,
  paginationSummaryVariants,
  type PaginationShape,
  type PaginationSize,
  type PaginationVariant,
} from './variants'

export interface PaginationLabels {
  nav: string
  first: string
  previous: string
  next: string
  last: string
  /** Prefix of a page button's accessible name, e.g. "Page 3". */
  page: string
  /** "Page 3 of 10" in the compact indicator; `{page}` and `{total}` are replaced. */
  summary: string
}

export interface PaginationProps extends BaseProps {
  /** Current page, 1-based (v-model:page). Out-of-range values are clamped. */
  page?: number
  /** Initial page when uncontrolled. */
  defaultPage?: number
  /** Total number of items. Negative or non-numeric values count as 0 (one empty page). */
  total?: number
  /** Items per page. Values below 1 or non-numeric fall back to 10. */
  pageSize?: number
  /** Page buttons kept on each side of the current page. */
  siblings?: number
  /** Show first/last page buttons. */
  showEdges?: boolean
  /**
   * `numbered` (default): page buttons, switching to "Page X of Y" below the `sm` breakpoint. `simple`: previous and next
   * buttons with text and "Page X of Y" between them (no page buttons, no edge buttons). `compact`: "Page X of Y"
   * between icon arrows at every width. Unknown values fall back to `numbered`.
   */
  variant?: PaginationVariant
  /** Size of the buttons: `sm` (24px), `md` (32px, default) or `lg` (44px). Unknown values fall back to `md`. */
  size?: PaginationSize
  /** Corner style of the buttons: `rounded` (default), `pill` or `square`. Unknown values fall back to `rounded`. */
  shape?: PaginationShape
  /** Same as `variant="compact"`: always use the compact "Page X of Y" layout (otherwise compact only below the `sm` breakpoint). */
  compact?: boolean
  disabled?: boolean
  labels?: Partial<PaginationLabels>
}

const DEFAULT_LABELS: PaginationLabels = {
  nav: 'Pagination',
  first: 'First page',
  previous: 'Previous page',
  next: 'Next page',
  last: 'Last page',
  page: 'Page',
  summary: 'Page {page} of {total}',
}

const props = withDefaults(defineProps<PaginationProps>(), {
  page: undefined,
  defaultPage: 1,
  total: 0,
  pageSize: 10,
  siblings: 1,
  showEdges: true,
  variant: 'numbered',
  shape: 'rounded',
})
const emit = defineEmits<{ 'update:page': [page: number] }>()

// Precedence per string: `labels` prop, then a surrounding ConfigProvider (`pagination.*`), then the English default.
const config = useConfig()
const configured = useConfigLabels('pagination', DEFAULT_LABELS)
const text = computed(() => ({ ...configured.value, ...props.labels }))
// A localised `labels` object that blanks a label would leave the landmark or a button without a name.
onMounted(() => {
  const names: (keyof PaginationLabels)[] = ['nav', 'previous', 'next', ...(props.showEdges && props.variant !== 'simple' ? (['first', 'last'] as const) : []), 'page']
  for (const name of names) requireText('Pagination', `labels.${name}`, text.value[name], 'Pass a non-empty string, or leave it out to keep the English default.')
})
const totalPages = computed(() => {
  const total = clampInt(props.total, 0, Number.MAX_SAFE_INTEGER, 0)
  const size = props.pageSize >= 1 ? clampInt(props.pageSize, 1, Number.MAX_SAFE_INTEGER, 10) : 10
  return Math.max(1, Math.ceil(total / size))
})

const inner = ref<unknown>(props.page ?? props.defaultPage)
watch(
  () => props.page,
  (p) => {
    if (p !== undefined) inner.value = p
  },
)
const current = computed(() => clampInt(inner.value, 1, totalPages.value, 1))

// Keep v-model in sync when the incoming page is invalid or the total shrank below it.
watch(
  [current, () => props.page],
  ([c, p]) => {
    if (p !== undefined && p !== c) emit('update:page', c)
  },
  { immediate: true },
)

const variant = computed<PaginationVariant>(() => (PAGINATION_VARIANTS.includes(props.variant as PaginationVariant) ? (props.variant as PaginationVariant) : 'numbered'))
// Without a `size` prop a surrounding ConfigProvider's size hint applies when Pagination supports it.
const size = computed<PaginationSize>(() => {
  const wanted = props.size ?? config.value.size
  return PAGINATION_SIZES.includes(wanted as PaginationSize) ? (wanted as PaginationSize) : 'md'
})
const shape = computed<PaginationShape>(() => (PAGINATION_SHAPES.includes(props.shape as PaginationShape) ? (props.shape as PaginationShape) : 'rounded'))
const simple = computed(() => variant.value === 'simple')
/** `compact` (prop or variant) and `simple` both show the summary at every width instead of the page list. */
const summaryAlways = computed(() => props.compact || variant.value === 'compact' || simple.value)
const edges = computed(() => props.showEdges && !simple.value)
const ICON_SIZE = { sm: 'icon-xs', md: 'icon-sm', lg: 'icon-lg' } as const
const TEXT_SIZE = { sm: 'xs', md: 'sm', lg: 'md' } as const
const ROUNDED = { rounded: 'default', pill: 'full', square: 'none' } as const
const iconSize = computed(() => ICON_SIZE[size.value])
const textSize = computed(() => TEXT_SIZE[size.value])
const rounded = computed(() => ROUNDED[shape.value])
/** The 24px size has no coarse-pointer growth of its own. */
const coarse = computed(() => (size.value === 'sm' ? 'pointer-coarse:size-10' : undefined))

const items = computed(() => getPaginationRange(current.value, totalPages.value, props.siblings))
const atStart = computed(() => current.value <= 1)
const atEnd = computed(() => current.value >= totalPages.value)
const summary = computed(() => text.value.summary.replace('{page}', String(current.value)).replace('{total}', String(totalPages.value)))

const root = ref<HTMLElement | null>(null)

async function go(next: number) {
  if (props.disabled) return
  const target = clampInt(next, 1, totalPages.value, current.value)
  if (target === current.value) return
  const from = typeof document === 'undefined' ? null : document.activeElement
  if (props.page === undefined) inner.value = target
  emit('update:page', target)
  // A button that just became disabled (Next on the last page) would drop focus to <body>: hand it to a live control.
  await nextTick()
  if (from instanceof HTMLButtonElement && from.disabled && root.value?.contains(from)) {
    const fallback = root.value.querySelector<HTMLElement>(atEnd.value ? '[data-slot="pagination-prev"]' : '[data-slot="pagination-next"]')
    fallback?.focus()
  }
}
</script>

<template>
  <nav
    ref="root"
    data-slot="pagination"
    :aria-label="text.nav"
    :data-variant="variant"
    :data-size="size"
    :data-shape="shape"
    :data-compact="summaryAlways ? '' : undefined"
    :class="cn('flex flex-wrap items-center justify-center gap-1', props.class)"
  >
    <Button
      v-if="edges"
      data-slot="pagination-first"
      variant="ghost"
      :size="iconSize"
      :rounded="rounded"
      :class="coarse"
      :disabled="disabled || atStart"
      :aria-label="text.first"
      @click="go(1)"
    >
      <Icon :icon="faAnglesLeft" class="rtl:rotate-180" />
    </Button>
    <Button
      v-if="simple"
      data-slot="pagination-prev"
      variant="outline"
      :size="textSize"
      :rounded="rounded"
      :disabled="disabled || atStart"
      @click="go(current - 1)"
    >
      <Icon :icon="faAngleLeft" class="rtl:rotate-180" />{{ text.previous }}
    </Button>
    <Button
      v-else
      data-slot="pagination-prev"
      variant="ghost"
      :size="iconSize"
      :rounded="rounded"
      :class="coarse"
      :disabled="disabled || atStart"
      :aria-label="text.previous"
      @click="go(current - 1)"
    >
      <Icon :icon="faAngleLeft" class="rtl:rotate-180" />
    </Button>

    <span
      data-slot="pagination-summary"
      aria-live="polite"
      :class="cn(paginationSummaryVariants({ size }), summaryAlways ? '' : 'sm:hidden')"
    >{{ summary }}</span>

    <ul v-if="!summaryAlways" data-slot="pagination-list" class="hidden items-center gap-1 sm:flex">
      <li v-for="item in items" :key="item">
        <span v-if="typeof item !== 'number'" data-slot="pagination-ellipsis" aria-hidden="true" :class="cn(paginationEllipsisVariants({ size }))">&hellip;</span>
        <Button
          v-else
          data-slot="pagination-page"
          :variant="item === current ? 'outline' : 'ghost'"
          :size="iconSize"
          :rounded="rounded"
          :class="cn('tabular-nums', coarse)"
          :disabled="disabled"
          :aria-label="`${text.page} ${item}`"
          :aria-current="item === current ? 'page' : undefined"
          @click="go(item)"
        >
          {{ item }}
        </Button>
      </li>
    </ul>

    <Button
      v-if="simple"
      data-slot="pagination-next"
      variant="outline"
      :size="textSize"
      :rounded="rounded"
      :disabled="disabled || atEnd"
      @click="go(current + 1)"
    >
      {{ text.next }}<Icon :icon="faAngleRight" class="rtl:rotate-180" />
    </Button>
    <Button
      v-else
      data-slot="pagination-next"
      variant="ghost"
      :size="iconSize"
      :rounded="rounded"
      :class="coarse"
      :disabled="disabled || atEnd"
      :aria-label="text.next"
      @click="go(current + 1)"
    >
      <Icon :icon="faAngleRight" class="rtl:rotate-180" />
    </Button>
    <Button
      v-if="edges"
      data-slot="pagination-last"
      variant="ghost"
      :size="iconSize"
      :rounded="rounded"
      :class="coarse"
      :disabled="disabled || atEnd"
      :aria-label="text.last"
      @click="go(totalPages)"
    >
      <Icon :icon="faAnglesRight" class="rtl:rotate-180" />
    </Button>
  </nav>
</template>
