import { cn, type ClassValue } from '../../../lib/cn'
import { cva } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'
import { forcedChecked, forcedInvalid } from '../Field/field-styles'
import type { ChoiceTone } from '../Checkbox/tones'

export const SEGMENTED_VARIANTS = ['pill', 'underline', 'outline', 'filled'] as const
/** `pill` is a tray with a raised selected chip; `underline` a rule with a marker under the selected segment; `outline` a bordered tray with a bordered selection; `filled` a tray with a solid selection. */
export type SegmentedVariant = (typeof SEGMENTED_VARIANTS)[number]
/** `default` keeps the neutral look of each variant; the others colour the selected segment. */
export type SegmentedTone = 'default' | ChoiceTone
export type SegmentedOrientation = 'horizontal' | 'vertical'
export type SegmentedSize = 'sm' | 'md' | 'lg'

const TONES = ['default', 'primary', 'success', 'danger', 'neutral', 'info'] as const
const SIZES = ['sm', 'md', 'lg'] as const
const pick = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T => ((allowed as readonly unknown[]).includes(value) ? (value as T) : fallback)

export const normalizeSegmentedVariant = (value: unknown): SegmentedVariant => pick(SEGMENTED_VARIANTS, value, 'pill')
export const normalizeSegmentedTone = (value: unknown): SegmentedTone => pick(TONES, value, 'default')
export const normalizeSegmentedOrientation = (value: unknown): SegmentedOrientation => (value === 'vertical' ? 'vertical' : 'horizontal')
export const normalizeSegmentedSize = (value: unknown): SegmentedSize => pick(SIZES, value, 'md')

/** Selected-segment classes per tone for the pill look: a solid chip (the neutral tone is foreground on background). */
const PILL_TONE = {
  primary: 'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:hover:text-primary-foreground',
  success: 'data-[state=checked]:bg-success data-[state=checked]:text-success-foreground data-[state=checked]:hover:text-success-foreground',
  danger: 'data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground data-[state=checked]:hover:text-destructive-foreground',
  neutral: 'data-[state=checked]:bg-foreground data-[state=checked]:text-background data-[state=checked]:hover:text-background',
  info: 'data-[state=checked]:bg-info data-[state=checked]:text-info-foreground data-[state=checked]:hover:text-info-foreground',
} as const

/** Marker colour per tone for the underline and outline looks. `default` and `neutral` use the ink colour. */
const MARK = {
  default: 'data-[state=checked]:border-foreground',
  primary: 'data-[state=checked]:border-primary',
  success: 'data-[state=checked]:border-success',
  danger: 'data-[state=checked]:border-destructive',
  neutral: 'data-[state=checked]:border-foreground',
  info: 'data-[state=checked]:border-info',
} as const

/** Solid selection per tone for the filled look. `default` and `neutral` are foreground on background. */
const SOLID = {
  default: PILL_TONE.neutral,
  primary: PILL_TONE.primary,
  success: PILL_TONE.success,
  danger: PILL_TONE.danger,
  neutral: PILL_TONE.neutral,
  info: PILL_TONE.info,
} as const

const toneCompounds = <K extends 'underline' | 'outline'>(variant: K) => (Object.keys(MARK) as (keyof typeof MARK)[]).map((tone) => ({ variant, tone, class: MARK[tone] }))

const root = cva(
  'max-w-full flex-wrap items-center gap-1 rounded-lg border border-transparent bg-muted p-1 text-muted-foreground ' + forcedInvalid,
  {
    variants: {
      fullWidth: { true: 'flex w-full', false: 'inline-flex' },
      variant: {
        pill: '',
        underline: 'gap-0 rounded-none border-0 border-b border-border bg-transparent p-0',
        outline: 'border-input bg-transparent',
        filled: 'rounded-md',
      },
      orientation: { horizontal: '', vertical: 'flex-col flex-nowrap items-stretch' },
    },
    compoundVariants: [{ variant: 'underline', orientation: 'vertical', class: 'border-b-0 border-s' }],
    defaultVariants: { fullWidth: false, variant: 'pill', orientation: 'horizontal' },
  },
)

const item = cva(
  [
    'inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap select-none transition-[color,box-shadow,background-color] motion-reduce:transition-none pointer-coarse:min-h-9',
    'hover:text-foreground data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-sm',
    forcedChecked,
    'disabled:pointer-events-none disabled:opacity-50',
    focusRing,
  ],
  {
    variants: {
      size: {
        sm: 'h-6 px-2.5 text-xs',
        md: 'h-7 px-3 text-sm',
        lg: 'h-9 px-4 text-base',
      },
      fullWidth: { true: 'flex-1', false: '' },
      tone: { default: '', primary: '', success: '', danger: '', neutral: '', info: '' },
      variant: {
        pill: '',
        underline: '-mb-px rounded-none border-b-2 border-transparent data-[state=checked]:bg-transparent data-[state=checked]:shadow-none',
        outline: 'border border-transparent data-[state=checked]:bg-transparent data-[state=checked]:shadow-none',
        filled: 'rounded-sm data-[state=checked]:shadow-none',
      },
      orientation: { horizontal: '', vertical: 'justify-start' },
    },
    compoundVariants: [
      { fullWidth: true, orientation: 'vertical', class: 'flex-none' },
      { variant: 'underline', orientation: 'vertical', class: 'mb-0 border-b-0 border-s-2 -ms-px' },
      { variant: 'pill', tone: 'primary', class: PILL_TONE.primary },
      { variant: 'pill', tone: 'success', class: PILL_TONE.success },
      { variant: 'pill', tone: 'danger', class: PILL_TONE.danger },
      { variant: 'pill', tone: 'neutral', class: PILL_TONE.neutral },
      { variant: 'pill', tone: 'info', class: PILL_TONE.info },
      ...toneCompounds('underline'),
      ...toneCompounds('outline'),
      ...(Object.keys(SOLID) as (keyof typeof SOLID)[]).map((tone) => ({ variant: 'filled' as const, tone, class: SOLID[tone] })),
    ],
    defaultVariants: { size: 'md', fullWidth: false, variant: 'pill', orientation: 'horizontal', tone: 'default' },
  },
)

export interface SegmentedStyleProps {
  variant?: unknown
  tone?: unknown
  orientation?: unknown
  fullWidth?: boolean
  size?: unknown
  class?: ClassValue
}

/** Root (tray) classes. Unknown values fall back to the defaults; the result goes through tailwind-merge so overrides replace the pill base. */
export function segmentedControlVariants(props: SegmentedStyleProps = {}): string {
  return cn(
    root({
      fullWidth: !!props.fullWidth,
      variant: normalizeSegmentedVariant(props.variant),
      orientation: normalizeSegmentedOrientation(props.orientation),
    }),
    props.class,
  )
}

/** Segment (radio button) classes, including size, tone and the selected-state look of the chosen variant. */
export function segmentedControlItemVariants(props: SegmentedStyleProps = {}): string {
  return cn(
    item({
      size: normalizeSegmentedSize(props.size),
      fullWidth: !!props.fullWidth,
      variant: normalizeSegmentedVariant(props.variant),
      orientation: normalizeSegmentedOrientation(props.orientation),
      tone: normalizeSegmentedTone(props.tone),
    }),
    props.class,
  )
}
