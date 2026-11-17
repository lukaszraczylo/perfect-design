import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'
import type { FlowCanvasEdgeStyle, FlowCanvasSize, FlowCanvasVariant } from './types'

export const FLOW_VARIANTS: readonly FlowCanvasVariant[] = ['plain', 'dots', 'grid']
export const FLOW_SIZES: readonly FlowCanvasSize[] = ['sm', 'md', 'lg']
export const FLOW_EDGE_STYLES: readonly FlowCanvasEdgeStyle[] = ['straight', 'curved', 'orthogonal']
/** Fallback height (px) of the canvas before it is measured, per `size`. Matches the `h-*` classes below. */
export const FLOW_HEIGHTS: Record<FlowCanvasSize, number> = { sm: 288, md: 384, lg: 512 }

/** The wrapper: toolbar, canvas and the text alternative stacked. `size` sets the gap between them. */
export const flowCanvasVariants = cva('flex w-full min-w-0 flex-col text-foreground', {
  variants: { size: { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' } },
  defaultVariants: { size: 'md' },
})

/** The canvas surface (the `role="application"` element): its height follows `size`, `variant` marks the background. */
export const flowCanvasViewportVariants = cva(
  'relative min-w-0 touch-none overflow-hidden rounded-lg border border-border select-none forced-colors:border-[CanvasText] ' + focusRing,
  {
    variants: {
      size: { sm: 'h-72', md: 'h-96', lg: 'h-128' },
      variant: { plain: 'bg-card text-card-foreground', dots: 'bg-background text-foreground', grid: 'bg-background text-foreground' },
    },
    defaultVariants: { size: 'md', variant: 'plain' },
  },
)

export type FlowCanvasVariants = VariantProps<typeof flowCanvasViewportVariants>
