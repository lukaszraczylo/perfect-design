import { cva, type VariantProps } from '../../../lib/cva'

export const sankeyVariants = cva('flex w-full min-w-0 flex-col gap-2', {
  variants: {
    variant: { flat: '', outline: '' },
    size: { sm: '', md: '', lg: '' },
  },
  defaultVariants: { variant: 'flat', size: 'md' },
})

/** Node box. `flat` is a solid block of the tone, `outline` an empty box with a tone coloured edge. */
export const sankeyNodeVariants = cva('', {
  variants: {
    variant: { flat: 'stroke-transparent', outline: 'fill-background stroke-2' },
  },
  defaultVariants: { variant: 'flat' },
})

/** Ribbon. `outline` adds a hairline edge so a ribbon stays visible without relying on its fill. */
export const sankeyLinkVariants = cva('', {
  variants: {
    variant: { flat: '', outline: 'stroke-1' },
  },
  defaultVariants: { variant: 'flat' },
})

export type SankeyVariantProps = VariantProps<typeof sankeyVariants>
export type SankeyVariant = NonNullable<SankeyVariantProps['variant']>
export type SankeySize = NonNullable<SankeyVariantProps['size']>
export type SankeyGap = 'sm' | 'md' | 'lg'
export type SankeyLinkOpacity = 'soft' | 'medium' | 'strong'

export const SANKEY_VARIANTS: readonly SankeyVariant[] = ['flat', 'outline']
export const SANKEY_SIZES: readonly SankeySize[] = ['sm', 'md', 'lg']
export const SANKEY_GAPS: readonly SankeyGap[] = ['sm', 'md', 'lg']
export const SANKEY_LINK_OPACITIES: readonly SankeyLinkOpacity[] = ['soft', 'medium', 'strong']

/** Viewbox height per `size` (an explicit `height` wins). */
export const SANKEY_HEIGHTS: Record<SankeySize, number> = { sm: 220, md: 320, lg: 440 }
/** Vertical space between nodes of one layer in px. */
export const SANKEY_GAP_PX: Record<SankeyGap, number> = { sm: 6, md: 12, lg: 22 }
export const SANKEY_NODE_WIDTH = 10
