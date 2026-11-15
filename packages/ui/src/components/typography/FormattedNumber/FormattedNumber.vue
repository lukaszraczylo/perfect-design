<script setup lang="ts">
import { computed, nextTick, onMounted, useAttrs } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import {
  formatNumber,
  isNumberFormatStyle,
  toFormattable,
  type NumberFormatStyle,
  type NumberNotation,
  type NumberSignDisplay,
} from './format'
import {
  formattedNumberSizes,
  formattedNumberTones,
  formattedNumberVariantNames,
  formattedNumberVariants,
  formattedNumberWeights,
  type FormattedNumberSize,
  type FormattedNumberTone,
  type FormattedNumberVariant,
  type FormattedNumberWeight,
} from './variants'

export interface FormattedNumberProps extends BaseProps {
  /** Number, bigint or numeric string (`'1234.5'`, `'1e3'`). Anything else renders `fallback`. */
  value: number | bigint | string
  /**
   * `decimal`, `percent` (0.25 renders 25%), `currency` (needs `currency`), `unit` (needs `unit`) or `compact`
   * (decimal with compact notation). This is the number-format "style"; the prop is named `format` because `style`
   * is the Vue inline-style attribute. A dynamic `:style="'percent'"` string naming one of these values is accepted as an alias.
   */
  format?: NumberFormatStyle
  /** ISO 4217 code (`EUR`). Required when `format` is `currency`. */
  currency?: string
  /** Intl unit (`kilometer`, `kilometer-per-hour`, `percent`...). Required when `format` is `unit`. */
  unit?: string
  notation?: NumberNotation
  /** 0 to 20; other values are clamped. */
  minimumFractionDigits?: number
  /** 0 to 20; raised to `minimumFractionDigits` when smaller. */
  maximumFractionDigits?: number
  signDisplay?: NumberSignDisplay
  /** BCP 47 tag. Defaults to `en`, not the browser locale, so server and client render the same text. */
  locale?: string
  /** Text for NaN, Infinity, blank and non-numeric values. */
  fallback?: string
  /** Tabular (equal width) figures so columns align. */
  tabular?: boolean
  /** Wrap the text in `<bdi>` so a number never reorders inside right-to-left (or mixed) text. */
  isolate?: boolean
  /** Text look: `plain` (default, inherits), `mono` or `outline` (hairline box). */
  variant?: FormattedNumberVariant
  /** Font size. `inherit` (default) keeps the surrounding size. */
  size?: FormattedNumberSize
  /**
   * `default` and `muted` colour only. `positive`, `negative` and `auto` (from the sign of the value) add colour and
   * show a sign so colour is never the only signal.
   */
  tone?: FormattedNumberTone
  weight?: FormattedNumberWeight
  /** Root element. */
  as?: string
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<FormattedNumberProps>(), {
  tabular: true,
  isolate: true,
  as: 'span',
  variant: 'plain',
  size: 'inherit',
  tone: 'default',
  fallback: 'n/a',
})
const attrs = useAttrs()

const aliasStyle = computed(() => (props.format === undefined && isNumberFormatStyle(attrs.style) ? (attrs.style as NumberFormatStyle) : undefined))
const format = computed<NumberFormatStyle | undefined>(() => props.format ?? aliasStyle.value)
const rest = computed(() => {
  if (aliasStyle.value === undefined) return attrs
  const { style: _style, ...others } = attrs
  return others
})

const parsed = computed(() => toFormattable(props.value))
const sign = computed(() => {
  const v = parsed.value
  if (v === null) return 0
  const n = Number(v)
  return n > 0 ? 1 : n < 0 ? -1 : 0
})
const tone = computed<FormattedNumberTone>(() => {
  const t = formattedNumberTones.includes(props.tone) ? props.tone : 'default'
  if (t !== 'auto') return t
  return sign.value > 0 ? 'positive' : sign.value < 0 ? 'negative' : 'default'
})
const carriesSign = computed(() => props.tone === 'positive' || props.tone === 'negative' || props.tone === 'auto')

const text = computed(() =>
  formatNumber(props.value, {
    style: format.value,
    currency: props.currency,
    unit: props.unit,
    notation: props.notation,
    minimumFractionDigits: props.minimumFractionDigits,
    maximumFractionDigits: props.maximumFractionDigits,
    signDisplay: props.signDisplay ?? (carriesSign.value ? 'exceptZero' : undefined),
    locale: props.locale,
    fallback: props.fallback,
  }),
)
const invalid = computed(() => parsed.value === null)

const classes = computed(() =>
  cn(
    formattedNumberVariants({
      variant: formattedNumberVariantNames.includes(props.variant) ? props.variant : 'plain',
      size: formattedNumberSizes.includes(props.size) ? props.size : 'inherit',
      tone: invalid.value ? 'default' : (tone.value as 'default' | 'muted' | 'positive' | 'negative'),
      weight: formattedNumberWeights.includes(props.weight as FormattedNumberWeight) ? props.weight : undefined,
      tabular: props.tabular,
    }),
    props.class,
  ),
)

const blank = (v: unknown) => typeof v !== 'string' || v.trim() === ''

onMounted(async () => {
  await nextTick()
  if (format.value === 'currency' && blank(props.currency)) {
    violation('FormattedNumber', 'requires-currency', "requires `currency` (an ISO 4217 code such as 'EUR') when `format` is 'currency'. Add `currency`, or use another `format`.")
  }
  if (format.value === 'unit' && blank(props.unit)) {
    violation('FormattedNumber', 'requires-unit', "requires `unit` (for example 'kilometer') when `format` is 'unit'. Add `unit`, or use another `format`.")
  }
})
</script>

<template>
  <Primitive v-bind="rest" data-slot="formatted-number" :as="as" :class="classes" :data-invalid="invalid ? 'true' : undefined">
    <bdi v-if="isolate" data-slot="formatted-number-value">{{ text }}</bdi>
    <template v-else>{{ text }}</template>
  </Primitive>
</template>
