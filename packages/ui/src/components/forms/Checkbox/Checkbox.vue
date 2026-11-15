<script setup lang="ts">
import { computed, ref, useAttrs, useId, useSlots, type HTMLAttributes } from 'vue'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { faCheck, faMinus } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import Icon from '../../primitives/Icon/Icon.vue'
import Label from '../Label/Label.vue'
import { useFieldControl } from '../Field/useFieldContext'
import { normalizeChoiceTone, normalizeLabelPosition, type ChoiceLabelPosition, type ChoiceTone } from './tones'
import { checkboxVariants, normalizeCheckboxShape, normalizeCheckboxSize, type CheckboxShape } from './variants'

export type CheckboxValue = boolean | 'indeterminate'

export interface CheckboxProps {
  /** Controlled state. `true`, `false` or `'indeterminate'`. Omit for uncontrolled use. */
  modelValue?: CheckboxValue | null
  /** Initial state when uncontrolled. */
  defaultValue?: CheckboxValue
  disabled?: boolean
  required?: boolean
  /** Marks the checkbox invalid (aria-invalid) and applies destructive styling. */
  invalid?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** Colour of the checked and indeterminate surface. */
  tone?: ChoiceTone
  /** Corner shape of the box: `rounded` (default), `square` or `circle`. */
  shape?: CheckboxShape
  /** Label text rendered in a `<label>` beside the box. Use the `label` slot for rich content. */
  label?: string
  /** Helper text under the label, linked to the box with `aria-describedby`. Shown only together with a label. Use the `description` slot for rich content. */
  description?: string
  /** Side of the label in reading order: `end` (default) or `start`. Flips in right-to-left layouts. */
  labelPosition?: ChoiceLabelPosition
  /** Form field name (renders a hidden input inside a `<form>`). */
  name?: string
  /** Value submitted with the form when checked. */
  value?: string
  /** Control id; falls back to the surrounding Field id, then to a generated one. */
  id?: string
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<CheckboxProps>(), { modelValue: undefined, defaultValue: undefined, size: 'md', tone: 'primary', shape: 'rounded', labelPosition: 'end' })
const emit = defineEmits<{ 'update:modelValue': [value: CheckboxValue] }>()
const slots = useSlots()
const attrs = useAttrs()

const control = useFieldControl({ invalid: () => props.invalid, disabled: () => props.disabled, required: () => props.required })

const uid = useId()
const boxId = computed(() => props.id ?? (attrs.id as string | undefined) ?? control.id.value ?? `checkbox-${uid}`)
const hasLabel = computed(() => !!props.label || !!slots.label)
const box = ref<{ $el: HTMLElement } | null>(null)
useRequireAccessibleName('Checkbox', () => box.value?.$el, 'Pass `label` (or the `label` slot), wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`.')

const SIZES = {
  sm: { icon: 'size-2.5', text: 'text-sm', hint: 'text-xs' },
  md: { icon: 'size-3', text: 'text-sm', hint: 'text-sm' },
  lg: { icon: 'size-3.5', text: 'text-base', hint: 'text-sm' },
} as const
const size = computed(() => SIZES[normalizeCheckboxSize(props.size)])

const hasDescription = computed(() => hasLabel.value && (!!props.description || !!slots.description))
const descriptionId = computed(() => `${boxId.value}-description`)
// Field hint/error ids, an explicit `aria-describedby` attribute and the description, without duplicates.
const describedBy = computed(() => {
  const ids = [control.describedBy.value, attrs['aria-describedby'] as string | undefined, hasDescription.value ? descriptionId.value : undefined]
  const tokens = ids.flatMap((v) => (v ? String(v).split(/\s+/) : []))
  return tokens.length ? [...new Set(tokens)].join(' ') : undefined
})

const classes = computed(() =>
  cn(
    checkboxVariants({ tone: normalizeChoiceTone(props.tone), shape: normalizeCheckboxShape(props.shape), size: normalizeCheckboxSize(props.size), labeled: hasLabel.value }),
    props.class,
  ),
)
const wrapperClasses = computed(() => cn('inline-flex max-w-full items-start gap-2', normalizeLabelPosition(props.labelPosition) === 'start' && 'flex-row-reverse'))

function onUpdate(v: unknown) {
  emit('update:modelValue', v as CheckboxValue)
}
</script>

<template>
  <div v-if="hasLabel" data-slot="checkbox-wrapper" :class="wrapperClasses">
    <CheckboxRoot
      ref="box"
      data-slot="checkbox"
      :id="boxId"
      :model-value="modelValue"
      :default-value="defaultValue"
      :disabled="control.disabled.value"
      :required="control.required.value || undefined"
      :name="name"
      :value="value"
      :aria-invalid="control.ariaInvalid.value"
      v-bind="$attrs"
      :aria-describedby="describedBy"
      :class="classes"
      @update:model-value="onUpdate"
    >
      <template #default="{ state }">
        <CheckboxIndicator data-slot="checkbox-indicator" class="grid place-content-center text-current">
          <Icon :icon="state === 'indeterminate' ? faMinus : faCheck" :class="size.icon" />
        </CheckboxIndicator>
      </template>
    </CheckboxRoot>
    <div v-if="hasDescription" data-slot="checkbox-text" class="grid min-w-0 gap-0.5">
      <Label data-slot="checkbox-label" :for="boxId" :disabled="control.disabled.value" :required="control.required.value" :class="cn('font-normal leading-snug', size.text)">
        <slot name="label">{{ label }}</slot>
      </Label>
      <p :id="descriptionId" data-slot="checkbox-description" :class="cn('leading-snug text-muted-foreground', size.hint, control.disabled.value && 'opacity-50')">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <Label v-else data-slot="checkbox-label" :for="boxId" :disabled="control.disabled.value" :required="control.required.value" :class="cn('font-normal leading-snug', size.text)">
      <slot name="label">{{ label }}</slot>
    </Label>
  </div>
  <CheckboxRoot
    v-else
    ref="box"
    data-slot="checkbox"
    :id="boxId"
    :model-value="modelValue"
    :default-value="defaultValue"
    :disabled="control.disabled.value"
    :required="control.required.value || undefined"
    :name="name"
    :value="value"
    :aria-invalid="control.ariaInvalid.value"
    v-bind="$attrs"
    :aria-describedby="describedBy"
    :class="classes"
    @update:model-value="onUpdate"
  >
    <template #default="{ state }">
      <CheckboxIndicator data-slot="checkbox-indicator" class="grid place-content-center text-current">
        <Icon :icon="state === 'indeterminate' ? faMinus : faCheck" :class="size.icon" />
      </CheckboxIndicator>
    </template>
  </CheckboxRoot>
</template>
