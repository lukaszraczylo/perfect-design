<script setup lang="ts">
import { computed, inject, onMounted, ref, useAttrs, useId, useSlots, type HTMLAttributes } from 'vue'
import { RadioGroupIndicator, RadioGroupItem } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { requireText, useRequireAccessibleName } from '../../../lib/contract'
import Label from '../Label/Label.vue'
import { normalizeChoiceTone, normalizeLabelPosition, type ChoiceLabelPosition, type ChoiceTone } from '../Checkbox/tones'
import { RADIO_GROUP_KEY } from './context'
import { normalizeRadioGroupSize, radioGroupDotVariants, radioGroupItemVariants, type RadioGroupSize } from './variants'

export interface RadioGroupItemProps {
  /** Value this item represents. Must be a non-empty string. */
  value: string
  disabled?: boolean
  /** Label text rendered in a `<label>` beside the radio. Use the default slot for rich content. */
  label?: string
  /** Helper text under the label, linked to the radio with `aria-describedby`. Shown only together with a label. Use the `description` slot for rich content. */
  description?: string
  /** Size of this radio. Inherits the group size when unset. */
  size?: RadioGroupSize
  /** Colour of the checked state. Inherits the group tone when unset. */
  tone?: ChoiceTone
  /** Side of the label in reading order. Inherits the group setting when unset. */
  labelPosition?: ChoiceLabelPosition
  id?: string
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<RadioGroupItemProps>(), { size: undefined, tone: undefined, labelPosition: undefined })
const slots = useSlots()
const attrs = useAttrs()
const group = inject(RADIO_GROUP_KEY, null)

const uid = useId()
const itemId = computed(() => props.id ?? (attrs.id as string | undefined) ?? `radio-${uid}`)
const hasLabel = computed(() => !!props.label || !!slots.default)
const hasDescription = computed(() => hasLabel.value && (!!props.description || !!slots.description))
const descriptionId = computed(() => `${itemId.value}-description`)
const describedBy = computed(() => {
  const tokens = [attrs['aria-describedby'] as string | undefined, hasDescription.value ? descriptionId.value : undefined].flatMap((v) => (v ? String(v).split(/\s+/) : []))
  return tokens.length ? [...new Set(tokens)].join(' ') : undefined
})

const item = ref<{ $el: HTMLElement } | null>(null)
onMounted(() => requireText('RadioGroupItem', 'value', props.value, 'Give each item its own value (an empty value is reserved for "nothing selected").'))
useRequireAccessibleName('RadioGroupItem', () => item.value?.$el, 'Pass `label` (or put the text in the default slot), or set `aria-label` / `aria-labelledby` on the item.')

const size = computed(() => normalizeRadioGroupSize(props.size ?? group?.size.value))
const tone = computed(() => normalizeChoiceTone(props.tone ?? group?.tone.value))
const labelPosition = computed(() => normalizeLabelPosition(props.labelPosition ?? group?.labelPosition.value))
const classes = computed(() => cn(radioGroupItemVariants({ tone: tone.value, size: size.value, labeled: hasLabel.value }), props.class))
const dotClasses = computed(() => radioGroupDotVariants({ tone: tone.value, size: size.value }))
const wrapperClasses = computed(() => cn('inline-flex max-w-full items-start gap-2', labelPosition.value === 'start' && 'flex-row-reverse'))
const labelClasses = computed(() => cn('font-normal leading-snug', size.value === 'lg' && 'text-base'))
const hintClasses = computed(() => cn('leading-snug text-muted-foreground', size.value === 'sm' ? 'text-xs' : 'text-sm', props.disabled && 'opacity-50'))
</script>

<template>
  <div v-if="hasLabel" data-slot="radio-group-item-wrapper" :class="wrapperClasses">
    <RadioGroupItem ref="item" data-slot="radio-group-item" :id="itemId" :value="value" :disabled="disabled" v-bind="$attrs" :aria-describedby="describedBy" :class="classes">
      <RadioGroupIndicator data-slot="radio-group-indicator" class="flex items-center justify-center">
        <span :class="dotClasses" />
      </RadioGroupIndicator>
    </RadioGroupItem>
    <div v-if="hasDescription" data-slot="radio-group-item-text" class="grid min-w-0 gap-0.5">
      <Label data-slot="radio-group-item-label" :for="itemId" :disabled="disabled" :class="labelClasses">
        <slot>{{ label }}</slot>
      </Label>
      <p :id="descriptionId" data-slot="radio-group-item-description" :class="hintClasses">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <Label v-else data-slot="radio-group-item-label" :for="itemId" :disabled="disabled" :class="labelClasses">
      <slot>{{ label }}</slot>
    </Label>
  </div>
  <RadioGroupItem v-else ref="item" data-slot="radio-group-item" :id="itemId" :value="value" :disabled="disabled" v-bind="$attrs" :aria-describedby="describedBy" :class="classes">
    <RadioGroupIndicator data-slot="radio-group-indicator" class="flex items-center justify-center">
      <span :class="dotClasses" />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
