import { cva, type VariantProps } from '../../../lib/cva'

export const CHAT_THREAD_DENSITIES = ['compact', 'default', 'relaxed'] as const
export type ChatThreadDensity = (typeof CHAT_THREAD_DENSITIES)[number]

/** Root: a positioned column. Give it a height (`h-96`, `h-full`) so the log inside can scroll. */
export const chatThreadVariants = cva('relative flex min-h-0 min-w-0 flex-col')

/** The scrolling log. Focusable, so keyboard users can scroll it; the ring sits inside the box so it is not clipped. */
export const chatThreadLogClasses = 'min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain [overflow-anchor:none] outline-hidden focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/40 forced-colors:focus-visible:outline-2 forced-colors:focus-visible:-outline-offset-2'

/** The message column inside the log: spacing between messages and around the thread. */
export const chatThreadContentVariants = cva('flex min-w-0 flex-col', {
  variants: {
    density: {
      compact: 'gap-2 p-2',
      default: 'gap-3 p-3',
      relaxed: 'gap-5 p-4',
    },
  },
  defaultVariants: { density: 'default' },
})

export type ChatThreadVariants = VariantProps<typeof chatThreadContentVariants>
