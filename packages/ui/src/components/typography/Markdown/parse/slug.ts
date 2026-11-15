const MAX_SLUG = 100

/** Stable, URL-safe id from heading text. Keeps letters and digits of any script, lowercases, joins words with `-`. Empty when nothing usable remains. */
export function slugify(text: string): string {
  let out = ''
  let pendingDash = false
  for (const ch of String(text ?? '').normalize('NFC').toLowerCase()) {
    if (/[\p{L}\p{N}\p{M}_]/u.test(ch)) {
      if (pendingDash && out) out += '-'
      pendingDash = false
      out += ch
      if (out.length >= MAX_SLUG) break
    } else if (/[\s-]/u.test(ch)) {
      pendingDash = true
    }
  }
  return out
}

/** Returns a function that maps text to a document-unique id: duplicates get `-1`, `-2`... and empty text becomes `section`. */
export function createSlugger(prefix = ''): (text: string) => string {
  const seen = new Set<string>()
  const counts = new Map<string, number>()
  return (text: string) => {
    const base = (prefix ? `${prefix}-` : '') + (slugify(text) || 'section')
    let id = base
    if (seen.has(id)) {
      let n = counts.get(base) ?? 0
      do {
        n += 1
        id = `${base}-${n}`
      } while (seen.has(id))
      counts.set(base, n)
    }
    seen.add(id)
    return id
  }
}
