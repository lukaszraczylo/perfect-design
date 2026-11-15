/**
 * Focus indicator for scrollable regions (`tabindex="0"` panels, code blocks) that sit inside an
 * `overflow-hidden` frame: an inset outline is never clipped, unlike the outward ring of `focusRing`.
 * The outline stays visible in forced-colors mode.
 *
 * Tailwind v4 `outline-hidden` sets `outline-style: none`, and `outline-2` only sets the width, so the style must be
 * restored with `focus-visible:outline-solid` or nothing is drawn (verified in Chrome: computed outline-style stayed `none`).
 */
export const insetFocus = 'outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring'
