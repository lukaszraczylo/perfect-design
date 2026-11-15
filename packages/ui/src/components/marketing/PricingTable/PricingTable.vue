<script setup lang="ts">
import { computed, nextTick, onMounted, useAttrs, useSlots } from 'vue'
import { requireOneOf, requireText } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Badge from '../../primitives/Badge/Badge.vue'
import ComparisonTable from '../ComparisonTable/ComparisonTable.vue'
import type {
  ComparisonColumn,
  ComparisonFeature,
  ComparisonRow,
  ComparisonValue,
} from '../ComparisonTable/ComparisonTable.vue'
import type { ComparisonTableSize, ComparisonTableVariant } from '../ComparisonTable/variants'
import { hasAmount, resolvePrice, type PricingBilling } from '../PricingCard/pricing'
import BillingToggle from '../PricingGrid/BillingToggle.vue'
import { useBillingContract, useBillingState } from '../PricingGrid/billing'
import { pricingTableVariants } from './variants'

export interface PricingTablePlan {
  /** Stable key (defaults to the index). */
  id?: string
  name: string
  /** Monthly (default) price, pre-formatted ("Free", "Custom" or your own currency format). */
  price?: string | number
  period?: string
  /** Price shown while billing is `yearly`; plans without it keep `price`. */
  yearlyPrice?: string | number
  /** Period after the yearly price; falls back to `period`. */
  yearlyPeriod?: string
  /** Note under the price while the yearly price is shown, e.g. "Billed yearly". */
  yearlyNote?: string
  description?: string
  /** Emphasise this plan's column. */
  highlighted?: boolean
  badge?: string
}

export interface PricingTableProps extends BaseProps {
  plans?: PricingTablePlan[]
  /** Feature rows (and `{ group }` heading rows); `values` are one entry per plan. */
  rows?: ComparisonRow[]
  /** Selected billing period (`v-model:billing`); leave undefined for uncontrolled use. */
  billing?: PricingBilling
  defaultBilling?: PricingBilling
  /** Force the billing toggle on/off. Default: shown when at least one plan has a `yearlyPrice`. */
  showToggle?: boolean
  yearlyDiscountLabel?: string
  monthlyLabel?: string
  yearlyLabel?: string
  billingLabel?: string
  /** Table surface style (see ComparisonTable). */
  variant?: ComparisonTableVariant
  size?: ComparisonTableSize
  /** Accessible name of the table. */
  caption?: string
  /** Extra classes for the table's scroll region, e.g. `max-h-96` so `stickyHeader` has something to stick within. */
  tableClass?: string
  stickyHeader?: boolean
  /** Keep the feature-name column visible while the table scrolls horizontally. On by default; pass `false` to let it scroll with the rest. */
  stickyFirstColumn?: boolean
  /** Top-left header cell text. */
  cornerLabel?: string
  /** Also render the `cta` slot in a footer row. */
  repeatCta?: boolean
  includedLabel?: string
  excludedLabel?: string
  unavailableLabel?: string
}

const props = withDefaults(defineProps<PricingTableProps>(), {
  plans: () => [],
  rows: () => [],
  billing: undefined,
  defaultBilling: 'monthly',
  showToggle: undefined,
  monthlyLabel: 'Monthly',
  yearlyLabel: 'Yearly',
  billingLabel: 'Billing period',
  variant: 'default',
  size: 'md',
  stickyHeader: false,
  stickyFirstColumn: true,
  cornerLabel: 'Features',
  repeatCta: false,
})
defineOptions({ inheritAttrs: false })
const emit = defineEmits<{ 'update:billing': [value: PricingBilling] }>()
const slots = useSlots()
const attrs = useAttrs()

defineSlots<{
  /** Call to action under each plan's price. */
  cta?: (props: { plan: PricingTablePlan; index: number; billing: PricingBilling }) => unknown
  corner?: () => unknown
  cell?: (props: { value: ComparisonValue; row: ComparisonFeature; column: ComparisonColumn; rowIndex: number; columnIndex: number }) => unknown
  'row-label'?: (props: { row: ComparisonFeature }) => unknown
}>()

const { billing, set } = useBillingState(
  () => props.billing,
  () => props.defaultBilling,
  (v) => emit('update:billing', v),
)

const plans = computed(() => props.plans.filter((p) => !!p && typeof p === 'object'))
const columns = computed<ComparisonColumn[]>(() =>
  plans.value.map((p) => ({ key: p.id, title: p.name, badge: p.badge, highlighted: p.highlighted })),
)
const prices = computed(() => plans.value.map((p) => resolvePrice(p, billing.value)))
const toggleVisible = computed(() => props.showToggle ?? plans.value.some((p) => hasAmount(p.yearlyPrice)))

