import { cva, type VariantProps } from '../../../lib/cva'

export const DIFF_VIEWER_VARIANTS = ['unified', 'split', 'inline'] as const
export type DiffViewerVariant = (typeof DIFF_VIEWER_VARIANTS)[number]
export const DIFF_VIEWER_SIZES = ['sm', 'md', 'lg'] as const
export type DiffViewerSize = (typeof DIFF_VIEWER_SIZES)[number]

/** Row height in px per size. Fixed so the windowed list can place rows; at least 24px so the fold buttons keep a usable target. */
export const DIFF_ROW_PX: Record<DiffViewerSize, number> = { sm: 24, md: 28, lg: 32 }

/** Outer frame. `variant` changes the markup (columns), not the frame; `size` sets the text size and the row height. */
export const diffViewerVariants = cva('flex min-w-0 max-w-full flex-col overflow-hidden rounded-md border bg-card text-foreground', {
  variants: {
    variant: { unified: '', split: '', inline: '' },
    size: { sm: 'text-xs', md: 'text-sm', lg: 'text-base' },
  },
  defaultVariants: { variant: 'unified', size: 'md' },
})

export type DiffCellType = 'ctx' | 'add' | 'del' | 'change' | 'empty'

/** Surface of a code or marker cell. Added and removed lines also carry a "+" / "-" marker and a distinct edge, so tone is never the only cue. */
export const diffCellVariants = cva('', {
  variants: {
    type: {
      ctx: '',
      add: 'bg-success/15',
      del: 'bg-destructive/10',
      change: '',
      empty: 'bg-muted/40',
    },
  },
  defaultVariants: { type: 'ctx' },
})

/** The marker column: "+", "-", "~" or blank. */
export const diffMarkerVariants = cva('select-none text-center font-mono', {
  variants: {
    type: {
      ctx: 'text-muted-foreground',
      add: 'text-success',
      del: 'text-destructive',
      change: 'text-foreground',
      empty: '',
    },
  },
  defaultVariants: { type: 'ctx' },
})

/** Edge of a row: solid for added, dashed for removed, solid ink for changed, so forced-colors mode still tells them apart. */
export const diffEdgeVariants = cva('border-s-2', {
  variants: {
    type: {
      ctx: 'border-card',
      add: 'border-success',
      del: 'border-dashed border-destructive',
      change: 'border-foreground',
      empty: 'border-card',
    },
  },
  defaultVariants: { type: 'ctx' },
})

/** Changed words inside a line: a tint plus a text decoration (underline for added, strike-through for removed). */
export const diffWordVariants = cva('rounded-xs text-foreground', {
  variants: {
    kind: {
      add: 'bg-success/30 underline',
      del: 'me-0.5 bg-destructive/20 line-through',
    },
  },
  defaultVariants: { kind: 'add' },
})

export type DiffViewerVariants = VariantProps<typeof diffViewerVariants>
