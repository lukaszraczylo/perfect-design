export interface CodeInfo {
  /** First word of the info string (case preserved), or an empty string. */
  language: string
  /** Value of `title=` or `filename=` (quotes allowed), when present. */
  filename?: string
}

const isWs = (c: string) => c === ' ' || c === '\t' || c === '\n'

/** Read `lang title="a b.yaml"` / `lang filename=a.yaml` from a fence info string. Unknown attributes are ignored. */
export function parseInfo(info: string): CodeInfo {
  const s = String(info ?? '').trim()
  let i = 0
  while (i < s.length && !isWs(s[i])) i += 1
  const language = s.slice(0, i)
  let title: string | undefined
  let file: string | undefined
  while (i < s.length) {
    while (i < s.length && isWs(s[i])) i += 1
    const keyStart = i
    while (i < s.length && s[i] !== '=' && !isWs(s[i])) i += 1
    const key = s.slice(keyStart, i).toLowerCase()
    let value = ''
    if (s[i] === '=') {
      i += 1
      const quote = s[i] === '"' || s[i] === "'" ? s[i] : ''
      if (quote) {
        i += 1
        const end = s.indexOf(quote, i)
        value = s.slice(i, end === -1 ? s.length : end)
        i = end === -1 ? s.length : end + 1
      } else {
        const start = i
        while (i < s.length && !isWs(s[i])) i += 1
        value = s.slice(start, i)
      }
    }
    if (key === 'title' && value) title ??= value
    else if (key === 'filename' && value) file ??= value
  }
  const filename = title ?? file
  return filename ? { language, filename } : { language }
}
