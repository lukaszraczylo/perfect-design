<script setup lang="ts">
import { computed, ref } from 'vue'
import { Toggle as RekaToggle, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import {
  TOGGLE_SHAPES,
  TOGGLE_SIZES,
  TOGGLE_TONES,
  TOGGLE_VARIANTS,
  toggleVariants,
  type ToggleShape,
  type ToggleSize,
  type ToggleTone,
  type ToggleVariant,
} from './variants'

export interface ToggleProps extends BaseProps {
  /** Pressed state (v-model). Leave undefined for uncontrolled use. */
  modelValue?: boolean
  /** Initial pressed state when uncontrolled. */
  defaultPressed?: boolean
  /** Look: `default` (flat), `outline`, `soft` (muted fill) or `filled` (secondary fill, solid when pressed). */
  variant?: ToggleVariant
  /** Colour of the pressed state. Unset = neutral accent (primary for `soft` and `filled`). */
  tone?: ToggleTone
  /** Height: `xs` 28px, `sm` 32px, `md` 36px, `lg` 40px, `xl` 44px. */
  size?: ToggleSize
  /** Corner radius: `rounded` (rounded-md), `pill` or `square`. */
  shape?: ToggleShape
  disabled?: boolean
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<ToggleProps>(), {
  modelValue: undefined,
  defaultPressed: false,
  variant: 'default',
  tone: undefined,
  size: 'md',
  shape: 'rounded',
  disabled: false,
  as: 'button',
})

defineEmits<{ 'update:modelValue': [value: boolean] }>()

defineSlots<{
  /** Toggle content. Receives the pressed state. */
  default?: (props: { pressed: boolean }) => unknown
}>()

const root = ref<{ $el?: unknown } | null>(null)
// An icon-only toggle has no text to name it. Skipped for elements that do not take a name from content (`as="div"`).
useRequireAccessibleName(
  'Toggle',
  () => (root.value?.$el instanceof Element ? root.value.$el : null),
  'An icon-only toggle needs `aria-label` (or `aria-labelledby`, or visible text), e.g. aria-label="Bold".',
  () => !!root.value?.$el && root.value.$el instanceof Element && root.value.$el.matches('button,[role=button],a[href]'),
)

const variant = computed<ToggleVariant>(() => (TOGGLE_VARIANTS.includes(props.variant) ? props.variant : 'default'))
const tone = computed<ToggleTone | undefined>(() => (props.tone && TOGGLE_TONES.includes(props.tone) ? props.tone : undefined))
const size = computed<ToggleSize>(() => (TOGGLE_SIZES.includes(props.size) ? props.size : 'md'))
const shape = computed<ToggleShape>(() => (TOGGLE_SHAPES.includes(props.shape) ? props.shape : 'rounded'))

const classes = computed(() => cn(toggleVariants({ variant: variant.value, tone: tone.value, size: size.value, shape: shape.value }), props.class))
</script>

<template>
  <RekaToggle
    ref="root"
    v-slot="{ modelValue: pressed }"
    data-slot="toggle"
    :as="as"
    :as-child="asChild"
    :model-value="modelValue"
    :default-value="defaultPressed"
    :disabled="disabled"
    :class="classes"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <slot :pressed="!!pressed" />
  </RekaToggle>
</template>
