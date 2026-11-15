<script setup lang="ts">
/** Internal: accessible monthly/yearly switch (radiogroup) shared by PricingGrid and PricingTable. Not exported. */
import { nextTick, ref } from 'vue'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Badge from '../../primitives/Badge/Badge.vue'
import type { PricingBilling } from '../PricingCard/pricing'

interface Props extends BaseProps {
  modelValue: PricingBilling
  monthlyLabel?: string
  yearlyLabel?: string
  /** Accessible name of the group. */
  label?: string
  /** Badge shown next to the yearly option, e.g. "Save 20%". */
  discountLabel?: string
}

const props = withDefaults(defineProps<Props>(), { monthlyLabel: 'Monthly', yearlyLabel: 'Yearly', label: 'Billing period' })
const emit = defineEmits<{ 'update:modelValue': [value: PricingBilling] }>()

const group = ref<HTMLElement>()
const options = ['monthly', 'yearly'] as const

function select(value: PricingBilling, focus = false) {
  emit('update:modelValue', value)
  if (focus) void nextTick(() => group.value?.querySelector<HTMLButtonElement>(`[data-value="${value}"]`)?.focus())
}

function onKeydown(e: KeyboardEvent) {
  const i = options.indexOf(props.modelValue)
  let next: PricingBilling | undefined
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = options[(i + 1) % options.length]
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = options[(i + options.length - 1) % options.length]
  else if (e.key === 'Home') next = 'monthly'
  else if (e.key === 'End') next = 'yearly'
  if (!next) return
  e.preventDefault()
  select(next, true)
}

// Every option has a border: the checked one is outlined in forced-colors mode, where background colour alone would vanish.
const item =
  'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors pointer-coarse:min-h-11 forced-colors:data-[state=checked]:outline-2 ' + focusRing
</script>

<template>
  <div
    ref="group"
    data-slot="pricing-billing-toggle"
    role="radiogroup"
    :aria-label="label"
    :class="cn('inline-flex items-center gap-1 rounded-full border bg-muted p-1', props.class)"
    @keydown="onKeydown"
  >
    <button
      type="button"
      role="radio"
      data-slot="pricing-billing-option"
      data-value="monthly"
      :aria-checked="modelValue === 'monthly'"
      :data-state="modelValue === 'monthly' ? 'checked' : 'unchecked'"
      :tabindex="modelValue === 'monthly' ? 0 : -1"
      :class="cn(item, modelValue === 'monthly' ? 'border-border bg-background text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')"
      @click="select('monthly')"
    >
      {{ monthlyLabel }}
    </button>
    <button
      type="button"
      role="radio"
      data-slot="pricing-billing-option"
      data-value="yearly"
      :aria-checked="modelValue === 'yearly'"
      :data-state="modelValue === 'yearly' ? 'checked' : 'unchecked'"
      :tabindex="modelValue === 'yearly' ? 0 : -1"
      :class="cn(item, modelValue === 'yearly' ? 'border-border bg-background text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')"
      @click="select('yearly')"
    >
      {{ yearlyLabel }}
      <Badge v-if="discountLabel" data-slot="pricing-billing-discount" variant="success" class="bg-success text-success-foreground">{{ discountLabel }}</Badge>
    </button>
  </div>
</template>
