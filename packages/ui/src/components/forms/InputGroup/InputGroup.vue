<script setup lang="ts">
import { computed, useId, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { provideInputGroup } from './context'
import { INNER_FOCUS, inputGroupVariants, type InputGroupLayout } from './variants'

export interface InputGroupProps {
  /** `inset` (default): one shared field surface with the addons inside it. `joined`: separate controls attached edge to edge. */
  layout?: InputGroupLayout
  /** Surface treatment of the shared surface (`inset` only). */
  variant?: FieldVariant
  size?: FieldSize
  shape?: FieldShape
  /** Status colour plus an icon (`inset` only). In a joined row give the Input its own `status`. */
  status?: FieldStatus
  /** Text of the visually hidden status message. Defaults to the English text. */
  statusLabel?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<InputGroupProps>(), { layout: 'inset', variant: 'outline', size: 'md', shape: 'rounded', status: 'default' })
const layout = computed<InputGroupLayout>(() => (props.layout === 'joined' ? 'joined' : 'inset'))
const status = computed(() => (layout.value === 'inset' ? normalizeStatus(props.status) : 'default'))
const statusId = `input-group-${useId()}-status`
provideInputGroup({ layout: () => layout.value })

const classes = computed(() =>
  cn(
    inputGroupVariants({
      layout: layout.value,
      variant: normalizeVariant(props.variant),
      size: normalizeFieldSize(props.size),
      shape: normalizeShape(props.shape),
      status: status.value,
    }),
    props.class,
  ),
)
</script>

<template>
  <div data-slot="input-group" :data-layout="layout" :class="[classes, layout === 'inset' && INNER_FOCUS]">
    <slot />
    <FieldStatusIcon :status="status" :id="statusId" :label="statusLabel" class="static shrink-0 translate-y-0" />
  </div>
</template>
