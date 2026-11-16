import { cva, type VariantProps } from '../../../lib/cva'
import type { AnsiColor, AnsiStyle } from './ansi'
import type { LogLevel } from './logs'
import { cn } from '../../../lib/cn'

export const LOG_VIEWER_VARIANTS = ['plain', 'panel', 'terminal'] as const
export type LogViewerVariant = (typeof LOG_VIEWER_VARIANTS)[number]
export const LOG_VIEWER_SIZES = ['sm', 'md', 'lg'] as const
export type LogViewerSize = (typeof LOG_VIEWER_SIZES)[number]
export const LOG_VIEWER_DENSITIES = ['comfortable', 'compact'] as const
export type LogViewerDensity = (typeof LOG_VIEWER_DENSITIES)[number]

/** Frame and text size. `plain` has no frame, `panel` is a bordered card, `terminal` a heavier ink frame. */
export const logViewerVariants = cva('relative flex min-w-0 max-w-full flex-col overflow-hidden text-foreground', {
  variants: {
    variant: {
      plain: '',
      panel: 'rounded-md border bg-card',
      terminal: 'rounded-md border-2 border-foreground bg-card',
    },
    size: { sm: 'text-xs', md: 'text-sm', lg: 'text-base' },
  },
  defaultVariants: { variant: 'panel', size: 'md' },
})

/** Row height in px per size and density (fixed so windowing is exact; every row stays a 24px target or taller). */
export const LOG_ROW_HEIGHT: Record<LogViewerDensity, Record<LogViewerSize, number>> = {
  comfortable: { sm: 24, md: 28, lg: 32 },
  compact: { sm: 24, md: 24, lg: 28 },
}
/** Rough width of one monospace character in px, used to estimate wrapped heights before they are measured. */
export const LOG_CHAR_WIDTH: Record<LogViewerSize, number> = { sm: 7.3, md: 8.5, lg: 9.7 }

const badge = cva('inline-flex shrink-0 items-center justify-center rounded-sm border px-1 text-xs leading-5 font-medium', {
  variants: {
    level: {
      debug: 'border-border text-muted-foreground',
      info: 'border-info/40 bg-info/15 text-info',
      warn: 'border-warning/50 bg-warning/20 text-warning-foreground dark:text-warning',
      // Solid surface: the row already carries a destructive/10 tint, and stacking a second tint left the text below 4.5:1.
      error: 'border-destructive/40 bg-background text-destructive',
    },
  },
  defaultVariants: { level: 'debug' },
})
export const logLevelBadgeVariants = (level: LogLevel): string => badge({ level })

/** Row tint for warnings and errors; the badge text carries the level as well. */
export const LOG_ROW_TONE: Record<LogLevel, string> = { debug: '', info: '', warn: 'bg-warning/10', error: 'bg-destructive/10' }

const FG: Record<AnsiColor, string> = {
  black: 'text-muted-foreground',
  red: 'text-destructive',
  green: 'text-success',
  yellow: 'text-warning-foreground dark:text-warning',
  blue: 'text-info',
  magenta: 'text-primary',
  cyan: 'text-info',
  white: 'text-foreground',
}
const BG: Record<AnsiColor, string> = {
  black: 'bg-muted',
  red: 'bg-destructive/15',
  green: 'bg-success/15',
  yellow: 'bg-warning/20',
  blue: 'bg-info/15',
  magenta: 'bg-primary/10',
  cyan: 'bg-info/15',
  white: 'bg-accent',
}
/** Token classes for an ANSI style. Colour names map to semantic tokens; weight and decoration carry meaning where tokens are shared. */
export function ansiClasses(style: AnsiStyle): string {
  if (style.inverse) return cn('bg-foreground text-background', style.bold && 'font-semibold', style.underline && 'underline', style.strike && 'line-through', style.italic && 'italic')
  return cn(
    style.fg && FG[style.fg],
    style.bg && BG[style.bg],
    style.dim && !style.fg && 'text-muted-foreground',
    style.bold && 'font-semibold',
    style.italic && 'italic',
    style.underline && 'underline',
    style.strike && 'line-through',
  )
}

export type LogViewerVariants = VariantProps<typeof logViewerVariants>
