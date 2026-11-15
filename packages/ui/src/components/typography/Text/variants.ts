import { cva, type VariantProps } from '../../../lib/cva'

export const textVariants = cva('', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      md: 'text-md',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
    },
    tone: {
      default: '',
      muted: 'text-muted-foreground',
      /** Same colour as `muted`: an opacity-reduced grey fails WCAG AA contrast, so it is no longer dimmer. */
      subtle: 'text-muted-foreground',
      foreground: 'text-foreground',
      primary: 'text-primary',
      success: 'text-success',
      warning: 'text-warning-foreground dark:text-warning',
      danger: 'text-destructive',
      info: 'text-info',
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
      start: 'text-start',
      end: 'text-end',
    },
    leading: {
      none: 'leading-none',
      tight: 'leading-tight',
      snug: 'leading-snug',
      normal: 'leading-normal',
      relaxed: 'leading-relaxed',
      loose: 'leading-loose',
    },
    transform: {
      uppercase: 'uppercase',
      lowercase: 'lowercase',
      capitalize: 'capitalize',
    },
    italic: {
      true: 'italic',
      false: '',
    },
    wrap: {
      balance: 'text-balance',
      pretty: 'text-pretty',
      nowrap: 'text-nowrap',
    },
    variant: {
      default: '',
      caption: '',
      label: 'leading-none',
      overline: '',
      mono: 'font-mono',
    },
  },
  defaultVariants: { size: 'base', tone: 'default' },
})

export const textSizes = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl'] as const
export const textVariantNames = ['default', 'caption', 'label', 'overline', 'mono'] as const

/** Fixed map so the Tailwind scanner sees every `line-clamp-N` class. */
export const lineClampClasses = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
} as const

export type TextVariants = VariantProps<typeof textVariants>
export type TextSize = NonNullable<TextVariants['size']>
export type TextTone = NonNullable<TextVariants['tone']>
export type TextWeight = NonNullable<TextVariants['weight']>
export type TextAlign = NonNullable<TextVariants['align']>
export type TextLeading = NonNullable<TextVariants['leading']>
export type TextTransform = NonNullable<TextVariants['transform']>
export type TextWrap = NonNullable<TextVariants['wrap']>
export type TextVariant = NonNullable<TextVariants['variant']>
export type TextLines = keyof typeof lineClampClasses

/**
 * Size / tone / weight a `variant` implies. Explicit props always win; the preset only fills what the
 * consumer left unset, so `<Text variant="caption" size="sm">` is a small caption, not an xs one.
 */
export const textPresets: Record<TextVariant, { size?: TextSize; tone?: TextTone; weight?: TextWeight }> = {
  default: {},
  caption: { size: 'xs', tone: 'muted' },
  label: { size: 'sm', weight: 'medium' },
  overline: { size: 'xs', tone: 'muted', weight: 'medium' },
  mono: { size: 'sm' },
}
