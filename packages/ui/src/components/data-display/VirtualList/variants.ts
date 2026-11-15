import { cva, type VariantProps } from '../../../lib/cva'

export const VIRTUAL_LIST_VARIANTS = ['plain', 'bordered', 'divided', 'striped'] as const

/** Viewport surface. `plain` is the original unframed list; `bordered` adds a rounded border. */
export const virtualListVariants = cva('relative overflow-auto', {
  variants: {
    variant: {
      plain: '',
      bordered: 'rounded-md border',
      divided: '',
      striped: '',
    },
  },
  defaultVariants: { variant: 'plain' },
})

/** Row decoration: `divided` draws a rule under each row, `striped` tints every second row. */
export const virtualListRowVariants = cva('absolute inset-x-0 overflow-hidden', {
  variants: {
    variant: {
      plain: '',
      bordered: '',
      divided: 'border-b',
      striped: '',
    },
    odd: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [{ variant: 'striped', odd: true, class: 'bg-muted/30' }],
  defaultVariants: { variant: 'plain', odd: false },
})

export type VirtualListVariants = VariantProps<typeof virtualListVariants>
export type VirtualListVariant = NonNullable<VirtualListVariants['variant']>
