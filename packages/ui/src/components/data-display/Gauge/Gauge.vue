<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue'
import { requireOneOf } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { useMountedCheck } from '../_shared/contract'
import { oneOf } from '../_chart/chartKit'
import { GAUGE_SIZES, GAUGE_VARIANTS, gaugeLinearValueSize, gaugeToneStroke, gaugeVariants, type GaugeSize, type GaugeTone, type GaugeVariant } from './variants'

export interface GaugeThreshold {
  /** The tone applies once the value is >= this number (the highest matching threshold wins). */
  value: number
  tone: GaugeTone
}

export interface GaugeProps extends BaseProps {
  value?: number | null
  min?: number
  max?: number
  /** Tone steps, e.g. `[{ value: 0, tone: 'success' }, { value: 70, tone: 'warning' }, { value: 90, tone: 'danger' }]`. */
  thresholds?: GaugeThreshold[]
  /** Tone used below every threshold (or when there are none). */
  tone?: GaugeTone
  size?: GaugeSize
  /** `semicircle` half-dial (default), `arc` three-quarter dial with the value inside, `linear` horizontal bar. Same meter semantics in all three. */
  variant?: GaugeVariant
  /** Visible caption under the value; also the accessible name unless `aria-label` is passed. */
  label?: string
  /** Replaces the formatted value inside the gauge and as `aria-valuetext`. */
  valueText?: string
  /** Animate the arc (sweep on mount and on change). Never animates under prefers-reduced-motion. */
  animated?: boolean
}

const props = withDefaults(defineProps<GaugeProps>(), { min: 0, max: 100, tone: 'primary', size: 'md', variant: 'semicircle', animated: true })

