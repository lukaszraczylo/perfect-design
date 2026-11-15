import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'
import { focusRing, invalidRing } from '../../../lib/styles'
import { forcedInvalid } from '../Field/field-styles'

export const RADIO_GROUP_SIZES = ['sm', 'md', 'lg'] as const
export type RadioGroupSize = (typeof RADIO_GROUP_SIZES)[number]
export const normalizeRadioGroupSize = (value: unknown): RadioGroupSize => ((RADIO_GROUP_SIZES as readonly unknown[]).includes(value) ? (value as RadioGroupSize) : 'md')

const itemBase = cva(
  [
    // The ::after pseudo-element grows the hit area to at least 24px (WCAG 2.5.8) and ~40px for touch.
    'peer relative inline-flex aspect-square size-4 shrink-0 items-center justify-center rounded-full border border-input bg-transparent text-primary shadow-xs transition-[color,box-shadow] after:absolute after:-inset-1 pointer-coarse:after:-inset-3 dark:bg-input/30',
    'data-[state=checked]:border-primary',
    'disabled:cursor-not-allowed disabled:opacity-50',
    focusRing,
    invalidRing,
    forcedInvalid,
  ],
  {
    variants: {
      // Non-default values only add overrides; the merge below drops the classes they replace.
      tone: {
        primary: '',
        success: 'text-success data-[state=checked]:border-success',
        danger: 'text-destructive data-[state=checked]:border-destructive',
        info: 'text-info data-[state=checked]:border-info',
        neutral: 'text-foreground data-[state=checked]:border-foreground',
      },
      size: { sm: 'size-3.5 after:-inset-1.5', md: '', lg: 'size-5' },
      labeled: { true: 'mt-0.5', false: '' },
    },
    defaultVariants: { tone: 'primary', size: 'md', labeled: false },
  },
)

/**
 * Class string of one radio button. Conflicting classes are merged (later wins), so a non-default size or tone replaces the
 * default one. At the defaults the output is the original radio class string.
 */
export function radioGroupItemVariants(props: NonNullable<Parameters<typeof itemBase>[0]> = {}): string {
  return cn(itemBase(props))
}

const dotBase = cva('block size-2 rounded-full bg-primary forced-colors:bg-[CanvasText]', {
  variants: {
    tone: {
      primary: '',
      success: 'bg-success',
      danger: 'bg-destructive',
      info: 'bg-info',
      neutral: 'bg-foreground',
    },
    size: { sm: 'size-1.5', md: '', lg: 'size-2.5' },
  },
  defaultVariants: { tone: 'primary', size: 'md' },
})

/** Class string of the dot inside a checked radio. */
export function radioGroupDotVariants(props: NonNullable<Parameters<typeof dotBase>[0]> = {}): string {
  return cn(dotBase(props))
}

export type RadioGroupItemVariants = VariantProps<typeof radioGroupItemVariants>
