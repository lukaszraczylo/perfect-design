<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Spinner from '../../primitives/Spinner/Spinner.vue'
import { checkAfterMount } from '../requireContent'
import { clampCount } from './count'
import { pick } from '../pick'
import {
  LOADING_STATE_LAYOUTS,
  LOADING_STATE_SHAPES,
  LOADING_STATE_SIZES,
  LOADING_STATE_VARIANTS,
  loadingStateVariants,
  type LoadingStateLayout,
  type LoadingStateShape,
  type LoadingStateSize,
  type LoadingStateVariant,
} from './variants'

export interface LoadingStateProps extends BaseProps {
  /**
   * `spinner` = spinner + label. Skeleton placeholders: `text` (lines), `card` (media + lines), `table` (header + rows x columns),
   * `list` (rows with a leading marker, a line and a trailing value), `avatar-text` (rows of avatar + two lines),
   * `kpi-grid` (`columns` metric tiles) and `form` (`rows` label + field pairs and a submit button).
   */
  variant?: LoadingStateVariant
  /** Scale of the `spinner` variant: `sm`, `md` (default) or `lg`. Skeleton variants ignore it. */
  size?: LoadingStateSize
  /** `stacked` (default, spinner above the label) or `inline` (spinner and label in one start-aligned row). Spinner variant only. */
  layout?: LoadingStateLayout
  /** Corner shape of the skeleton placeholders: `rounded` (default), `square` or `pill`. The spinner variant ignores it. */
  shape?: LoadingStateShape
  /** Announced to assistive tech (and shown next to the spinner). */
  label?: string
  /** Fill the viewport height and centre the content. */
  fullPage?: boolean
  /** Skeleton text lines / table body rows / list rows / avatar rows / form fields (1-50). */
  rows?: number
  /** Skeleton table columns, or number of `kpi-grid` tiles (1-12). */
  columns?: number
}

const props = withDefaults(defineProps<LoadingStateProps>(), { variant: 'spinner', size: 'md', layout: 'stacked', shape: 'rounded', label: 'Loading…', fullPage: false, rows: 3, columns: 4 })

const slots = useSlots()
// The label is the only thing a screen reader announces for this status region (it is visually hidden on skeletons).
checkAfterMount(() => {
  if (slots.default) return
  requireText('LoadingState', 'label', props.label, 'Say what is loading, for example "Loading invoices". The default slot also works.')
})

const resolvedVariant = computed<LoadingStateVariant>(() => (LOADING_STATE_VARIANTS.includes(props.variant) ? props.variant : 'spinner'))
const resolvedSize = computed<LoadingStateSize>(() => pick(props.size, LOADING_STATE_SIZES, 'md'))
const resolvedLayout = computed<LoadingStateLayout>(() => pick(props.layout, LOADING_STATE_LAYOUTS, 'stacked'))
const resolvedShape = computed<LoadingStateShape>(() => pick(props.shape, LOADING_STATE_SHAPES, 'rounded'))
const SPINNER_SIZES = { sm: 'md', md: 'lg', lg: 'xl' } as const
const rowList = computed(() => Array.from({ length: clampCount(props.rows, 3) }, (_, i) => i))
const colList = computed(() => Array.from({ length: clampCount(props.columns, 4, 12) }, (_, i) => i))
const lineWidth = (i: number, n: number) => (i === n - 1 && n > 1 ? 'w-2/3' : i % 2 ? 'w-11/12' : 'w-full')
const classes = computed(() => cn(loadingStateVariants({ variant: resolvedVariant.value, fullPage: props.fullPage, size: resolvedSize.value, layout: resolvedLayout.value }), props.class))
const SHAPE_CLASS = { rounded: '', square: 'rounded-none', pill: 'rounded-full' } as const
const bone = computed(() => cn('animate-pulse rounded bg-muted motion-reduce:animate-none', SHAPE_CLASS[resolvedShape.value]))
// A tall media block keeps a small radius in the pill shape (a full radius would turn it into an ellipse).
const mediaBone = computed(() => cn(bone.value, resolvedShape.value === 'pill' && 'rounded-lg'))
</script>