/** The table's name comes from `caption`, `aria-label` or `aria-labelledby`; the last two are forwarded to the table region, not the wrapper. */
const ARIA_NAME = ['aria-label', 'aria-labelledby']
const nameAttrs = () => Object.fromEntries(ARIA_NAME.filter((k) => k in attrs).map((k) => [k, attrs[k]]))
const rootAttrs = () => Object.fromEntries(Object.entries(attrs).filter(([k]) => !ARIA_NAME.includes(k)))
/** Fallback so the table is never unnamed in production; the contract below still reports the missing name. */
const tableCaption = () => (props.caption?.trim() ? props.caption : null) || (attrs['aria-label'] || attrs['aria-labelledby'] ? undefined : 'Plan comparison')

useBillingContract('PricingTable', {
  billing: () => props.billing,
  defaultBilling: () => props.defaultBilling,
  toggleVisible: () => toggleVisible.value,
  billingLabel: () => props.billingLabel,
  monthlyLabel: () => props.monthlyLabel,
  yearlyLabel: () => props.yearlyLabel,
})
onMounted(async () => {
  await nextTick()
  requireOneOf('PricingTable', { caption: props.caption, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, 'Name the table, for example `caption="Plan comparison"`, so screen reader users can tell tables apart.')
  const bad = plans.value.findIndex((p) => typeof p.name !== 'string' || p.name.trim() === '')
  if (bad !== -1) requireText('PricingTable', `plans[${bad}].name`, undefined, 'Its column header would be empty.')
})
</script>

<template>
  <div v-bind="rootAttrs()" data-slot="pricing-table" :data-billing="billing" :class="cn(pricingTableVariants(), props.class)">
    <BillingToggle
      v-if="toggleVisible"
      :model-value="billing"
      :monthly-label="monthlyLabel"
      :yearly-label="yearlyLabel"
      :label="billingLabel"
      :discount-label="yearlyDiscountLabel"
      @update:model-value="set"
    />
    <ComparisonTable
      v-bind="nameAttrs()"
      :columns="columns"
      :rows="rows"
      :variant="variant"
      :size="size"
      :caption="tableCaption()"
      :class="tableClass"
      :sticky-header="stickyHeader"
      :sticky-first-column="stickyFirstColumn"
      :corner-label="cornerLabel"
      :included-label="includedLabel"
      :excluded-label="excludedLabel"
      :unavailable-label="unavailableLabel"
    >
      <template #column-header="{ index }">
        <div data-slot="pricing-table-plan" class="flex flex-col items-center gap-1">
          <Badge v-if="plans[index].badge" data-slot="pricing-table-badge">{{ plans[index].badge }}</Badge>
          <span data-slot="pricing-table-name" class="text-base font-semibold">{{ plans[index].name }}</span>
          <span
            v-if="prices[index].amount !== undefined"
            data-slot="pricing-table-price"
            :data-billing="prices[index].yearly ? 'yearly' : 'monthly'"
            class="flex flex-wrap items-baseline justify-center gap-1"
          >
            <span data-slot="pricing-table-amount" class="text-2xl font-bold tracking-tight">{{ prices[index].amount }}</span>
            <span v-if="prices[index].period" data-slot="pricing-table-period" class="text-xs font-normal text-muted-foreground">{{ prices[index].period }}</span>
          </span>
          <span v-if="prices[index].yearly && plans[index].yearlyNote" data-slot="pricing-table-note" class="text-xs font-normal text-muted-foreground">{{ plans[index].yearlyNote }}</span>
          <span v-if="plans[index].description" data-slot="pricing-table-description" class="text-xs font-normal text-muted-foreground">{{ plans[index].description }}</span>
          <div v-if="slots.cta" data-slot="pricing-table-cta" class="mt-2 flex flex-col font-normal">
            <slot name="cta" :plan="plans[index]" :index="index" :billing="billing" />
          </div>
        </div>
      </template>
      <template v-if="repeatCta && slots.cta" #column-footer="{ index }">
        <div data-slot="pricing-table-footer-cta" class="flex flex-col">
          <slot name="cta" :plan="plans[index]" :index="index" :billing="billing" />
        </div>
      </template>
      <template v-if="slots.corner" #corner><slot name="corner" /></template>
      <template v-if="slots.cell" #cell="c"><slot name="cell" v-bind="c" /></template>
      <template v-if="slots['row-label']" #row-label="r"><slot name="row-label" v-bind="r" /></template>
    </ComparisonTable>
  </div>
</template>
