import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/**
 * Accordion styling.
 *
 * - `variant`: `flush` (default: items divided by a rule, no frame), `bordered` (the whole accordion in one rounded frame),
 *   `separated` (each item its own bordered card, with gaps) and `filled` (each item on a muted surface, no borders).
 * - `size`: `sm` | `md` (default) | `lg` for the trigger and content text and padding.
 * - `iconPosition`: `end` (default) or `start`, where the chevron (or the `icon` slot) sits relative to the title.
 * - Size classes conflict with the base on purpose: pass the result through `cn()` (the components do).
 */
export const accordionVariants = cva('w-full', {
  variants: {
    variant: {
      flush: '',
      bordered: 'rounded-lg border px-4',
      separated: 'flex flex-col gap-2',
      filled: 'flex flex-col gap-1.5',
    },
  },
  defaultVariants: { variant: 'flush' },
})

export const accordionItemVariants = cva('border-b last:border-b-0', {
  variants: {
    variant: {
      flush: '',
      bordered: '',
      separated: 'rounded-lg border bg-card px-4 text-card-foreground last:border-b',
      filled: 'rounded-lg border-b-0 bg-muted/50 px-4',
    },
  },
  defaultVariants: { variant: 'flush' },
})

export const accordionTriggerVariants = cva(
  [
    'group flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-start text-sm font-medium motion-safe:transition-colors hover:underline disabled:pointer-events-none disabled:opacity-50 pointer-coarse:min-h-11',
    focusRing,
  ],
  {
    variants: {
      size: { sm: 'py-2 text-xs', md: '', lg: 'py-5 text-base' },
      iconPosition: { end: '', start: 'justify-start' },
    },
    defaultVariants: { size: 'md', iconPosition: 'end' },
  },
)

export const accordionContentVariants = cva(
  'overflow-hidden text-sm data-[state=closed]:animate-ds-collapse-up data-[state=open]:animate-ds-collapse-down motion-reduce:animate-none',
  {
    variants: { size: { sm: 'text-xs', md: '', lg: 'text-base' } },
    defaultVariants: { size: 'md' },
  },
)

export const accordionContentInnerVariants = cva('pb-4', {
  variants: { size: { sm: 'pb-2', md: '', lg: 'pb-5' } },
  defaultVariants: { size: 'md' },
})

export type AccordionRootVariants = VariantProps<typeof accordionVariants>
export type AccordionVariant = NonNullable<AccordionRootVariants['variant']>
export type AccordionSize = NonNullable<VariantProps<typeof accordionTriggerVariants>['size']>
export type AccordionIconPosition = NonNullable<VariantProps<typeof accordionTriggerVariants>['iconPosition']>
export const ACCORDION_VARIANTS: readonly AccordionVariant[] = ['flush', 'bordered', 'separated', 'filled']
export const ACCORDION_SIZES: readonly AccordionSize[] = ['sm', 'md', 'lg']
export const ACCORDION_ICON_POSITIONS: readonly AccordionIconPosition[] = ['end', 'start']
