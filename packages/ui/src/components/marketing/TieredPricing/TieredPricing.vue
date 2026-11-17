<script setup lang="ts">
import { computed, nextTick, onMounted, useAttrs } from 'vue'
import { cn } from '../../../lib/cn'
import { requireOneOf } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { useConfig, useConfigLabels } from '../../layout/ConfigProvider/config'
import { formatNumber } from '../../typography/FormattedNumber/format'
import { formatPrice, significantFractionDigits, resolvePriceLocale, DEFAULT_PRICE_LOCALE } from '../../typography/Price/format'
import Price from '../../typography/Price/Price.vue'
import TieredPricingMarker from './TieredPricingMarker.vue'
import { activeTierIndexes, normalizeTiers, resolvePricingMode, tierTotal, tierUnits, type PricingMode, type PricingTier } from './tiers'
import {
  resolveTieredPricingSize,
  resolveTieredPricingVariant,
  tieredPricingCellVariants,
  tieredPricingStepVariants,
  tieredPricingVariants,
  type TieredPricingSize,
  type TieredPricingVariant,
} from './variants'

export interface TieredPricingProps extends BaseProps {
  /** Tiers in any order: `{ upTo, rate, flat? }`. `upTo: null` means "and above". Invalid tiers are skipped. */
  tiers: PricingTier[]
  /** `graduated`: each tier's units cost that tier's rate. `volume`: all units cost the rate of the tier reached. Unknown values mean `graduated`. */
  mode?: PricingMode
  /** Usage to price. Marks the tier(s) it reaches and shows the total. Negative counts as 0; non-finite shows nothing. */
  usage?: number
  /** Plural unit name, such as "requests". */
  unit?: string
  /** ISO 4217 code. Default `USD`. */
  currency?: string
  /** BCP 47 tag. Defaults to the ConfigProvider locale, else `en-US`. */
  locale?: string
  /** Name of the table or list. Required unless `aria-label` or `aria-labelledby` is set. */
  caption?: string
  /** `table` is a semantic table in a scroll region; `steps` is a ladder that stacks below `sm`. Unknown values mean `table`. */
  variant?: TieredPricingVariant
  size?: TieredPricingSize
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<TieredPricingProps>(), { mode: 'graduated', variant: 'table', size: 'md' })
const attrs = useAttrs()
const config = useConfig()
const labels = useConfigLabels('TieredPricing', {
  usage: 'Usage',
  rate: 'Rate per unit',
  flat: 'Flat fee',
  yourUsage: 'Your usage',
  total: 'Total for {usage}',
  upTo: 'Up to {to}',
  between: 'Over {from} to {to}',
  over: 'Over {from}',
  allUsage: 'All usage',
  graduatedNote: 'Each tier prices only the units that fall inside it.',
  volumeNote: 'Every unit is priced at the rate of the tier your total reaches.',
  empty: 'No tiers defined.',
  fallbackName: 'Tiered pricing',
})

