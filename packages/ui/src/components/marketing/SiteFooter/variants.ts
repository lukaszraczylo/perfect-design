import { cva, type VariantProps } from '../../../lib/cva'

export const siteFooterVariantNames = ['columns', 'simple', 'centered', 'minimal', 'newsletter', 'mega', 'split'] as const
export type SiteFooterVariant = (typeof siteFooterVariantNames)[number]

export const siteFooterToneNames = ['default', 'dark', 'muted'] as const
export type SiteFooterTone = (typeof siteFooterToneNames)[number]

export const siteFooterSizeNames = ['sm', 'md', 'lg'] as const
export type SiteFooterSize = (typeof siteFooterSizeNames)[number]

export const siteFooterAlignNames = ['start', 'center', 'end'] as const
export type SiteFooterAlign = (typeof siteFooterAlignNames)[number]

export const siteFooterVariants = cva('border-t', {
  variants: {
    tone: {
      default: 'bg-background text-foreground',
      dark: 'border-transparent bg-foreground text-background',
      muted: 'bg-muted text-foreground',
    },
  },
  defaultVariants: { tone: 'default' },
})
export type SiteFooterVariants = VariantProps<typeof siteFooterVariants>

/** Vertical padding by variant and `size` (md is the original padding). Written out in full so Tailwind finds each class. */
export const siteFooterContainerVariants = cva('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', {
  variants: {
    variant: { columns: '', newsletter: '', split: '', mega: '', simple: '', centered: '', minimal: '' },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: ['columns', 'newsletter', 'split'], size: 'sm', class: 'py-8' },
    { variant: ['columns', 'newsletter', 'split'], size: 'md', class: 'py-12' },
    { variant: ['columns', 'newsletter', 'split'], size: 'lg', class: 'py-16' },
    { variant: 'mega', size: 'sm', class: 'py-12' },
    { variant: 'mega', size: 'md', class: 'py-16' },
    { variant: 'mega', size: 'lg', class: 'py-20' },
    { variant: ['simple', 'centered'], size: 'sm', class: 'py-6' },
    { variant: ['simple', 'centered'], size: 'md', class: 'py-10' },
    { variant: ['simple', 'centered'], size: 'lg', class: 'py-14' },
    { variant: 'minimal', size: 'sm', class: 'py-4' },
    { variant: 'minimal', size: 'md', class: 'py-6' },
    { variant: 'minimal', size: 'lg', class: 'py-8' },
  ],
  defaultVariants: { variant: 'columns', size: 'md' },
})

/** Text size of links, titles, descriptions and legal text: `lg` steps up to 16px, `sm` and `md` stay at 14px. */
export const siteFooterTextVariants = cva('', {
  variants: { size: { sm: 'text-sm', md: 'text-sm', lg: 'text-base' } },
  defaultVariants: { size: 'md' },
})

/**
 * Alignment (`align`). Unset keeps each variant's own alignment; setting it overrides the variant's classes, so merge the
 * result with `cn` (the component does) when it is combined with a `siteFooter*Variants` string.
 */
export const siteFooterAlignVariants = cva('', {
  variants: { align: { start: 'text-start', center: 'text-center', end: 'text-end' } },
})
/** Alignment of the brand block (a flex column). */
export const siteFooterBrandAlignVariants = cva('', {
  variants: { align: { start: 'items-start', center: 'items-center', end: 'items-end' } },
})
/** Alignment of the flat link list. */
export const siteFooterListAlignVariants = cva('', {
  variants: { align: { start: 'justify-start', center: 'justify-center', end: 'justify-end' } },
})
/** Alignment of the flex main row (`simple` and `centered`): centred or end-aligned content stacks instead of spreading across the row. */
export const siteFooterMainAlignVariants = cva('', {
  variants: {
    align: {
      start: 'items-start text-start',
      center: 'items-center text-center md:flex-col md:items-center md:justify-center',
      end: 'items-end text-end md:flex-col md:items-end md:justify-center',
    },
  },
})
/** Alignment of the legal row: centred or end-aligned content stacks instead of spreading across the row. */
export const siteFooterLegalAlignVariants = cva('', {
  variants: {
    align: {
      start: 'items-start text-start sm:flex-row sm:items-center',
      center: 'items-center text-center sm:flex-col sm:items-center sm:justify-center',
      end: 'items-end text-end sm:flex-col sm:items-end sm:justify-center',
    },
  },
})

export const siteFooterMainVariants = cva('', {
  variants: {
    variant: {
      columns: 'grid gap-10 lg:grid-cols-4',
      newsletter: 'grid gap-10 lg:grid-cols-4',
      mega: 'grid gap-12 lg:grid-cols-6',
      split: 'grid gap-10 lg:grid-cols-2',
      simple: 'flex flex-col gap-6 md:flex-row md:items-center md:justify-between',
      centered: 'flex flex-col items-center gap-6 text-center',
      minimal: '',
    },
  },
  defaultVariants: { variant: 'columns' },
})

export const siteFooterBrandVariants = cva('flex flex-col gap-4', {
  variants: {
    variant: {
      columns: 'items-start',
      newsletter: 'items-start',
      mega: 'items-start lg:col-span-2',
      split: 'items-start',
      simple: 'items-start',
      centered: 'items-center',
      minimal: 'items-start',
    },
  },
  defaultVariants: { variant: 'columns' },
})

export const siteFooterColumnsVariants = cva('grid grid-cols-2 gap-8', {
  variants: {
    variant: {
      columns: 'sm:grid-cols-3 lg:col-span-3 lg:only:col-span-4 lg:grid-cols-4',
      newsletter: 'sm:grid-cols-3 lg:col-span-2',
      mega: 'sm:grid-cols-4 lg:col-span-4',
      split: 'sm:grid-cols-3',
      simple: 'sm:grid-cols-3 lg:grid-cols-4',
      centered: 'sm:grid-cols-3 lg:grid-cols-4',
      minimal: 'sm:grid-cols-3 lg:grid-cols-4',
    },
  },
  defaultVariants: { variant: 'columns' },
})

export const siteFooterLegalVariants = cva('flex flex-col justify-between gap-4', {
  variants: {
    variant: {
      columns: 'mt-12 items-start border-t pt-6 sm:flex-row sm:items-center',
      newsletter: 'mt-12 items-start border-t pt-6 sm:flex-row sm:items-center',
      mega: 'mt-16 items-start border-t pt-6 sm:flex-row sm:items-center',
      split: 'mt-12 items-start border-t pt-6 sm:flex-row sm:items-center',
      simple: 'mt-8 items-start border-t pt-6 sm:flex-row sm:items-center',
      centered: 'mt-8 items-center border-t pt-6 text-center',
      minimal: 'items-center sm:flex-row',
    },
    tone: {
      default: '',
      dark: 'border-background/20',
      muted: '',
    },
  },
  defaultVariants: { variant: 'columns', tone: 'default' },
})
