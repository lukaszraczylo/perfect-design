<script setup lang="ts">
import { computed, nextTick, onMounted, useAttrs } from 'vue'
import { ToggleGroupRoot, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { requireOneOf } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { provideToggleGroupContext } from './context'
import {
  TOGGLE_GROUP_GAPS,
  TOGGLE_GROUP_SHAPES,
  TOGGLE_GROUP_SIZES,
  TOGGLE_GROUP_TONES,
  TOGGLE_GROUP_VARIANTS,
  toggleGroupVariants,
  type ToggleGroupGap,
  type ToggleGroupShape,
  type ToggleGroupSize,
  type ToggleGroupTone,
  type ToggleGroupVariant,
} from './variants'

export interface ToggleGroupProps extends BaseProps {
  /** `single` keeps at most one item pressed (string value); `multiple` any number (string[] value). */
  type?: 'single' | 'multiple'
  /** Selected value(s) (v-model). Leave undefined for uncontrolled use. */
  modelValue?: string | string[]
  /** Initial value(s) when uncontrolled. */
  defaultValue?: string | string[]
  /** Look shared by every item (items may override): `default`, `outline` or `segmented` (items on a muted track). */
  variant?: ToggleGroupVariant
  /** Size shared by every item (items may override): xs, sm, md, lg, xl. */
  size?: ToggleGroupSize
  /** Corner shape shared by every item: `rounded` (default), `pill` or `square`. */
  shape?: ToggleGroupShape
  /** Colour of the pressed item: `neutral` (default accent fill) or a solid `primary`, `success`, `danger` or `info` fill. */
  tone?: ToggleGroupTone
  /** Space between items: `none` joins them (default); `sm` and `md` render separate buttons. */
  gap?: ToggleGroupGap
  orientation?: 'horizontal' | 'vertical'
  /** Stretch the group to its container and share the width between items. */
  fullWidth?: boolean
  disabled?: boolean
  /** Wrap keyboard focus from last to first item. */
  loop?: boolean
  dir?: 'ltr' | 'rtl'
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<ToggleGroupProps>(), {
  type: 'single',
  modelValue: undefined,
  defaultValue: undefined,
  variant: 'default',
  size: 'md',
  shape: 'rounded',
  tone: 'neutral',
  gap: 'none',
  orientation: 'horizontal',
  fullWidth: false,
  disabled: false,
  loop: true,
  dir: undefined,
})

defineEmits<{ 'update:modelValue': [value: string | string[] | undefined] }>()

// Unknown values fall back to the defaults instead of rendering unstyled items.
const variant = computed<ToggleGroupVariant>(() => (TOGGLE_GROUP_VARIANTS.includes(props.variant) ? props.variant : 'default'))
const size = computed<ToggleGroupSize>(() => (TOGGLE_GROUP_SIZES.includes(props.size) ? props.size : 'md'))

const shape = computed<ToggleGroupShape>(() => (TOGGLE_GROUP_SHAPES.includes(props.shape) ? props.shape : 'rounded'))
const tone = computed<ToggleGroupTone>(() => (TOGGLE_GROUP_TONES.includes(props.tone) ? props.tone : 'neutral'))
const gap = computed<ToggleGroupGap>(() => (TOGGLE_GROUP_GAPS.includes(props.gap) ? props.gap : 'none'))

const attrs = useAttrs()
const held = new Map<string, number>()
provideToggleGroupContext({
  variant,
  size,
  shape,
  tone,
  gap,
  orientation: computed(() => props.orientation),
  fullWidth: computed(() => props.fullWidth),
  claim(value) {
    held.set(value, (held.get(value) ?? 0) + 1)
    return { count: held.get(value)!, release: () => held.set(value, Math.max(0, (held.get(value) ?? 1) - 1)) }
  },
})

onMounted(async () => {
  await nextTick()
  requireOneOf(
    'ToggleGroup',
    { 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] },
    'Name the group so assistive tech announces what the buttons control, e.g. aria-label="Text alignment".',
  )
})

const classes = computed(() =>
  cn(
    toggleGroupVariants({ variant: variant.value, orientation: props.orientation, fullWidth: props.fullWidth, shape: shape.value, gap: gap.value }),
    props.class,
  ),
)
</script>

<template>
  <ToggleGroupRoot
    data-slot="toggle-group"
    :type="type"
    :model-value="modelValue"
    :default-value="defaultValue"
    :orientation="orientation"
    :disabled="disabled"
    :loop="loop"
    :dir="dir"
    :as="as"
    :as-child="asChild"
    :data-orientation="orientation"
    :class="classes"
    @update:model-value="$emit('update:modelValue', $event as string | string[] | undefined)"
  >
    <slot />
  </ToggleGroupRoot>
</template>
