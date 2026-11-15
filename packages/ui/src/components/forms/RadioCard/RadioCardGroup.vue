<script setup lang="ts">
import { computed, nextTick, provide, ref, useId, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { useFieldControl } from '../Field/useFieldContext'
import { createValueRegistry, useRequireGroupName } from '../CheckboxCard/contract-helpers'
import { useControllable } from '../CheckboxCard/use-controllable'
import type { CardLayout, CardSize, CardTone, CardVariant } from '../CheckboxCard/variants'
import { RADIO_CARD_GROUP_KEY } from './context'

export interface RadioCardGroupProps {
  /** Selected value. Omit for uncontrolled use. */
  modelValue?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  disabled?: boolean
  required?: boolean
  /** Marks the group invalid (aria-invalid) and every card with a destructive border. */
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
  /** Form field name. Defaults to a generated unique name so the browser groups the radios. */
  name?: string
  /** Wrap arrow-key focus from last to first card and back. */
  loop?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<RadioCardGroupProps>(), {
  modelValue: undefined,
  defaultValue: undefined,
  variant: undefined,
  size: undefined,
  tone: undefined,
  layout: undefined,
  columns: 1,
  name: undefined,
  loop: true,
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const uid = useId()
const root = ref<HTMLElement>()
const control = useFieldControl({ invalid: () => props.invalid, disabled: () => props.disabled, required: () => props.required })
const model = useControllable<string | undefined>(() => props.modelValue, props.defaultValue, (v) => emit('update:modelValue', v as string))
useRequireGroupName('RadioCardGroup', () => root.value, 'Wrap it in `Field` with a `label` or in `Fieldset` with a legend, or set `aria-label` / `aria-labelledby` on the group.')
const registry = createValueRegistry()
const groupName = computed(() => props.name ?? `radio-card-${uid}`)

const COLS = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' } as const
const classes = computed(() => cn('grid grid-cols-1 gap-3', COLS[props.columns as 1] ?? '', props.class))

function radios(): HTMLInputElement[] {
  return Array.from(root.value?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? [])
}

/** Re-apply the model to the native radios (a rejected controlled change leaves them out of sync). */
function syncNative() {
  void nextTick(() => {
    for (const r of radios()) r.checked = r.value === model.value.value
  })
}

function select(value: string) {
  if (control.disabled.value || value === model.value.value) return syncNative()
  model.set(value)
  syncNative()
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (target?.tagName !== 'INPUT' || (target as HTMLInputElement).type !== 'radio') return
  const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
  const enabled = radios().filter((r) => !r.disabled)
  const at = enabled.indexOf(target as HTMLInputElement)
  let next: HTMLInputElement | undefined
  if (e.key === 'Home') next = enabled[0]
  else if (e.key === 'End') next = enabled[enabled.length - 1]
  else if (e.key in keys && at !== -1) {
    const i = at + keys[e.key]
    next = enabled[props.loop ? (i + enabled.length) % enabled.length : Math.min(Math.max(i, 0), enabled.length - 1)]
  } else return
  e.preventDefault()
  if (!next) return
  next.focus()
  select(next.value)
}

provide(RADIO_CARD_GROUP_KEY, {
  value: computed(() => model.value.value),
  name: groupName.value,
  disabled: computed(() => control.disabled.value),
  invalid: computed(() => control.invalid.value),
  required: computed(() => control.required.value),
  variant: computed(() => props.variant),
  size: computed(() => props.size),
  tone: computed(() => props.tone),
  layout: computed(() => props.layout),
  claim: registry.claim,
  select,
})
</script>

<template>
  <div
    ref="root"
    data-slot="radio-card-group"
    role="radiogroup"
    :id="control.id.value"
    :aria-required="control.required.value || undefined"
    :aria-labelledby="control.labelledBy()"
    :aria-describedby="control.describedBy.value"
    :aria-invalid="control.ariaInvalid.value"
    :aria-disabled="control.disabled.value || undefined"
    :class="classes"
    @keydown="onKeydown"
  >
    <slot />
  </div>
</template>
