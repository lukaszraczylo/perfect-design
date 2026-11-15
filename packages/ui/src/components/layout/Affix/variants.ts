import { cva, type VariantProps } from '../../../lib/cva'

/** Look of the pinned element while it is stuck (`data-stuck`). Position classes are applied by the component. */
export const affixVariants = cva('transition-shadow motion-reduce:transition-none', {
  variants: {
    variant: {
      plain: '',
      elevated: 'data-[stuck]:bg-background data-[stuck]:shadow-md forced-colors:data-[stuck]:border',
      bordered: 'data-[stuck]:bg-background',
    },
    position: {
      top: '',
      bottom: '',
    },
  },
  compoundVariants: [
    { variant: 'bordered', position: 'top', class: 'data-[stuck]:border-b' },
    { variant: 'bordered', position: 'bottom', class: 'data-[stuck]:border-t' },
  ],
  defaultVariants: { variant: 'plain', position: 'top' },
})

export type AffixVariant = NonNullable<VariantProps<typeof affixVariants>['variant']>
