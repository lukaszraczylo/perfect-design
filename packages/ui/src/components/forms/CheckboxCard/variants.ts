import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'
import { normalizeChoiceTone, type ChoiceTone } from '../Checkbox/tones'

/** Surface styling shared by CheckboxCard and RadioCard. State comes from `data-state`, `data-disabled`, `data-invalid` on the root. */
const cardVariantsBase = cva(
  'relative flex w-full cursor-pointer items-start gap-3 rounded-lg border text-left transition-[color,box-shadow,background-color,border-color] motion-reduce:transition-none ' +
    'has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/40 ' +
    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 ' +
    'data-[invalid]:border-destructive data-[invalid]:ring-destructive/20 dark:data-[invalid]:ring-destructive/40 ' +
    // Forced colors drops box-shadow and fills: focus becomes an outline, checked a system-colour border, invalid a dashed border.
    'forced-colors:has-focus-visible:outline-2 forced-colors:has-focus-visible:outline-offset-2 forced-colors:has-focus-visible:outline-solid ' +
    'forced-colors:data-[state=checked]:border-[Highlight] forced-colors:data-[invalid]:border-dashed',
  {
    variants: {
      variant: {
        outline:
          'border-input bg-transparent shadow-xs not-data-[disabled]:hover:bg-accent/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5',
        filled:
          'border-transparent bg-muted not-data-[disabled]:hover:bg-muted/70 data-[state=checked]:border-primary data-[state=checked]:bg-primary/10',
      },
      size: {
        sm: 'gap-2.5 p-3 text-sm',
        md: 'p-4 text-sm',
        lg: 'gap-4 p-5 text-base',
      },
      /** Colour of the checked state. `primary` keeps the base classes. Overrides live in `compoundVariants` because they depend on the surface. */
      tone: { primary: '', success: '', danger: '', neutral: '', info: '' },
      /** `stacked` puts the icon above the text and pins the indicator to the top end corner. */
      layout: { default: '', stacked: 'flex-col' },
    },
    compoundVariants: [
      { variant: 'outline', tone: 'success', class: 'data-[state=checked]:border-success data-[state=checked]:bg-success/5' },
      { variant: 'outline', tone: 'danger', class: 'data-[state=checked]:border-destructive data-[state=checked]:bg-destructive/5' },
      { variant: 'outline', tone: 'neutral', class: 'data-[state=checked]:border-foreground data-[state=checked]:bg-foreground/5' },
      { variant: 'outline', tone: 'info', class: 'data-[state=checked]:border-info data-[state=checked]:bg-info/5' },
      { variant: 'filled', tone: 'success', class: 'data-[state=checked]:border-success data-[state=checked]:bg-success/10' },
      { variant: 'filled', tone: 'danger', class: 'data-[state=checked]:border-destructive data-[state=checked]:bg-destructive/10' },
      { variant: 'filled', tone: 'neutral', class: 'data-[state=checked]:border-foreground data-[state=checked]:bg-foreground/10' },
      { variant: 'filled', tone: 'info', class: 'data-[state=checked]:border-info data-[state=checked]:bg-info/10' },
    ],
    defaultVariants: { variant: 'outline', size: 'md', tone: 'primary', layout: 'default' },
  },
)

const VARIANTS = ['outline', 'filled'] as const
const SIZES = ['sm', 'md', 'lg'] as const
const LAYOUTS = ['default', 'stacked'] as const
const pick = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T => ((allowed as readonly unknown[]).includes(value) ? (value as T) : fallback)

export const normalizeCardVariant = (value: unknown): CardVariant => pick(VARIANTS, value, 'outline')
export const normalizeCardSize = (value: unknown): CardSize => pick(SIZES, value, 'md')
export const normalizeCardLayout = (value: unknown): CardLayout => pick(LAYOUTS, value, 'default')
export const normalizeCardTone = (value: unknown): CardTone => normalizeChoiceTone(value)

/**
 * Surface of the selectable cards. Unknown values fall back to the defaults and the result goes through tailwind-merge,
 * so a tone override replaces the primary classes instead of sitting next to them.
 */
export function checkboxCardVariants(props: { variant?: unknown; size?: unknown; tone?: unknown; layout?: unknown; class?: Parameters<typeof cn>[0] } = {}): string {
  return cn(
    cardVariantsBase({
      variant: normalizeCardVariant(props.variant),
      size: normalizeCardSize(props.size),
      tone: normalizeCardTone(props.tone),
      layout: normalizeCardLayout(props.layout),
    }),
    props.class,
  )
}

/** Checked-state classes of the indicator (box or dot) per tone. `primary` is the base look and adds nothing. */
export const CARD_INDICATOR_TONE: Record<CardTone, string> = {
  primary: '',
  success: 'data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground',
  danger: 'data-[state=checked]:border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground',
  neutral: 'data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background',
  info: 'data-[state=checked]:border-info data-[state=checked]:bg-info data-[state=checked]:text-info-foreground',
}

/** Colour of the leading icon while the card is checked, per tone. */
export const CARD_ICON_TONE: Record<CardTone, string> = {
  primary: '',
  success: 'group-data-[state=checked]:text-success',
  danger: 'group-data-[state=checked]:text-destructive',
  neutral: 'group-data-[state=checked]:text-foreground',
  info: 'group-data-[state=checked]:text-info',
}

export type CheckboxCardVariants = VariantProps<typeof cardVariantsBase>
export type CardVariant = 'outline' | 'filled'
export type CardSize = 'sm' | 'md' | 'lg'
export type CardTone = ChoiceTone
export type CardLayout = 'default' | 'stacked'
