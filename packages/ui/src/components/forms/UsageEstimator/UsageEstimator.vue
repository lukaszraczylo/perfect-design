<script setup lang="ts">
import { computed, onMounted, ref, watch, type HTMLAttributes } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import { useDebounceFn } from '../../../lib/use-helpers'
import { useConfig } from '../../layout/ConfigProvider/config'
import { Price, formatPrice, significantFractionDigits } from '../../typography/Price'
import { formatNumber } from '../../typography/FormattedNumber/format'
import { useControllable } from '../CheckboxCard/use-controllable'
import NumberInput from '../NumberInput/NumberInput.vue'
import Slider from '../Slider/Slider.vue'
import { clampQuantity, estimateTotal, lineCost, lowerBound, unitsPer, type UsageDimension } from './estimate'
import {
  normalizeUsageEstimatorInput,
  normalizeUsageEstimatorSize,
  normalizeUsageEstimatorVariant,
  usageEstimatorRowVariants,
  usageEstimatorTotalVariants,
  usageEstimatorVariants,
  type UsageEstimatorInput,
  type UsageEstimatorSize,
  type UsageEstimatorVariant,
} from './variants'

export interface UsageEstimatorProps {
  /** Metered dimensions, one row each. Every `id` and `label` is required and unique. */
  dimensions: UsageDimension[]
  /** Quantity per dimension id. Omit for uncontrolled use. A missing id counts as the dimension's `min` (or 0). */
  modelValue?: Record<string, number>
  /** Initial quantities when uncontrolled. */
  defaultValue?: Record<string, number>
  /** ISO 4217 currency code. */
  currency?: string
  /** BCP 47 locale for money and quantities. Defaults to the ConfigProvider locale, else `en-US`. */
  locale?: string
  /** Text after the total, such as "/month". */
  period?: string
  /** Which controls each row shows. `slider` alone shows the quantity as text. */
  input?: UsageEstimatorInput
  /** Show the cost of each row and its rate hint. The total is always shown. */
  showBreakdown?: boolean
  totalLabel?: string
  /** Disclaimer under the total, such as "Sample rates. Estimate only." Use the `note` slot for rich content. */
  note?: string
  size?: UsageEstimatorSize
  variant?: UsageEstimatorVariant
  class?: HTMLAttributes['class']
}

const ANNOUNCE_DELAY_MS = 600

const props = withDefaults(defineProps<UsageEstimatorProps>(), {
  modelValue: undefined,
  defaultValue: undefined,
  currency: undefined,
  locale: undefined,
  period: undefined,
  input: 'both',
  showBreakdown: true,
  totalLabel: 'Estimated total',
  note: undefined,
  size: 'md',
  variant: 'card',
})
const emit = defineEmits<{ 'update:modelValue': [value: Record<string, number>] }>()
defineSlots<{ note?: () => unknown }>()

const config = useConfig()
const locale = computed(() => props.locale ?? config.value.locale)
const isRecord = (v: unknown): v is Record<string, number> => !!v && typeof v === 'object' && !Array.isArray(v)

const dimensions = computed<UsageDimension[]>(() => (Array.isArray(props.dimensions) ? props.dimensions.filter((d) => !!d && typeof d === 'object') : []))
const model = useControllable<Record<string, number>>(
  () => (isRecord(props.modelValue) ? props.modelValue : undefined),
  isRecord(props.defaultValue) ? { ...props.defaultValue } : {},
  (v) => emit('update:modelValue', v),
)

const size = computed(() => normalizeUsageEstimatorSize(props.size))
const variant = computed(() => normalizeUsageEstimatorVariant(props.variant))
const input = computed(() => normalizeUsageEstimatorInput(props.input))
const showSlider = computed(() => input.value !== 'number')
const showNumber = computed(() => input.value !== 'slider')

const quantity = (d: UsageDimension) => clampQuantity(d, model.value.value[d.id] ?? lowerBound(d))
const total = computed(() => estimateTotal(dimensions.value, model.value.value))

function setQuantity(d: UsageDimension, next: unknown) {
  const n = clampQuantity(d, next)
  if (n === quantity(d) && d.id in model.value.value) return
  model.set({ ...model.value.value, [d.id]: n })
}

const stepOf = (d: UsageDimension) => (typeof d.step === 'number' && Number.isFinite(d.step) && d.step > 0 ? d.step : 1)
// A broken `max` is reported once mounted; the controls stay usable meanwhile.
const maxOf = (d: UsageDimension) => (Number.isFinite(d.max) && d.max > lowerBound(d) ? d.max : lowerBound(d) + stepOf(d))
const numberText = (n: number) => formatNumber(n, { locale: locale.value, maximumFractionDigits: 2 })
const labelOf = (d: UsageDimension) => `${d.label}, ${d.unit}`
const money = (n: number, extra: { minimumFractionDigits?: number } = {}) => formatPrice(n, { currency: props.currency, locale: locale.value, ...extra })

