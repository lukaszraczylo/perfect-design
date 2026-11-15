import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'

export const OFFLINE_INDICATOR_VARIANTS = ['default', 'banner', 'pill', 'inline'] as const

/**
 * Offline message styling. `default` is the original bordered, tinted box. `banner` is a full-width filled strip for the top
 * of a layout, `pill` a small rounded chip for toolbars and headers, `inline` plain text with an icon.
 * Only used while offline: the online state renders no box (`display: contents`).
 */
const offlineIndicator = cva('', {
  variants: {
    variant: {
      default: 'flex items-center gap-2 rounded-md border border-warning/50 bg-warning/15 px-3 py-2 text-sm text-foreground',
      banner: 'flex w-full items-center justify-center gap-2 border-y border-warning bg-warning px-4 py-2 text-center text-sm text-warning-foreground',
      pill: 'inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-warning/50 bg-warning/15 px-3 py-1 text-xs text-foreground',
      inline: 'inline-flex max-w-full items-center gap-1.5 text-sm text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
})
export const offlineIndicatorVariants = (props?: Parameters<typeof offlineIndicator>[0]): string => cn(offlineIndicator(props))

const offlineIcon = cva('shrink-0', {
  variants: {
    variant: {
      default: 'text-warning-foreground dark:text-warning',
      banner: 'text-current',
      pill: 'text-warning-foreground dark:text-warning',
      inline: 'text-warning-foreground dark:text-warning',
    },
  },
  defaultVariants: { variant: 'default' },
})
/** Colour of the leading icon. */
export const offlineIndicatorIconVariants = (props?: Parameters<typeof offlineIcon>[0]): string => cn(offlineIcon(props))

export type OfflineIndicatorVariants = VariantProps<typeof offlineIndicatorVariants>
export type OfflineIndicatorVariant = (typeof OFFLINE_INDICATOR_VARIANTS)[number]
