<script setup lang="ts">
import { computed, ref, useAttrs, useId, useSlots, type HTMLAttributes } from 'vue'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { faCheck, faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import Icon from '../../primitives/Icon/Icon.vue'
import Label from '../Label/Label.vue'
import { normalizeChoiceTone, normalizeLabelPosition, type ChoiceLabelPosition, type ChoiceTone } from '../Checkbox/tones'
import { useFieldControl } from '../Field/useFieldContext'
import { normalizeSwitchSize, switchTextVariants, switchThumbVariants, switchVariants } from './variants'

export interface SwitchProps {
  /** On/off state. Omit for uncontrolled use. */
  modelValue?: boolean | null
  /** Initial state when uncontrolled. */
  defaultValue?: boolean
  disabled?: boolean
  required?: boolean
  /** Marks the switch invalid (aria-invalid). */
  invalid?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** Colour of the on state. */
  tone?: ChoiceTone
  /** Draw a check on the thumb when on and a cross when off, so the state does not rest on position and colour alone. */
  showIcons?: boolean
  /** Short text inside the track while on (for example "On"). Decorative (`aria-hidden`); the accessible name stays the label. Sizes `md` and `lg` only (`sm` ignores it); keep it to about three characters, longer text is clipped. */
  onLabel?: string
  /** Short text inside the track while off (for example "Off"). Same rules as `onLabel`. */
  offLabel?: string
  /** Label text rendered in a `<label>` beside the switch. Use the `label` slot for rich content. */
  label?: string
  /** Helper text under the label, linked to the switch with `aria-describedby`. Shown only together with a label. Use the `description` slot for rich content. */
  description?: string
  /** Side of the label in reading order: `end` (default) or `start`. Flips in right-to-left layouts. */
  labelPosition?: ChoiceLabelPosition
  /** Form field name (renders a hidden input inside a `<form>`). */
  name?: string
  /** Value submitted with the form when on. */
  value?: string
  id?: string
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<SwitchProps>(), { modelValue: undefined, defaultValue: undefined, size: 'md', tone: 'primary', labelPosition: 'end', onLabel: undefined, offLabel: undefined })
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const slots = useSlots()
const attrs = useAttrs()

const control = useFieldControl({ invalid: () => props.invalid, disabled: () => props.disabled, required: () => props.required })

const uid = useId()
const hasLabel = computed(() => !!props.label || !!slots.label)
// Without a label the id stays whatever the consumer or Field provided; the label `for` needs one, so it gets a generated fallback.
const switchId = computed(() => props.id ?? (attrs.id as string | undefined) ?? control.id.value ?? (hasLabel.value ? `switch-${uid}` : undefined))
const hasDescription = computed(() => hasLabel.value && (!!props.description || !!slots.description))
const descriptionId = computed(() => `${switchId.value}-description`)
const describedBy = computed(() => {
  const ids = [control.describedBy.value, attrs['aria-describedby'] as string | undefined, hasDescription.value ? descriptionId.value : undefined]
  const tokens = ids.flatMap((v) => (v ? String(v).split(/\s+/) : []))
  return tokens.length ? [...new Set(tokens)].join(' ') : undefined
})

const root = ref<{ $el: HTMLElement } | null>(null)
useRequireAccessibleName('Switch', () => root.value?.$el, 'Pass `label` (or the `label` slot), wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`.')

const size = computed(() => normalizeSwitchSize(props.size))
const tone = computed(() => normalizeChoiceTone(props.tone))
const textSize = computed(() => (size.value === 'lg' ? 'text-base' : 'text-sm'))
const iconSize = computed(() => ({ sm: 'size-2', md: 'size-2.5', lg: 'size-3' })[size.value])

// On/off text needs the wider track, which only fits md and lg.
const texts = computed(() => size.value !== 'sm' && (!!props.onLabel || !!props.offLabel))
const textOn = computed(() => switchTextVariants({ state: 'on', tone: tone.value }))
const textOff = computed(() => switchTextVariants({ state: 'off', tone: tone.value }))
const classes = computed(() => cn(switchVariants({ tone: tone.value, size: size.value, labeled: hasLabel.value, texts: texts.value }), props.class))
const thumbClasses = computed(() => switchThumbVariants({ tone: tone.value, size: size.value, icons: !!props.showIcons, texts: texts.value }))
const wrapperClasses = computed(() => cn('inline-flex max-w-full items-start gap-2', normalizeLabelPosition(props.labelPosition) === 'start' && 'flex-row-reverse'))
</script>

<template>
  <div v-if="hasLabel" data-slot="switch-wrapper" :class="wrapperClasses">
    <SwitchRoot
      ref="root"
      data-slot="switch"
      :id="switchId"
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
      @update:model-value="(v) => emit('update:modelValue', v)"
    >
      <template #default="{ modelValue: on }">
        <template v-if="texts">
          <span v-if="on && onLabel" data-slot="switch-on-label" aria-hidden="true" :class="textOn">{{ onLabel }}</span>
          <span v-else-if="!on && offLabel" data-slot="switch-off-label" aria-hidden="true" :class="textOff">{{ offLabel }}</span>
        </template>
        <SwitchThumb data-slot="switch-thumb" :class="thumbClasses">
          <Icon v-if="showIcons" data-slot="switch-icon" :icon="on ? faCheck : faXmark" :class="iconSize" />
        </SwitchThumb>
      </template>
    </SwitchRoot>
    <div v-if="hasDescription" data-slot="switch-text" class="grid min-w-0 gap-0.5">
      <Label data-slot="switch-label" :for="switchId" :disabled="control.disabled.value" :required="control.required.value" :class="cn('font-normal leading-snug', textSize)">
        <slot name="label">{{ label }}</slot>
      </Label>
      <p :id="descriptionId" data-slot="switch-description" :class="cn('leading-snug text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm', control.disabled.value && 'opacity-50')">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <Label v-else data-slot="switch-label" :for="switchId" :disabled="control.disabled.value" :required="control.required.value" :class="cn('font-normal leading-snug', textSize)">
      <slot name="label">{{ label }}</slot>
    </Label>
  </div>
  <SwitchRoot
    v-else
    ref="root"
    data-slot="switch"
    :id="switchId"
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
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template #default="{ modelValue: on }">
      <template v-if="texts">
        <span v-if="on && onLabel" data-slot="switch-on-label" aria-hidden="true" :class="textOn">{{ onLabel }}</span>
        <span v-else-if="!on && offLabel" data-slot="switch-off-label" aria-hidden="true" :class="textOff">{{ offLabel }}</span>
      </template>
      <SwitchThumb data-slot="switch-thumb" :class="thumbClasses">
        <Icon v-if="showIcons" data-slot="switch-icon" :icon="on ? faCheck : faXmark" :class="iconSize" />
      </SwitchThumb>
    </template>
  </SwitchRoot>
</template>