<template>
  <div
    data-slot="loading-state"
    :data-variant="resolvedVariant"
    :data-size="resolvedSize === 'md' ? undefined : resolvedSize"
    :data-layout="resolvedLayout === 'stacked' ? undefined : resolvedLayout"
    :data-shape="resolvedShape === 'rounded' ? undefined : resolvedShape"
    role="status"
    aria-live="polite"
    aria-busy="true"
    :class="classes"
  >
    <template v-if="resolvedVariant === 'spinner'">
      <span aria-hidden="true"><Spinner :size="SPINNER_SIZES[resolvedSize]" class="text-primary" /></span>
      <span data-slot="loading-state-label"><slot>{{ label }}</slot></span>
    </template>
    <template v-else>
      <span class="sr-only" data-slot="loading-state-label"><slot>{{ label }}</slot></span>
      <div v-if="resolvedVariant === 'text'" aria-hidden="true" class="flex flex-col gap-2.5">
        <div v-for="i in rowList" :key="i" data-slot="loading-state-skeleton" :class="cn(bone, 'h-4', lineWidth(i, rowList.length))" />
      </div>
      <template v-else-if="resolvedVariant === 'card'">
        <div data-slot="loading-state-skeleton" aria-hidden="true" :class="cn(mediaBone, 'h-32 w-full')" />
        <div aria-hidden="true" class="flex flex-col gap-2.5">
          <div v-for="i in rowList" :key="i" data-slot="loading-state-skeleton" :class="cn(bone, 'h-4', lineWidth(i, rowList.length))" />
        </div>
      </template>
      <div v-else-if="resolvedVariant === 'list'" aria-hidden="true" class="flex flex-col gap-3">
        <div v-for="i in rowList" :key="i" data-slot="loading-state-row" class="flex items-center gap-3">
          <div data-slot="loading-state-skeleton" :class="cn(bone, 'size-4 shrink-0')" />
          <div data-slot="loading-state-skeleton" :class="cn(bone, 'h-4 flex-1')" />
          <div data-slot="loading-state-skeleton" :class="cn(bone, 'h-4 w-12 shrink-0')" />
        </div>
      </div>
      <div v-else-if="resolvedVariant === 'avatar-text'" aria-hidden="true" class="flex flex-col gap-4">
        <div v-for="i in rowList" :key="i" data-slot="loading-state-row" class="flex items-center gap-3">
          <div data-slot="loading-state-skeleton" :class="cn(bone, 'size-10 shrink-0 rounded-full')" />
          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <div data-slot="loading-state-skeleton" :class="cn(bone, 'h-4 w-1/3')" />
            <div data-slot="loading-state-skeleton" :class="cn(bone, 'h-3 w-2/3')" />
          </div>
        </div>
      </div>
      <div v-else-if="resolvedVariant === 'kpi-grid'" aria-hidden="true" class="grid w-full grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4">
        <div v-for="c in colList" :key="c" data-slot="loading-state-tile" class="flex flex-col gap-3 rounded-lg border bg-card p-4">
          <div data-slot="loading-state-skeleton" :class="cn(bone, 'h-3 w-1/2')" />
          <div data-slot="loading-state-skeleton" :class="cn(bone, 'h-8 w-2/3')" />
          <div data-slot="loading-state-skeleton" :class="cn(bone, 'h-3 w-1/3')" />
        </div>
      </div>
      <div v-else-if="resolvedVariant === 'form'" aria-hidden="true" class="flex flex-col gap-4">
        <div v-for="i in rowList" :key="i" data-slot="loading-state-field" class="flex flex-col gap-2">
          <div data-slot="loading-state-skeleton" :class="cn(bone, 'h-3 w-24')" />
          <div data-slot="loading-state-skeleton" :class="cn(bone, 'h-9 w-full')" />
        </div>
        <div data-slot="loading-state-skeleton" :class="cn(bone, 'h-9 w-28')" />
      </div>
      <div v-else aria-hidden="true" class="flex flex-col gap-3">
        <div class="flex gap-4">
          <div v-for="c in colList" :key="c" data-slot="loading-state-skeleton" :class="cn(bone, 'h-4 flex-1 bg-muted-foreground/20')" />
        </div>
        <div v-for="r in rowList" :key="r" data-slot="loading-state-row" class="flex gap-4">
          <div v-for="c in colList" :key="c" data-slot="loading-state-skeleton" :class="cn(bone, 'h-4 flex-1')" />
        </div>
      </div>
    </template>
  </div>
</template>
