import { cva, type VariantProps } from '../../../lib/cva'

export const LOGO_CLOUD_LAYOUTS = ['grid', 'inline', 'marquee', 'with-title', 'split', 'centered', 'card'] as const
export type LogoCloudLayout = (typeof LOGO_CLOUD_LAYOUTS)[number]
export const LOGO_CLOUD_SIZES = ['sm', 'md', 'lg'] as const
export type LogoCloudSize = (typeof LOGO_CLOUD_SIZES)[number]
export const LOGO_CLOUD_TONES = ['grayscale', 'color', 'muted'] as const
export type LogoCloudTone = (typeof LOGO_CLOUD_TONES)[number]
export const LOGO_CLOUD_SHAPES = ['plain', 'rounded', 'square', 'pill'] as const
export type LogoCloudShape = (typeof LOGO_CLOUD_SHAPES)[number]
export const LOGO_CLOUD_GAPS = ['sm', 'md', 'lg'] as const
export type LogoCloudGap = (typeof LOGO_CLOUD_GAPS)[number]

export function resolveLogoCloudLayout(value: unknown): LogoCloudLayout {
  return (LOGO_CLOUD_LAYOUTS as readonly unknown[]).includes(value) ? (value as LogoCloudLayout) : 'grid'
}
export function resolveLogoCloudSize(value: unknown): LogoCloudSize {
  return (LOGO_CLOUD_SIZES as readonly unknown[]).includes(value) ? (value as LogoCloudSize) : 'md'
}
export function resolveLogoCloudShape(value: unknown): LogoCloudShape {
  return (LOGO_CLOUD_SHAPES as readonly unknown[]).includes(value) ? (value as LogoCloudShape) : 'plain'
}
export function resolveLogoCloudGap(value: unknown): LogoCloudGap {
  return (LOGO_CLOUD_GAPS as readonly unknown[]).includes(value) ? (value as LogoCloudGap) : 'md'
}

export const logoCloudVariants = cva('flex flex-col gap-6', {
  variants: {
    layout: {
      grid: '',
      inline: '',
      marquee: '',
      'with-title': 'gap-8 lg:flex-row lg:items-center',
      split: 'gap-8 lg:flex-row lg:items-start',
      centered: 'items-center gap-8',
      card: 'gap-6 rounded-lg border bg-card p-6 text-card-foreground sm:p-8',
    },
  },
  defaultVariants: { layout: 'grid' },
})

export const logoCloudTitleVariants = cva('text-sm font-medium text-muted-foreground', {
  variants: {
    layout: {
      grid: 'text-center',
      inline: 'text-center',
      marquee: 'text-center',
      'with-title': 'text-start text-base font-semibold text-foreground lg:max-w-56 lg:shrink-0',
      split: 'text-balance text-start text-xl font-semibold text-foreground lg:w-1/3 lg:shrink-0',
      centered: 'max-w-xl text-balance text-center text-lg font-semibold text-foreground',
      card: 'text-start',
    },
  },
  defaultVariants: { layout: 'grid' },
})

/**
 * The list of logos. `gap` is the spacing between logos (md keeps the original spacing). Grid-like layouts
 * (`grid`, `with-title`, `card`) use `columns`; row layouts (`inline`, `split`, `centered`) wrap.
 */
export const logoCloudListVariants = cva('', {
  variants: {
    layout: {
      grid: 'grid grid-cols-2 items-center sm:grid-cols-3',
      'with-title': 'grid flex-1 grid-cols-2 items-center sm:grid-cols-3',
      card: 'grid grid-cols-2 items-center sm:grid-cols-3',
      inline: 'flex flex-wrap items-center justify-center',
      split: 'flex flex-1 flex-wrap items-center justify-start',
      centered: 'flex flex-wrap items-center justify-center',
      marquee: '',
    },
    gap: { sm: '', md: '', lg: '' },
    columns: { 3: '', 4: '', 5: '', 6: '' },
  },
  compoundVariants: [
    { layout: ['grid', 'with-title', 'card'], gap: 'sm', class: 'gap-x-4 gap-y-4' },
    { layout: ['grid', 'with-title', 'card'], gap: 'md', class: 'gap-x-8 gap-y-6' },
    { layout: ['grid', 'with-title', 'card'], gap: 'lg', class: 'gap-x-12 gap-y-8' },
    { layout: ['inline', 'split', 'centered'], gap: 'sm', class: 'gap-x-6 gap-y-4' },
    { layout: ['inline', 'split', 'centered'], gap: 'md', class: 'gap-x-10 gap-y-6' },
    { layout: ['inline', 'split', 'centered'], gap: 'lg', class: 'gap-x-16 gap-y-8' },
    { layout: ['grid', 'with-title', 'card'], columns: 3, class: 'md:grid-cols-3' },
    { layout: ['grid', 'with-title', 'card'], columns: 4, class: 'md:grid-cols-4' },
    { layout: ['grid', 'with-title', 'card'], columns: 5, class: 'md:grid-cols-5' },
    { layout: ['grid', 'with-title', 'card'], columns: 6, class: 'md:grid-cols-6' },
  ],
  defaultVariants: { layout: 'grid', gap: 'md', columns: 5 },
})

export const logoCloudLogoVariants = cva('flex items-center justify-center text-center font-semibold text-muted-foreground', {
  variants: {
    size: { sm: 'h-8 text-sm', md: 'h-12 text-base', lg: 'h-16 text-lg' },
    // `plain` is the original borderless logo. The other shapes draw a bordered tile on the card surface.
    shape: {
      plain: 'rounded-sm',
      rounded: 'rounded-md border bg-card px-4 py-1',
      square: 'rounded-none border bg-card px-4 py-1',
      pill: 'rounded-full border bg-card px-5 py-1',
    },
    // Dim the picture only, never the text fallback: opacity on text breaks the 4.5:1 contrast requirement.
    tone: {
      grayscale:
        '[&>img]:opacity-70 [&>img]:grayscale [&>img]:transition-[filter,opacity] motion-reduce:[&>img]:transition-none hover:[&>img]:opacity-100 hover:[&>img]:grayscale-0 focus-visible:[&>img]:opacity-100 focus-visible:[&>img]:grayscale-0',
      color: '',
      // Always quiet: no hover or focus reveal, so a row of unlinked logos never looks interactive.
      muted: '[&>img]:opacity-60 [&>img]:grayscale',
    },
  },
  defaultVariants: { size: 'md', shape: 'plain', tone: 'grayscale' },
})

export type LogoCloudVariants = VariantProps<typeof logoCloudVariants>
export type LogoCloudColumns = 3 | 4 | 5 | 6
