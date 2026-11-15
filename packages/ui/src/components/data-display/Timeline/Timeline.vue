<script setup lang="ts">
import { computed, provide, useAttrs } from 'vue'
import { requireOneOf } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { useMountedCheck } from '../_shared/contract'
import { TIMELINE_KEY, TIMELINE_LAYOUTS, TIMELINE_SIZES, TIMELINE_VARIANTS, timelineVariants, type TimelineLayout, type TimelineSize, type TimelineVariant } from './variants'

export interface TimelineProps extends BaseProps {
  /** Render as `ol` (default, chronological order matters) or `ul`. */
  as?: 'ol' | 'ul'
  /**
   * `vertical` (default), `horizontal` (steps in a row, scrolls on overflow) or `alternating`
   * (events left/right of a centre line from `md` up; a plain vertical list below).
   */
  layout?: TimelineLayout
  /** `compact` shrinks markers, spacing and body text; `large` enlarges markers, spacing and text. */
  size?: TimelineSize
  /**
   * Marker look. `default` is a tinted marker; `outline` a ring in the status tone with a plain centre; `solid` fills the
   * marker with the tone. The status stays available as visually hidden text in every variant.
   */
  variant?: TimelineVariant
  /** Accessible name of the list. Required for `horizontal`, which becomes a focusable scroll region (or pass `aria-label`). */
  label?: string
}

const props = withDefaults(defineProps<TimelineProps>(), { as: 'ol', layout: 'vertical', size: 'default', variant: 'default' })
const layout = computed<TimelineLayout>(() => (TIMELINE_LAYOUTS.includes(props.layout) ? props.layout : 'vertical'))
const size = computed<TimelineSize>(() => (TIMELINE_SIZES.includes(props.size) ? props.size : 'default'))
const variant = computed<TimelineVariant>(() => (TIMELINE_VARIANTS.includes(props.variant) ? props.variant : 'default'))
provide(TIMELINE_KEY, { layout, size, variant })
const scrolls = computed(() => layout.value === 'horizontal')
const attrs = useAttrs()
useMountedCheck(() => {
  if (scrolls.value) requireOneOf('Timeline', { label: props.label, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, 'A horizontal timeline is a focusable scroll region and needs a name, e.g. `label="Delivery steps"`.')
})
const classes = computed(() => cn(timelineVariants({ layout: layout.value }), scrolls.value && ['focus-visible:ring-inset', focusRing], props.class))
</script>

<template>
  <component
    :is="as === 'ul' ? 'ul' : 'ol'"
    data-slot="timeline"
    role="list"
    :aria-label="label"
    :tabindex="scrolls ? 0 : undefined"
    :data-layout="layout === 'vertical' ? undefined : layout"
    :data-size="size === 'default' ? undefined : size"
    :data-variant="variant === 'default' ? undefined : variant"
    :class="classes"
  >
    <slot />
  </component>
</template>