const attrs = useAttrs()
useMountedCheck(() => requireOneOf('Gauge', { label: props.label, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, 'A gauge is a meter and needs a name, e.g. `label="CPU"`.'))

const REDUCED = '(prefers-reduced-motion: reduce)'

const lo = computed(() => {
  const a = Number.isFinite(props.min) ? props.min : 0
  const b = Number.isFinite(props.max) ? props.max : 100
  return Math.min(a, b)
})
const hi = computed(() => {
  const a = Number.isFinite(props.min) ? props.min : 0
  const b = Number.isFinite(props.max) ? props.max : 100
  return Math.max(a, b)
})
const valid = computed(() => typeof props.value === 'number' && Number.isFinite(props.value))
const clamped = computed(() => (valid.value ? Math.min(hi.value, Math.max(lo.value, props.value as number)) : lo.value))
const percent = computed(() => (hi.value === lo.value ? 0 : ((clamped.value - lo.value) / (hi.value - lo.value)) * 100))

const activeTone = computed<GaugeTone>(() => {
  if (!valid.value) return 'neutral'
  let picked: GaugeTone = props.tone
  let best = -Infinity
  for (const t of props.thresholds ?? []) {
    if (Number.isFinite(t?.value) && clamped.value >= t.value && t.value >= best) {
      best = t.value
      picked = t.tone
    }
  }
  return gaugeToneStroke[picked] ? picked : props.tone
})

const text = computed(() => {
  if (props.valueText) return props.valueText
  return valid.value ? String(Math.round(clamped.value * 100) / 100) : '–'
})

// Arc sweep: starts empty on mount (when animating), then transitions to the real value.
const reduced = ref(false)
const drawn = ref(percent.value)
let raf: number | undefined
let mq: MediaQueryList | undefined
const onMq = (e: MediaQueryListEvent) => (reduced.value = e.matches)

onMounted(() => {
  mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(REDUCED) : undefined
  reduced.value = !!mq?.matches
  mq?.addEventListener('change', onMq)
  if (props.animated && !reduced.value && typeof requestAnimationFrame === 'function') {
    drawn.value = 0
    raf = requestAnimationFrame(() => {
      raf = undefined
      drawn.value = percent.value
    })
  }
})
watch(percent, (p) => (drawn.value = p))
onBeforeUnmount(() => {
  if (raf !== undefined && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf)
  mq?.removeEventListener('change', onMq)
})

const arcClass = computed(() =>
  cn(
    'fill-none',
    gaugeToneStroke[activeTone.value],
    props.animated && !reduced.value && 'transition-[stroke-dasharray] duration-500 ease-out motion-reduce:transition-none',
  ),
)
const shape = computed(() => oneOf<GaugeVariant>(props.variant, GAUGE_VARIANTS, 'semicircle'))
const sizeKey = computed(() => oneOf<GaugeSize>(props.size, GAUGE_SIZES, 'md'))
const classes = computed(() => cn(gaugeVariants({ size: sizeKey.value, variant: shape.value }), props.class))
/** Track and arc share one path; `pathLength="100"` turns dash lengths into percentages. */
const trackPath = computed(() => (shape.value === 'linear' ? 'M 0 4 H 100' : shape.value === 'arc' ? 'M 21.72 78.28 A 40 40 0 1 1 78.28 78.28' : 'M 10 50 A 40 40 0 0 1 90 50'))
/** `role="meter"` requires aria-valuenow, so a gauge without a value is exposed as a labelled image instead. */
const role = computed(() => (valid.value ? 'meter' : 'img'))
const name = computed(() => {
  const base = props.label || 'Gauge'
  return valid.value ? base : `${base}: No data`
})
</script>

<template>
  <div
    data-slot="gauge"
    :role="role"
    :aria-label="name"
    :aria-valuenow="valid ? clamped : undefined"
    :aria-valuemin="valid ? lo : undefined"
    :aria-valuemax="valid ? hi : undefined"
    :aria-valuetext="valid ? (valueText ?? undefined) : undefined"
    :data-tone="activeTone"
    :data-state="valid ? 'value' : 'empty'"
    :data-variant="shape === 'semicircle' ? undefined : shape"
    :class="classes"
  >
    <!-- Linear: caption and value on one line above the bar. -->
    <div v-if="shape === 'linear'" data-slot="gauge-content" class="flex items-baseline justify-between gap-3 pb-1.5 leading-none">
      <span v-if="label || $slots.label" data-slot="gauge-label" class="min-w-0 truncate text-xs font-normal text-muted-foreground">
        <slot name="label">{{ label }}</slot>
      </span>
      <span data-slot="gauge-value" :class="['ms-auto font-semibold tabular-nums', gaugeLinearValueSize[sizeKey]]">
        <slot :value="clamped" :percent="percent" :tone="activeTone" :text="text">{{ text }}</slot>
      </span>
    </div>
    <svg
      data-slot="gauge-svg"
      :viewBox="shape === 'linear' ? '0 0 100 8' : shape === 'arc' ? '0 0 100 100' : '0 0 100 52'"
      :class="['block w-full', shape === 'linear' && 'overflow-hidden rounded-full']"
      aria-hidden="true"
      focusable="false"
    >
      <path data-slot="gauge-track" :d="trackPath" pathLength="100" fill="none" :stroke-width="shape === 'linear' ? 8 : 10" class="stroke-muted" />
      <path
        v-if="drawn > 0 && valid"
        data-slot="gauge-arc"
        :d="trackPath"
        pathLength="100"
        :stroke-width="shape === 'linear' ? 8 : 10"
        :stroke-dasharray="`${drawn} 100`"
        :class="arcClass"
      />
    </svg>
    <div
      v-if="shape !== 'linear'"
      data-slot="gauge-content"
      :class="['absolute flex flex-col items-center leading-none', shape === 'arc' ? 'inset-0 justify-center' : 'inset-x-0 bottom-0']"
    >
      <span data-slot="gauge-value" class="font-semibold tabular-nums">
        <slot :value="clamped" :percent="percent" :tone="activeTone" :text="text">{{ text }}</slot>
      </span>
      <span v-if="label || $slots.label" data-slot="gauge-label" class="mt-1 text-xs font-normal text-muted-foreground">
        <slot name="label">{{ label }}</slot>
      </span>
    </div>
  </div>
</template>
