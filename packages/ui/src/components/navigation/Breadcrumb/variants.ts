import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Breadcrumb trail look. `size` sets the text size of the list (`md` is the default, `text-sm`) and the gap between
 * entries. Size classes conflict with the base on purpose: pass the result through `cn()` (the components do).
 */
export const breadcrumbListVariants = cva('flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2', {
  variants: {
    size: {
      sm: 'gap-1 text-xs sm:gap-1.5',
      md: '',
      lg: 'text-base',
    },
  },
  defaultVariants: { size: 'md' },
})

export type BreadcrumbListVariants = VariantProps<typeof breadcrumbListVariants>
export type BreadcrumbSize = NonNullable<BreadcrumbListVariants['size']>
/** Glyph between entries: a chevron (default), a slash or a small dot. */
export type BreadcrumbSeparatorKind = 'chevron' | 'slash' | 'dot'

export const BREADCRUMB_SIZES: readonly BreadcrumbSize[] = ['sm', 'md', 'lg']
export const BREADCRUMB_SEPARATORS: readonly BreadcrumbSeparatorKind[] = ['chevron', 'slash', 'dot']
