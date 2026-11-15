import { cva, type VariantProps } from '../../../lib/cva'

export const containerVariants = cva('w-full', {
  variants: {
    size: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl',
      '5xl': 'max-w-5xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl',
      prose: 'max-w-prose',
      full: 'max-w-full',
    },
    padded: { true: 'px-4 sm:px-6 lg:px-8', false: '' },
    centered: { true: 'mx-auto', false: '' },
    /** Horizontal gutter preset. When set it replaces the `padded` boolean. */
    gutter: {
      none: 'px-0',
      sm: 'px-3 sm:px-4',
      md: 'px-4 sm:px-6 lg:px-8',
      lg: 'px-6 sm:px-8 lg:px-12',
    },
    /** Vertical padding preset. Unset adds no vertical padding. */
    paddingY: {
      none: 'py-0',
      sm: 'py-4 md:py-6',
      md: 'py-8 md:py-12',
      lg: 'py-12 md:py-20',
    },
  },
  defaultVariants: { size: '7xl', padded: true, centered: true },
})

export type ContainerVariants = VariantProps<typeof containerVariants>
export type ContainerSize = NonNullable<ContainerVariants['size']>
export type ContainerGutter = NonNullable<ContainerVariants['gutter']>
export type ContainerPaddingY = NonNullable<ContainerVariants['paddingY']>

export const containerSizes: readonly string[] = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'prose', 'full']
export const containerGutters: readonly string[] = ['none', 'sm', 'md', 'lg']
export const containerPaddingsY: readonly string[] = ['none', 'sm', 'md', 'lg']
