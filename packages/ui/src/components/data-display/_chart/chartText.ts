/** Text helpers shared by the newer SVG charts. Pure: no Vue, no DOM. */
import { truncateLabel } from './chartKit'

/**
 * A name on at most two lines of `maxChars`: it breaks at a space, and what still does not fit is cut with an
 * ellipsis. A single long word is cut on one line.
 */
export function wrapLabel(text: string, maxChars: number): string[] {
  const t = text.trim()
  const max = Math.max(3, Math.floor(Number.isFinite(maxChars) ? maxChars : 3))
  if (t.length <= max) return [t]
  const words = t.split(/\s+/)
  let first = ''
  let used = 0
  while (used < words.length) {
    const next = first ? `${first} ${words[used]}` : words[used]!
    if (next.length > max) break
    first = next
    used++
  }
  if (!first) return [truncateLabel(t, max)]
  const rest = words.slice(used).join(' ')
  return rest ? [first, truncateLabel(rest, max)] : [first]
}
