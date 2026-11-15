<script setup lang="ts">
import { computed, inject, useSlots } from 'vue'
import { violation } from '../../../lib/contract'
import type { IconDefinition } from '../../../lib/icons-tools'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { hasText, useMountedCheck } from '../_shared/contract'
import Icon from '../../primitives/Icon/Icon.vue'
import { TIMELINE_KEY, timelineConnectorVariants, timelineItemVariants, timelineMarkerVariants, type TimelineStatus } from './variants'

export interface TimelineItemProps extends BaseProps {
  /** Tone of the marker. */
  status?: TimelineStatus
  title?: string
  /** Human-readable time, e.g. "2 hours ago". */
  time?: string
  /** Machine-readable value for `<time datetime>`. */
  datetime?: string
  icon?: IconDefinition
}

const props = withDefaults(defineProps<TimelineItemProps>(), { status: 'neutral' })
const slots = useSlots()
useMountedCheck(() => {
  if (!hasText(props.title) && !hasText(props.time) && !slots.title && !slots.time) {
    violation('TimelineItem', 'requires-title-or-time', 'requires a `title` or a `time` (or the `title` / `time` slot): an item with neither says nothing about the event.')
  }
})
const ctx = inject(TIMELINE_KEY, undefined)
const layout = computed(() => ctx?.layout.value ?? 'vertical')
const size = computed(() => ctx?.size.value ?? 'default')
const classes = computed(() => cn(timelineItemVariants({ layout: layout.value, size: size.value }), props.class))
const connectorClasses = computed(() => timelineConnectorVariants({ layout: layout.value, size: size.value }))
const variant = computed(() => ctx?.variant?.value ?? 'default')
const markerClasses = computed(() => timelineMarkerVariants({ status: props.status, layout: layout.value, size: size.value, variant: variant.value }))
const compact = computed(() => size.value === 'compact')
const large = computed(() => size.value === 'large')
/** The marker tone is colour only, so non-neutral statuses are also spoken. */
const STATUS_TEXT: Record<TimelineStatus, string> = { neutral: '', primary: '', success: 'Success', warning: 'Warning', danger: 'Error', info: 'Info' }
const statusText = computed(() => STATUS_TEXT[props.status] ?? '')
</script>

<template>
  <li data-slot="timeline-item" :data-status="status" :class="classes">
    <span data-slot="timeline-connector" aria-hidden="true" :class="connectorClasses" />
    <span data-slot="timeline-marker" aria-hidden="true" :class="markerClasses">
      <slot name="icon"><Icon v-if="icon" :icon="icon" size="xs" /><span v-else :class="compact ? 'size-1.5 rounded-full bg-current' : large ? 'size-2.5 rounded-full bg-current' : 'size-2 rounded-full bg-current'" /></slot>
    </span>
    <div class="flex flex-wrap items-baseline justify-between gap-x-3">
      <span v-if="statusText" data-slot="timeline-status" class="sr-only">{{ statusText }}.</span>
      <div v-if="title || $slots.title" data-slot="timeline-title" :class="large ? 'text-base font-medium text-foreground' : 'text-sm font-medium text-foreground'"><slot name="title">{{ title }}</slot></div>
      <time v-if="time || $slots.time" data-slot="timeline-time" :datetime="datetime" :class="large ? 'text-sm text-muted-foreground tabular-nums' : 'text-xs text-muted-foreground tabular-nums'"><slot name="time">{{ time }}</slot></time>
    </div>
    <div v-if="$slots.default" data-slot="timeline-content" :class="compact ? 'mt-0.5 text-xs text-muted-foreground' : large ? 'mt-1.5 text-base text-muted-foreground' : 'mt-1 text-sm text-muted-foreground'"><slot /></div>
  </li>
</template>
