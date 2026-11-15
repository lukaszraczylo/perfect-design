import { cva, type VariantProps } from '../../../lib/cva'

export const stackVariants = cva('flex', {
  variants: {
    direction: {
      vertical: 'flex-col',
      horizontal: 'flex-row',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap',
    },
    /**
     * Surface of the stack itself. `plain` (default) has none. `bordered`: hairline border. `card`: bordered `bg-card` panel.
     * `muted`: quiet filled panel (`secondary` token pair, same colour as `muted` and covered by the contrast tests).
     * Surfaces add `p-4` unless `padding` is set.
     */
    variant: {
      plain: '',
      bordered: 'rounded-lg border border-border',
      card: 'rounded-lg border border-border bg-card text-card-foreground',
      muted: 'rounded-lg bg-secondary text-secondary-foreground',
    },
    /** Inner padding. `auto` (default): none for `plain`, `p-4` for the surface variants. */
    padding: {
      auto: '',
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
    /** Border between children; the axis follows `direction`, see `stackDividerClasses`. */
    divided: {
      true: '',
      false: '',
    },
  },
  defaultVariants: { direction: 'vertical', wrap: false, divided: false, variant: 'plain', padding: 'auto' },
  compoundVariants: [
    { variant: ['bordered', 'card', 'muted'], padding: 'auto', class: 'p-4' },
    { direction: 'vertical', divided: true, class: 'divide-y divide-border' },
    { direction: 'horizontal', divided: true, class: 'divide-x divide-border' },
  ],
})

/**
 * Horizontal stacks that switch to a column below the given breakpoint. Later classes win over the
 * `flex-row` from `stackVariants` through tailwind-merge. Literal so Tailwind generates them.
 */
export const stackCollapseClasses: Record<string, string> = {
  sm: 'flex-col sm:flex-row',
  md: 'flex-col md:flex-row',
  lg: 'flex-col lg:flex-row',
}
export type StackCollapse = 'sm' | 'md' | 'lg'

export type StackVariants = VariantProps<typeof stackVariants>
export type StackDirection = NonNullable<StackVariants['direction']>
export type StackAlign = NonNullable<StackVariants['align']>
export type StackJustify = NonNullable<StackVariants['justify']>
export type StackVariant = NonNullable<StackVariants['variant']>
export type StackPadding = NonNullable<StackVariants['padding']>
export const stackSurfaces: readonly StackVariant[] = ['plain', 'bordered', 'card', 'muted']
export const stackPaddings: readonly StackPadding[] = ['auto', 'none', 'sm', 'md', 'lg']
