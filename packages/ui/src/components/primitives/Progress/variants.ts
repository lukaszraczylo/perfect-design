import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Track (the groove). `flex-auto`, not `flex-1`: with `value-position="top"` the root is a flex column and
 * `flex-1`'s basis of 0% overrides the height class on the main axis, collapsing the bar to zero height.
 */
export const progressVariants = cva('relative w-full flex-auto overflow-hidden rounded-full bg-muted forced-colors:border', {
  variants: {
    size: {
      xs: 'h-0.5',
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
      xl: 'h-5',
    },
  },
  defaultVariants: { size: 'md' },
})

/** Filled bar. `striped` is accepted for compatibility and draws nothing (gradients are not used); `animated` pulses the fill (reduced-motion safe). */
export const progressIndicatorVariants = cva('h-full rounded-full forced-colors:border-2', {
  variants: {
    tone: {
      neutral: 'bg-muted-foreground',
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-destructive',
      info: 'bg-info',
    },
    striped: {
      true: '',
      false: '',
    },
    animated: {
      true: 'animate-pulse motion-reduce:animate-none',
      false: '',
    },
  },
  defaultVariants: { tone: 'primary', striped: false, animated: false },
})

/** Text colour of the percentage rendered inside the filled bar (matches the tone background). */
export const progressInsideValueVariants = cva(
  'flex items-center justify-end whitespace-nowrap px-1.5 text-2xs font-medium leading-none tabular-nums',
  {
    variants: {
      tone: {
        neutral: 'text-background',
        primary: 'text-primary-foreground',
        success: 'text-success-foreground',
        warning: 'text-warning-foreground',
        danger: 'text-destructive-foreground',
        info: 'text-info-foreground',
      },
    },
    defaultVariants: { tone: 'primary' },
  },
)

/** One cell of a segmented bar (the groove of that segment). */
export const progressSegmentVariants = cva('h-full flex-1 overflow-hidden rounded-full bg-muted')

export type ProgressVariants = VariantProps<typeof progressVariants>
export type ProgressSize = NonNullable<ProgressVariants['size']>
export type ProgressIndicatorVariants = VariantProps<typeof progressIndicatorVariants>
export type ProgressTone = NonNullable<ProgressIndicatorVariants['tone']>
/** Where the percentage goes: `end` = beside the bar, `inside` = inside the filled bar, `top` = header row above the bar. */
export type ProgressValuePosition = 'end' | 'inside' | 'top'
