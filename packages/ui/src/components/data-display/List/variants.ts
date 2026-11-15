import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'
import type { InjectionKey, ComputedRef } from 'vue'

const base = cva('flex flex-col', {
  variants: {
    variant: {
      /** No dividers or surfaces. */
      plain: '',
      /** Hairline dividers between rows (default). */
      divided: 'divide-y divide-border',
      /** Every row is its own bordered card; rows are separated by a gap. */
      card: 'gap-2',
      /** Divided rows that are all hover/focus/keyboard interactive. */
      interactive: 'divide-y divide-border',
      /** Divided rows with a larger, unmuted leading slot meant for an Avatar. */
      'with-avatar': 'divide-y divide-border',
    },
  },
  defaultVariants: { variant: 'divided' },
})

/** Container classes of a List. */
export const listVariants = (props?: Parameters<typeof base>[0]): string => cn(base(props))

export type ListVariants = VariantProps<typeof base>
export type ListVariant = NonNullable<ListVariants['variant']>

export const LIST_VARIANTS: readonly ListVariant[] = ['plain', 'divided', 'card', 'interactive', 'with-avatar']

/** List provides its effective variant so ListItem can adapt without the consumer repeating it per row. */
export const LIST_VARIANT_KEY: InjectionKey<ComputedRef<ListVariant | undefined>> = Symbol('perfect-design:list-variant')

export const LIST_SIZES = ['sm', 'md', 'lg'] as const
export type ListSize = (typeof LIST_SIZES)[number]
export const LIST_GAPS = ['none', 'sm', 'md', 'lg'] as const
export type ListGap = (typeof LIST_GAPS)[number]

/** Row padding and text size per list size. `md` is the original row. */
export const listItemSizes: Record<ListSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-3 py-2.5 text-sm',
  lg: 'px-4 py-3.5 text-base',
}
/** Description line under the row text per list size (`sm` and `md` keep the original `text-xs`). */
export const listDescriptionSizes: Record<ListSize, string> = { sm: 'text-xs', md: 'text-xs', lg: 'text-sm' }

/** Space between rows. Only `plain` and `card` lists use it: divided rows are separated by their rule, not by space. */
export const listGaps: Record<ListGap, string> = { none: 'gap-0', sm: 'gap-1', md: 'gap-2', lg: 'gap-4' }

/** List provides its size so ListItem can match it without repeating it per row. */
export const LIST_SIZE_KEY: InjectionKey<ComputedRef<ListSize>> = Symbol('perfect-design:list-size')
