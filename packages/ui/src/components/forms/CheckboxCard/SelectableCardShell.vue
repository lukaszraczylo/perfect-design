<script setup lang="ts">
import { computed, nextTick, ref, useId, useSlots, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import type { IconDefinition } from '../../../lib/icons-tools'
import { faCheck } from '../../../lib/icons'
import { forcedChecked } from '../Field/field-styles'
import Icon from '../../primitives/Icon/Icon.vue'
import { CARD_ICON_TONE, CARD_INDICATOR_TONE, checkboxCardVariants, normalizeCardLayout, normalizeCardTone, type CardLayout, type CardSize, type CardTone, type CardVariant } from './variants'

/** Internal: shared markup for CheckboxCard and RadioCard. Not exported from the barrel. */
export interface SelectableCardShellProps {
  type: 'checkbox' | 'radio'
  /** data-slot of the root, e.g. `checkbox-card`. Parts derive `<slotName>-<part>`. */
  slotName: string
  checked: boolean
  variant?: CardVariant
  size?: CardSize
  tone?: CardTone
  layout?: CardLayout
  title?: string
  description?: string
  icon?: IconDefinition
  value?: string
  name?: string
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  /** Ids of a surrounding Field's hint and error; added to the card's own description id. */
  describedBy?: string
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = defineProps<SelectableCardShellProps>()
const emit = defineEmits<{ change: [checked: boolean] }>()
const slots = useSlots()
const uid = useId()
const input = ref<HTMLInputElement>()
const titleId = `${uid}-title`
useRequireAccessibleName(
  props.type === 'radio' ? 'RadioCard' : 'CheckboxCard',
  () => input.value,
  'Give the card a `title` (or `description`, or text in the default slot), or set `aria-label` / `aria-labelledby`. An icon alone is not a name.',
)
const descId = `${uid}-desc`

const hasTitle = computed(() => !!props.title || !!slots.title)
const hasDescription = computed(() => !!props.description || !!slots.description)
const hasIcon = computed(() => !!props.icon || !!slots.icon)
const state = computed(() => (props.checked ? 'checked' : 'unchecked'))
const tone = computed(() => normalizeCardTone(props.tone))
const stacked = computed(() => normalizeCardLayout(props.layout) === 'stacked')
const classes = computed(() => cn('group', checkboxCardVariants({ variant: props.variant, size: props.size, tone: tone.value, layout: props.layout }), props.class))

function onChange(e: Event) {
  if (props.disabled) return
  emit('change', (e.target as HTMLInputElement).checked)
  // keep the native state in sync when the parent refuses (controlled) the change
  void nextTick(() => {
    if (input.value) input.value.checked = props.checked
  })
}

defineExpose({ input })
</script>

<template>
  <label
    :data-slot="slotName"
    :data-state="state"
    :data-disabled="disabled ? '' : undefined"
    :data-invalid="invalid ? '' : undefined"
    :class="classes"
  >
    <input
      ref="input"
      :data-slot="`${slotName}-input`"
      :type="type"
      class="peer sr-only"
      :name="name"
      :value="value"
      :checked="checked"
      :disabled="disabled"
      :required="required || undefined"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-labelledby="hasTitle ? titleId : undefined"
      :aria-describedby="describedBy ? [hasDescription ? descId : '', describedBy].filter(Boolean).join(' ') : hasDescription ? descId : undefined"
      v-bind="$attrs"
      @change="onChange"
    />
    <span v-if="hasIcon" :data-slot="`${slotName}-icon`" :class="cn('mt-0.5 flex shrink-0 text-muted-foreground group-data-[state=checked]:text-primary', CARD_ICON_TONE[tone])">
      <slot name="icon"><Icon v-if="icon" :icon="icon" /></slot>
    </span>
    <span :data-slot="`${slotName}-content`" :class="cn('grid min-w-0 flex-1 gap-1', stacked && 'w-full pe-7')">
      <span v-if="hasTitle" :id="titleId" :data-slot="`${slotName}-title`" class="leading-snug font-medium">
        <slot name="title">{{ title }}</slot>
      </span>
      <span v-if="hasDescription" :id="descId" :data-slot="`${slotName}-description`" class="leading-snug text-muted-foreground">
        <slot name="description">{{ description }}</slot>
      </span>
      <slot />
    </span>
    <span
      :data-slot="`${slotName}-indicator`"
      :data-state="state"
      aria-hidden="true"
      :class="
        cn(
          'mt-0.5 inline-flex size-4 shrink-0 items-center justify-center border border-input bg-background text-transparent transition-colors motion-reduce:transition-none',
          type === 'radio' ? 'rounded-full' : 'rounded-sm',
          'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
          forcedChecked,
          CARD_INDICATOR_TONE[tone],
          stacked && 'absolute end-3 top-3 mt-0',
        )
      "
    >
      <Icon v-if="type === 'checkbox'" :icon="faCheck" class="size-3" />
      <span v-else class="size-1.5 rounded-full bg-current" />
    </span>
  </label>
</template>
