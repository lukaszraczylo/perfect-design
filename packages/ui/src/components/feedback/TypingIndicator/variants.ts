import { cva, type VariantProps } from '../../../lib/cva'

export const TYPING_INDICATOR_VARIANTS = ['bubble', 'plain'] as const
export const TYPING_INDICATOR_SIZES = ['sm', 'md'] as const
export type TypingIndicatorVariant = (typeof TYPING_INDICATOR_VARIANTS)[number]
export type TypingIndicatorSize = (typeof TYPING_INDICATOR_SIZES)[number]

/** `bubble` is a muted rounded chip like a chat message; `plain` is just the dots in the surrounding text colour. */
export const typingIndicatorVariants = cva('inline-flex w-fit max-w-full items-center text-muted-foreground', {
  variants: {
    variant: { bubble: 'rounded-lg bg-muted text-muted-foreground', plain: '' },
    size: { sm: 'gap-1', md: 'gap-1.5' },
  },
  compoundVariants: [
    { variant: 'bubble', size: 'sm', class: 'px-2.5 py-2' },
    { variant: 'bubble', size: 'md', class: 'px-3 py-3' },
  ],
  defaultVariants: { variant: 'bubble', size: 'md' },
})

export const TYPING_DOT_SIZES: Record<TypingIndicatorSize, string> = { sm: 'size-1', md: 'size-1.5' }
export type TypingIndicatorVariants = VariantProps<typeof typingIndicatorVariants>
