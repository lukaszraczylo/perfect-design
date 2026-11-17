<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { useConfig, useConfigLabels } from '../../layout/ConfigProvider/config'
import { DEFAULT_PRICE_FALLBACK, DEFAULT_PRICE_LOCALE, formatPrice, isPriceAmount, resolvePriceLocale } from './format'
import { priceAuxVariants, priceVariants, resolvePriceSize, resolvePriceTone, type PriceSize, type PriceTone } from './variants'

export interface PriceProps extends BaseProps {
  /** The amount in major units (49.5 is 49.50). null, undefined, NaN and Infinity render `fallback`. */
  amount?: number | null
  /** ISO 4217 code. An invalid code renders a plain number. */
  currency?: string
  /** BCP 47 tag. Defaults to the ConfigProvider locale, else `en-US`. */
  locale?: string
  /** Text after the amount, smaller and muted, such as "/month". */
  period?: string
  /** Previous price, struck through before the amount. Screen readers read "Was X, now Y". */
  compareAt?: number
  notation?: 'standard' | 'compact'
  /** Default 0 for whole amounts and 2 otherwise. */
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  /** Shown instead of the amount when `amount` is exactly 0, such as "Free". */
  freeLabel?: string
  /** Shown when the amount is missing or not finite. */
  fallback?: string
  size?: PriceSize
  tone?: PriceTone
  as?: PrimitiveProps['as']
}

defineSlots<{ default?: () => unknown }>()

const props = withDefaults(defineProps<PriceProps>(), { size: 'md', tone: 'default', fallback: DEFAULT_PRICE_FALLBACK, as: 'span' })

const config = useConfig()
const labels = useConfigLabels('Price', { was: 'Was', now: 'now', noPrice: 'No price' })

const size = computed(() => resolvePriceSize(props.size))
const tone = computed(() => resolvePriceTone(props.tone))
const locale = computed(() => resolvePriceLocale(props.locale ?? config.value.locale ?? DEFAULT_PRICE_LOCALE))
const valid = computed(() => isPriceAmount(props.amount))

const opts = computed(() => ({
  currency: props.currency,
  locale: locale.value,
  notation: props.notation,
  minimumFractionDigits: props.minimumFractionDigits,
  maximumFractionDigits: props.maximumFractionDigits,
  freeLabel: props.freeLabel,
  fallback: props.fallback,
}))

const text = computed(() => formatPrice(props.amount, opts.value))
const compareText = computed(() =>
  valid.value && isPriceAmount(props.compareAt) ? formatPrice(props.compareAt, { ...opts.value, freeLabel: undefined }) : null,
)
const dashFallback = computed(() => !valid.value && props.fallback === DEFAULT_PRICE_FALLBACK)

const classes = computed(() => cn(priceVariants({ size: size.value, tone: tone.value }), props.class))
const auxClasses = computed(() => priceAuxVariants({ size: size.value }))
</script>

<template>
  <Primitive data-slot="price" :as="as" :class="classes" :data-size="size" :data-tone="tone" :data-invalid="valid ? undefined : 'true'">
    <template v-if="compareText">
      <span class="sr-only">{{ labels.was }} {{ compareText }}, {{ labels.now }}&nbsp;</span>
      <s data-slot="price-compare" aria-hidden="true" :class="cn(auxClasses, 'line-through')">{{ compareText }}</s>
    </template>
    <span data-slot="price-amount" :role="dashFallback && !$slots.default ? 'img' : undefined" :aria-label="dashFallback && !$slots.default ? labels.noPrice : undefined"><slot>{{ text }}</slot></span>
    <span v-if="period" data-slot="price-period" :class="auxClasses">{{ period }}</span>
  </Primitive>
</template>
