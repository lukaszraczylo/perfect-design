import { cva, type ClassInput, type VariantProps } from '../../../lib/cva'

/** `shimmer` is kept as an alias: gradients are not part of the design system, so it pulses like the default. */
const shimmerClasses = 'animate-pulse'

const skeletonBase = cva('bg-muted motion-reduce:animate-none', {
  variants: {
    shape: {
      text: 'h-4 w-full rounded-sm',
      circle: 'size-10 rounded-full',
      rect: 'h-20 w-full rounded-md',
      rounded: 'h-20 w-full rounded-xl',
      pill: 'h-6 w-24 rounded-full',
      avatar: 'size-10 shrink-0 rounded-full',
      // One line of the paragraph; the wrapper uses `skeletonLinesVariants`.
      lines: 'h-4 w-full rounded-sm',
    },
    animation: {
      none: '',
      pulse: 'animate-pulse',
      shimmer: shimmerClasses,
    },
  },
  defaultVariants: { shape: 'rect', animation: 'pulse' },
})

export type SkeletonShape = NonNullable<NonNullable<Parameters<typeof skeletonBase>[0]>['shape']>
export type SkeletonAnimation = NonNullable<NonNullable<Parameters<typeof skeletonBase>[0]>['animation']>

export interface SkeletonVariantProps {
  shape?: SkeletonShape | null
  /** `none` | `pulse` (default) | `shimmer`. Wins over the legacy `shimmer` flag. */
  animation?: SkeletonAnimation | null
  /** Legacy flag: `true` is the same as `animation: 'shimmer'`. */
  shimmer?: boolean | null
  class?: ClassInput
}

/** Classes for one skeleton block. `shimmer: true` is kept as a shortcut for `animation: 'shimmer'`. */
export function skeletonVariants(props: SkeletonVariantProps = {}): string {
  const { shimmer, animation, ...rest } = props
  return skeletonBase({ ...rest, animation: animation ?? (shimmer ? 'shimmer' : undefined) })
}

/** Wrapper of the `lines` (paragraph) shape. */
export const skeletonLinesVariants = cva('flex w-full flex-col gap-2')

export type SkeletonVariants = VariantProps<typeof skeletonVariants>
