import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'

export const TREE_DENSITIES = ['default', 'compact'] as const
export type TreeDensity = (typeof TREE_DENSITIES)[number]

export const TREE_SIZES = ['sm', 'md', 'lg'] as const
export type TreeSize = (typeof TREE_SIZES)[number]

export const TREE_VARIANTS = ['default', 'lines', 'boxed'] as const
export type TreeVariant = (typeof TREE_VARIANTS)[number]

/**
 * Tree root. `default` keeps the original `gap-0.5 text-sm`. `size` sets the type scale (`md` is the original `text-sm`),
 * `density` the vertical rhythm. `boxed` frames the whole tree in a bordered card surface.
 */
export const treeVariants = cva('flex flex-col text-sm', {
  variants: {
    density: { default: 'gap-0.5', compact: 'gap-0 text-xs' },
    size: { sm: 'text-xs', md: '', lg: 'text-base' },
    lines: { true: 'gap-0', false: '' },
    boxed: { true: 'rounded-lg border border-border bg-card p-1 text-card-foreground', false: '' },
  },
  defaultVariants: { density: 'default', size: 'md', lines: false, boxed: false },
})

export const treeItemVariants = cva('flex cursor-pointer items-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground', {
  variants: {
    density: { default: 'gap-1.5 py-1 pe-2', compact: 'gap-1 py-0.5 pe-1.5' },
    lines: { true: 'relative', false: '' },
  },
  defaultVariants: { density: 'default', lines: false },
})

const checkbox = cva('flex shrink-0 items-center justify-center rounded-sm border transition-colors', {
  variants: {
    density: { default: 'size-4', compact: 'size-3.5' },
    size: { sm: '', md: '', lg: 'size-5' },
    state: {
      unchecked: 'border-input bg-background',
      checked: 'border-primary bg-primary text-primary-foreground',
      indeterminate: 'border-primary bg-primary text-primary-foreground',
    },
  },
  defaultVariants: { density: 'default', size: 'md', state: 'unchecked' },
})
export const treeCheckboxVariants = (props?: Parameters<typeof checkbox>[0]): string => cn(checkbox(props))

/** Geometry (rem) per density: indentation step and toggle size. Connector lines derive from these. */
export const treeMetrics: Record<TreeDensity, { step: number; toggle: number; pad: number }> = {
  default: { step: 1, toggle: 1, pad: 0.25 },
  compact: { step: 0.75, toggle: 0.875, pad: 0.25 },
}

/** The same geometry per size. `sm` is the compact geometry and `md` the default one, so `density="compact"` alone still maps to `sm`. */
export const treeSizeMetrics: Record<TreeSize, { step: number; toggle: number; pad: number }> = {
  sm: treeMetrics.compact,
  md: treeMetrics.default,
  lg: { step: 1.25, toggle: 1.25, pad: 0.25 },
}

export type TreeVariants = VariantProps<typeof treeVariants>
