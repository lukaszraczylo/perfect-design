import { cva, type VariantProps } from '../../../lib/cva'

/**
 * FormattedNumber styling. The default is the number inheriting the surrounding font, size and colour, with
 * tabular figures so columns of numbers line up.
 *
 * `tone` positive / negative use `text-success` / `text-destructive`, which are covered by the contrast tests on
 * background and card. They are never the only signal: the component shows a sign for them (see `signDisplay`).
 */
export const formattedNumberVariants = cva('whitespace-nowrap', {
  variants: {
    variant: {
      plain: '',
      mono: 'font-mono',
      outline: 'rounded-md border border-border px-1.5 py-0.5',
    },
    size: {
      inherit: '',
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      md: 'text-md',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    },
    tone: {
      default: '',
      muted: 'text-muted-foreground',
      positive: 'text-success',
      negative: 'text-destructive',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    tabular: {
      true: 'tabular-nums',
      false: '',
    },
  },
  defaultVariants: { variant: 'plain', size: 'inherit', tone: 'default', tabular: true },
})

export const formattedNumberVariantNames = ['plain', 'mono', 'outline'] as const
export const formattedNumberSizes = ['inherit', 'xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl'] as const
/** `auto` picks `positive` or `negative` from the sign of the value and is resolved by the component. */
export const formattedNumberTones = ['default', 'muted', 'positive', 'negative', 'auto'] as const
export const formattedNumberWeights = ['normal', 'medium', 'semibold', 'bold'] as const

export type FormattedNumberVariants = VariantProps<typeof formattedNumberVariants>
export type FormattedNumberVariant = (typeof formattedNumberVariantNames)[number]
export type FormattedNumberSize = (typeof formattedNumberSizes)[number]
export type FormattedNumberTone = (typeof formattedNumberTones)[number]
export type FormattedNumberWeight = (typeof formattedNumberWeights)[number]
