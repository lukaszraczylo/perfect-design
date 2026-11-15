import { cva, type VariantProps } from '../../../lib/cva'

export const headingVariants = cva('font-display tracking-tight', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      md: 'text-md',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    tone: {
      default: '',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      success: 'text-success',
      warning: 'text-warning-foreground dark:text-warning',
      danger: 'text-destructive',
      info: 'text-info',
    },
    balance: {
      true: 'text-balance',
      false: '',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    variant: {
      default: '',
      /** Short accent bar under the text. Override the colour with `after:bg-*`. */
      underline: "after:mt-3 after:block after:h-1 after:w-12 after:rounded-full after:bg-primary after:content-['']",
      /** Full-width divider under the text. */
      divider: 'border-b border-border pb-3',
    },
  },
  compoundVariants: [
    { variant: 'underline', align: 'center', class: 'after:mx-auto' },
    { variant: 'underline', align: 'right', class: 'after:ms-auto' },
  ],
  defaultVariants: { size: '2xl', weight: 'semibold', tone: 'default', balance: false, variant: 'default' },
})

/** Wrapper used when a heading has an eyebrow and/or a description. */
export const headingGroupVariants = cva('flex flex-col gap-2', {
  variants: {
    align: {
      left: 'items-start text-left',
      center: 'items-center text-center',
      right: 'items-end text-right',
    },
  },
  defaultVariants: { align: 'left' },
})

/** Supporting paragraph under a heading. */
export const headingDescriptionVariants = cva('max-w-2xl text-pretty text-muted-foreground', {
  variants: {
    size: {
      sm: 'text-sm',
      base: 'text-md',
      lg: 'text-lg',
    },
  },
  defaultVariants: { size: 'base' },
})

export type HeadingVariants = VariantProps<typeof headingVariants>
export type HeadingSize = NonNullable<HeadingVariants['size']>
export type HeadingWeight = NonNullable<HeadingVariants['weight']>
export type HeadingTone = NonNullable<HeadingVariants['tone']>
export type HeadingAlign = NonNullable<HeadingVariants['align']>
export type HeadingVariant = NonNullable<HeadingVariants['variant']>
export type HeadingDescriptionSize = NonNullable<VariantProps<typeof headingDescriptionVariants>['size']>
export const headingVariantNames = ['default', 'underline', 'divider'] as const
export const headingAligns = ['left', 'center', 'right'] as const
export const headingSizes = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'] as const
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

/** Visual size used when `size` is not given, per semantic level. */
export const headingDefaultSizes: Record<HeadingLevel, HeadingSize> = {
  1: '4xl',
  2: '3xl',
  3: '2xl',
  4: 'xl',
  5: 'lg',
  6: 'md',
}

/** Description size per visual heading size. */
export const headingDescriptionSizes: Record<HeadingSize, HeadingDescriptionSize> = {
  xs: 'sm',
  sm: 'sm',
  base: 'sm',
  md: 'base',
  lg: 'base',
  xl: 'base',
  '2xl': 'base',
  '3xl': 'lg',
  '4xl': 'lg',
  '5xl': 'lg',
  '6xl': 'lg',
}
