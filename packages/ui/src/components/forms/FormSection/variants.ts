import { cva, type VariantProps } from '../../../lib/cva'

export const formSectionVariants = cva('grid gap-6', {
  variants: {
    variant: {
      /** Header above the fields. */
      stacked: '',
      /** Header on the left, fields on the right from the `lg` breakpoint up. */
      split: 'lg:grid-cols-3 lg:gap-x-10',
      /** Header above the fields inside a bordered, padded card. */
      card: 'rounded-lg border bg-card p-4 text-card-foreground sm:p-6',
    },
    /** Gap between the header and the fields and inner text size. */
    size: {
      sm: 'gap-4',
      md: '',
      lg: 'gap-8',
    },
    divider: {
      true: 'border-b pb-8',
      false: '',
    },
  },
  defaultVariants: { variant: 'stacked', size: 'md', divider: false },
})

export const formSectionFieldsVariants = cva('grid grid-cols-1 gap-x-6 gap-y-4', {
  variants: {
    columns: {
      1: '',
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-2 lg:grid-cols-3',
      4: 'sm:grid-cols-2 lg:grid-cols-4',
    },
    variant: {
      stacked: '',
      split: 'lg:col-span-2',
      card: '',
    },
    size: {
      sm: 'gap-x-4 gap-y-3',
      md: '',
      lg: 'gap-x-8 gap-y-6',
    },
  },
  defaultVariants: { columns: 1, variant: 'stacked', size: 'md' },
})

export type FormSectionVariants = VariantProps<typeof formSectionVariants>
export type FormSectionFieldsVariants = VariantProps<typeof formSectionFieldsVariants>
