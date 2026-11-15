<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { COUNT_BADGE_PLACEMENTS, countBadgePlacementClasses, type CountBadgePlacement } from './variants'

export interface CountBadgeAnchorProps extends BaseProps {
  /** Corner of the anchored element the badge sits on: `top-end` (default), `top-start`, `bottom-end` or `bottom-start`. Start and end flip in right-to-left text. */
  placement?: CountBadgePlacement
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<CountBadgeAnchorProps>(), { placement: 'top-end', as: 'span' })

const placement = computed<CountBadgePlacement>(() => (COUNT_BADGE_PLACEMENTS.includes(props.placement) ? props.placement : 'top-end'))
const classes = computed(() => cn('relative inline-flex w-fit shrink-0 align-middle', props.class))
const badgeClasses = computed(() => cn('pointer-events-none absolute z-10 flex *:ring-2 *:ring-background', countBadgePlacementClasses(placement.value)))
</script>

<template>
  <Primitive data-slot="count-badge-anchor" :as="as" :class="classes" :data-placement="placement">
    <slot />
    <span v-if="$slots.badge" data-slot="count-badge-anchor-badge" :class="badgeClasses">
      <slot name="badge" />
    </span>
  </Primitive>
</template>
