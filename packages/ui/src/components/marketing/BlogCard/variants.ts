import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Root surface. The three dimensions are independent:
 *  - `variant`: layout (direction of the image and the text)
 *  - `shape`: corner radius (`rounded` is the original `rounded-lg`)
 *  - `appearance`: `card` (bordered, the original look), `plain` (no fill, no visible border) or `filled` (muted fill)
 * Plain and filled keep a transparent 1px border so the box does not shift between appearances and so a border shows up in
 * forced-colors mode. Text on `filled` uses the secondary token pair (secondary and muted are the same colour in every theme).
 */
export const blogCardVariants = cva(
  'group relative flex overflow-hidden has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/40 forced-colors:has-[a:focus-visible]:outline-2 forced-colors:has-[a:focus-visible]:outline-offset-2',
  {
    variants: {
      variant: {
        vertical: 'flex-col',
        horizontal: 'flex-col sm:flex-row',
        featured: 'flex-col lg:flex-row',
      },
      shape: {
        rounded: 'rounded-lg',
        square: 'rounded-none',
      },
      appearance: {
        card: 'border bg-card text-card-foreground',
        plain: 'border border-transparent bg-transparent text-foreground',
        filled: 'border border-transparent bg-secondary text-secondary-foreground',
      },
    },
    defaultVariants: { variant: 'vertical', shape: 'rounded', appearance: 'card' },
  },
)

export const blogCardImageVariants = cva('relative aspect-video shrink-0 overflow-hidden bg-muted', {
  variants: {
    variant: {
      vertical: 'w-full',
      horizontal: 'w-full sm:aspect-auto sm:w-64 md:w-72',
      featured: 'w-full lg:aspect-auto lg:w-3/5',
    },
  },
  defaultVariants: { variant: 'vertical' },
})

/** Padding follows `size` (sm, md = the original, lg); the featured layout pads more and centres its text from `lg`. */
export const blogCardBodyVariants = cva('flex min-w-0 flex-1 flex-col', {
  variants: {
    size: { sm: 'gap-2', md: 'gap-3', lg: 'gap-4' },
    variant: { vertical: '', horizontal: '', featured: '' },
  },
  compoundVariants: [
    { variant: ['vertical', 'horizontal'], size: 'sm', class: 'p-4' },
    { variant: ['vertical', 'horizontal'], size: 'md', class: 'p-5' },
    { variant: ['vertical', 'horizontal'], size: 'lg', class: 'p-6' },
    { variant: 'featured', size: 'sm', class: 'p-4 lg:justify-center lg:p-8' },
    { variant: 'featured', size: 'md', class: 'p-6 lg:justify-center lg:p-10' },
    { variant: 'featured', size: 'lg', class: 'p-8 lg:justify-center lg:p-12' },
  ],
  defaultVariants: { size: 'md', variant: 'vertical' },
})

export const blogCardTitleVariants = cva('text-balance font-semibold tracking-tight [overflow-wrap:anywhere]', {
  variants: {
    variant: { vertical: '', horizontal: '', featured: '' },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: ['vertical', 'horizontal'], size: 'sm', class: 'text-base' },
    { variant: ['vertical', 'horizontal'], size: 'md', class: 'text-lg' },
    { variant: ['vertical', 'horizontal'], size: 'lg', class: 'text-xl' },
    { variant: 'featured', size: 'sm', class: 'text-xl lg:text-2xl' },
    { variant: 'featured', size: 'md', class: 'text-2xl lg:text-3xl' },
    { variant: 'featured', size: 'lg', class: 'text-3xl lg:text-4xl' },
  ],
  defaultVariants: { variant: 'vertical', size: 'md' },
})

/** Excerpt text: 14px, 16px at `lg`. On the filled appearance it uses `secondary-foreground` (muted-foreground is only checked on muted, background and card). */
export const blogCardExcerptVariants = cva('text-pretty [overflow-wrap:anywhere]', {
  variants: {
    size: { sm: 'text-sm', md: 'text-sm', lg: 'text-base' },
    appearance: { card: 'text-muted-foreground', plain: 'text-muted-foreground', filled: 'text-secondary-foreground' },
  },
  defaultVariants: { size: 'md', appearance: 'card' },
})

/** Author, date and read time line. */
export const blogCardMetaVariants = cva('mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1', {
  variants: {
    size: { sm: 'text-xs', md: 'text-xs', lg: 'text-sm' },
    appearance: { card: 'text-muted-foreground', plain: 'text-muted-foreground', filled: 'text-secondary-foreground' },
  },
  defaultVariants: { size: 'md', appearance: 'card' },
})

export type BlogCardVariants = VariantProps<typeof blogCardVariants>
export type BlogCardVariant = NonNullable<BlogCardVariants['variant']>
export type BlogCardShape = NonNullable<BlogCardVariants['shape']>
export type BlogCardAppearance = NonNullable<BlogCardVariants['appearance']>
export type BlogCardSize = NonNullable<VariantProps<typeof blogCardBodyVariants>['size']>

export const BLOG_VARIANTS: readonly BlogCardVariant[] = ['vertical', 'horizontal', 'featured']
export const BLOG_SIZES: readonly BlogCardSize[] = ['sm', 'md', 'lg']
export const BLOG_SHAPES: readonly BlogCardShape[] = ['rounded', 'square']
export const BLOG_APPEARANCES: readonly BlogCardAppearance[] = ['card', 'plain', 'filled']
