<script setup lang="ts">
import { computed, nextTick, onMounted, useSlots } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import PricingCard, { type PricingCardProps } from '../PricingCard/PricingCard.vue'
import { hasAmount, type PricingBilling } from '../PricingCard/pricing'
import { resolvePricingCardShape, resolvePricingCardSize, resolvePricingCardVariant, type PricingCardShape, type PricingCardSize, type PricingCardVariant } from '../PricingCard/variants'
import { pickColumns } from '../shared/motion'
import BillingToggle from './BillingToggle.vue'
import { useBillingContract, useBillingState } from './billing'
import { pricingGridVariants, pricingGridWrapperVariants, type PricingGridColumns } from './variants'

export type PricingPlan = Omit<PricingCardProps, 'class' | 'billing'>

export interface PricingGridProps extends BaseProps {
  /** Plans to render; use the default slot instead for custom cards. */
  plans?: PricingPlan[]
  /** Columns on large screens (1-4). Invalid values fall back to 3. */
  columns?: PricingGridColumns
  /** Selected billing period (`v-model:billing`). Leave undefined for uncontrolled use. Unknown values mean `monthly`. */
  billing?: PricingBilling
  /** Initial billing period when uncontrolled. */
  defaultBilling?: PricingBilling
  /** Force the billing toggle on/off. Default: shown when at least one plan has a `yearlyPrice`. */
  showToggle?: boolean
  /** Badge next to the yearly option, e.g. "Save 20%". */
  yearlyDiscountLabel?: string
  monthlyLabel?: string
  yearlyLabel?: string
  /** Accessible name of the billing toggle. */
  billingLabel?: string
  /** PricingCard variant for generated cards (a plan's own `variant` wins). */
  variant?: PricingCardVariant
  /** PricingCard `size` for generated cards (a plan's own `size` wins). Exposed as `data-size`. */
  size?: PricingCardSize
  /** PricingCard `shape` for generated cards (a plan's own `shape` wins). Exposed as `data-shape`. */
  shape?: PricingCardShape
}

const props = withDefaults(defineProps<PricingGridProps>(), {
  plans: () => [],
  columns: 3,
  billing: undefined,
  defaultBilling: 'monthly',
  showToggle: undefined,
  monthlyLabel: 'Monthly',
  yearlyLabel: 'Yearly',
  billingLabel: 'Billing period',
})
const emit = defineEmits<{ 'update:billing': [value: PricingBilling] }>()
const slots = useSlots()

defineSlots<{
  default?: (props: { billing: PricingBilling }) => unknown
  /** Per-plan call-to-action when using `plans`. */
  cta?: (props: { plan: PricingPlan; index: number; billing: PricingBilling }) => unknown
}>()

const { billing, set } = useBillingState(
  () => props.billing,
  () => props.defaultBilling,
  (v) => emit('update:billing', v),
)

const cols = computed(() => pickColumns(props.columns, [1, 2, 3, 4] as const, 3))
const list = computed(() => props.plans.filter((p) => !!p && typeof p === 'object'))
const toggleVisible = computed(() => props.showToggle ?? list.value.some((p) => hasAmount(p.yearlyPrice)))
const cardSize = computed(() => resolvePricingCardSize(props.size))
const cardShape = computed(() => resolvePricingCardShape(props.shape))
const cardVariant = computed(() => resolvePricingCardVariant(props.variant))
const gridClasses = computed(() => pricingGridVariants({ columns: cols.value }))
useBillingContract('PricingGrid', {
  billing: () => props.billing,
  defaultBilling: () => props.defaultBilling,
  toggleVisible: () => toggleVisible.value,
  billingLabel: () => props.billingLabel,
  monthlyLabel: () => props.monthlyLabel,
  yearlyLabel: () => props.yearlyLabel,
})
onMounted(async () => {
  await nextTick()
  if (!slots.default && list.value.length === 0) {
    violation('PricingGrid', 'requires-plans', 'requires at least one entry in `plans` (or PricingCards in the default slot). An empty grid renders nothing.')
  }
})
/** Native list semantics only when the grid renders its own cards (each wrapped in an <li>); slot content is free-form. */
const asList = computed(() => !slots.default && list.value.length > 0)
</script>

<template>
  <div
    v-if="toggleVisible"
    data-slot="pricing-grid"
    :data-columns="cols"
    :data-variant="cardVariant"
    :data-size="cardSize"
    :data-shape="cardShape"
    :data-billing="billing"
    :class="cn(pricingGridWrapperVariants(), props.class)"
  >
    <BillingToggle
      :model-value="billing"
      :monthly-label="monthlyLabel"
      :yearly-label="yearlyLabel"
      :label="billingLabel"
      :discount-label="yearlyDiscountLabel"
      @update:model-value="set"
    />
    <component :is="asList ? 'ul' : 'div'" data-slot="pricing-grid-items" :role="asList ? 'list' : undefined" :class="cn(gridClasses, 'w-full')">
      <slot :billing="billing">
        <li v-for="(plan, i) in list" :key="`${i}-${plan.name}`" data-slot="pricing-grid-item">
          <PricingCard :variant="variant" :size="size" :shape="shape" v-bind="plan" :billing="billing" class="h-full">
            <template v-if="slots.cta" #cta><slot name="cta" :plan="plan" :index="i" :billing="billing" /></template>
          </PricingCard>
        </li>
      </slot>
    </component>
  </div>
  <component
    :is="asList ? 'ul' : 'div'"
    v-else
    data-slot="pricing-grid"
    :role="asList ? 'list' : undefined"
    :data-columns="cols"
    :data-variant="cardVariant"
    :data-size="cardSize"
    :data-shape="cardShape"
    :data-billing="billing"
    :class="cn(gridClasses, props.class)"
  >
    <slot :billing="billing">
      <li v-for="(plan, i) in list" :key="`${i}-${plan.name}`" data-slot="pricing-grid-item">
        <PricingCard :variant="variant" :size="size" :shape="shape" v-bind="plan" :billing="billing" class="h-full">
          <template v-if="slots.cta" #cta><slot name="cta" :plan="plan" :index="i" :billing="billing" /></template>
        </PricingCard>
      </li>
    </slot>
  </component>
</template>
