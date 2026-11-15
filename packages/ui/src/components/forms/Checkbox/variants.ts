import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'
import { focusRing, invalidRing } from '../../../lib/styles'
import { forcedInvalid } from '../Field/field-styles'

export const CHECKBOX_SHAPES = ['rounded', 'square', 'circle'] as const
export type CheckboxShape = (typeof CHECKBOX_SHAPES)[number]
export const CHECKBOX_SIZES = ['sm', 'md', 'lg'] as const
export type CheckboxSize = (typeof CHECKBOX_SIZES)[number]

export const normalizeCheckboxShape = (value: unknown): CheckboxShape => ((CHECKBOX_SHAPES as readonly unknown[]).includes(value) ? (value as CheckboxShape) : 'rounded')
export const normalizeCheckboxSize = (value: unknown): CheckboxSize => ((CHECKBOX_SIZES as readonly unknown[]).includes(value) ? (value as CheckboxSize) : 'md')

/** Checked and indeterminate surface for one tone: complete literals so Tailwind sees every class. */
const checked = {
  success:
    'data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground data-[state=indeterminate]:border-success data-[state=indeterminate]:bg-success data-[state=indeterminate]:text-success-foreground',
  danger:
    'data-[state=checked]:border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground data-[state=indeterminate]:border-destructive data-[state=indeterminate]:bg-destructive data-[state=indeterminate]:text-destructive-foreground',
  info: 'data-[state=checked]:border-info data-[state=checked]:bg-info data-[state=checked]:text-info-foreground data-[state=indeterminate]:border-info data-[state=indeterminate]:bg-info data-[state=indeterminate]:text-info-foreground',
  neutral:
    'data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background data-[state=indeterminate]:border-foreground data-[state=indeterminate]:bg-foreground data-[state=indeterminate]:text-background',
}

const checkboxBase = cva(
  [
    // The dark-mode fill is scoped to the unchecked state. Unscoped, it ties on specificity
    // with the checked background and is emitted after it, so a checked box stayed grey in dark mode.
    'peer relative inline-flex shrink-0 items-center justify-center rounded-sm border border-input bg-transparent shadow-xs transition-[color,box-shadow] after:absolute pointer-coarse:after:-inset-3 dark:data-[state=unchecked]:bg-input/30',
    'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
    'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
    'disabled:cursor-not-allowed disabled:opacity-50',
    focusRing,
    invalidRing,
    forcedInvalid,
  ],
  {
    variants: {
      // Non-default values only add overrides; the merge below drops the classes they replace.
      tone: { primary: '', ...checked },
      shape: { rounded: '', square: 'rounded-none', circle: 'rounded-full' },
      // The ::after pseudo-element grows the hit area to at least 24px (WCAG 2.5.8) and to ~40px for touch.
      size: {
        sm: 'size-3.5 after:-inset-1.5',
        md: 'size-4 after:-inset-1',
        lg: 'size-5 after:-inset-1',
      },
      // Aligns the box with the first line of the label.
      labeled: { true: 'mt-0.5', false: '' },
    },
    defaultVariants: { tone: 'primary', shape: 'rounded', size: 'md', labeled: false },
  },
)

type CheckboxVariantInput = NonNullable<Parameters<typeof checkboxBase>[0]>

/**
 * Class string of the checkbox box. Conflicting classes are merged (later wins), so a non-default tone or shape replaces the
 * default one instead of sitting next to it. At the defaults the output is the original checkbox class string.
 */
export function checkboxVariants(props: CheckboxVariantInput = {}): string {
  return cn(checkboxBase(props))
}

export type CheckboxVariants = VariantProps<typeof checkboxVariants>
