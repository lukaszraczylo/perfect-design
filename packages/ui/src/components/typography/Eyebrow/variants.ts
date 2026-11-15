import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Eyebrow styling. Sentence case only: no uppercase, no letter-spacing (LLMSlop T4, T5).
 *
 * - `variant`: `plain` (default, text only), `rule` (a hairline after the text), `dot` (a small dot before it).
 *   The rule and dot are decorative `aria-hidden` spans rendered by the component, not by this function.
 * - `tone`: text colour (`primary`, `muted`, `foreground`); the rule and dot follow the text colour or the border token.
 * - `size`: `xs`, `sm` (default), `md`.
 */
export const eyebrowVariants = cva('font-medium', {
  variants: {
    tone: {
      primary: 'text-primary',
      muted: 'text-muted-foreground',
      foreground: 'text-foreground',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
    },
    variant: {
      plain: '',
      rule: 'flex items-center gap-3',
      dot: 'inline-flex items-center gap-2',
    },
  },
  defaultVariants: { tone: 'primary', size: 'sm', variant: 'plain' },
})

export type EyebrowVariants = VariantProps<typeof eyebrowVariants>
export type EyebrowTone = NonNullable<EyebrowVariants['tone']>
export type EyebrowSize = NonNullable<EyebrowVariants['size']>
export type EyebrowVariant = NonNullable<EyebrowVariants['variant']>
export const eyebrowTones: readonly EyebrowTone[] = ['primary', 'muted', 'foreground']
export const eyebrowSizes: readonly EyebrowSize[] = ['xs', 'sm', 'md']
export const eyebrowVariantNames: readonly EyebrowVariant[] = ['plain', 'rule', 'dot']

/** Decorative hairline after the label (`rule`). Falls back to the text colour in forced-colors mode. */
export const eyebrowRuleClasses = 'h-px min-w-4 flex-1 bg-border forced-colors:bg-current'
/** Decorative dot before the label (`dot`). Uses the text colour. */
export const eyebrowDotClasses = 'inline-block size-1.5 shrink-0 rounded-full bg-current'
