<script setup lang="ts">
import { computed, getCurrentInstance, inject, nextTick, onMounted } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { oneOf } from '../shared/pick'
import {
  STAT_COUNTER_ALIGNS,
  STAT_COUNTER_SIZES,
  STAT_COUNTER_TONES,
  statCounterVariants,
  type StatCounterAlign,
  type StatCounterSize,
  type StatCounterTone,
} from './variants'

export interface StatCounterProps extends BaseProps {
  /** Number to show. Non-finite values (NaN, Infinity) render `fallback`. */
  value: number
  prefix?: string
  suffix?: string
  /** @deprecated Removed with the count-up animation (LLMSlop M3). Accepted and ignored so existing templates keep working. */
  duration?: number
  /** Fraction digits shown (0-6). */
  decimals?: number
  /** BCP-47 locale used for number formatting. */
  locale?: string
  /** @deprecated Removed with the count-up animation (LLMSlop M3). Accepted and ignored: the number is always static. */
  animate?: boolean
  /** Text shown when `value` is not a finite number. */
  fallback?: string
  /** Figure size: `sm` (24px), `md` (36px) or `lg` (60px), semibold. Unset inherits the surrounding type size. Unknown values are ignored. */
  size?: StatCounterSize
  /** Figure colour: `default` (inherited), `primary`, `muted`, `success`, `info` or `danger`. Unknown values fall back to `default`. The colour is never the only signal: give the number a visible label. */
  tone?: StatCounterTone
  /** Text alignment. Setting it makes the figure a block; unset it stays inline. Unknown values are ignored. */
  align?: StatCounterAlign
}

const props = withDefaults(defineProps<StatCounterProps>(), {
  prefix: '',
  suffix: '',
  duration: undefined,
  decimals: 0,
  locale: 'en-US',
  animate: undefined,
  fallback: 'n/a',
  size: undefined,
  tone: 'default',
  align: undefined,
})

const valid = computed(() => typeof props.value === 'number' && Number.isFinite(props.value))
// StatGrid checks its items itself (and names the index), so a counter inside one stays quiet.
const insideGrid = inject<boolean>('pd:stat-grid', false)
const self = getCurrentInstance()
// A non-finite value is a mistake unless the caller chose a `fallback` text for it (a deliberate "not available" state).
onMounted(async () => {
  await nextTick()
  if (!valid.value && !insideGrid && self?.vnode.props?.fallback === undefined) {
    violation('StatCounter', 'requires-finite-value', `requires a finite number \`value\` (got ${String(props.value)}), or an explicit \`fallback\` text for a value that is not available. It would render "${props.fallback}" instead of a figure.`)
  }
})
const digits = computed(() => {
  const d = Number.isFinite(props.decimals) ? Math.trunc(props.decimals) : 0
  return Math.min(6, Math.max(0, d))
})

function format(n: number): string {
  try {
    return n.toLocaleString(props.locale, { minimumFractionDigits: digits.value, maximumFractionDigits: digits.value })
  } catch {
    return n.toFixed(digits.value)
  }
}

const text = computed(() => (valid.value ? `${props.prefix}${format(props.value)}${props.suffix}` : props.fallback))

/** `undefined` keeps the original inline figure that inherits size and colour. */
const size = computed<StatCounterSize | undefined>(() => (STAT_COUNTER_SIZES as readonly unknown[]).includes(props.size) ? props.size : undefined)
const tone = computed<StatCounterTone>(() => oneOf(props.tone, STAT_COUNTER_TONES, 'default'))
const align = computed<StatCounterAlign | undefined>(() => (STAT_COUNTER_ALIGNS as readonly unknown[]).includes(props.align) ? props.align : undefined)
const classes = computed(() => cn(statCounterVariants({ size: size.value, tone: tone.value, align: align.value }), props.class))
</script>

<template>
  <span data-slot="stat-counter" :data-size="size" :data-tone="tone" :data-align="align" :class="classes">{{ text }}</span>
</template>
