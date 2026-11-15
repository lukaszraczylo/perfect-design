import { cva, type VariantProps } from '../../../lib/cva'
import { DIAGRAM_VARIANTS, FRAME, type DiagramVariant } from '../_diagram/palette'
import { DIAGRAM_TONES } from '../_diagram/types'

export const MERMAID_VARIANTS = DIAGRAM_VARIANTS
export const MERMAID_SIZES = ['sm', 'md', 'lg'] as const
export const MERMAID_DENSITIES = ['compact', 'comfortable', 'spacious'] as const
export const MERMAID_EDGE_STYLES = ['curved', 'straight', 'orthogonal'] as const
export const MERMAID_DIRECTIONS = ['TB', 'LR', 'BT', 'RL'] as const
export const MERMAID_ROUNDED = ['none', 'sm', 'md', 'full'] as const
export const MERMAID_TONES = DIAGRAM_TONES
export const MERMAID_FITS = ['width', 'scroll', 'auto'] as const
/** With `fit="auto"` the diagram scrolls at natural size when scaling it to the container would shrink it below this factor. */
export const MERMAID_AUTO_MIN_SCALE = 0.6

/**
 * Frame of the diagram: `variant` sets the surface (outline and filled share a bordered card, soft is a borderless muted
 * panel, mono is single-colour ink), `size` the text of the captions and controls, `density` the
 * padding and gaps. The drawing itself (node style, tone, corner radius, edge style, direction) is part of the SVG.
 */
export const mermaidDiagramVariants = cva('relative flex min-w-0 max-w-full flex-col text-foreground', {
  variants: {
    variant: {
      outline: FRAME.outline,
      filled: FRAME.filled,
      mono: FRAME.mono,
      soft: FRAME.soft,
    } satisfies Record<DiagramVariant, string>,
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
    density: {
      compact: 'gap-1.5 p-2',
      comfortable: 'gap-3 p-4',
      spacious: 'gap-4 p-6',
    },
  },
  defaultVariants: { variant: 'outline', size: 'md', density: 'comfortable' },
})

export type MermaidDiagramVariants = VariantProps<typeof mermaidDiagramVariants>
