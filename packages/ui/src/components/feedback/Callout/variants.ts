import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'

/** All supported callout kinds, in documentation order. */
export const CALLOUT_TYPES = ['note', 'tip', 'important', 'warning', 'caution', 'danger', 'success', 'quote', 'example'] as const

/** Surface treatment. `soft` is the original tinted look and adds no classes. */
export const CALLOUT_APPEARANCES = ['soft', 'solid', 'outline', 'minimal'] as const
/** Padding, gap and type scale. `md` is the original size and adds no classes. */
export const CALLOUT_SIZES = ['sm', 'md', 'lg'] as const

/** Solid fills use only token pairs the contrast test covers (status colour with its foreground, primary, secondary, foreground on background). */
const solid: Record<(typeof CALLOUT_TYPES)[number], string> = {
  note: 'border-info bg-info text-info-foreground',
  tip: 'border-success bg-success text-success-foreground',
  important: 'border-primary bg-primary text-primary-foreground',
  warning: 'border-warning bg-warning text-warning-foreground',
  caution: 'border-destructive bg-destructive text-destructive-foreground',
  danger: 'border-destructive bg-destructive text-destructive-foreground',
  success: 'border-success bg-success text-success-foreground',
  quote: 'border-transparent bg-foreground text-background',
  example: 'border-secondary bg-secondary text-secondary-foreground',
}
const outline: Record<(typeof CALLOUT_TYPES)[number], string> = {
  note: 'border-info bg-transparent',
  tip: 'border-success bg-transparent',
  important: 'border-chart-4 bg-transparent',
  warning: 'border-warning bg-transparent',
  caution: 'border-destructive bg-transparent',
  danger: 'border-destructive bg-transparent',
  success: 'border-success bg-transparent',
  quote: 'border-border bg-transparent',
  example: 'border-chart-2 bg-transparent',
}

const calloutRoot = cva('relative flex gap-3 rounded-md border px-4 py-3 text-sm', {
  variants: {
    type: {
      note: 'border-info/30 bg-info/10',
      tip: 'border-success/30 bg-success/10',
      important: 'border-chart-4/30 bg-chart-4/10',
      warning: 'border-warning/40 bg-warning/15',
      caution: 'border-destructive/30 bg-destructive/10',
      danger: 'border-destructive/30 bg-destructive/10',
      success: 'border-success/30 bg-success/10',
      quote: 'border-border bg-muted/40 text-foreground',
      example: 'border-chart-2/30 bg-chart-2/10',
    },
    appearance: { soft: '', solid: '', outline: '', minimal: 'border-transparent bg-transparent px-0' },
    size: {
      sm: 'gap-2 px-3 py-2 text-xs',
      md: '',
      lg: 'gap-4 px-5 py-4 text-base',
    },
  },
  compoundVariants: [
    ...CALLOUT_TYPES.map((type) => ({ type, appearance: 'solid' as const, class: solid[type] })),
    ...CALLOUT_TYPES.map((type) => ({ type, appearance: 'outline' as const, class: outline[type] })),
    { appearance: 'minimal', size: 'sm', class: 'px-0' },
    { appearance: 'minimal', size: 'lg', class: 'px-0' },
  ],
  defaultVariants: { type: 'note', appearance: 'soft', size: 'md' },
})

export const calloutVariants = (props?: Parameters<typeof calloutRoot>[0]): string => cn(calloutRoot(props))

const calloutIcon = cva('mt-0.5 shrink-0 [&_svg]:size-4', {
  variants: {
    type: {
      note: 'text-info',
      tip: 'text-success',
      important: 'text-chart-4',
      warning: 'text-warning-foreground dark:text-warning',
      caution: 'text-destructive',
      danger: 'text-destructive',
      success: 'text-success',
      quote: 'text-muted-foreground',
      example: 'text-chart-2',
    },
    appearance: { soft: '', solid: 'text-current dark:text-current', outline: '', minimal: '' },
    size: { sm: '[&_svg]:size-3.5', md: '', lg: '[&_svg]:size-5' },
  },
  defaultVariants: { type: 'note', appearance: 'soft', size: 'md' },
})

export const calloutIconVariants = (props?: Parameters<typeof calloutIcon>[0]): string => cn(calloutIcon(props))

export type CalloutVariants = VariantProps<typeof calloutVariants>
export type CalloutType = NonNullable<CalloutVariants['type']>
export type CalloutAppearance = NonNullable<CalloutVariants['appearance']>
export type CalloutSize = NonNullable<CalloutVariants['size']>
