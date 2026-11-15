import { cva, type VariantProps } from '../../../lib/cva'

/**
 * RelativeTime styling. The default inherits the surrounding font, size and colour.
 *
 * - `variant`: `plain` (default), `muted` (secondary text colour) or `dotted` (dotted underline that hints at the
 *   absolute date in the tooltip; it is a hint only, the tooltip is not keyboard reachable).
 * - `tone` mirrors `Text`: status colours use `text-success`, `text-warning-foreground` (`dark:text-warning`),
 *   `text-destructive` and `text-info`, all covered by the contrast tests. Add words, not colour alone, to carry meaning.
 */
export const relativeTimeVariants = cva('tabular-nums', {
  variants: {
    variant: {
      plain: '',
      muted: 'text-muted-foreground',
      dotted: 'underline decoration-dotted decoration-1 underline-offset-4',
    },
    size: {
      inherit: '',
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      md: 'text-md',
      lg: 'text-lg',
    },
    tone: {
      default: '',
      primary: 'text-primary',
      success: 'text-success',
      warning: 'text-warning-foreground dark:text-warning',
      danger: 'text-destructive',
      info: 'text-info',
    },
  },
  defaultVariants: { variant: 'plain', size: 'inherit', tone: 'default' },
})

export const relativeTimeVariantNames = ['plain', 'muted', 'dotted'] as const
export const relativeTimeSizes = ['inherit', 'xs', 'sm', 'base', 'md', 'lg'] as const
export const relativeTimeTones = ['default', 'primary', 'success', 'warning', 'danger', 'info'] as const

export type RelativeTimeVariants = VariantProps<typeof relativeTimeVariants>
export type RelativeTimeVariant = (typeof relativeTimeVariantNames)[number]
export type RelativeTimeSize = (typeof relativeTimeSizes)[number]
export type RelativeTimeTone = (typeof relativeTimeTones)[number]
