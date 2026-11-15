<script setup lang="ts">
import { computed, provide, ref, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { useFieldControl } from '../Field/useFieldContext'
import { CHECKBOX_CARD_GROUP_KEY } from './context'
import { createValueRegistry, useRequireGroupName } from './contract-helpers'
import { useControllable } from './use-controllable'
import type { CardLayout, CardSize, CardTone, CardVariant } from './variants'

export interface CheckboxCardGroupProps {
  /** Selected values. Omit for uncontrolled use. */
  modelValue?: string[]
  /** Initial selection when uncontrolled. */
  defaultValue?: string[]
  /** Disables every card in the group. */
  disabled?: boolean
  /** Marks every card invalid. */
  invalid?: boolean
  /** Variant applied to cards that do not set their own. */
  variant?: CardVariant
  /** Size applied to cards that do not set their own. */
  size?: CardSize
  /** Tone applied to cards that do not set their own. */
  tone?: CardTone
  /** Layout applied to cards that do not set their own. */
  layout?: CardLayout
  /** Number of grid columns from the `sm` breakpoint up (1-4). Invalid values fall back to 1. */
  columns?: 1 | 2 | 3 | 4
  /** Form field name shared by all cards. */
  name?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<CheckboxCardGroupProps>(), {
  modelValue: undefined,
  defaultValue: () => [],
  disabled: false,
  invalid: false,
  variant: undefined,
  size: undefined,
  tone: undefined,
  layout: undefined,
  columns: 1,
  name: undefined,
})
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const control = useFieldControl({ invalid: () => props.invalid, disabled: () => props.disabled })
const clean = (v: unknown): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : [])
const model = useControllable<string[]>(
  () => (props.modelValue === undefined ? undefined : clean(props.modelValue)),
  clean(props.defaultValue),
  (v) => emit('update:modelValue', v),
)
const values = model.value
const root = ref<HTMLElement | null>(null)
useRequireGroupName('CheckboxCardGroup', () => root.value, 'Wrap it in `Field` with a `label` or in `Fieldset` with a legend, or set `aria-label` / `aria-labelledby` on the group.')
const registry = createValueRegistry()

const COLS = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' } as const
const classes = computed(() => cn('grid grid-cols-1 gap-3', COLS[props.columns as 1] ?? '', props.class))

provide(CHECKBOX_CARD_GROUP_KEY, {
  values,
  disabled: computed(() => control.disabled.value),
  invalid: computed(() => control.invalid.value),
  variant: computed(() => props.variant),
  size: computed(() => props.size),
  tone: computed(() => props.tone),
  layout: computed(() => props.layout),
  name: computed(() => props.name),
  claim: registry.claim,
  toggle(value: string, checked: boolean) {
    const has = values.value.includes(value)
    if (checked === has) return
    model.set(checked ? [...values.value, value] : values.value.filter((v) => v !== value))
  },
})
</script>

<template>
  <div
    ref="root"
    data-slot="checkbox-card-group"
    role="group"
    :id="control.id.value"
    :aria-labelledby="control.labelledBy()"
    :aria-describedby="control.describedBy.value"
    :class="classes"
  >
    <slot />
  </div>
</template>
