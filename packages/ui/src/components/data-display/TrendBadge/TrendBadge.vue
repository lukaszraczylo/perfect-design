<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { TREND_BADGE_SHAPES, TREND_BADGE_SIZES, TREND_BADGE_VARIANTS, trendBadgeVariants, type TrendBadgeShape, type TrendBadgeSize, type TrendBadgeTone, type TrendBadgeVariant } from './variants'

export type TrendDirection = 'up' | 'down' | 'flat'
export type TrendBadgeFormat = 'number' | 'percent' | 'compact' | 'currency'

export interface TrendBadgeProps extends BaseProps {
  /** Arrow direction. When omitted it is derived from the sign of `value`. */
  direction?: TrendDirection
  /** Magnitude of the change. The sign is NOT printed (the arrow carries it). null / NaN / Infinity render `–`. */
  value?: number | null
  /** Which direction is GOOD: `up` (revenue), `down` (latency, cost) or `none` (always neutral). */
  goodWhen?: 'up' | 'down' | 'none'
  /** Shorthand for `goodWhen="down"`. */
  inverse?: boolean
  /** Number format. `percent` appends `%` to the value as-is (12 → `12%`), it does not multiply by 100. */
  format?: TrendBadgeFormat
  /** ISO currency code, used when `format="currency"`. Invalid codes fall back to plain numbers. */
  currency?: string
  /** BCP 47 locale; invalid values fall back to the runtime default. */
  locale?: string
  /** Maximum fraction digits (0-20, default 1). */
  fractionDigits?: number
  /** `soft` tinted (default), `solid` filled, `ghost` text only, `outline` bordered text. Unknown values fall back to `soft`. */
  variant?: TrendBadgeVariant
  size?: TrendBadgeSize
  /** `rounded` (default, 6px), `pill` fully round, `square` no radius. Unknown values fall back to `rounded`. */
  shape?: TrendBadgeShape
}

const props = withDefaults(defineProps<TrendBadgeProps>(), {
  goodWhen: 'up',
  format: 'number',
  fractionDigits: 1,
  variant: 'soft',
  size: 'md',
  shape: 'rounded',
})

const provided = computed(() => props.value !== undefined)
const valid = computed(() => typeof props.value === 'number' && Number.isFinite(props.value))
/** Provided but not a finite number: null, NaN, Infinity. */
const invalid = computed(() => provided.value && !valid.value)

const dir = computed<TrendDirection>(() => {
  if (invalid.value) return 'flat'
  if (props.direction === 'up' || props.direction === 'down' || props.direction === 'flat') return props.direction
  if (valid.value) return (props.value as number) > 0 ? 'up' : (props.value as number) < 0 ? 'down' : 'flat'
  return 'flat'
})

const good = computed<'up' | 'down' | 'none'>(() => (props.inverse ? 'down' : props.goodWhen))
const tone = computed<TrendBadgeTone>(() => {
  if (invalid.value || dir.value === 'flat' || good.value === 'none') return 'neutral'
  return dir.value === good.value ? 'good' : 'bad'
})

function formatter(): Intl.NumberFormat {
  const digits = Number.isInteger(props.fractionDigits) ? Math.min(20, Math.max(0, props.fractionDigits)) : 1
  const opts: Intl.NumberFormatOptions = { maximumFractionDigits: digits }
  if (props.format === 'compact') opts.notation = 'compact'
  else if (props.format === 'percent') Object.assign(opts, { style: 'unit', unit: 'percent' })
  else if (props.format === 'currency' && props.currency) Object.assign(opts, { style: 'currency', currency: props.currency })
  const attempts: [string | undefined, Intl.NumberFormatOptions][] = [
    [props.locale, opts],
    [undefined, opts],
    [undefined, { maximumFractionDigits: digits }],
  ]
  for (const [loc, o] of attempts) {
    try {
      return new Intl.NumberFormat(loc, o)
    } catch {
      /* try the next, more forgiving combination */
    }
  }
  return new Intl.NumberFormat()
}

const text = computed(() => {
  if (invalid.value) return '–'
  if (!valid.value) return ''
  return formatter().format(Math.abs(props.value as number))
})

const srText = computed(() => {
  if (invalid.value) return 'No data'
  if (dir.value === 'flat') return 'No change'
  const word = dir.value === 'up' ? 'Increase' : 'Decrease'
  return text.value ? `${word} of ${text.value}` : word
})

const ARROW: Record<TrendDirection, string> = {
  up: 'M12 19V5m0 0-6 6m6-6 6 6',
  down: 'M12 5v14m0 0-6-6m6 6 6-6',
  flat: 'M5 12h14',
}

const variant = computed<TrendBadgeVariant>(() => (TREND_BADGE_VARIANTS.includes(props.variant) ? props.variant : 'soft'))
const size = computed<TrendBadgeSize>(() => (TREND_BADGE_SIZES.includes(props.size) ? props.size : 'md'))
const shape = computed<TrendBadgeShape>(() => (TREND_BADGE_SHAPES.includes(props.shape) ? props.shape : 'rounded'))
const classes = computed(() => cn(trendBadgeVariants({ variant: variant.value, tone: tone.value, size: size.value, shape: shape.value }), props.class))
</script>

<template>
  <span data-slot="trend-badge" :data-direction="dir" :data-tone="tone" :class="classes">
    <svg
      data-slot="trend-badge-icon"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path :d="ARROW[dir]" />
    </svg>
    <span class="sr-only" data-slot="trend-badge-sr">{{ srText }}</span>
    <span v-if="text || $slots.default" data-slot="trend-badge-value" aria-hidden="true"><slot :text="text" :direction="dir" :tone="tone">{{ text }}</slot></span>
  </span>
</template>
