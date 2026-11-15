import { cn } from '../../../lib/cn'
import { cva } from '../../../lib/cva'

export const ASYNC_BOUNDARY_STATES = ['idle', 'loading', 'error', 'empty', 'success'] as const
export const ASYNC_BOUNDARY_VARIANTS = ['default', 'card', 'compact'] as const
export const ASYNC_BOUNDARY_SIZES = ['sm', 'md', 'lg'] as const

export type AsyncBoundaryState = (typeof ASYNC_BOUNDARY_STATES)[number]
export type AsyncBoundaryVariant = (typeof ASYNC_BOUNDARY_VARIANTS)[number]
export type AsyncBoundarySize = (typeof ASYNC_BOUNDARY_SIZES)[number]

const root = cva('relative min-w-0', {
  variants: {
    /** `default` adds no surface. `card` is a bordered surface. `compact` only changes the states it renders (single-row error, dense empty state, inline loader). */
    variant: { default: '', card: 'rounded-lg border bg-card text-card-foreground', compact: '' },
    /** Forwarded to the built-in LoadingState, ErrorState and EmptyState; adds no classes of its own. */
    size: { sm: '', md: '', lg: '' },
  },
  defaultVariants: { variant: 'default', size: 'md' },
})

/** AsyncBoundary root classes. Safe to use standalone on a plain element. */
export const asyncBoundaryVariants = (props?: Parameters<typeof root>[0]): string => cn(root(props))

const content = cva('min-w-0', {
  variants: { variant: { default: '', card: 'p-4', compact: '' } },
  defaultVariants: { variant: 'default' },
})
/** Wrapper around the default slot. */
export const asyncBoundaryContentVariants = (props?: Parameters<typeof content>[0]): string => cn(content(props))

export type AsyncBoundaryVariants = NonNullable<Parameters<typeof asyncBoundaryVariants>[0]>
