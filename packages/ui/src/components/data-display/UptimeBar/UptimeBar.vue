<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import { requireOneOf, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { useMountedCheck } from '../_shared/contract'
import { oneOf, plural } from '../_chart/chartKit'
import { UPTIME_DENSE_AT, UPTIME_SIZES, UPTIME_STATES, UPTIME_STATE_LABELS, uptimeBarVariants, uptimeSegmentVariants, type UptimeSize, type UptimeState } from './variants'
import { useAttrs } from 'vue'

export interface UptimeSegment {
  state: UptimeState
  /** What the segment stands for, e.g. the time of the check. Shown in its tooltip and in the summary. */
  label?: string
}

export interface UptimeSummarySlotProps {
  total: number
  counts: Record<UptimeState, number>
  /** The default summary text, e.g. "28 checks: 26 up, 1 degraded, 1 down". */
  text: string
}

export interface UptimeBarProps extends BaseProps {
  /** One segment per check or period, oldest first. Unknown states are drawn as `unknown`. */
  segments: UptimeSegment[]
  /** Accessible name, e.g. "API checks, last 28 days". */
  label?: string
  /** Replaces the state names (English defaults: up, degraded, down, unknown). */
  stateLabels?: Partial<Record<UptimeState, string>>
  /** Segment height: `sm` 16px, `md` 32px, `lg` 48px. Unknown values fall back to `md`. */
  size?: UptimeSize
  /** Replaces the generated summary text (visible and in the accessible name). */
  summary?: string
  /** Hide the visible summary line (the accessible name keeps it). */
  hideSummary?: boolean
  /** Shown when there are no segments. */
  emptyText?: string
}

const props = withDefaults(defineProps<UptimeBarProps>(), { size: 'md', hideSummary: false, emptyText: 'No checks yet' })
const attrs = useAttrs()

useMountedCheck(
  () => {
    requireOneOf('UptimeBar', { label: props.label, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, 'The bar is an image with a text alternative and needs a name, e.g. `label="API checks, last 28 days"`.')
    if (!Array.isArray(props.segments)) violation('UptimeBar', 'requires-segments', 'requires `segments`, an array of `{ state, label? }`. An empty array shows the empty text.')
  },
  [() => props.segments],
)

const items = computed(() => (Array.isArray(props.segments) ? props.segments : []))
const names = computed<Record<UptimeState, string>>(() => {
  const out = { ...UPTIME_STATE_LABELS }
  for (const s of UPTIME_STATES) {
    const custom = props.stateLabels?.[s]
    if (typeof custom === 'string' && custom.trim()) out[s] = custom
  }
  return out
})
const stateOf = (s: UptimeSegment): UptimeState => oneOf<UptimeState>(s?.state, UPTIME_STATES, 'unknown')
const segs = computed(() =>
  items.value.map((s) => {
    const state = stateOf(s)
    const text = s?.label ? `${s.label}: ${names.value[state]}` : names.value[state]
    return { state, text, cls: uptimeSegmentVariants({ state }) }
  }),
)
const counts = computed(() => {
  const c: Record<UptimeState, number> = { up: 0, degraded: 0, down: 0, unknown: 0 }
  for (const s of segs.value) c[s.state]++
  return c
})
const generated = computed(() => `${plural(segs.value.length, 'check')}: ${UPTIME_STATES.filter((s) => counts.value[s] > 0).map((s) => `${counts.value[s]} ${names.value[s]}`).join(', ')}`)
const summaryText = computed(() => (props.summary?.trim() ? props.summary : generated.value))
const name = computed(() => (props.label ? `${props.label}: ${summaryText.value}` : summaryText.value))
const barClass = computed(() => uptimeBarVariants({ size: oneOf<UptimeSize>(props.size, UPTIME_SIZES, 'md'), gap: segs.value.length <= UPTIME_DENSE_AT }))
</script>

<template>
  <div
    v-if="segs.length === 0"
    data-slot="uptime-bar"
    role="img"
    :aria-label="label ? `${label}: ${emptyText}` : emptyText"
    :class="cn('flex min-h-12 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground', $props.class)"
  >
    <span data-slot="uptime-bar-empty">{{ emptyText }}</span>
  </div>
  <div v-else data-slot="uptime-bar" :class="cn('flex w-full min-w-0 flex-col gap-1.5', $props.class)">
    <div data-slot="uptime-bar-track" role="img" :aria-label="name" :class="barClass">
      <span v-for="(s, i) in segs" :key="i" data-slot="uptime-bar-segment" :data-state="s.state" :title="s.text" :class="s.cls" />
    </div>
    <div v-if="!hideSummary" data-slot="uptime-bar-summary" class="text-xs text-muted-foreground tabular-nums">
      <slot name="summary" :total="segs.length" :counts="counts" :text="summaryText">{{ summaryText }}</slot>
    </div>
  </div>
</template>
