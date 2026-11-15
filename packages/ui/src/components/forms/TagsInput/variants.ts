import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'
import { fieldSurface, touchTarget } from '../../../lib/styles'
import { FIELD_SHAPE_CLASSES_MULTILINE, FIELD_STATUS_PAD, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'

/**
 * The tags container holds the focus ring itself: focus is inside it (on the text input or a remove button), so the
 * variation classes use `focus-within:` where the shared single-line maps use `focus-visible:`. Written as complete
 * literals so Tailwind's scanner picks every class up.
 */
export const TAGS_INPUT_SIZES: Record<FieldSize, string> = {
  xs: 'min-h-7 px-1.5 py-0.5',
  sm: 'min-h-8',
  md: 'min-h-9',
  lg: 'min-h-11 px-3',
}

/** Text size of the typing input by container `size`: 16px below `md`, then the compact size (`lg` stays 16px). */
export const TAGS_INPUT_TEXT: Record<FieldSize, string> = {
  xs: 'text-md md:text-xs',
  sm: 'text-md md:text-sm',
  md: 'text-md md:text-base',
  lg: 'text-md',
}

export const TAGS_INPUT_VARIANT_CLASSES: Record<FieldVariant, string> = {
  outline: '',
  filled: 'bg-muted shadow-none dark:bg-card',
  underline:
    'rounded-none border-0 border-b border-input bg-transparent px-0 shadow-none focus-within:border-b-2 focus-within:ring-0 dark:bg-transparent forced-colors:border-b-[ButtonText]',
  ghost: 'border-transparent bg-transparent shadow-none hover:border-input focus-within:bg-background dark:bg-transparent forced-colors:border-[ButtonText]',
}

export const TAGS_INPUT_STATUS_CLASSES: Record<FieldStatus, string> = {
  default: '',
  success: 'border-success focus-within:border-success focus-within:ring-success/30 dark:focus-within:ring-success/40',
  warning:
    'border-warning-foreground focus-within:border-warning-foreground focus-within:ring-warning-foreground/30 dark:border-warning dark:focus-within:border-warning dark:focus-within:ring-warning/40',
  error: 'border-destructive focus-within:border-destructive focus-within:ring-destructive/30 dark:focus-within:ring-destructive/40',
}

/** Vertical position of the status icon: the first row of tags, so it stays put while the tags wrap. */
export const TAGS_INPUT_ICON_TOP: Record<FieldSize, string> = { xs: 'top-1.5', sm: 'top-2', md: 'top-2.5', lg: 'top-3.5' }

const base = cva(
  [
    fieldSurface,
    touchTarget +
      ' flex flex-wrap items-center gap-1.5 px-2 py-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40 forced-colors:focus-within:outline-2 forced-colors:focus-within:outline-solid data-[invalid]:border-destructive data-[invalid]:ring-destructive/20 data-[disabled]:cursor-not-allowed data-[disabled]:border-dashed',
  ],
  {
    variants: {
      size: TAGS_INPUT_SIZES,
      shape: FIELD_SHAPE_CLASSES_MULTILINE,
      variant: TAGS_INPUT_VARIANT_CLASSES,
      status: TAGS_INPUT_STATUS_CLASSES,
      /** End padding for the status icon. Last, so a shape or the underline cannot reset it. */
      pad: { none: '', status: `relative ${FIELD_STATUS_PAD}` },
    },
    defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default', pad: 'none' },
  },
)

/**
 * Class list of the TagsInput container: field surface, size, variant, shape, status. Conflicting utilities are resolved
 * (later wins), so it can be put on a plain `<div>` that wraps your own chips and `<input>`.
 */
export const tagsInputVariants = (props?: Parameters<typeof base>[0]): string => cn(base(props))

export type TagsInputVariants = VariantProps<typeof tagsInputVariants>
