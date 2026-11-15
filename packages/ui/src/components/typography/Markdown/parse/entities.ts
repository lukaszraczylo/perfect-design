/** HTML character references: numeric (decimal and hex) plus a small named set. Anything else stays literal. */
const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  copy: '\u00a9',
  reg: '\u00ae',
  trade: '\u2122',
  hellip: '\u2026',
  mdash: '\u2014',
  ndash: '\u2013',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
  laquo: '\u00ab',
  raquo: '\u00bb',
  times: '\u00d7',
  divide: '\u00f7',
  deg: '\u00b0',
  plusmn: '\u00b1',
  middot: '\u00b7',
  bull: '\u2022',
  euro: '\u20ac',
  pound: '\u00a3',
  yen: '\u00a5',
  cent: '\u00a2',
  sect: '\u00a7',
  para: '\u00b6',
  larr: '\u2190',
  rarr: '\u2192',
  uarr: '\u2191',
  darr: '\u2193',
  ne: '\u2260',
  le: '\u2264',
  ge: '\u2265',
  colon: ':',
  Tab: '\t',
  NewLine: '\n',
  sol: '/',
  lpar: '(',
  rpar: ')',
  num: '#',
}

const ENTITY = /&(?:#[xX]([0-9a-fA-F]{1,6})|#([0-9]{1,7})|([A-Za-z][A-Za-z0-9]{1,31}));/y

/** Decode one reference starting at `index` (which must hold `&`). Returns the text and the length consumed, or `null`. */
export function matchEntity(text: string, index: number): { value: string; length: number } | null {
  ENTITY.lastIndex = index
  const m = ENTITY.exec(text)
  if (!m) return null
  let value: string | undefined
  if (m[1] !== undefined || m[2] !== undefined) {
    const code = m[1] !== undefined ? parseInt(m[1], 16) : parseInt(m[2], 10)
    value = code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff) ? '\ufffd' : String.fromCodePoint(code)
  } else {
    value = Object.hasOwn(NAMED, m[3]) ? NAMED[m[3]] : undefined
  }
  return value === undefined ? null : { value, length: m[0].length }
}

/** Replace every recognised character reference in `text`. */
export function decodeEntities(text: string): string {
  if (!text.includes('&')) return text
  let out = ''
  let last = 0
  let i = text.indexOf('&')
  while (i !== -1) {
    const hit = matchEntity(text, i)
    if (hit) {
      out += text.slice(last, i) + hit.value
      i += hit.length
      last = i
    } else {
      i += 1
    }
    i = text.indexOf('&', i)
  }
  return out + text.slice(last)
}

const ESCAPABLE = /\\([!-/:-@[-`{-~])/g

/** Resolve backslash escapes and character references (destinations, titles, info strings). */
export function unescapeString(text: string): string {
  if (!text.includes('\\') && !text.includes('&')) return text
  return decodeEntities(text.replace(ESCAPABLE, '$1'))
}
