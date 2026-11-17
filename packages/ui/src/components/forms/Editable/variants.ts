import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing, invalidRing, touchTarget } from '../../../lib/styles'

export const EDITABLE_VARIANTS = ['plain', 'outline', 'filled', 'underline'] as const
export type EditableVariant = (typeof EDITABLE_VARIANTS)[number]
export const EDITABLE_SIZES = ['xs', 'sm', 'md', 'lg'] as const
export type EditableSize = (typeof EDITABLE_SIZES)[number]

const base = cva('block min-h-8 w-full min-w-0 rounded-md border border-transparent px-2 py-1 text-left ' + touchTarget, {
  variants: {
    size: {
      xs: 'min-h-7 py-0.5 text-md md:text-xs',
      sm: 'text-md md:text-sm',
      md: 'text-md md:text-base',
      lg: 'text-lg',
    },
    /**
     * How the text looks BEFORE editing. `plain` reads as text until hovered, `outline` and `filled` always look like a
     * field, `underline` keeps a bottom rule. Forced-colors mode draws the border of every variant that has one.
     */
    variant: {
      plain: '',
      outline: '',
      filled: '',
      underline: '',
    },
    state: {
      preview:
        'cursor-text break-words whitespace-pre-wrap hover:border-input hover:bg-accent/50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 data-[readonly]:cursor-default data-[readonly]:hover:border-transparent data-[readonly]:hover:bg-transparent data-[empty]:text-muted-foreground ' +
        focusRing,
      editing: 'border-input bg-transparent shadow-xs dark:bg-input/30 ' + focusRing + ' ' + invalidRing,
    },
  },
  defaultVariants: { size: 'md', variant: 'plain', state: 'preview' },
  compoundVariants: [
    // outline: a visible border at rest; the hover fill is not needed because the border already says "field".
    { variant: 'outline', state: 'preview', class: 'border-input hover:bg-transparent forced-colors:border-[ButtonText] data-[readonly]:hover:border-input' },
    // filled: a muted fill at rest (muted-foreground placeholder on muted is a tested pair).
    { variant: 'filled', state: 'preview', class: 'bg-muted text-foreground hover:border-input hover:bg-muted forced-colors:border-[ButtonText] data-[readonly]:hover:bg-muted' },
    { variant: 'filled', state: 'editing', class: 'border-transparent bg-muted text-foreground shadow-none dark:bg-muted' },
    // underline: only the bottom rule; editing thickens it instead of ringing the box.
    {
      variant: 'underline',
      state: 'preview',
      class: 'rounded-none border-0 border-b border-input px-0 hover:bg-transparent forced-colors:border-b-[ButtonText] data-[readonly]:hover:border-b-input',
    },
    {
      variant: 'underline',
      state: 'editing',
      class: 'rounded-none border-0 border-b border-input bg-transparent px-0 shadow-none focus-visible:border-b-2 focus-visible:ring-0 dark:bg-transparent forced-colors:border-b-[ButtonText]',
    },
  ],
})

/**
 * Text metrics and surface of the preview and the editing control of `Editable`. Conflicting utilities are resolved
 * (later wins), so it can be put on plain elements: `<span :class="editableVariants({ variant: 'filled' })">`.
 */
export const editableVariants = (props?: Parameters<typeof base>[0]): string => cn(base(props))

export type EditableVariants = VariantProps<typeof editableVariants>
