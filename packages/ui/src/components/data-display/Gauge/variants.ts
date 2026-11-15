import { cva, type VariantProps } from '../../../lib/cva'
import type { Tone } from '../../../lib/types'

export const gaugeVariants = cva('relative inline-block text-foreground', {
  variants: {
    size: {
      sm: 'w-24 text-sm',
      md: 'w-40 text-xl',
      lg: 'w-56 text-3xl',
    },
    variant: {
      semicircle: '',
      arc: '',
      linear: '',
    },
  },
  defaultVariants: { size: 'md', variant: 'semicircle' },
})

/** `semicircle` is the half-dial (default), `arc` a three-quarter dial with the value in its centre, `linear` a horizontal bar. */
export type GaugeVariant = 'semicircle' | 'arc' | 'linear'
export const GAUGE_VARIANTS: readonly GaugeVariant[] = ['semicircle', 'arc', 'linear']
export const GAUGE_SIZES: readonly GaugeSize[] = ['sm', 'md', 'lg']

/** The value of a linear gauge sits on a line with its caption, so it is smaller than the dial value of the same size. */
export const gaugeLinearValueSize: Record<GaugeSize, string> = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }

export type GaugeVariants = VariantProps<typeof gaugeVariants>
export type GaugeSize = NonNullable<GaugeVariants['size']>
export type GaugeTone = Tone

/** Arc stroke class per tone (theme tokens only). */
export const gaugeToneStroke: Record<GaugeTone, string> = {
  neutral: 'stroke-muted-foreground',
  primary: 'stroke-primary',
  success: 'stroke-success',
  warning: 'stroke-warning',
  danger: 'stroke-destructive',
  info: 'stroke-info',
}
