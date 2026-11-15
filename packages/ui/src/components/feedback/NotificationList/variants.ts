import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'

export const NOTIFICATION_LIST_VARIANTS = ['default', 'compact'] as const
export const NOTIFICATION_LIST_APPEARANCES = ['card', 'flush'] as const
export const NOTIFICATION_LIST_SHAPES = ['circle', 'square'] as const

export const notificationListVariants = cva('flex w-full flex-col overflow-hidden rounded-lg border bg-card text-card-foreground', {
  variants: {
    variant: { default: 'text-sm', compact: 'text-xs' },
    /** `card` is the original bordered, rounded surface. `flush` drops the border, radius and fill so the list sits inside a popover, sheet or card. */
    appearance: { card: '', flush: 'rounded-none border-0 bg-transparent' },
  },
  defaultVariants: { variant: 'default', appearance: 'card' },
})

/** One notification row (the `li`). `read` dims it; unread rows get a subtle tint. */
export const notificationItemVariants = cva('relative flex items-start border-b border-border last:border-b-0', {
  variants: {
    variant: { default: 'gap-3 px-4 py-3', compact: 'gap-2 px-3 py-2' },
    read: { true: 'bg-transparent', false: 'bg-primary/5' },
  },
  defaultVariants: { variant: 'default', read: true },
})

/** Round icon bubble tinted by tone. */
const notificationTone = cva('flex shrink-0 items-center justify-center rounded-full', {
  variants: {
    tone: {
      neutral: 'bg-muted text-muted-foreground',
      info: 'bg-info/15 text-info',
      success: 'bg-success/15 text-success',
      warning: 'bg-warning/20 text-warning-foreground dark:text-warning',
      danger: 'bg-destructive/10 text-destructive',
    },
    variant: { default: 'size-8', compact: 'size-6' },
    /** `circle` is the original bubble; `square` uses the control radius. */
    shape: { circle: '', square: 'rounded-md' },
  },
  defaultVariants: { tone: 'neutral', variant: 'default', shape: 'circle' },
})
export const notificationToneVariants = (props?: Parameters<typeof notificationTone>[0]): string => cn(notificationTone(props))

export type NotificationListVariants = VariantProps<typeof notificationListVariants>
export type NotificationListVariant = NonNullable<NotificationListVariants['variant']>
export type NotificationListAppearance = (typeof NOTIFICATION_LIST_APPEARANCES)[number]
export type NotificationListShape = (typeof NOTIFICATION_LIST_SHAPES)[number]
