import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/**
 * ShowMore styling.
 *
 * - Root: `layout` puts the toggle `below` the content (default) or `inline`, beside the content at its last line.
 * - Content clamp: `lines` maps to one of six literal `line-clamp-*` classes, `maxHeight` to a literal `max-h-*` preset
 *   (it wins over `lines`). Both are lookups, never built from strings, so Tailwind sees every class.
 * - Toggle: `appearance` (`link`, `button`, `outline`), `size`, and for the `below` layout `align`
 *   (`start`, `center`, `end`, logical, so right-to-left flips them). The toggle is at least 24px tall and 44px on
 *   coarse pointers.
 */
export const showMoreVariants = cva('flex w-full min-w-0', {
  variants: {
    layout: {
      below: 'flex-col gap-1',
      inline: 'flex-row items-end gap-2',
    },
  },
  defaultVariants: { layout: 'below' },
})

export const showMoreContentVariants = cva('min-w-0 break-words', {
  variants: {
    layout: {
      below: '',
      inline: 'flex-1',
    },
  },
  defaultVariants: { layout: 'below' },
})

export const showMoreToggleVariants = cva(
  ['inline-flex shrink-0 items-center justify-center gap-1 rounded-md font-medium whitespace-nowrap select-none pointer-coarse:min-h-11', focusRing],
  {
    variants: {
      appearance: {
        link: 'px-1 text-primary underline-offset-4 hover:underline',
        button: 'bg-primary/10 text-primary hover:bg-primary/20',
        outline: 'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'min-h-6 text-xs',
        md: 'min-h-8 text-sm',
        lg: 'min-h-10 text-sm',
      },
      layout: {
        below: '',
        inline: '',
      },
      align: {
        start: '',
        center: '',
        end: '',
      },
    },
    compoundVariants: [
      { appearance: ['button', 'outline'], size: 'sm', class: 'px-2' },
      { appearance: ['button', 'outline'], size: 'md', class: 'px-3' },
      { appearance: ['button', 'outline'], size: 'lg', class: 'px-4' },
      { layout: 'below', align: 'start', class: 'self-start' },
      { layout: 'below', align: 'center', class: 'self-center' },
      { layout: 'below', align: 'end', class: 'self-end' },
    ],
    defaultVariants: { appearance: 'link', size: 'md', layout: 'below', align: 'start' },
  },
)

export type ShowMoreLayout = 'below' | 'inline'
export type ShowMoreAlign = 'start' | 'center' | 'end'
export type ShowMoreAppearance = 'link' | 'button' | 'outline'
export type ShowMoreSize = 'sm' | 'md' | 'lg'
export type ShowMoreMaxHeight = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ShowMoreVariants = VariantProps<typeof showMoreToggleVariants>

export const SHOW_MORE_LAYOUTS: readonly ShowMoreLayout[] = ['below', 'inline']
export const SHOW_MORE_ALIGNS: readonly ShowMoreAlign[] = ['start', 'center', 'end']
export const SHOW_MORE_APPEARANCES: readonly ShowMoreAppearance[] = ['link', 'button', 'outline']
export const SHOW_MORE_SIZES: readonly ShowMoreSize[] = ['sm', 'md', 'lg']
export const SHOW_MORE_MAX_HEIGHTS: readonly ShowMoreMaxHeight[] = ['xs', 'sm', 'md', 'lg', 'xl']

export const SHOW_MORE_DEFAULT_LINES = 3
export const SHOW_MORE_MAX_LINES = 6

/** Literal classes, one per supported line count. */
export const showMoreLineClamp: Record<number, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
}

/** Literal height presets: 64px, 96px, 128px, 192px and 256px at the default spacing scale. */
export const showMoreMaxHeight: Record<ShowMoreMaxHeight, string> = {
  xs: 'max-h-16 overflow-hidden',
  sm: 'max-h-24 overflow-hidden',
  md: 'max-h-32 overflow-hidden',
  lg: 'max-h-48 overflow-hidden',
  xl: 'max-h-64 overflow-hidden',
}

/** A whole number from 1 to 6. Not a number, NaN or below 1: 3. Above 6: 6. Fractions are truncated. */
export function resolveShowMoreLines(lines: unknown): number {
  if (typeof lines !== 'number' || Number.isNaN(lines)) return SHOW_MORE_DEFAULT_LINES
  const whole = Math.trunc(lines)
  if (whole < 1) return SHOW_MORE_DEFAULT_LINES
  return Math.min(whole, SHOW_MORE_MAX_LINES)
}
