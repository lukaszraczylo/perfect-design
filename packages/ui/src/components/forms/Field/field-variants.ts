/**
 * Variation fragments shared by every text field (Input, Textarea, NumberInput, PasswordInput, SearchInput, DateInput, TimeInput,
 * NativeSelect, Select trigger, Combobox, MultiSelect, TagsInput, CopyField, PinInput, FileDropzone, DatePicker, DateRangePicker,
 * InputGroup) so all of them vary identically. Defaults (`outline`, `rounded`, `default`, `md`) add no classes, so the default
 * output of each control is unchanged. Written as complete literals so Tailwind's scanner picks every class up.
 */
import { cva } from '../../../lib/cva'
import { faCircleCheck, faCircleExclamation, faTriangleExclamation } from '../../../lib/icons'
import type { IconDefinition } from '../../../lib/icons-tools'
import { fieldSurface } from '../../../lib/styles'
import { forcedInvalid } from './field-styles'

export const FIELD_VARIANTS = ['outline', 'filled', 'underline', 'ghost'] as const
export const FIELD_SHAPES = ['rounded', 'pill', 'square'] as const
export const FIELD_STATUSES = ['default', 'success', 'warning', 'error'] as const
export const FIELD_SIZES = ['xs', 'sm', 'md', 'lg'] as const

export type FieldVariant = (typeof FIELD_VARIANTS)[number]
export type FieldShape = (typeof FIELD_SHAPES)[number]
export type FieldStatus = (typeof FIELD_STATUSES)[number]
export type FieldSize = (typeof FIELD_SIZES)[number]

/** Height and text size by `size`. `xs` is 28px tall; 16px text below `md` and a 44px touch target stay for every size but `lg`. */
export const FIELD_SIZE_CLASSES: Record<FieldSize, string> = {
  xs: 'h-7 px-2 text-md md:text-xs pointer-coarse:min-h-11',
  sm: 'h-8 text-md md:text-sm pointer-coarse:min-h-11',
  md: 'h-9 text-md md:text-base pointer-coarse:min-h-11',
  lg: 'h-11 text-md',
}

/**
 * Surface treatment. `outline` is the default and adds nothing. `filled` is `muted` in light mode. In dark mode `fieldSurface` fills
 * every field with `input/30`, which is almost the `muted` colour (about 1.10:1 on the page), so `filled` would be indistinguishable
 * from `outline`; it uses `card` there instead, which is at least 1.15:1 away from that outline fill over the page and over a card
 * (contrast.test.ts) and keeps the covered foreground/card and muted-foreground/card text pairs. Every variant keeps a visible boundary or fill (forced-colors
 * draws a border) and the focus indicator stays a ring or a thicker bottom border, never colour alone.
 */
export const FIELD_VARIANT_CLASSES: Record<FieldVariant, string> = {
  outline: '',
  filled: 'bg-muted shadow-none dark:bg-card',
  underline:
    'rounded-none border-0 border-b border-input bg-transparent px-0 shadow-none focus-visible:border-b-2 focus-visible:ring-0 dark:bg-transparent forced-colors:border-b-[ButtonText]',
  ghost: 'border-transparent bg-transparent shadow-none hover:border-input focus-visible:bg-background dark:bg-transparent forced-colors:border-[ButtonText]',
}

/** Corner shape. `rounded` is the default. Multi-line fields use `rounded-xl` for `pill` (a full pill would clip the text). */
export const FIELD_SHAPE_CLASSES: Record<FieldShape, string> = {
  rounded: '',
  pill: 'rounded-full px-4',
  square: 'rounded-none',
}
export const FIELD_SHAPE_CLASSES_MULTILINE: Record<FieldShape, string> = {
  rounded: '',
  pill: 'rounded-xl px-4',
  square: 'rounded-none',
}

/**
 * Status colouring. Success and error use the tested `success` / `destructive` on background pairs; warning uses
 * `warning-foreground` in light mode and `warning` in dark mode (the pair the tinted-text contrast test covers).
 * The colour is always paired with a status icon and (success, warning) text for assistive tech, see `FieldStatusIcon`.
 */
export const FIELD_STATUS_CLASSES: Record<FieldStatus, string> = {
  default: '',
  success: 'border-success focus-visible:border-success focus-visible:ring-success/30 dark:focus-visible:ring-success/40',
  warning:
    'border-warning-foreground focus-visible:border-warning-foreground focus-visible:ring-warning-foreground/30 dark:border-warning dark:focus-visible:border-warning dark:focus-visible:ring-warning/40',
  error: 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/40',
}

export const FIELD_STATUS_ICONS: Record<Exclude<FieldStatus, 'default'>, IconDefinition> = {
  success: faCircleCheck,
  warning: faTriangleExclamation,
  error: faCircleExclamation,
}

/** Icon colour per status (same token pairs as the borders). */
export const FIELD_STATUS_ICON_CLASSES: Record<Exclude<FieldStatus, 'default'>, string> = {
  success: 'text-success',
  warning: 'text-warning-foreground dark:text-warning',
  error: 'text-destructive',
}

/** Screen reader text for the status icon. `error` has none: `aria-invalid` and the linked error message already say it. */
export const FIELD_STATUS_TEXT: Record<'success' | 'warning', string> = { success: 'Valid', warning: 'Warning' }

/** Padding that keeps text clear of the status icon (inline-end). */
export const FIELD_STATUS_PAD = 'pe-9'

const pick = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback)
/** Unknown values fall back to the default. */
export const normalizeVariant = (v: unknown) => pick(FIELD_VARIANTS, v, 'outline')
export const normalizeShape = (v: unknown) => pick(FIELD_SHAPES, v, 'rounded')
export const normalizeStatus = (v: unknown) => pick(FIELD_STATUSES, v, 'default')
export const normalizeFieldSize = (v: unknown) => pick(FIELD_SIZES, v, 'md')

export interface FieldLookOptions {
  variant?: FieldVariant
  shape?: FieldShape
  status?: FieldStatus
  /** Textarea-like fields: `pill` becomes `rounded-xl`. */
  multiline?: boolean
}

/** Only the variation classes (variant, shape, status). Empty at the defaults. Use it when a control keeps its own base classes. */
export function fieldLookClasses({ variant, shape, status, multiline }: FieldLookOptions = {}): string {
  const s = normalizeShape(shape)
  const v = normalizeVariant(variant)
  // `underline` squares the corners itself; a shape would fight it.
  return [FIELD_VARIANT_CLASSES[v], v === 'underline' ? '' : (multiline ? FIELD_SHAPE_CLASSES_MULTILINE : FIELD_SHAPE_CLASSES)[s], FIELD_STATUS_CLASSES[normalizeStatus(status)]]
    .filter(Boolean)
    .join(' ')
}

/**
 * Full class list of a single-line text field: surface + size + variant + shape + status. With the defaults this is exactly the
 * string Input has always rendered. Reuse it on a plain `<input>`: `<input :class="fieldVariants({ variant: 'filled' })" />`.
 */
export const fieldVariants = cva([fieldSurface, 'py-1'], {
  variants: {
    size: FIELD_SIZE_CLASSES,
    variant: FIELD_VARIANT_CLASSES,
    shape: FIELD_SHAPE_CLASSES,
    status: FIELD_STATUS_CLASSES,
  },
  defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' },
  compoundVariants: [{ class: forcedInvalid }, { variant: 'underline', shape: ['pill', 'square'], class: 'rounded-none px-0' }],
})
