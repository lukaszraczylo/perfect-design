<script setup lang="ts">
import { computed, nextTick, onMounted, useAttrs, useId } from 'vue'
import { cn } from '../../../lib/cn'
import { requireOneOf } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { useConfig, useConfigLabels } from '../../layout/ConfigProvider/config'
import Badge from '../../primitives/Badge/Badge.vue'
import { DEFAULT_PRICE_LOCALE, resolvePriceLocale, significantFractionDigits } from '../../typography/Price/format'
import Price from '../../typography/Price/Price.vue'
import { buildSections, type RateCardGroup, type RateCardItem } from './sections'
import {
  rateCardCellVariants,
  rateCardRowVariants,
  rateCardVariants,
  resolveRateCardSize,
  resolveRateCardVariant,
  type RateCardSize,
  type RateCardVariant,
} from './variants'

export type { RateCardItem, RateCardGroup } from './sections'

export interface RateCardProps extends BaseProps {
  /** Rates to list. Items without a name or a rate are skipped. */
  items: RateCardItem[]
  /** ISO 4217 code. Default `USD`. */
  currency?: string
  /** BCP 47 tag. Defaults to the ConfigProvider locale, else `en-US`. */
  locale?: string
  /** Name of the table or list. Required unless `aria-label` or `aria-labelledby` is set. */
  caption?: string
  /** `table` is a semantic table in a scroll region; `list` stacks each rate and reflows on narrow screens. Unknown values mean `table`. */
  variant?: RateCardVariant
  size?: RateCardSize
  /** Heading rows. Items join a group through `item.group`; groups appear in this order. */
  groups?: RateCardGroup[]
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<RateCardProps>(), { variant: 'table', size: 'md' })
const attrs = useAttrs()
const config = useConfig()
const uid = useId()
const labels = useConfigLabels('RateCard', {
  item: 'Item',
  unit: 'Unit',
  rate: 'Rate',
  included: 'Included',
  overage: 'Beyond included',
  empty: 'No rates listed.',
  fallbackName: 'Rates',
})

