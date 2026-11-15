import { cva, type VariantProps } from '../../../lib/cva'

/** Root. `list` and `podium` stack their lists; `table` is the scroll region around the table. */
export const leaderboardVariants = cva('min-w-0 max-w-full text-foreground', {
  variants: {
    variant: {
      list: 'flex flex-col',
      table: 'overflow-x-auto rounded-md',
      podium: 'flex flex-col gap-4',
    },
    size: { sm: 'text-xs', md: 'text-sm', lg: 'text-base' },
  },
  defaultVariants: { variant: 'list', size: 'md' },
})

/** One row of the list (and of the list under the podium). */
export const leaderboardRowVariants = cva('flex min-w-0 items-center gap-3 border-b px-2 last:border-b-0', {
  variants: {
    density: { comfortable: 'py-3', compact: 'py-1.5' },
    highlighted: { true: 'bg-muted', false: '' },
  },
  defaultVariants: { density: 'comfortable', highlighted: false },
})

/** A cell of the table. */
export const leaderboardCellVariants = cva('px-3 align-middle', {
  variants: { density: { comfortable: 'py-3', compact: 'py-1.5' } },
  defaultVariants: { density: 'comfortable' },
})

/** One podium place. The visual order 2-1-3 uses CSS `order`; the DOM stays in rank order. */
export const leaderboardPodiumVariants = cva('flex min-w-0 flex-1 flex-col items-center justify-end gap-2 rounded-md border p-3 text-center', {
  variants: {
    place: { first: 'order-2 min-h-40', second: 'order-1 min-h-32', third: 'order-3 min-h-28' },
    highlighted: { true: 'bg-muted', false: 'bg-card' },
  },
  defaultVariants: { place: 'first', highlighted: false },
})

export type LeaderboardVariants = VariantProps<typeof leaderboardVariants>
