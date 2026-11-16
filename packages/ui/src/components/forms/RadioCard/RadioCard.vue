<script setup lang="ts">
import { computed, inject, onMounted, type HTMLAttributes } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { violation } from '../../../lib/contract'
import SelectableCardShell from '../CheckboxCard/SelectableCardShell.vue'
import { useGroupedCardValue } from '../CheckboxCard/contract-helpers'
import type { CardLayout, CardSize, CardTone, CardVariant } from '../CheckboxCard/variants'
import { RADIO_CARD_GROUP_KEY } from './context'

export interface RadioCardProps {
  /** Value this card represents. Must be a non-empty string. */
  value: string
  /** Title text. Use the `title` slot for rich content. */
  title?: string
  /** Description text. Use the `description` slot for rich content. */
  description?: string
  /** Optional icon shown before the text. Use the `icon` slot for anything else. */
  icon?: IconDefinition
  variant?: CardVariant
  size?: CardSize
  /** Colour of the checked state. Inherits the group tone when unset. */
  tone?: CardTone
  /** `stacked` puts the icon above the text and the indicator in the top end corner. Inherits the group layout when unset. */
  layout?: CardLayout
  disabled?: boolean
  /** Marks this card invalid (aria-invalid + destructive border). */
  invalid?: boolean
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<RadioCardProps>(), {
  title: undefined,
  description: undefined,
  icon: undefined,
  variant: undefined,
  size: undefined,
  tone: undefined,
  layout: undefined,
})

// Without a RadioCardGroup the card is inert (renders unchecked, ignores input).
const group = inject(RADIO_CARD_GROUP_KEY, null)
onMounted(() => {
  if (!group) violation('RadioCard', 'requires-group', 'requires a surrounding RadioCardGroup, which owns the selected value and the radio name. Wrap the cards in `<RadioCardGroup v-model="...">`.')
})
useGroupedCardValue('RadioCard', 'RadioCardGroup', group, () => props.value)
const checked = computed(() => !!group && !!props.value && group.value.value === props.value)
const disabled = computed(() => props.disabled || !group || group.disabled.value)
const invalid = computed(() => props.invalid || !!group?.invalid.value)

function onChange(next: boolean) {
  if (next && group && props.value && !disabled.value) group.select(props.value)
}
</script>

<template>
  <SelectableCardShell
    slot-name="radio-card"
    type="radio"
    :checked="checked"
    :variant="variant ?? group?.variant.value"
    :size="size ?? group?.size.value"
    :tone="tone ?? group?.tone.value"
    :layout="layout ?? group?.layout.value"
    :title="title"
    :description="description"
    :icon="icon"
    :value="value"
    :name="group?.name.value"
    :form="group && !group.submits.value ? `${group.name.value}-unattached` : undefined"
    :disabled="disabled"
    :invalid="invalid"
    :required="group?.required.value"
    :class="props.class"
    v-bind="$attrs"
    @change="onChange"
  >
    <template v-if="$slots.icon" #icon><slot name="icon" :checked="checked" /></template>
    <template v-if="$slots.title" #title><slot name="title" :checked="checked" /></template>
    <template v-if="$slots.description" #description><slot name="description" :checked="checked" /></template>
    <slot :checked="checked" />
  </SelectableCardShell>
</template>
