import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Footer (loading, end of list, error) look.
 * - `variant`: `default` (py-4, error stacked: message above the retry button) or `compact` (py-2, error on one wrapping row).
 * - `size`: `sm` (text-xs), `md` (default, text-sm) or `lg` (text-base). Also sizes the spinner.
 */
export const infiniteScrollFooterVariants = cva('', {
  variants: {
    variant: {
      default: 'py-4',
      compact: 'py-2',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
})

/** Layout of the error footer: stacked column (default) or one wrapping row (compact). */
export const infiniteScrollErrorVariants = cva('flex items-center text-center text-destructive', {
  variants: {
    variant: {
      default: 'flex-col gap-2',
      compact: 'flex-row flex-wrap justify-center gap-x-3 gap-y-1',
    },
  },
  defaultVariants: { variant: 'default' },
})

/** Loading spinner (decorative, `aria-hidden`). */
export const infiniteScrollSpinnerVariants = cva('animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none', {
  variants: {
    size: {
      sm: 'size-3',
      md: 'size-4',
      lg: 'size-5',
    },
  },
  defaultVariants: { size: 'md' },
})

export type InfiniteScrollVariants = VariantProps<typeof infiniteScrollFooterVariants>
export type InfiniteScrollVariant = NonNullable<InfiniteScrollVariants['variant']>
export type InfiniteScrollSize = NonNullable<InfiniteScrollVariants['size']>
export const infiniteScrollVariantNames: readonly InfiniteScrollVariant[] = ['default', 'compact']
export const infiniteScrollSizes: readonly InfiniteScrollSize[] = ['sm', 'md', 'lg']