onMounted(async () => {
  await nextTick()
  requireOneOf('RateCard', { caption: props.caption, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, 'Name the rate list, for example `caption="Sample usage rates"`, so screen reader users can tell tables apart.')
})

const variant = computed(() => resolveRateCardVariant(props.variant))
const size = computed(() => resolveRateCardSize(props.size))
const locale = computed(() => resolvePriceLocale(props.locale ?? config.value.locale ?? DEFAULT_PRICE_LOCALE))
const sections = computed(() => buildSections(props.items, props.groups))
const flat = computed(() => sections.value.flatMap((s) => s.items.map((i) => i.item)))
const hasIncluded = computed(() => flat.value.some((i) => i.included))
const hasOverage = computed(() => flat.value.some((i) => i.overage))
const columns = computed(() => 3 + (hasIncluded.value ? 1 : 0) + (hasOverage.value ? 1 : 0))

const rest = computed(() => {
  const { 'aria-label': _l, 'aria-labelledby': _b, ...others } = attrs
  return others
})
const name = computed(() => props.caption?.trim() || (attrs['aria-label'] as string | undefined) || (attrs['aria-labelledby'] ? undefined : labels.value.fallbackName))
const labelledby = computed(() => attrs['aria-labelledby'] as string | undefined)

const digits = (rate: number) => significantFractionDigits(rate)
const priceSize = computed(() => (size.value === 'lg' ? 'md' : 'sm'))
const rootClasses = computed(() => cn(rateCardVariants({ variant: variant.value, size: size.value }), props.class))
const cell = computed(() => rateCardCellVariants({ size: size.value }))
const row = computed(() => rateCardRowVariants({ size: size.value }))
const head = 'text-start font-medium text-muted-foreground'
const groupId = (i: number) => `${uid}-group-${i}`
</script>

<template>
  <div v-bind="rest" data-slot="rate-card" :data-variant="variant" :data-size="size" :class="rootClasses">
    <p v-if="flat.length === 0" data-slot="rate-card-empty" class="text-muted-foreground">{{ labels.empty }}</p>

    <div
      v-else-if="variant === 'table'"
      data-slot="rate-card-scroll"
      role="region"
      tabindex="0"
      :aria-label="name"
      :aria-labelledby="labelledby"
      class="overflow-x-auto rounded-lg border border-border"
    >
      <table data-slot="rate-card-table" class="w-full min-w-xl border-collapse text-start">
        <caption v-if="name" class="sr-only">{{ name }}</caption>
        <thead data-slot="rate-card-head">
          <tr>
            <th scope="col" :class="cn(cell, head)">{{ labels.item }}</th>
            <th scope="col" :class="cn(cell, head)">{{ labels.unit }}</th>
            <th scope="col" :class="cn(cell, head, 'text-end')">{{ labels.rate }}</th>
            <th v-if="hasIncluded" scope="col" :class="cn(cell, head)">{{ labels.included }}</th>
            <th v-if="hasOverage" scope="col" :class="cn(cell, head)">{{ labels.overage }}</th>
          </tr>
        </thead>
        <tbody v-for="(s, si) in sections" :key="s.group ?? `ungrouped-${si}`">
          <tr v-if="s.group" data-slot="rate-card-group">
            <th scope="rowgroup" :colspan="columns" :class="cn(cell, 'bg-muted/40 text-start font-medium')">
              {{ s.group }}<span v-if="s.description" class="ms-2 font-normal text-muted-foreground">{{ s.description }}</span>
            </th>
          </tr>
          <tr v-for="{ item, key } in s.items" :key="key" data-slot="rate-card-row">
            <th scope="row" data-slot="rate-card-name" :class="cn(cell, 'text-start font-medium')">
              <span class="inline-flex flex-wrap items-center gap-1.5">
                {{ item.name }}
                <Badge v-if="item.badge" data-slot="rate-card-badge" variant="soft" tone="primary" size="sm">{{ item.badge }}</Badge>
              </span>
              <span v-if="item.description" data-slot="rate-card-description" class="block font-normal text-muted-foreground">{{ item.description }}</span>
            </th>
            <td data-slot="rate-card-unit" :class="cn(cell, 'text-muted-foreground')">{{ item.unit }}</td>
            <td data-slot="rate-card-rate" :class="cn(cell, 'text-end')">
              <Price v-if="typeof item.rate === 'number'" :amount="item.rate" :currency="currency" :locale="locale" :minimum-fraction-digits="digits(item.rate)" :maximum-fraction-digits="digits(item.rate)" :size="priceSize" />
              <span v-else class="font-medium">{{ item.rate }}</span>
            </td>
            <td v-if="hasIncluded" data-slot="rate-card-included" :class="cell">{{ item.included }}</td>
            <td v-if="hasOverage" data-slot="rate-card-overage" :class="cell">{{ item.overage }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else data-slot="rate-card-list" role="group" :aria-label="name" :aria-labelledby="labelledby">
      <div v-for="(s, si) in sections" :key="s.group ?? `ungrouped-${si}`" data-slot="rate-card-section" :role="s.group ? 'group' : undefined" :aria-labelledby="s.group ? groupId(si) : undefined">
        <p v-if="s.group" :id="groupId(si)" data-slot="rate-card-group" class="border-b border-border py-2 font-medium">
          {{ s.group }}<span v-if="s.description" class="ms-2 font-normal text-muted-foreground">{{ s.description }}</span>
        </p>
        <dl class="m-0">
          <div v-for="{ item, key } in s.items" :key="key" data-slot="rate-card-row" :class="row">
            <dt data-slot="rate-card-name" class="inline-flex flex-wrap items-center gap-1.5 font-medium">
              {{ item.name }}
              <Badge v-if="item.badge" data-slot="rate-card-badge" variant="soft" tone="primary" size="sm">{{ item.badge }}</Badge>
            </dt>
            <dd v-if="item.description" data-slot="rate-card-description" class="m-0 text-muted-foreground">{{ item.description }}</dd>
            <dd data-slot="rate-card-rate" class="m-0 flex flex-wrap items-baseline gap-x-1.5">
              <Price v-if="typeof item.rate === 'number'" :amount="item.rate" :currency="currency" :locale="locale" :minimum-fraction-digits="digits(item.rate)" :maximum-fraction-digits="digits(item.rate)" :size="priceSize" />
              <span v-else class="font-medium">{{ item.rate }}</span>
              <span data-slot="rate-card-unit" class="text-muted-foreground">{{ item.unit }}</span>
            </dd>
            <dd v-if="item.included" data-slot="rate-card-included" class="m-0"><span class="sr-only">{{ labels.included }}: </span>{{ item.included }}</dd>
            <dd v-if="item.overage" data-slot="rate-card-overage" class="m-0 text-muted-foreground"><span class="sr-only">{{ labels.overage }}: </span>{{ item.overage }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