onMounted(async () => {
  await nextTick()
  requireOneOf('TieredPricing', { caption: props.caption, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, 'Name the tiers, for example `caption="Sample request pricing"`, so screen reader users can tell tables apart.')
})

const variant = computed(() => resolveTieredPricingVariant(props.variant))
const size = computed(() => resolveTieredPricingSize(props.size))
const mode = computed(() => resolvePricingMode(props.mode))
const locale = computed(() => resolvePriceLocale(props.locale ?? config.value.locale ?? DEFAULT_PRICE_LOCALE))
const tiers = computed(() => normalizeTiers(props.tiers))
const hasFlat = computed(() => tiers.value.some((t) => t.flat !== undefined))

const rest = computed(() => {
  const { 'aria-label': _l, 'aria-labelledby': _b, ...others } = attrs
  return others
})
const name = computed(() => props.caption?.trim() || (attrs['aria-label'] as string | undefined) || (attrs['aria-labelledby'] ? undefined : labels.value.fallbackName))
const labelledby = computed(() => attrs['aria-labelledby'] as string | undefined)

const usage = computed(() => (typeof props.usage === 'number' && Number.isFinite(props.usage) ? Math.max(0, props.usage) : undefined))
const active = computed(() => new Set(usage.value === undefined ? [] : activeTierIndexes(tiers.value, usage.value, mode.value)))
const units = computed(() => tierUnits(tiers.value, usage.value ?? 0))
const total = computed(() => (usage.value === undefined ? undefined : tierTotal(tiers.value, usage.value, mode.value)))

const num = (n: number) => formatNumber(n, { locale: locale.value })
const withUnit = (n: number) => (props.unit ? `${num(n)} ${props.unit}` : num(n))
const fill = (tpl: string, vars: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m)

function rangeLabel(i: number): string {
  const t = tiers.value[i]
  if (t.upTo === null) return t.from === 0 ? labels.value.allUsage : fill(labels.value.over, { from: num(t.from) })
  return t.from === 0 ? fill(labels.value.upTo, { to: num(t.upTo) }) : fill(labels.value.between, { from: num(t.from), to: num(t.upTo) })
}
const rateDigits = (rate: number) => significantFractionDigits(rate)
const money = (n: number) => formatPrice(n, { currency: props.currency, locale: locale.value })
const totalText = computed(() => (usage.value === undefined || total.value === undefined ? '' : `${fill(labels.value.total, { usage: withUnit(usage.value) })}: ${money(total.value)}`))
const markerDetail = (i: number) => (mode.value === 'graduated' ? withUnit(units.value[i]) : undefined)

const note = computed(() => (mode.value === 'volume' ? labels.value.volumeNote : labels.value.graduatedNote))
const rootClasses = computed(() => cn(tieredPricingVariants({ variant: variant.value, size: size.value }), props.class))
const cell = computed(() => tieredPricingCellVariants({ size: size.value }))
const step = computed(() => tieredPricingStepVariants({ size: size.value }))
const priceSize = computed(() => (variant.value === 'steps' ? (size.value === 'lg' ? 'lg' : 'md') : size.value === 'lg' ? 'md' : 'sm'))
</script>

<template>
  <div v-bind="rest" data-slot="tiered-pricing" :data-variant="variant" :data-size="size" :data-mode="mode" :class="rootClasses">
    <p data-slot="tiered-pricing-note" class="text-muted-foreground">{{ note }}</p>

    <p v-if="tiers.length === 0" data-slot="tiered-pricing-empty" class="text-muted-foreground">{{ labels.empty }}</p>

    <div
      v-else-if="variant === 'table'"
      data-slot="tiered-pricing-scroll"
      role="region"
      tabindex="0"
      :aria-label="name"
      :aria-labelledby="labelledby"
      class="overflow-x-auto rounded-lg border border-border"
    >
      <table data-slot="tiered-pricing-table" class="w-full min-w-md border-collapse text-start">
        <caption v-if="name" class="sr-only">{{ name }}</caption>
        <thead data-slot="tiered-pricing-head">
          <tr>
            <th scope="col" :class="cn(cell, 'text-start font-medium text-muted-foreground')">{{ labels.usage }}<template v-if="unit"> ({{ unit }})</template></th>
            <th scope="col" :class="cn(cell, 'text-end font-medium text-muted-foreground')">{{ labels.rate }}</th>
            <th v-if="hasFlat" scope="col" :class="cn(cell, 'text-end font-medium text-muted-foreground')">{{ labels.flat }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, i) in tiers" :key="`${t.source}-${i}`" data-slot="tiered-pricing-tier" :data-active="active.has(i) ? 'true' : undefined" :class="active.has(i) ? 'bg-primary/5' : undefined">
            <th scope="row" data-slot="tiered-pricing-range" :class="cn(cell, 'text-start font-medium')">
              <bdi>{{ rangeLabel(i) }}</bdi>
              <span v-if="active.has(i)" class="ms-2"><TieredPricingMarker :label="labels.yourUsage" :detail="markerDetail(i)" /></span>
            </th>
            <td data-slot="tiered-pricing-rate" :class="cn(cell, 'text-end')">
              <Price :amount="t.rate" :currency="currency" :locale="locale" :minimum-fraction-digits="rateDigits(t.rate)" :maximum-fraction-digits="rateDigits(t.rate)" :size="priceSize" />
            </td>
            <td v-if="hasFlat" data-slot="tiered-pricing-flat" :class="cn(cell, 'text-end')">
              <Price v-if="t.flat !== undefined" :amount="t.flat" :currency="currency" :locale="locale" :size="priceSize" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ol v-else data-slot="tiered-pricing-steps" :aria-label="name" :aria-labelledby="labelledby" class="m-0 flex list-none flex-col gap-2 p-0 sm:flex-row">
      <li
        v-for="(t, i) in tiers"
        :key="`${t.source}-${i}`"
        data-slot="tiered-pricing-tier"
        :data-active="active.has(i) ? 'true' : undefined"
        :class="cn(step, active.has(i) && 'border-primary bg-primary/5')"
      >
        <span data-slot="tiered-pricing-range" class="font-medium"><bdi>{{ rangeLabel(i) }}</bdi></span>
        <span data-slot="tiered-pricing-rate">
          <Price :amount="t.rate" :currency="currency" :locale="locale" :minimum-fraction-digits="rateDigits(t.rate)" :maximum-fraction-digits="rateDigits(t.rate)" :size="priceSize" />
        </span>
        <span v-if="t.flat !== undefined" data-slot="tiered-pricing-flat" class="text-muted-foreground">
          {{ labels.flat }} <Price :amount="t.flat" :currency="currency" :locale="locale" size="sm" tone="muted" />
        </span>
        <TieredPricingMarker v-if="active.has(i)" :label="labels.yourUsage" :detail="markerDetail(i)" />
      </li>
    </ol>

    <div data-slot="tiered-pricing-status" role="status" class="font-medium">
      <p v-if="totalText" data-slot="tiered-pricing-total" class="tabular-nums">{{ totalText }}</p>
    </div>
  </div>
</template>
