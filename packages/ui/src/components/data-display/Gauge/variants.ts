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

const DIAL_BASE_PX: Record<GaugeSize, number> = { sm: 12, md: 20, lg: 30 }
const DIAL_WIDTH_PX: Record<GaugeSize, number> = { sm: 96, md: 160, lg: 224 }
/** Share of the dial width the value may use on one line: the chord of the inner arc above the caption. */
const DIAL_TEXT_SHARE = 0.5
const GLYPH_EM = 0.58
const DIAL_FONT_CLASS: Record<number, string> = { 8: 'text-[8px]', 9: 'text-[9px]', 10: 'text-[10px]', 11: 'text-[11px]', 12: 'text-xs', 14: 'text-sm', 16: 'text-base', 18: 'text-lg', 20: 'text-xl', 24: 'text-2xl', 30: 'text-3xl' }
const DIAL_FONT_STEPS = Object.keys(DIAL_FONT_CLASS).map(Number)

/** Text size class that keeps a dial value of `length` characters on one line inside the dial, never above the size's own text size. */
export function gaugeDialFontClass(size: GaugeSize, length: number): string {
  const fit = (DIAL_WIDTH_PX[size] * DIAL_TEXT_SHARE) / (Math.max(1, length) * GLYPH_EM)
  const px = Math.min(DIAL_BASE_PX[size], fit)
  const step = DIAL_FONT_STEPS.filter((s) => s <= px).pop() ?? DIAL_FONT_STEPS[0]!
  return DIAL_FONT_CLASS[step]!
}

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
