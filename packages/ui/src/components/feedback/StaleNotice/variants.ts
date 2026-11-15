import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'

/** Looks of the notice. `default` is the original bordered box. */
export const STALE_NOTICE_VARIANTS = ['default', 'inline', 'banner', 'pill'] as const
/**
 * `auto` (default) picks the tone from the data age: `warning` once stale, `neutral` while fresh. Any other value forces
 * that tone in both states (the stale text still appears when the data is stale).
 */
export const STALE_NOTICE_TONES = ['auto', 'neutral', 'info', 'success', 'warning', 'danger'] as const

export type StaleNoticeVariant = (typeof STALE_NOTICE_VARIANTS)[number]
export type StaleNoticeTone = (typeof STALE_NOTICE_TONES)[number]
export type StaleNoticeResolvedTone = Exclude<StaleNoticeTone, 'auto'>

/**
 * Layout per variant plus the surface of the resolved tone (`tone`: neutral | info | success | warning | danger).
 * `inline` has no box, only text colour. `banner` is a full-width strip with top and bottom borders.
 */
const staleNotice = cva('flex flex-wrap items-center gap-x-2 gap-y-1', {
  variants: {
    variant: {
      default: 'rounded-md border px-3 py-2 text-sm',
      inline: 'text-sm',
      banner: 'w-full border-y px-4 py-2 text-sm',
      pill: 'w-fit max-w-full rounded-full border px-3 py-1 text-xs',
    },
    tone: {
      neutral: 'bg-muted/40 text-muted-foreground',
      info: 'border-info/50 bg-info/15 text-foreground',
      success: 'border-success/50 bg-success/15 text-foreground',
      warning: 'border-warning/50 bg-warning/15 text-foreground',
      danger: 'border-destructive/50 bg-destructive/10 text-foreground',
    },
  },
  compoundVariants: [
    { variant: 'inline', tone: 'neutral', class: 'bg-transparent text-muted-foreground' },
    { variant: 'inline', tone: ['info', 'success', 'warning', 'danger'], class: 'border-transparent bg-transparent text-foreground' },
  ],
  defaultVariants: { variant: 'default', tone: 'neutral' },
})
export const staleNoticeVariants = (props?: Parameters<typeof staleNotice>[0]): string => cn(staleNotice(props))

const staleIcon = cva('', {
  variants: {
    tone: {
      neutral: '',
      info: 'text-info',
      success: 'text-success',
      warning: 'text-warning-foreground dark:text-warning',
      danger: 'text-destructive',
    },
  },
  defaultVariants: { tone: 'neutral' },
})
/** Colour of the clock icon. Neutral inherits the text colour. */
export const staleNoticeIconVariants = (props?: Parameters<typeof staleIcon>[0]): string => cn(staleIcon(props))

export type StaleNoticeVariants = VariantProps<typeof staleNoticeVariants>
