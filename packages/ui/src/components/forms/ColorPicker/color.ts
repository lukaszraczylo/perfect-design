/** Hex colour helpers for ColorPicker. */

const HEX_RE = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * Normalise `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` (leading `#` optional, any case, surrounding space ignored)
 * to lowercase `#rrggbb` / `#rrggbbaa`. Returns `null` for anything else (including non-strings).
 */
export function normalizeColorPickerHex(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const m = HEX_RE.exec(value.trim())
  if (!m) return null
  const h = m[1].toLowerCase()
  return '#' + (h.length <= 4 ? [...h].map((c) => c + c).join('') : h)
}

/** Default palette (data, not styling): neutrals plus a spread of hues. Override with the `swatches` prop. */
export const COLOR_PICKER_SWATCHES: readonly string[] = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#111827', '#6b7280', '#d1d5db', '#ffffff',
]
