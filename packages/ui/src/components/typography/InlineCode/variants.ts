import { cva, type VariantProps } from '../../../lib/cva'

/**
 * InlineCode styling.
 * - `variant`: `default` (muted chip), `outline` (hairline border, no fill), `plain` (monospace text only).
 * - `size`: `xs`, `sm` (default), `md`, `lg`. Font sizes are tokens; for "same as the surrounding text" pass a `text-*` class.
 * - `tone`: `neutral` (default) or a status colour. On `default` it tints the chip (`bg-X/10 text-X`), on `outline` it colours
 *   the border and text, on `plain` only the text. Every pairing is a token pair covered by the contrast tests.
 * Tone classes come AFTER the variant classes; wrap the result in `cn()` outside the component so tailwind-merge drops the neutral fill.
 */
export const inlineCodeVariants = cva('rounded-sm py-0.5 font-mono font-medium break-words', {
  variants: {
    variant: {
      default: 'bg-muted px-1 text-foreground',
      outline: 'border border-border bg-transparent px-1',
      plain: 'bg-transparent px-0',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-md',
    },
    tone: {
      neutral: '',
      primary: '',
      success: '',
      danger: '',
      info: '',
    },
  },
  compoundVariants: [
    { variant: 'default', tone: 'primary', class: 'bg-primary/10 text-primary' },
    { variant: 'default', tone: 'success', class: 'bg-success/15 text-success' },
    { variant: 'default', tone: 'danger', class: 'bg-destructive/10 text-destructive' },
    { variant: 'default', tone: 'info', class: 'bg-info/15 text-info' },
    { variant: 'outline', tone: 'primary', class: 'border-primary/50 text-primary' },
    { variant: 'outline', tone: 'success', class: 'border-success/50 text-success' },
    { variant: 'outline', tone: 'danger', class: 'border-destructive/50 text-destructive' },
    { variant: 'outline', tone: 'info', class: 'border-info/50 text-info' },
    { variant: 'plain', tone: 'primary', class: 'text-primary' },
    { variant: 'plain', tone: 'success', class: 'text-success' },
    { variant: 'plain', tone: 'danger', class: 'text-destructive' },
    { variant: 'plain', tone: 'info', class: 'text-info' },
  ],
  defaultVariants: { variant: 'default', size: 'sm', tone: 'neutral' },
})

export type InlineCodeVariants = VariantProps<typeof inlineCodeVariants>
export type InlineCodeVariant = NonNullable<InlineCodeVariants['variant']>
export type InlineCodeSize = NonNullable<InlineCodeVariants['size']>
export type InlineCodeTone = NonNullable<InlineCodeVariants['tone']>
export const inlineCodeVariantNames: readonly InlineCodeVariant[] = ['default', 'outline', 'plain']
export const inlineCodeSizes: readonly InlineCodeSize[] = ['xs', 'sm', 'md', 'lg']
export const inlineCodeTones: readonly InlineCodeTone[] = ['neutral', 'primary', 'success', 'danger', 'info']
