<script setup lang="ts">
import { computed, onMounted, ref, useId, type HTMLAttributes } from 'vue'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import { faCheck } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import Badge from '../../primitives/Badge/Badge.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import { Price } from '../../typography/Price'
import { useConfig } from '../../layout/ConfigProvider/config'
import { useRequireGroupName } from '../CheckboxCard/contract-helpers'
import { useControllable } from '../CheckboxCard/use-controllable'
import { useFieldControl } from '../Field/useFieldContext'
import SegmentedControl from '../SegmentedControl/SegmentedControl.vue'
import { radioGroupDotVariants } from '../RadioGroup/variants'
import {
  normalizePlanPickerBilling,
  normalizePlanPickerSize,
  normalizePlanPickerVariant,
  planPickerItemVariants,
  planPickerVariants,
  type PlanPickerBilling,
  type PlanPickerSize,
  type PlanPickerVariant,
} from './variants'

export interface PlanPickerPlan {
  /** Value of the plan: a unique, non-empty string. */
  id: string
  name: string
  description?: string
  /** Monthly price in major units. `null` shows `customLabel` instead of a price. */
  price: number | null
  /** Price while billing is yearly. Omit to show `price` in both modes. */
  yearlyPrice?: number | null
  /** Text after the price, such as "/month". */
  period?: string
  /** Text after the yearly price, such as "/year". Falls back to `period`. */
  yearlyPeriod?: string
  /** Short label next to the name, such as "Current". */
  badge?: string
  disabled?: boolean
  /** Up to about three short points, shown under the description. */
  features?: string[]
}

export interface PlanPickerBillingLabels {
  /** Accessible name of the billing toggle. */
  group?: string
  monthly?: string
  yearly?: string
}

export interface PlanPickerProps {
  plans: PlanPickerPlan[]
  /** Selected plan id. Omit for uncontrolled use. */
  modelValue?: string
  /** Initial plan id when uncontrolled. */
  defaultValue?: string
  /** `monthly` or `yearly`. Omit for uncontrolled use (`v-model:billing`). */
  billing?: PlanPickerBilling
  /** Initial billing when uncontrolled. */
  defaultBilling?: PlanPickerBilling
  /** Render the monthly and yearly toggle above the plans. */
  showBillingToggle?: boolean
  /** Text and accessible name of the billing toggle. */
  billingLabels?: PlanPickerBillingLabels
  /** Shown under a yearly price. An empty string hides it. */
  yearlyNote?: string
  /** Shown instead of the price when `price` is `null`. */
  customLabel?: string
  /** ISO 4217 currency code. */
  currency?: string
  /** BCP 47 locale for prices. Defaults to the ConfigProvider locale, else `en-US`. */
  locale?: string
  /** Form field name. Renders a hidden input with the selected id so a native form submits it. */
  name?: string
  required?: boolean
  disabled?: boolean
  /** Marks the group invalid (aria-invalid) and every plan with a destructive border. */
  invalid?: boolean
  size?: PlanPickerSize
  /** `cards` are bordered radio cards; `list` is one bordered list with dividers. */
  variant?: PlanPickerVariant
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<PlanPickerProps>(), {
  modelValue: undefined,
  defaultValue: undefined,
  billing: undefined,
  defaultBilling: 'monthly',
  showBillingToggle: false,
  billingLabels: undefined,
  yearlyNote: 'Billed yearly',
  customLabel: 'Custom',
  currency: undefined,
  locale: undefined,
  name: undefined,
  size: 'md',
  variant: 'cards',
})
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:billing': [value: PlanPickerBilling]
}>()

const uid = useId()
const config = useConfig()
const locale = computed(() => props.locale ?? config.value.locale)
const control = useFieldControl({ invalid: () => props.invalid, disabled: () => props.disabled, required: () => props.required })

const root = ref<{ $el: HTMLElement } | null>(null)
useRequireGroupName('PlanPicker', () => root.value?.$el, 'Wrap it in `Field` with a `label` or in `Fieldset` with a legend, or set `aria-label` / `aria-labelledby` on the picker.')

const plans = computed<PlanPickerPlan[]>(() => (Array.isArray(props.plans) ? props.plans.filter((p) => !!p && typeof p === 'object') : []))
const model = useControllable<string | undefined>(() => props.modelValue, props.defaultValue, (v) => emit('update:modelValue', v as string))
const billingModel = useControllable<PlanPickerBilling>(
  () => (props.billing === undefined ? undefined : normalizePlanPickerBilling(props.billing)),
  normalizePlanPickerBilling(props.defaultBilling),
  (v) => emit('update:billing', v),
)
const yearly = computed(() => billingModel.value.value === 'yearly')

const size = computed(() => normalizePlanPickerSize(props.size))
const variant = computed(() => normalizePlanPickerVariant(props.variant))
const groupClasses = computed(() => planPickerVariants({ variant: variant.value, size: size.value }))
const itemClasses = computed(() => planPickerItemVariants({ variant: variant.value, size: size.value }))
const dotClasses = radioGroupDotVariants()
const priceSize = computed(() => (size.value === 'lg' ? 'md' : 'sm'))

const billingOptions = computed(() => [
  { value: 'monthly', label: props.billingLabels?.monthly ?? 'Monthly' },
  { value: 'yearly', label: props.billingLabels?.yearly ?? 'Yearly' },
])
const billingName = computed(() => props.billingLabels?.group ?? 'Billing period')

