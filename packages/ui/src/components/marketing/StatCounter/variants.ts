import { cva, type VariantProps } from '../../../lib/cva'

export const STAT_COUNTER_SIZES = ['sm', 'md', 'lg'] as const
export const STAT_COUNTER_TONES = ['default', 'primary', 'muted', 'success', 'info', 'danger'] as const
export const STAT_COUNTER_ALIGNS = ['start', 'center', 'end'] as const

export type StatCounterSize = (typeof STAT_COUNTER_SIZES)[number]
export type StatCounterTone = (typeof STAT_COUNTER_TONES)[number]
export type StatCounterAlign = (typeof STAT_COUNTER_ALIGNS)[number]

/**
 * The number. With no `size` it inherits the surrounding type (so it can sit in a heading or in `StatGrid`); `sm`, `md` and
 * `lg` set 24px, 36px and 60px semibold figures. `tone` colours the figure with a tested text token (`default` keeps the
 * inherited colour). `align` makes the span a block so the text can align; unset leaves it inline. The figure is static:
 * nothing counts up (LLMSlop M3).
 */
export const statCounterVariants = cva('tabular-nums', {
  variants: {
    size: {
      sm: 'text-2xl font-semibold tracking-tight',
      md: 'text-4xl font-semibold tracking-tight',
      lg: 'text-6xl font-semibold tracking-tight',
    },
    tone: {
      default: '',
      primary: 'text-primary',
      muted: 'text-muted-foreground',
      success: 'text-success',
      info: 'text-info',
      danger: 'text-destructive',
    },
    align: {
      start: 'block text-start',
      center: 'block text-center',
      end: 'block text-end',
    },
  },
})

export type StatCounterVariants = VariantProps<typeof statCounterVariants>
