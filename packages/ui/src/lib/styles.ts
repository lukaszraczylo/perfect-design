/**
 * Shared class fragments. Components compose these so that focus, invalid and disabled
 * states look identical everywhere. Change here → change everywhere.
 */
export const focusRing =
  'outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40'

export const invalidRing =
  'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40'

export const disabledStyles = 'disabled:pointer-events-none disabled:opacity-50'

/** Text-field surface shared by Input, Textarea, Select trigger, NativeSelect, TagsInput... */
export const fieldSurface =
  'w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-base shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 ' +
  focusRing +
  ' ' +
  invalidRing

/** Popover-like floating surface (Popover, Dropdown, Select content, Tooltip uses its own). */
export const floatingSurface =
  'z-(--z-dropdown) rounded-md border bg-popover text-popover-foreground shadow-md'

/** Coarse-pointer (touch) minimum hit area. */
export const touchTarget = 'pointer-coarse:min-h-11'

/**
 * Groove of a progress bar, stat bar, gauge or KPI progress. `muted` is about 1.2:1 against a dark card, so the track
 * disappears; `input` blended at 45% is at least 1.5:1 against background and card in every theme (contrast.test.ts).
 */
export const trackSurface = 'bg-input/45'
/** Same colour for an SVG stroke (the `Gauge` track). */
export const trackStroke = 'stroke-input/45'