function hintOf(d: UsageDimension): string {
  const parts: string[] = []
  if (Array.isArray(d.tiers) && d.tiers.length > 0) parts.push('Graduated rates')
  else {
    const rate = Number.isFinite(d.rate) ? d.rate : 0
    const per = unitsPer(d)
    parts.push(`${money(rate, Number.isInteger(rate) ? {} : { minimumFractionDigits: significantFractionDigits(rate) })} / ${per > 1 ? `${numberText(per)} ${d.unit}` : d.unitSingular || d.unit}`)
  }
  if (typeof d.included === 'number' && d.included > 0) parts.push(`${numberText(d.included)} included`)
  return parts.join(' · ')
}

const announcement = ref('')
const announce = useDebounceFn(() => {
  announcement.value = `${props.totalLabel}: ${money(total.value)}${props.period ? ` ${props.period}` : ''}`
}, ANNOUNCE_DELAY_MS)
watch(total, () => announce())

onMounted(() => {
  const seen = new Set<string>()
  for (const d of dimensions.value) {
    if (typeof d.id !== 'string' || d.id.trim() === '') return violation('UsageEstimator', 'requires-id', 'requires a non-empty string `id` on every dimension. Give each dimension its own id.')
    if (seen.has(d.id)) return violation('UsageEstimator', 'unique-id', `requires a unique \`id\` on every dimension, but "${d.id}" is used more than once.`)
    seen.add(d.id)
    if (typeof d.label !== 'string' || d.label.trim() === '') return violation('UsageEstimator', 'requires-label', `requires a non-empty \`label\` on dimension "${d.id}": it names the slider and the number field.`)
    if (!(Number.isFinite(d.max) && d.max > lowerBound(d))) return violation('UsageEstimator', 'requires-max', `requires \`max\` on dimension "${d.id}" to be a finite number above \`min\` (default 0).`)
    const rates = Array.isArray(d.tiers) && d.tiers.length > 0 ? d.tiers.map((t) => t?.rate) : [d.rate]
    if (rates.some((r) => !(typeof r === 'number' && Number.isFinite(r) && r >= 0))) return violation('UsageEstimator', 'requires-rate', `requires \`rate\` on dimension "${d.id}" (and on every tier) to be a finite number of at least 0.`)
  }
})

const rootClasses = computed(() => cn(usageEstimatorVariants({ variant: variant.value, size: size.value }), props.class))
const rowClasses = computed(() => usageEstimatorRowVariants({ size: size.value }))
const totalClasses = computed(() => usageEstimatorTotalVariants({ size: size.value }))
</script>

<template>
  <div data-slot="usage-estimator" :data-variant="variant !== 'card' ? variant : undefined" :data-size="size !== 'md' ? size : undefined" :class="rootClasses">
    <ul v-if="dimensions.length" data-slot="usage-estimator-rows" role="list" class="grid min-w-0 gap-5">
      <li v-for="(d, i) in dimensions" :key="`${i}-${d.id}`" data-slot="usage-estimator-row" :data-dimension="d.id" :class="rowClasses">
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span class="min-w-0">
            <span data-slot="usage-estimator-label" class="font-medium">{{ d.label }}</span>
            <span data-slot="usage-estimator-unit" class="ms-2 text-muted-foreground tabular-nums">{{ showNumber ? d.unit : `${numberText(quantity(d))} ${d.unit}` }}</span>
          </span>
          <span v-if="showBreakdown" data-slot="usage-estimator-line">
            <Price :amount="lineCost(d, quantity(d))" :currency="currency" :locale="locale" size="sm" />
          </span>
        </div>
        <p v-if="showBreakdown" data-slot="usage-estimator-hint" class="text-xs text-muted-foreground tabular-nums">{{ hintOf(d) }}</p>
        <div data-slot="usage-estimator-controls" class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Slider
            v-if="showSlider"
            class="min-w-0 sm:flex-1"
            :size="size"
            :min="lowerBound(d)"
            :max="maxOf(d)"
            :step="stepOf(d)"
            :aria-label="labelOf(d)"
            :format-value="(v: number) => `${numberText(v)} ${d.unit}`"
            :model-value="[quantity(d)]"
            @update:model-value="(v: number[]) => setQuantity(d, v[0])"
          />
          <NumberInput
            v-if="showNumber"
            class="w-full sm:w-40 sm:shrink-0"
            :size="size"
            :min="lowerBound(d)"
            :max="maxOf(d)"
            :step="stepOf(d)"
            :aria-label="labelOf(d)"
            :model-value="quantity(d)"
            @update:model-value="(v: number | null) => setQuantity(d, v)"
          />
        </div>
      </li>
    </ul>
    <div data-slot="usage-estimator-total" :class="totalClasses">
      <span data-slot="usage-estimator-total-label" class="font-medium">{{ totalLabel }}</span>
      <Price :amount="total" :currency="currency" :locale="locale" :period="period" size="lg" />
    </div>
    <p v-if="note || $slots.note" data-slot="usage-estimator-note" class="text-sm text-muted-foreground"><slot name="note">{{ note }}</slot></p>
    <span data-slot="usage-estimator-status" role="status" class="sr-only">{{ announcement }}</span>
  </div>
</template>
