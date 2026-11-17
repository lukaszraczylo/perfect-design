import { cva, type VariantProps } from '../../../lib/cva'

export const PROMPT_INPUT_VARIANTS = ['default', 'filled', 'minimal'] as const
export const PROMPT_INPUT_SIZES = ['sm', 'md', 'lg'] as const
export type PromptInputVariant = (typeof PROMPT_INPUT_VARIANTS)[number]
export type PromptInputSize = (typeof PROMPT_INPUT_SIZES)[number]

const pick = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback)
/** Unknown values fall back to the default. */
export const normalizePromptVariant = (v: unknown) => pick(PROMPT_INPUT_VARIANTS, v, 'default')
export const normalizePromptSize = (v: unknown) => pick(PROMPT_INPUT_SIZES, v, 'md')

/**
 * Class list of the prompt box (the bordered container that holds the textarea and the toolbar). The ring shows while the
 * textarea has keyboard focus; forced-colors mode draws an outline instead. `variant` changes the surface, `size` the text
 * size and padding. `<div :class="promptInputVariants({ variant: 'filled' })">` reuses the look on a plain element.
 */
export const promptInputVariants = cva(
  [
    'flex w-full min-w-0 flex-col gap-1 rounded-lg border text-foreground transition-[color,box-shadow]',
    'has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-3 has-[textarea:focus-visible]:ring-ring/40',
    'forced-colors:has-[textarea:focus-visible]:outline-2 forced-colors:has-[textarea:focus-visible]:outline-offset-2',
    'has-[textarea[aria-invalid=true]]:border-destructive has-[textarea:disabled]:cursor-not-allowed has-[textarea:disabled]:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: 'border-input bg-background text-foreground shadow-xs dark:bg-input/30',
        filled: 'border-transparent bg-muted text-foreground forced-colors:border-[ButtonText]',
        minimal: 'border-transparent bg-transparent hover:border-input forced-colors:border-[ButtonText]',
      },
      size: {
        sm: 'p-1.5 text-md md:text-sm',
        md: 'p-2 text-md md:text-base',
        lg: 'p-3 text-md',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

export type PromptInputVariants = VariantProps<typeof promptInputVariants>
