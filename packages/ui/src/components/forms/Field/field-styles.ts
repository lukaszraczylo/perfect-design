/**
 * Class fragments shared by the text-like form controls in this folder group.
 * Written as complete literals so Tailwind's scanner picks every class up.
 */

/**
 * Control height and text size by `size`. Text is 16px (`text-md`) below `md` so iOS Safari does not zoom
 * the page on focus, and returns to the compact UI size from `md`. Touch pointers get a 44px minimum height.
 */
export const CONTROL_SIZES = {
  sm: 'h-8 text-md md:text-sm pointer-coarse:min-h-11',
  md: 'h-9 text-md md:text-base pointer-coarse:min-h-11',
  lg: 'h-11 text-md',
} as const

/** Forced-colors mode drops colour and shadow, so an invalid control gets a dashed border instead. */
export const forcedInvalid = 'forced-colors:aria-invalid:border-dashed'

/** Forced-colors mode replaces fills; checked and selected states use system colours so they stay visible. */
export const forcedChecked = 'forced-colors:data-[state=checked]:bg-[Highlight] forced-colors:data-[state=checked]:text-[HighlightText]'

/** Inline button inside a field (password toggle, clear): 24px minimum, larger for touch. */
export const fieldAddonButton =
  'absolute end-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors outline-hidden hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/40 pointer-coarse:size-9 disabled:pointer-events-none disabled:opacity-50'
