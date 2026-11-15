import { cva, type VariantProps } from '../../../lib/cva'
import type { NetworkLayout } from './networkLayout'

/** Root wrapper. `size` sets the space between title, drawing, legend and notes; the drawing height has its own table. */
export const networkGraphVariants = cva('flex w-full min-w-0 flex-col', {
  variants: { size: { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' } },
  defaultVariants: { size: 'md' },
})

export type NetworkGraphVariants = VariantProps<typeof networkGraphVariants>
export type NetworkGraphSize = NonNullable<NetworkGraphVariants['size']>
/** `plain` nodes only, `labelled` adds node and connection labels, `grouped` outlines every group with a hull. */
export type NetworkGraphVariant = 'plain' | 'labelled' | 'grouped'
export type NetworkGraphEdgeStyle = 'straight' | 'curved'
export type { NetworkLayout as NetworkGraphLayout }

export const NETWORK_SIZES: readonly NetworkGraphSize[] = ['sm', 'md', 'lg']
export const NETWORK_VARIANTS: readonly NetworkGraphVariant[] = ['plain', 'labelled', 'grouped']
export const NETWORK_EDGE_STYLES: readonly NetworkGraphEdgeStyle[] = ['straight', 'curved']

/** Drawing height (viewBox units) per `size`. A graph needs more room than a bar chart. */
export const NETWORK_HEIGHTS: Record<NetworkGraphSize, number> = { sm: 200, md: 300, lg: 420 }
