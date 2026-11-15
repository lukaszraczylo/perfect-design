import { cva, type VariantProps } from '../../../lib/cva'

export const ACTIVITY_FEED_VARIANTS = ['list', 'timeline', 'compact', 'grouped'] as const
export type ActivityFeedVariant = (typeof ACTIVITY_FEED_VARIANTS)[number]
export const ACTIVITY_FEED_SIZES = ['sm', 'md', 'lg'] as const
export type ActivityFeedSize = (typeof ACTIVITY_FEED_SIZES)[number]
export const ACTIVITY_FEED_DENSITIES = ['comfortable', 'compact'] as const
export type ActivityFeedDensity = (typeof ACTIVITY_FEED_DENSITIES)[number]
export const ACTIVITY_FEED_TONES = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const
export type ActivityFeedTone = (typeof ACTIVITY_FEED_TONES)[number]

/** Root. `size` sets the text size; `grouped` separates the day groups with a gap that follows `density`. */
export const activityFeedVariants = cva('flex min-w-0 max-w-full flex-col text-foreground', {
  variants: {
    variant: { list: '', timeline: '', compact: '', grouped: '' },
    size: { sm: 'text-xs', md: 'text-sm', lg: 'text-base' },
    density: { comfortable: '', compact: '' },
  },
  compoundVariants: [
    { variant: 'grouped', density: 'comfortable', class: 'gap-6' },
    { variant: 'grouped', density: 'compact', class: 'gap-3' },
  ],
  defaultVariants: { variant: 'list', size: 'md', density: 'comfortable' },
})

/**
 * One event row. `list` and `grouped` rule each row off, `timeline` draws a connector between markers (padding instead of
 * a rule), `compact` is a single tight line with no avatar.
 */
export const activityFeedItemVariants = cva('group/item relative flex min-w-0', {
  variants: {
    variant: {
      list: 'gap-3 border-b last:border-b-0',
      grouped: 'gap-3 border-b last:border-b-0',
      timeline: 'gap-3',
      compact: 'gap-2 border-b last:border-b-0',
    },
    density: { comfortable: '', compact: '' },
  },
  compoundVariants: [
    { variant: ['list', 'grouped'], density: 'comfortable', class: 'py-3' },
    { variant: ['list', 'grouped'], density: 'compact', class: 'py-1.5' },
    { variant: 'timeline', density: 'comfortable', class: 'pb-5 last:pb-0' },
    { variant: 'timeline', density: 'compact', class: 'pb-2.5 last:pb-0' },
    { variant: 'compact', density: 'comfortable', class: 'py-1.5' },
    { variant: 'compact', density: 'compact', class: 'py-1' },
  ],
  defaultVariants: { variant: 'list', density: 'comfortable' },
})

/** Round marker (icon or dot). Tinted tones as in Timeline; the tone is also written as text and shown as an icon. */
export const activityFeedMarkerVariants = cva('flex shrink-0 items-center justify-center rounded-full border', {
  variants: {
    tone: {
      neutral: 'border-border bg-muted text-muted-foreground',
      primary: 'border-primary/40 bg-primary/15 text-primary',
      success: 'border-success/40 bg-success/15 text-success',
      warning: 'border-warning/50 bg-warning/20 text-warning-foreground dark:text-warning',
      danger: 'border-destructive/40 bg-destructive/15 text-destructive',
      info: 'border-info/40 bg-info/15 text-info',
    },
    size: {
      sm: 'size-5 [&_svg]:size-2.5',
      md: 'size-6 [&_svg]:size-3',
      lg: 'size-8 [&_svg]:size-4',
    },
  },
  defaultVariants: { tone: 'neutral', size: 'md' },
})

/** Icon drawn next to the text when an avatar leads the row. */
export const activityFeedToneIconVariants = cva('inline-block shrink-0 align-text-bottom', {
  variants: {
    tone: {
      neutral: 'text-muted-foreground',
      primary: 'text-primary',
      success: 'text-success',
      warning: 'text-warning-foreground dark:text-warning',
      danger: 'text-destructive',
      info: 'text-info',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

export type ActivityFeedVariants = VariantProps<typeof activityFeedVariants>
