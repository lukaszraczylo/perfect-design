import { cva, type VariantProps } from '../../../lib/cva'
import { trackSurface } from '../../../lib/styles'

export const UPTIME_STATES = ['up', 'degraded', 'down', 'unknown'] as const
export type UptimeState = (typeof UPTIME_STATES)[number]

export const UPTIME_SIZES = ['sm', 'md', 'lg'] as const
export type UptimeSize = (typeof UPTIME_SIZES)[number]

/** Above this many segments the gap between them is dropped so the row still fits a 320px screen. */
export const UPTIME_DENSE_AT = 100

/** English state names; `stateLabels` overrides them per state. */
export const UPTIME_STATE_LABELS: Record<UptimeState, string> = { up: 'up', degraded: 'degraded', down: 'down', unknown: 'unknown' }

export const uptimeBarVariants = cva('flex w-full items-stretch overflow-hidden', {
  variants: {
    size: { sm: 'h-4', md: 'h-8', lg: 'h-12' },
    gap: { true: 'gap-px', false: 'gap-0' },
  },
  defaultVariants: { size: 'md', gap: true },
})

export const uptimeSegmentVariants = cva('min-w-px flex-1 rounded-xs', {
  variants: {
    state: {
      up: 'bg-success',
      degraded: 'bg-warning',
      down: 'bg-destructive',
      unknown: trackSurface,
    },
  },
  defaultVariants: { state: 'unknown' },
})

export type UptimeBarVariants = VariantProps<typeof uptimeBarVariants>
export type UptimeSegmentVariants = VariantProps<typeof uptimeSegmentVariants>
