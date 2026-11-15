import { cva, type VariantProps } from '../../../lib/cva'

export const descriptionListVariants = cva('group/dl flex flex-col text-sm', {
  variants: {
    divided: { true: 'divide-y divide-border', false: 'gap-3' },
    variant: {
      stacked: '',
      inline: '',
      grid: 'grid gap-x-6 gap-y-4',
      striped: 'gap-0 overflow-hidden rounded-md border',
    },
    /** Type scale of terms and values. `md` is the original `text-sm`; pass the result through `cn` so the later size wins. */
    size: { sm: 'text-xs', md: '', lg: 'text-base' },
    /** Space between items. `default` is the original rhythm; the extra classes only act where a variant has item spacing. */
    density: { compact: '', default: '', comfortable: '' },
  },
  compoundVariants: [
    { density: 'compact', divided: false, variant: ['stacked', 'inline'], class: 'gap-1.5' },
    { density: 'comfortable', divided: false, variant: ['stacked', 'inline'], class: 'gap-5' },
    { density: 'compact', variant: 'grid', class: 'gap-y-2' },
    { density: 'comfortable', variant: 'grid', class: 'gap-y-6' },
  ],
  defaultVariants: { variant: 'stacked', divided: false, size: 'md', density: 'default' },
})

/** Extra classes DescriptionItem adds per list variant (`stacked` adds nothing: unchanged default output). */
export const descriptionItemVariants = cva('', {
  variants: {
    variant: {
      stacked: '',
      inline: 'flex items-baseline justify-between gap-4',
      grid: '',
      striped: 'px-3 py-2 odd:bg-muted/50',
    },
    /** Item padding where the list has any (`divided` rows and `striped` rows); `default` adds nothing. */
    density: { compact: '', default: '', comfortable: '' },
  },
  compoundVariants: [
    { density: 'compact', class: 'group-data-[divided=true]/dl:py-1' },
    { density: 'comfortable', class: 'group-data-[divided=true]/dl:py-3' },
    { density: 'compact', variant: 'striped', class: 'py-1' },
    { density: 'comfortable', variant: 'striped', class: 'py-3' },
  ],
  defaultVariants: { variant: 'stacked', density: 'default' },
})

/** Extra classes for the `dd` per list variant. */
export const descriptionDetailsVariants = cva('flex min-w-0 items-start gap-1.5 break-words font-medium text-foreground', {
  variants: {
    variant: {
      stacked: '',
      inline: 'justify-end text-end',
      grid: '',
      striped: '',
    },
  },
  defaultVariants: { variant: 'stacked' },
})

export type DescriptionListVariant = 'stacked' | 'inline' | 'grid' | 'striped'
export type DescriptionListSize = 'sm' | 'md' | 'lg'
export type DescriptionListDensity = 'compact' | 'default' | 'comfortable'
export type DescriptionListColumns = 1 | 2 | 3 | 4
export type DescriptionListVariants = VariantProps<typeof descriptionListVariants>

export const DESCRIPTION_LIST_SIZES: readonly DescriptionListSize[] = ['sm', 'md', 'lg']
export const DESCRIPTION_LIST_DENSITIES: readonly DescriptionListDensity[] = ['compact', 'default', 'comfortable']
export const DESCRIPTION_LIST_VARIANTS: readonly DescriptionListVariant[] = ['stacked', 'inline', 'grid', 'striped']

/** Responsive column classes for `variant="grid"` (full literals so Tailwind can see them). */
export const descriptionGridColumns: Record<DescriptionListColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}
