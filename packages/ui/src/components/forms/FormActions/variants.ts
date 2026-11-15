import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'

export const FORM_ACTIONS_LAYOUTS = ['stacked', 'inline', 'split'] as const
export const FORM_ACTIONS_VARIANTS = ['plain', 'bar', 'boxed'] as const
export const FORM_ACTIONS_SIZES = ['sm', 'md', 'lg'] as const
export const FORM_ACTIONS_ALIGNS = ['start', 'center', 'end', 'between'] as const
export type FormActionsLayout = (typeof FORM_ACTIONS_LAYOUTS)[number]
export type FormActionsVariant = (typeof FORM_ACTIONS_VARIANTS)[number]
export type FormActionsSize = (typeof FORM_ACTIONS_SIZES)[number]
export type FormActionsAlign = (typeof FORM_ACTIONS_ALIGNS)[number]

/** Written as complete literals so Tailwind's scanner picks every class up. */
const ALIGN_ROW = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between' } as const
const ALIGN_SM = { start: 'sm:justify-start', center: 'sm:justify-center', end: 'sm:justify-end', between: 'sm:justify-between' } as const

/** Padding of a surface (`bar`, `boxed`, or a `sticky` bar) by size. */
const PAD = { sm: 'px-3 py-2', md: 'px-4 py-3', lg: 'px-5 py-4' } as const

const base = cva('flex', {
  variants: {
    /**
     * `stacked`: full-width buttons in a column below `sm`, a row from `sm` (the default). `inline`: a wrapping row at every
     * width. `split`: like `stacked`, but the first action sits at the start and the others at the end from `sm` (a
     * destructive or secondary action apart from the primary one). Every layout keeps DOM order.
     */
    layout: {
      stacked: 'flex-col items-stretch sm:flex-row sm:flex-wrap sm:items-center *:w-full sm:*:w-auto',
      inline: 'flex-row flex-wrap items-center',
      split: 'flex-col items-stretch sm:flex-row sm:flex-wrap sm:items-center sm:justify-end *:w-full sm:*:w-auto sm:*:first:not-last:me-auto',
    },
    align: { start: '', center: '', end: '', between: '' },
    size: { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' },
    /** `plain` has no surface; `bar` is a full-width footer with a top border; `boxed` is a bordered, rounded panel. All are opaque. */
    variant: {
      plain: '',
      bar: 'border-t bg-background',
      boxed: 'rounded-md border bg-background',
    },
    /** Sticks to the bottom of the scroll container. A plain sticky bar gets the `bar` surface so content never shows through. */
    sticky: { true: 'sticky bottom-0 z-(--z-sticky)', false: '' },
  },
  defaultVariants: { layout: 'stacked', align: 'end', size: 'md', variant: 'plain', sticky: false },
  compoundVariants: [
    ...FORM_ACTIONS_ALIGNS.map((a) => ({ layout: 'stacked' as const, align: a, class: ALIGN_SM[a] })),
    ...FORM_ACTIONS_ALIGNS.map((a) => ({ layout: 'inline' as const, align: a, class: ALIGN_ROW[a] })),
    { variant: 'plain' as const, sticky: true, class: 'border-t bg-background' },
    ...FORM_ACTIONS_SIZES.flatMap((s) => [
      { variant: ['bar', 'boxed'] as ('bar' | 'boxed')[], size: s, class: PAD[s] },
      { sticky: true, size: s, class: PAD[s] },
    ]),
  ],
})

/**
 * Class list of the FormActions container: layout, alignment, size, surface and sticky positioning. Conflicting utilities
 * are resolved (later wins), so it can be put on a plain `<div>` that holds your own buttons.
 */
export const formActionsVariants = (props?: Parameters<typeof base>[0]): string => cn(base(props))

export type FormActionsVariants = VariantProps<typeof formActionsVariants>
