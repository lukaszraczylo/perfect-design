import { cva, type VariantProps } from '../../../lib/cva'

export const IMAGE_GRID_VARIANTS = ['grid', 'masonry', 'featured'] as const
export const IMAGE_GRID_GAPS = ['none', 'sm', 'md', 'lg'] as const
export const IMAGE_GRID_ASPECTS = ['square', 'video', 'portrait', 'landscape', 'auto'] as const
export const IMAGE_GRID_SHAPES = ['rounded', 'square'] as const

/**
 * Root layout. `grid` is the original uniform grid, `masonry` uses CSS columns (natural image heights),
 * `featured` is a grid whose first tile spans 2x2.
 */
export const imageGridVariants = cva('', {
  variants: {
    variant: {
      grid: 'grid grid-cols-2',
      masonry: 'columns-2',
      featured: 'grid grid-flow-dense grid-cols-2',
    },
    columns: { 2: '', 3: '', 4: '' },
    gap: {
      none: 'gap-0',
      sm: 'gap-1.5',
      md: 'gap-3',
      lg: 'gap-6',
    },
  },
  compoundVariants: [
    { variant: ['grid', 'featured'], columns: 2, class: 'sm:grid-cols-2' },
    { variant: ['grid', 'featured'], columns: 3, class: 'sm:grid-cols-3' },
    { variant: ['grid', 'featured'], columns: 4, class: 'sm:grid-cols-2 lg:grid-cols-4' },
    { variant: 'masonry', columns: 2, class: 'sm:columns-2' },
    { variant: 'masonry', columns: 3, class: 'sm:columns-3' },
    { variant: 'masonry', columns: 4, class: 'sm:columns-2 lg:columns-4' },
  ],
  defaultVariants: { variant: 'grid', columns: 3, gap: 'md' },
})

/** Wrapper of each tile. Masonry needs a bottom margin (row gap does not exist in CSS columns) and must not split. */
export const imageGridItemVariants = cva('min-w-0', {
  variants: {
    variant: { grid: '', masonry: 'break-inside-avoid', featured: '' },
    gap: { none: '', sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: 'masonry', gap: 'none', class: 'mb-0' },
    { variant: 'masonry', gap: 'sm', class: 'mb-1.5' },
    { variant: 'masonry', gap: 'md', class: 'mb-3' },
    { variant: 'masonry', gap: 'lg', class: 'mb-6' },
  ],
  defaultVariants: { variant: 'grid', gap: 'md' },
})

/** Thumbnail frame; `auto` lets the image decide the height. `shape` sets the corners (`rounded-lg` or none). */
export const imageGridTileVariants = cva('relative block min-h-11 w-full overflow-hidden border bg-muted', {
  variants: {
    aspect: {
      square: 'aspect-square',
      video: 'aspect-video',
      portrait: 'aspect-3/4',
      landscape: 'aspect-4/3',
      auto: '',
    },
    shape: {
      rounded: 'rounded-lg',
      square: 'rounded-none',
    },
  },
  defaultVariants: { aspect: 'square', shape: 'rounded' },
})

/**
 * The featured hero tile fills a 2x2 area whose height comes from the smaller tiles beside it. Below `sm` the grid has two
 * columns, so the hero spans the whole row and nothing sizes it: it would collapse to the row gap. Below `sm` it keeps the
 * grid's aspect ratio instead (`auto` falls back to square). Written out in full so Tailwind finds each class.
 */
export const imageGridHeroMobileAspect: Record<ImageGridAspect, string> = {
  square: 'max-sm:aspect-square',
  video: 'max-sm:aspect-video',
  portrait: 'max-sm:aspect-3/4',
  landscape: 'max-sm:aspect-4/3',
  auto: 'max-sm:aspect-square',
}

export type ImageGridVariants = VariantProps<typeof imageGridVariants>
export type ImageGridColumns = NonNullable<ImageGridVariants['columns']>
export type ImageGridVariant = (typeof IMAGE_GRID_VARIANTS)[number]
export type ImageGridGap = (typeof IMAGE_GRID_GAPS)[number]
export type ImageGridAspect = (typeof IMAGE_GRID_ASPECTS)[number]
export type ImageGridShape = (typeof IMAGE_GRID_SHAPES)[number]
