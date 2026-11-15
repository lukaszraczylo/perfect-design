import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'

const base = cva('', {
  variants: {
    layout: {
      /** Responsive grid of separate tiles (default). */
      grid: 'grid gap-4',
      /** Wrapping flex row; tiles grow from a 10rem minimum. `columns` is ignored. */
      inline: 'flex flex-wrap items-stretch gap-4 [&>*]:min-w-40 [&>*]:flex-1',
      /** One bordered surface with hairline dividers between the tiles (grid + gap-px over a border-coloured background). */
      divided:
        'grid gap-px overflow-hidden rounded-xl border bg-border shadow-sm [&>*]:rounded-none [&>*]:border-0 [&>*]:bg-card [&>*]:shadow-none',
    },
    /** Space between tiles of `grid` and `inline`. `divided` keeps its hairline gap. `md` is today's `gap-4`. */
    gap: {
      none: '',
      sm: '',
      md: '',
      lg: '',
    },
  },
  compoundVariants: [
    { layout: ['grid', 'inline'], gap: 'none', class: 'gap-0' },
    { layout: ['grid', 'inline'], gap: 'sm', class: 'gap-2' },
    { layout: ['grid', 'inline'], gap: 'lg', class: 'gap-6' },
  ],
  defaultVariants: { layout: 'grid', gap: 'md' },
})

/** Container classes of a StatGroup (column classes are added by the component). */
export const statGroupVariants = (props?: Parameters<typeof base>[0]): string => cn(base(props))

export type StatGroupVariants = VariantProps<typeof base>
export type StatGroupLayout = NonNullable<StatGroupVariants['layout']>
export type StatGroupGap = NonNullable<StatGroupVariants['gap']>
export const STAT_GROUP_GAPS = ['none', 'sm', 'md', 'lg'] as const
