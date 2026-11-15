<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { formatCountBadge } from './count'
import {
  COUNT_BADGE_APPEARANCES,
  COUNT_BADGE_SHAPES,
  COUNT_BADGE_SIZES,
  COUNT_BADGE_TONES,
  countBadgeVariants,
  type CountBadgeAppearance,
  type CountBadgeShape,
  type CountBadgeSize,
  type CountBadgeTone,
} from './variants'

export interface CountBadgeProps extends BaseProps {
  /** The number to show. Not a number, NaN and negatives count as 0, fractions are truncated, `Infinity` shows `max+`. Omit it in `dot` mode for an always-visible dot. */
  count?: number
  /** Largest number printed; above it the badge shows `max+` (`99+`). Must be a whole number from 1; anything else falls back to 99. */
  max?: number
  /** Render a badge with `0`. By default a count of 0 renders nothing. */
  showZero?: boolean
  /** A small marker without a number. Still needs `label`. When `count` is given, the dot hides at 0 (unless `showZero`). */
  dot?: boolean
  /** REQUIRED accessible text, read instead of the visible number, e.g. `3 unread messages` or `New activity`. Rendered as visually hidden text. */
  label?: string
  tone?: CountBadgeTone
  size?: CountBadgeSize
  /** `pill` grows with the text, `circle` stays round up to two digits, `square` uses the control radius. */
  shape?: CountBadgeShape
  /** `solid` (filled), `soft` (tinted) or `outline` (border on the page background). */
  appearance?: CountBadgeAppearance
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<CountBadgeProps>(), {
  max: 99,
  showZero: false,
  dot: false,
  tone: 'primary',
  size: 'md',
  shape: 'pill',
  appearance: 'solid',
  as: 'span',
})

const resolved = computed(() => formatCountBadge(props.count, props.max))
const visible = computed(() => {
  if (props.showZero || resolved.value.value > 0) return true
  // A dot without a count is a plain "something new" marker and always shows.
  return props.dot && props.count === undefined
})
const label = computed(() => (typeof props.label === 'string' ? props.label.trim() : ''))

const tone = computed<CountBadgeTone>(() => (COUNT_BADGE_TONES.includes(props.tone) ? props.tone : 'primary'))
const size = computed<CountBadgeSize>(() => (COUNT_BADGE_SIZES.includes(props.size) ? props.size : 'md'))
const shape = computed<CountBadgeShape>(() => (COUNT_BADGE_SHAPES.includes(props.shape) ? props.shape : 'pill'))
const appearance = computed<CountBadgeAppearance>(() => (COUNT_BADGE_APPEARANCES.includes(props.appearance) ? props.appearance : 'solid'))

const classes = computed(() =>
  cn(countBadgeVariants({ appearance: appearance.value, tone: tone.value, size: size.value, shape: shape.value, dot: props.dot }), props.class),
)

// A rendered badge must say what it counts. Nothing is checked while it renders nothing.
function check() {
  if (!visible.value) return
  requireText('CountBadge', 'label', props.label, 'It is read instead of the visible number, e.g. label="3 unread messages" or label="New activity".')
}
onMounted(async () => {
  await nextTick()
  check()
})
watch(visible, async (now) => {
  if (!now) return
  await nextTick()
  check()
})
</script>

<template>
  <Primitive
    v-if="visible"
    data-slot="count-badge"
    :as="as"
    :class="classes"
    :data-dot="dot ? '' : undefined"
    :data-overflow="!dot && resolved.overflow ? '' : undefined"
  >
    <span v-if="!dot" data-slot="count-badge-text" aria-hidden="true">{{ resolved.text }}</span>
    <span v-if="label" data-slot="count-badge-label" class="sr-only">{{ label }}</span>
  </Primitive>
</template>
