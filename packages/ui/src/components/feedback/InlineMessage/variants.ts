import { cva, type VariantProps } from '../../../lib/cva'

export const inlineMessageVariants = cva('flex items-start gap-1.5 leading-snug', {
  variants: {
    tone: {
      neutral: 'text-muted-foreground',
      info: 'text-info',
      success: 'text-success',
      warning: 'text-warning-foreground dark:text-warning',
      danger: 'text-destructive',
    },
    size: {
      sm: 'text-xs [&_svg]:size-3',
      md: 'text-sm [&_svg]:size-3.5',
      lg: 'text-base [&_svg]:size-4',
    },
    /** `plain` is the original coloured text and adds no classes. `soft` and `outline` give the message a box. */
    variant: {
      plain: '',
      soft: 'w-fit max-w-full rounded-md px-2 py-1',
      outline: 'w-fit max-w-full rounded-md border px-2 py-1',
    },
  },
  compoundVariants: [
    { variant: 'soft', tone: 'neutral', class: 'bg-muted' },
    { variant: 'soft', tone: 'info', class: 'bg-info/15' },
    { variant: 'soft', tone: 'success', class: 'bg-success/15' },
    { variant: 'soft', tone: 'warning', class: 'bg-warning/20' },
    { variant: 'soft', tone: 'danger', class: 'bg-destructive/10' },
    { variant: 'outline', tone: 'neutral', class: 'border-border' },
    { variant: 'outline', tone: 'info', class: 'border-info/50' },
    { variant: 'outline', tone: 'success', class: 'border-success/50' },
    { variant: 'outline', tone: 'warning', class: 'border-warning' },
    { variant: 'outline', tone: 'danger', class: 'border-destructive/50' },
  ],
  defaultVariants: { tone: 'neutral', size: 'md', variant: 'plain' },
})

export type InlineMessageVariants = VariantProps<typeof inlineMessageVariants>
export type InlineMessageSize = NonNullable<InlineMessageVariants['size']>
export type InlineMessageVariant = NonNullable<InlineMessageVariants['variant']>

export const INLINE_MESSAGE_SIZES = ['sm', 'md', 'lg'] as const
export const INLINE_MESSAGE_VARIANTS = ['plain', 'soft', 'outline'] as const
