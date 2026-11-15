<script setup lang="ts">
import { computed, nextTick, onMounted, useSlots } from 'vue'
import { requireText, violation } from '../../../lib/contract'
import { faCheck, faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Badge from '../../primitives/Badge/Badge.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import { hasAmount, normalizeBilling, resolvePrice, type PricingBilling } from './pricing'
import {
  pricingCardAmountVariants,
  pricingCardFeaturesVariants,
  pricingCardVariants,
  resolvePricingCardShape,
  resolvePricingCardSize,
  resolvePricingCardVariant,
  type PricingCardShape,
  type PricingCardSize,
  type PricingCardVariant,
} from './variants'

export type PricingFeature = string | { label: string; included?: boolean }

export interface PricingCardProps extends BaseProps {
  name?: string
  /** Number or text ("Free", "Custom"). Numbers are shown as-is; format currency yourself. This is the monthly (default) price. */
  price?: string | number
  /** Billing period shown after the price, e.g. "/month". */
  period?: string
  /** Price shown instead of `price` while `billing` is `yearly`. Plans without it keep `price` in both modes. */
  yearlyPrice?: string | number
  /** Period shown after the yearly price (e.g. "/year"). Falls back to `period`. */
  yearlyPeriod?: string
  /** Which price to show. PricingGrid sets this from its billing toggle. Unknown values mean `monthly`. */
  billing?: PricingBilling
  /** Small note under the price while the yearly price is shown, e.g. "Billed yearly". */
  yearlyNote?: string
  description?: string
  features?: PricingFeature[]
  /** Visually emphasise the recommended plan (same as `variant="highlighted"`). */
  highlighted?: boolean
  /** Visual style. Unknown values fall back to `default`. */
  variant?: PricingCardVariant
  /** Padding and price scale: `sm`, `md` (default, the original spacing) or `lg`. Unknown values fall back to `md`. */
  size?: PricingCardSize
  /** Corners: `rounded` (default) or `square`. Unknown values fall back to `rounded`. */
  shape?: PricingCardShape
  /** Small label above the name, e.g. "Most popular". */
  badge?: string
  /** Heading level of the plan name (1-6). Invalid values fall back to 3. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** Label announced to screen readers for features that are not included. */
  excludedLabel?: string
}

const props = withDefaults(defineProps<PricingCardProps>(), {
  features: () => [],
  level: 3,
  excludedLabel: 'Not included',
  variant: 'default',
  size: 'md',
  shape: 'rounded',
  highlighted: false,
})

const slots = useSlots()

defineSlots<{
  name?: () => unknown
  price?: (props: { price: string | number | undefined; period: string | undefined; billing: PricingBilling; yearly: boolean }) => unknown
  default?: () => unknown
  cta?: () => unknown
}>()

onMounted(async () => {
  await nextTick()
  if (!slots.name) requireText('PricingCard', 'name', props.name, 'Name the plan, or fill the `name` slot.')
  if (!slots.price && !hasAmount(props.price)) {
    violation('PricingCard', 'requires-price', 'requires a `price` (or the `price` slot). Pass pre-formatted text such as "Free" or "Custom" for plans without a number; `0` is allowed.')
  }
})

const tag = computed(() => (Number.isInteger(props.level) && props.level >= 1 && props.level <= 6 ? `h${props.level}` : 'h3'))
const rows = computed(() =>
  props.features
    .filter((f) => (typeof f === 'string' ? f !== '' : !!f && typeof f.label === 'string'))
    .map((f) => (typeof f === 'string' ? { label: f, included: true } : { label: f.label, included: f.included !== false })),
)
const variant = computed(() => resolvePricingCardVariant(props.variant))
const size = computed(() => resolvePricingCardSize(props.size))
const shape = computed(() => resolvePricingCardShape(props.shape))
const billing = computed(() => normalizeBilling(props.billing))
const emphasised = computed(() => props.highlighted || variant.value === 'highlighted')
const resolved = computed(() => resolvePrice(props, billing.value))
const hasPrice = computed(() => resolved.value.amount !== undefined)
const classes = computed(() => cn(pricingCardVariants({ variant: variant.value, highlighted: emphasised.value, size: size.value, shape: shape.value }), props.class))
</script>

<template>
  <article
    data-slot="pricing-card"
    :data-variant="variant"
    :data-size="size"
    :data-shape="shape"
    :data-highlighted="emphasised ? '' : undefined"
    :class="classes"
  >
    <div data-slot="pricing-card-header" class="flex flex-col gap-2">
      <Badge v-if="badge" data-slot="pricing-card-badge" class="w-fit">{{ badge }}</Badge>
      <component :is="tag" v-if="name || $slots.name" data-slot="pricing-card-name" class="text-lg font-semibold">
        <slot name="name">{{ name }}</slot>
      </component>
      <p v-if="description" data-slot="pricing-card-description" class="text-sm text-muted-foreground">{{ description }}</p>
    </div>
    <div v-if="hasPrice || $slots.price" data-slot="pricing-card-price" :data-billing="resolved.yearly ? 'yearly' : 'monthly'" class="flex flex-wrap items-baseline gap-1">
      <slot name="price" :price="resolved.amount" :period="resolved.period" :billing="billing" :yearly="resolved.yearly">
        <span data-slot="pricing-card-amount" :class="pricingCardAmountVariants({ variant, size })">{{ resolved.amount }}</span>
        <span v-if="resolved.period" data-slot="pricing-card-period" class="text-sm text-muted-foreground">{{ resolved.period }}</span>
        <span v-if="resolved.yearly && yearlyNote" data-slot="pricing-card-note" class="basis-full text-xs text-muted-foreground">{{ yearlyNote }}</span>
      </slot>
    </div>
    <ul v-if="rows.length" data-slot="pricing-card-features" role="list" :class="pricingCardFeaturesVariants({ variant })">
      <li
        v-for="(f, i) in rows"
        :key="i"
        data-slot="pricing-card-feature"
        :data-included="f.included ? 'true' : 'false'"
        :class="cn('flex items-start gap-2', !f.included && 'text-muted-foreground')"
      >
        <Icon :icon="f.included ? faCheck : faXmark" :class="cn('mt-0.5', f.included ? 'text-success' : 'text-muted-foreground')" />
        <span :class="cn(!f.included && 'line-through')">{{ f.label }}</span>
        <span v-if="!f.included" class="sr-only">({{ excludedLabel }})</span>
      </li>
    </ul>
    <slot />
    <div v-if="$slots.cta" data-slot="pricing-card-cta" class="mt-auto flex flex-col">
      <slot name="cta" />
    </div>
  </article>
</template>
