<script setup lang="ts">
import { computed, ref, useAttrs, useId, type HTMLAttributes } from 'vue'
import { SelectIcon, SelectTrigger } from 'reka-ui'
import { faChevronDown } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRegisterPart } from '../../../lib/contract'
import { useRequireControlName } from '../CheckboxCard/contract-helpers'
import Icon from '../../primitives/Icon/Icon.vue'
import { useFieldControl } from '../Field/useFieldContext'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { selectTriggerVariants } from './variants'
import { normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldStatus, type FieldVariant } from '../Field/field-variants'

export interface SelectTriggerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Surface treatment: `outline` (default), `filled`, `underline` or `ghost`. */
  variant?: FieldVariant
  /** Corner shape: `rounded` (default), `pill` or `square`. */
  shape?: FieldShape
  /** Validation status shown with an icon as well as colour. `error` also sets `aria-invalid`. */
  status?: FieldStatus
  disabled?: boolean
  /** Marks the trigger invalid (aria-invalid) and applies destructive styling. */
  invalid?: boolean
  id?: string
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<SelectTriggerProps>(), { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' })

const status = computed(() => normalizeStatus(props.status))
const control = useFieldControl({ invalid: () => props.invalid || status.value === 'error', disabled: () => props.disabled })
const attrs = useAttrs()
const statusId = `select-status-${useId()}`
// Success and warning carry visually hidden text; reference it next to the Field description and any author `aria-describedby`.
const describedBy = computed(
  () => [attrs['aria-describedby'], control.describedBy.value, status.value === 'success' || status.value === 'warning' ? statusId : undefined].filter(Boolean).join(' ') || undefined,
)
useRegisterPart('Select', 'SelectTrigger')
const trigger = ref<{ $el: HTMLElement } | null>(null)
useRequireControlName('SelectTrigger', () => trigger.value?.$el, 'Wrap the Select in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby` on SelectTrigger. The selected value or placeholder is not a name.')

const classes = computed(() =>
  cn(
    selectTriggerVariants({
      size: normalizeFieldSize(props.size),
      variant: normalizeVariant(props.variant),
      shape: normalizeShape(props.shape),
      status: status.value,
    }),
    props.class,
  ),
)
</script>

<template>
  <SelectTrigger
    ref="trigger"
    data-slot="select-trigger"
    :id="props.id ?? control.id.value"
    :data-size="size"
    :data-status="status === 'default' ? undefined : status"
    v-bind="$attrs"
    :disabled="control.disabled.value"
    :aria-invalid="control.invalid.value ? 'true' : undefined"
    :aria-describedby="describedBy"
    :class="classes"
  >
    <slot />
    <FieldStatusIcon :status="status" :id="statusId" class="relative end-auto top-auto ms-auto shrink-0 translate-y-0" />
    <SelectIcon as-child>
      <Icon :icon="faChevronDown" size="sm" class="text-muted-foreground opacity-70" />
    </SelectIcon>
  </SelectTrigger>
</template>
