import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'
import { focusRing, invalidRing } from '../../../lib/styles'
import { forcedChecked, forcedInvalid } from '../Field/field-styles'

export const SWITCH_SIZES = ['sm', 'md', 'lg'] as const
export type SwitchSize = (typeof SWITCH_SIZES)[number]
export const normalizeSwitchSize = (value: unknown): SwitchSize => ((SWITCH_SIZES as readonly unknown[]).includes(value) ? (value as SwitchSize) : 'md')

const switchBase = cva(
  [
    // The ::after pseudo-element grows the hit area to at least 24px tall (WCAG 2.5.8) and ~40px for touch.
    'peer relative inline-flex shrink-0 items-center rounded-full border-2 border-transparent shadow-xs transition-colors after:absolute after:inset-x-0 after:-inset-y-1 pointer-coarse:after:-inset-y-3 motion-reduce:transition-none',
    'forced-colors:border-[ButtonText]',
    forcedChecked,
    forcedInvalid,
    'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
    'disabled:cursor-not-allowed disabled:opacity-50',
    focusRing,
    invalidRing,
    'aria-invalid:data-[state=unchecked]:bg-destructive/30',
  ],
  {
    variants: {
      // Non-default tones only replace the checked track colour. The off state keeps `bg-input`, so on and off still differ
      // by the thumb position (and the icon with `showIcons`), not by colour alone.
      tone: {
        primary: '',
        success: 'data-[state=checked]:bg-success',
        danger: 'data-[state=checked]:bg-destructive',
        info: 'data-[state=checked]:bg-info',
        neutral: 'data-[state=checked]:bg-foreground',
      },
      size: {
        sm: 'h-4 w-7',
        md: 'h-5 w-9',
        lg: 'h-6 w-11',
      },
      // A 16px track is shorter than the first line of its label.
      labeled: { true: '', false: '' },
      // On/off text inside the track (`onLabel` / `offLabel`, md and lg only): a wider track.
      texts: { true: '', false: '' },
    },
    compoundVariants: [
      { size: 'sm', labeled: true, class: 'mt-0.5' },
      { size: 'md', texts: true, class: 'w-14' },
      { size: 'lg', texts: true, class: 'w-16' },
      // The off track is muted with an input-coloured border, so muted-foreground text on muted (a tested pair) is legible and the
      // boundary stays 3:1. An invalid off track keeps the muted fill (the destructive border carries the error).
      { texts: true, class: 'data-[state=unchecked]:border-input data-[state=unchecked]:bg-muted dark:data-[state=unchecked]:bg-muted aria-invalid:data-[state=unchecked]:bg-muted aria-invalid:data-[state=unchecked]:border-destructive' },
    ],
    defaultVariants: { tone: 'primary', size: 'md', labeled: false, texts: false },
  },
)

/**
 * Class string of the switch track. Conflicting classes are merged (later wins), so a non-default tone replaces the default
 * checked colour. At the defaults the output is the original switch class string.
 */
export function switchVariants(props: NonNullable<Parameters<typeof switchBase>[0]> = {}): string {
  return cn(switchBase(props))
}

const thumbBase = cva(
  'pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform motion-reduce:transition-none data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground forced-colors:bg-[ButtonText] forced-colors:data-[state=checked]:bg-[HighlightText]',
  {
    variants: {
      tone: {
        primary: '',
        success: 'dark:data-[state=checked]:bg-success-foreground',
        danger: 'dark:data-[state=checked]:bg-destructive-foreground',
        info: 'dark:data-[state=checked]:bg-info-foreground',
        neutral: 'dark:data-[state=checked]:bg-background',
      },
      size: {
        sm: 'size-3 data-[state=checked]:translate-x-3 rtl:data-[state=checked]:-translate-x-3',
        md: 'size-4 data-[state=checked]:translate-x-4 rtl:data-[state=checked]:-translate-x-4',
        lg: 'size-5 data-[state=checked]:translate-x-5 rtl:data-[state=checked]:-translate-x-5',
      },
      // Longer travel across the wider track that holds the on/off text.
      texts: { true: '', false: '' },
      // With icons the thumb centres a glyph. The glyph is muted when off and takes the tone colour when on: light thumbs are
      // `background` and dark checked thumbs are the tone's foreground, so the pair is always the tone against its foreground.
      icons: { true: 'grid place-content-center data-[state=unchecked]:text-muted-foreground forced-colors:text-[Canvas] forced-colors:data-[state=checked]:text-[Highlight]', false: '' },
    },
    compoundVariants: [
      { size: 'md', texts: true, class: 'data-[state=checked]:translate-x-9 rtl:data-[state=checked]:-translate-x-9' },
      { size: 'lg', texts: true, class: 'data-[state=checked]:translate-x-10 rtl:data-[state=checked]:-translate-x-10' },
      { icons: true, tone: 'primary', class: 'data-[state=checked]:text-primary' },
      { icons: true, tone: 'success', class: 'data-[state=checked]:text-success' },
      { icons: true, tone: 'danger', class: 'data-[state=checked]:text-destructive' },
      { icons: true, tone: 'info', class: 'data-[state=checked]:text-info' },
      { icons: true, tone: 'neutral', class: 'data-[state=checked]:text-foreground' },
    ],
    defaultVariants: { tone: 'primary', size: 'md', icons: false, texts: false },
  },
)

/**
 * The on/off text inside the track. It sits on the side the thumb has left (start when on, end when off), is `aria-hidden` and
 * uses the tone's foreground on the tone track (tested pairs) and muted-foreground on the muted off track.
 */
export const switchTextVariants = cva('pointer-events-none absolute inset-y-0 flex max-w-7 items-center overflow-hidden text-xs leading-none font-medium whitespace-nowrap select-none', {
  variants: {
    state: {
      on: 'start-1',
      off: 'end-1 text-muted-foreground',
    },
    tone: {
      primary: '',
      success: '',
      danger: '',
      info: '',
      neutral: '',
    },
  },
  compoundVariants: [
    { state: 'on', tone: 'primary', class: 'text-primary-foreground' },
    { state: 'on', tone: 'success', class: 'text-success-foreground' },
    { state: 'on', tone: 'danger', class: 'text-destructive-foreground' },
    { state: 'on', tone: 'info', class: 'text-info-foreground' },
    { state: 'on', tone: 'neutral', class: 'text-background' },
  ],
  defaultVariants: { state: 'on', tone: 'primary' },
})

/** Class string of the switch thumb (translation, size, and the glyph colours when `icons` is on). */
export function switchThumbVariants(props: NonNullable<Parameters<typeof thumbBase>[0]> = {}): string {
  return cn(thumbBase(props))
}

export type SwitchVariants = VariantProps<typeof switchVariants>
