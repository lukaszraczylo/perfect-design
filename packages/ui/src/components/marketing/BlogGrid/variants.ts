import { cva, type VariantProps } from '../../../lib/cva'

/** `gap` is the space between cards: `sm` 16px, `md` 24px (the original), `lg` 32px. */
export const blogGridVariants = cva('grid', {
  variants: {
    gap: { sm: 'gap-4', md: 'gap-6', lg: 'gap-8' },
    columns: {
      1: 'grid-cols-1',
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-2 lg:grid-cols-3',
      4: 'sm:grid-cols-2 lg:grid-cols-4',
    },
  },
  defaultVariants: { gap: 'md', columns: 3 },
})

export type BlogGridVariants = VariantProps<typeof blogGridVariants>
export type BlogGridColumns = NonNullable<BlogGridVariants['columns']>
export type BlogGridGap = NonNullable<BlogGridVariants['gap']>
export type BlogGridLayout = 'grid' | 'featured'

export const BLOG_GRID_LAYOUTS: readonly BlogGridLayout[] = ['grid', 'featured']
export const BLOG_GRID_GAPS: readonly BlogGridGap[] = ['sm', 'md', 'lg']
