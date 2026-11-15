import { cva, type VariantProps } from '../../../lib/cva'

export const blockquoteVariants = cva('text-foreground', {
  variants: {
    variant: {
      /** Left border in the neutral border colour. */
      default: 'border-s-2 border-border ps-4 italic',
      /** Left border in the primary colour. */
      primary: 'border-s-2 border-primary ps-4 italic',
      /** Softly tinted surface with a hairline border. */
      tinted: 'rounded-lg border border-border bg-muted/50 px-4 py-3',
      /** Quote card: bordered surface, roman type. */
      card: 'rounded-lg border border-border bg-card p-6 text-card-foreground',
      /** Large display quote. Pair with `align="center"` for a pull-quote. */
      pull: "font-display text-2xl font-medium tracking-tight text-balance",
    },
    size: {
      sm: 'text-sm',
      base: 'text-base',
      md: 'text-md',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
    },
    align: {
      start: '',
      center: 'text-center',
    },
  },
  defaultVariants: { variant: 'default' },
})

export type BlockquoteVariants = VariantProps<typeof blockquoteVariants>
export type BlockquoteVariant = NonNullable<BlockquoteVariants['variant']>
export type BlockquoteSize = NonNullable<BlockquoteVariants['size']>
export type BlockquoteAlign = NonNullable<BlockquoteVariants['align']>
export const blockquoteVariantNames = ['default', 'primary', 'tinted', 'card', 'pull'] as const
export const blockquoteSizes = ['sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl'] as const
export const blockquoteAligns = ['start', 'center'] as const

/** Attribution row used when an author, role or avatar is given. */
export const blockquoteAuthorVariants = cva('mt-4 flex items-center gap-3 not-italic', {
  variants: {
    align: {
      start: '',
      center: 'justify-center',
    },
  },
  defaultVariants: { align: 'start' },
})
