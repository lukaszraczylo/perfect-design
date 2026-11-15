<script setup lang="ts">
import { computed, ref, useAttrs, useId, watch, type HTMLAttributes } from 'vue'
import { faChevronDown } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import Icon from '../../primitives/Icon/Icon.vue'
import { useFieldControl } from '../Field/useFieldContext'
import { useNativeValidation } from '../Field/useNativeValidation'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { nativeSelectVariants } from './variants'

export interface NativeSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface NativeSelectProps {
  modelValue?: string | null
  /** Options rendered as `<option>`. Use the default slot instead for `<optgroup>` or custom markup. */
  options?: NativeSelectOption[]
  /** Disabled, hidden first option shown while no value is selected. */
  placeholder?: string
  disabled?: boolean
  required?: boolean
  /** Marks the select invalid (aria-invalid) and applies destructive styling. */
  invalid?: boolean
  /** Surface treatment of the select. */
  variant?: FieldVariant
  /** Height and text size. `xs` is 28px tall. */
  size?: FieldSize
  /** Corner shape. */
  shape?: FieldShape
  /** Status colour plus an icon left of the chevron (and screen reader text for `success` and `warning`). `error` also sets `aria-invalid`. */
  status?: FieldStatus
  /** Text of the visually hidden status message. Defaults to the English text. */
  statusLabel?: string
  /** Merged onto the wrapper element (width/layout). Other attributes go to the `<select>`. */
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<NativeSelectProps>(), { variant: 'outline', size: 'md', shape: 'rounded', status: 'default' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const status = computed(() => normalizeStatus(props.status))
const attrs = useAttrs()
const statusId = `native-select-${useId()}-status`
const control = useFieldControl({ invalid: () => props.invalid || status.value === 'error', disabled: () => props.disabled, required: () => props.required })

const selectEl = ref<HTMLSelectElement | null>(null)
useNativeValidation(selectEl)
useRequireAccessibleName('NativeSelect', () => selectEl.value, 'Wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`. A placeholder option is not a name.')

const model = ref(props.modelValue ?? '')
watch(
  () => props.modelValue,
  (v) => {
    model.value = v ?? ''
  },
)

const showingPlaceholder = computed(() => !!props.placeholder && model.value === '')
const wrapperClasses = computed(() => cn('relative w-full', props.class))
const variant = computed(() => normalizeVariant(props.variant))
const shape = computed(() => normalizeShape(props.shape))
const classes = computed(() =>
  cn(
    nativeSelectVariants({ size: normalizeFieldSize(props.size), variant: variant.value, shape: shape.value, status: status.value }),
    // The status icon sits left of the chevron.
    status.value !== 'default' && 'pe-16',
    showingPlaceholder.value && 'text-muted-foreground',
  ),
)
/** The chevron and the status icon sit flush for underline and further in for pill. */
const chevronClass = computed(() => cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground', variant.value === 'underline' ? 'end-0' : shape.value === 'pill' ? 'end-4' : 'end-3'))
const statusClass = computed(() => (variant.value === 'underline' ? 'end-6' : shape.value === 'pill' ? 'end-10' : 'end-9'))
/** The caller's attributes win, except that the status id is appended to `aria-describedby`. */
function selectAttrs() {
  const base = (attrs['aria-describedby'] as string | undefined) ?? control.describedBy.value
  const describedBy = [base, status.value === 'success' || status.value === 'warning' ? statusId : ''].filter(Boolean).join(' ') || undefined
  return { ...attrs, 'aria-describedby': describedBy }
}

function onChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  model.value = v
  emit('update:modelValue', v)
}
</script>

<template>
  <div data-slot="native-select-wrapper" :class="wrapperClasses">
    <select
      ref="selectEl"
      data-slot="native-select"
      :id="control.id.value"
      :value="model"
      :disabled="control.disabled.value"
      :required="control.required.value || undefined"
      :aria-invalid="control.ariaInvalid.value"
      :data-placeholder="showingPlaceholder ? '' : undefined"
      v-bind="selectAttrs()"
      :class="classes"
      @change="onChange"
    >
      <option v-if="placeholder" value="" disabled hidden>{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value" :disabled="o.disabled">{{ o.label }}</option>
      <slot />
    </select>
    <Icon
      data-slot="native-select-icon"
      :icon="faChevronDown"
      size="sm"
      :class="chevronClass"
    />
    <FieldStatusIcon :status="status" :id="statusId" :label="statusLabel" :class="statusClass" />
  </div>
</template>