/** Price shown for a plan in the current billing mode. A yearly price is used only when the plan has one. */
function priceOf(plan: PlanPickerPlan) {
  const useYearly = yearly.value && plan.yearlyPrice !== undefined
  const amount = useYearly ? plan.yearlyPrice : plan.price
  return {
    amount: typeof amount === 'number' && Number.isFinite(amount) ? amount : null,
    period: useYearly ? (plan.yearlyPeriod ?? plan.period) : plan.period,
    yearly: useYearly && typeof amount === 'number' && Number.isFinite(amount),
  }
}

const idOf = (i: number, part: string) => `${uid}-${i}-${part}`
function describedBy(plan: PlanPickerPlan, i: number): string {
  return [plan.description ? idOf(i, 'description') : '', plan.features?.length ? idOf(i, 'features') : '', idOf(i, 'price')].filter(Boolean).join(' ')
}

onMounted(() => {
  const seen = new Set<string>()
  for (const p of plans.value) {
    if (typeof p.id !== 'string' || p.id.trim() === '') return violation('PlanPicker', 'requires-id', 'requires a non-empty string `id` on every plan. Give each plan its own id.')
    if (seen.has(p.id)) return violation('PlanPicker', 'unique-id', `requires a unique \`id\` on every plan, but "${p.id}" is used more than once.`)
    seen.add(p.id)
    if (typeof p.name !== 'string' || p.name.trim() === '') return violation('PlanPicker', 'requires-name', `requires a non-empty \`name\` on plan "${p.id}": it is the accessible name of the plan.`)
  }
})

function onSelect(value: unknown) {
  if (control.disabled.value || typeof value !== 'string' || value === model.value.value) return
  model.set(value)
}
function onBilling(value: unknown) {
  billingModel.set(normalizePlanPickerBilling(value, billingModel.value.value))
}
</script>

<template>
  <div data-slot="plan-picker" :class="cn('flex min-w-0 flex-col gap-3', props.class)">
    <SegmentedControl
      v-if="showBillingToggle"
      data-slot="plan-picker-billing"
      size="sm"
      :options="billingOptions"
      :aria-label="billingName"
      :disabled="control.disabled.value"
      :model-value="billingModel.value.value"
      class="self-start"
      @update:model-value="onBilling"
    />
    <RadioGroupRoot
      ref="root"
      data-slot="plan-picker-group"
      :id="control.id.value"
      :model-value="model.value.value"
      :disabled="control.disabled.value"
      :required="control.required.value || undefined"
      :aria-labelledby="control.labelledBy()"
      :aria-describedby="control.describedBy.value"
      :aria-invalid="control.ariaInvalid.value"
      :data-size="size !== 'md' ? size : undefined"
      :data-variant="variant !== 'cards' ? variant : undefined"
      :class="groupClasses"
      v-bind="$attrs"
      @update:model-value="onSelect"
    >
      <RadioGroupItem
        v-for="(plan, i) in plans"
        :key="`${i}-${plan.id}`"
        data-slot="plan-picker-item"
        :value="plan.id"
        :disabled="plan.disabled"
        :data-invalid="control.invalid.value ? '' : undefined"
        :aria-labelledby="idOf(i, 'name')"
        :aria-describedby="describedBy(plan, i)"
        :class="itemClasses"
      >
        <span data-slot="plan-picker-indicator" class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-transparent text-primary group-data-[state=checked]/plan:border-primary">
          <RadioGroupIndicator data-slot="plan-picker-dot" class="flex items-center justify-center"><span :class="dotClasses" /></RadioGroupIndicator>
        </span>
        <span class="grid min-w-0 gap-1">
          <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span data-slot="plan-picker-name" :id="idOf(i, 'name')" class="font-medium">{{ plan.name }}</span>
            <Badge v-if="plan.badge" data-slot="plan-picker-badge" variant="soft" size="sm">{{ plan.badge }}</Badge>
          </span>
          <span v-if="plan.description" data-slot="plan-picker-description" :id="idOf(i, 'description')" class="text-muted-foreground">{{ plan.description }}</span>
          <span v-if="plan.features?.length" data-slot="plan-picker-features" :id="idOf(i, 'features')" class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span v-for="(feature, f) in plan.features" :key="f" data-slot="plan-picker-feature" class="inline-flex items-center gap-1"><Icon :icon="faCheck" size="xs" />{{ feature }}</span>
          </span>
        </span>
        <span data-slot="plan-picker-price" :id="idOf(i, 'price')" class="grid justify-items-end text-end">
          <Price v-if="priceOf(plan).amount !== null" :amount="priceOf(plan).amount" :currency="currency" :locale="locale" :period="priceOf(plan).period" :size="priceSize" />
          <span v-else data-slot="plan-picker-custom" class="font-medium">{{ customLabel }}</span>
          <span v-if="priceOf(plan).yearly && yearlyNote" data-slot="plan-picker-note" class="text-xs text-muted-foreground">{{ yearlyNote }}</span>
        </span>
      </RadioGroupItem>
    </RadioGroupRoot>
    <input v-if="name && model.value.value" data-slot="plan-picker-input" type="hidden" :name="name" :value="model.value.value" :disabled="control.disabled.value || undefined" />
  </div>
</template>
