import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Pagination text. `size` scales the "Page X of Y" summary and the gap placeholder for hidden pages; the buttons take
 * their size from `Button`. Size classes conflict with the base on purpose: pass the result through `cn()`.
 */
export const paginationSummaryVariants = cva('px-2 text-sm text-muted-foreground tabular-nums', {
  variants: { size: { sm: 'text-xs', md: '', lg: 'text-base' } },
  defaultVariants: { size: 'md' },
})

export const paginationEllipsisVariants = cva('inline-flex size-8 items-center justify-center text-muted-foreground', {
  variants: { size: { sm: 'size-6 text-xs', md: '', lg: 'size-11 text-base' } },
  defaultVariants: { size: 'md' },
})

export type PaginationSummaryVariants = VariantProps<typeof paginationSummaryVariants>
export type PaginationSize = NonNullable<PaginationSummaryVariants['size']>
/** `numbered` page buttons, `simple` previous and next with text, `compact` summary between arrows. */
export type PaginationVariant = 'numbered' | 'simple' | 'compact'
/** Button corners: `rounded` (default), `pill` or `square`. */
export type PaginationShape = 'rounded' | 'pill' | 'square'

export const PAGINATION_VARIANTS: readonly PaginationVariant[] = ['numbered', 'simple', 'compact']
export const PAGINATION_SIZES: readonly PaginationSize[] = ['sm', 'md', 'lg']
export const PAGINATION_SHAPES: readonly PaginationShape[] = ['rounded', 'pill', 'square']
