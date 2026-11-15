<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Badge from '../Badge/Badge.vue'
import StatusDot from '../StatusDot/StatusDot.vue'
import { humanizeStatus, statusTone, type StatusBadgeTone } from './status'
import {
  STATUS_BADGE_SHAPES,
  STATUS_BADGE_SIZES,
  STATUS_BADGE_VARIANTS,
  statusBadgeDotSize,
  statusBadgeLook,
  statusBadgeRounded,
  statusBadgeVariants,
  type StatusBadgeShape,
  type StatusBadgeSize,
  type StatusBadgeVariant,
} from './variants'

export interface StatusBadgeProps extends BaseProps {
  /** Raw status from your data, e.g. `'in_progress'`, `'Failed'`. Case-insensitive; null/empty = Unknown. */
  status?: string | null
  /** Per-instance overrides of the built-in status -> tone map. */
  tones?: Record<string, StatusBadgeTone>
  /** Text to show. Defaults to the humanised status (`in_progress` -> `In progress`). */
  label?: string
  /** Look: `soft` (default), `outline`, `solid` or `plain` (text and dot only). */
  variant?: StatusBadgeVariant
  /** Text, padding and dot size: `sm`, `md` or `lg`. */
  size?: StatusBadgeSize
  /** Corner radius: `rounded` (default), `pill` or `square`. */
  shape?: StatusBadgeShape
  /** Show the leading dot. */
  dot?: boolean
  /** Pulse the dot (live / in-progress states). */
  pulse?: boolean
}

const props = withDefaults(defineProps<StatusBadgeProps>(), {
  status: undefined,
  tones: undefined,
  label: undefined,
  variant: 'soft',
  size: 'md',
  shape: 'rounded',
  dot: true,
})

defineSlots<{
  /** Replaces the label text. */
  default?: (props: { label: string; tone: StatusBadgeTone }) => unknown
}>()

const tone = computed(() => statusTone(props.status, props.tones))
const text = computed(() => props.label || humanizeStatus(props.status))
const variant = computed<StatusBadgeVariant>(() => (STATUS_BADGE_VARIANTS.includes(props.variant) ? props.variant : 'soft'))
const size = computed<StatusBadgeSize>(() => (STATUS_BADGE_SIZES.includes(props.size) ? props.size : 'md'))
const shape = computed<StatusBadgeShape>(() => (STATUS_BADGE_SHAPES.includes(props.shape) ? props.shape : 'rounded'))
const look = computed(() => statusBadgeLook(variant.value, tone.value))
const classes = computed(() => cn(statusBadgeVariants({ variant: variant.value }), props.class))
</script>

<template>
  <Badge
    data-slot="status-badge"
    :variant="look.variant"
    :tone="look.tone"
    :size="size"
    :rounded="statusBadgeRounded[shape]"
    :data-tone="tone"
    :class="classes"
  >
    <StatusDot v-if="dot" :tone="tone" :size="statusBadgeDotSize[size]" :pulse="pulse" class="bg-current" />
    <slot :label="text" :tone="tone">{{ text }}</slot>
  </Badge>
</template>
