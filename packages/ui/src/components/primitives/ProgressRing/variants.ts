import { cva, type VariantProps } from '../../../lib/cva'

/** Stroke colour of the value arc. */
export const progressRingVariants = cva('fill-none', {
  variants: {
    tone: {
      neutral: 'stroke-muted-foreground',
      primary: 'stroke-primary',
      success: 'stroke-success',
      warning: 'stroke-warning',
      danger: 'stroke-destructive',
      info: 'stroke-info',
    },
  },
  defaultVariants: { tone: 'primary' },
})

export type ProgressRingVariants = VariantProps<typeof progressRingVariants>
export type ProgressRingTone = NonNullable<ProgressRingVariants['tone']>

/** `default` draws the muted track under the arc; `bare` draws the arc alone (for rings on busy or already tinted surfaces). */
export type ProgressRingVariant = 'default' | 'bare'
/** Line cap of the arc: `round` (default) or `butt` (flat ends, exact arc length). */
export type ProgressRingShape = 'round' | 'butt'
/** Preset diameters. `size` also accepts any number of px. */
export type ProgressRingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export const PROGRESS_RING_VARIANTS: readonly ProgressRingVariant[] = ['default', 'bare']
export const PROGRESS_RING_SHAPES: readonly ProgressRingShape[] = ['round', 'butt']
export const PROGRESS_RING_SIZES: readonly ProgressRingSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

/** Diameter and default thickness in px for each size preset. `md` is the component default (64px, 6px). */
export const progressRingSizeScale: Readonly<Record<ProgressRingSize, { size: number; stroke: number }>> = Object.freeze({
  xs: { size: 40, stroke: 4 },
  sm: { size: 48, stroke: 5 },
  md: { size: 64, stroke: 6 },
  lg: { size: 96, stroke: 8 },
  xl: { size: 128, stroke: 10 },
})
