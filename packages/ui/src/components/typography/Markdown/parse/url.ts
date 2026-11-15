import { decodeEntities } from './entities'

/** Schemes a link may use. `allowedProtocols` can only narrow this list. Relative paths and `#fragments` are always fine. */
export const SAFE_LINK_PROTOCOLS = ['http', 'https', 'mailto', 'tel'] as const
/** Schemes an image may use, plus `data:image/(png|jpeg|gif|webp)` (never SVG). */
export const SAFE_IMAGE_PROTOCOLS = ['http', 'https', 'data'] as const

export interface SanitizeUrlOptions {
  /** Validate as an image source (adds `data:image/...` raster URIs, drops `mailto` and `tel`). */
  image?: boolean
  /** Narrow the built-in list. Names outside the safe list are ignored; an empty array allows only relative URLs. */
  allowedProtocols?: readonly string[]
}

/** Characters browsers drop or ignore while parsing a URL, plus Unicode spaces and format characters used to hide a scheme. */
const HIDDEN = /[\u0000-\u0020\u007f-\u00a0\u00ad\u1680\u180e\u2000-\u200f\u2028-\u202f\u205f-\u2064\u3000\ufeff]/g
/** Control characters only: removed from the value we hand back (tabs and newlines inside a URL are ignored by browsers). */
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g
const SCHEME = /^([a-z][a-z0-9+.-]*):/i
const DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp)(?:;[a-z0-9=.+-]+)*,/i
const PEEK = 512
const MAX_PASSES = 4

/** Numeric references without the closing `;` (browsers accept them in attributes). Only used to detect hidden schemes. */
function lenientNumeric(text: string): string {
  return text.replace(/&#(?:[xX]([0-9a-fA-F]{1,6})|([0-9]{1,7}));?/g, (_, hex: string | undefined, dec: string | undefined) => {
    const code = hex !== undefined ? parseInt(hex, 16) : parseInt(dec as string, 10)
    return code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff) ? String.fromCodePoint(code) : ''
  })
}

function percentDecode(text: string): string {
  return text.replace(/%([0-9a-fA-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
}

/**
 * The prefix of `url` as a browser would see it once entities, percent escapes and hidden characters are
 * undone. Returns `null` when the text keeps changing (nested encoding): treat that as hostile.
 */
function visiblePrefix(url: string): string | null {
  let head = url.replace(HIDDEN, '').slice(0, PEEK)
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const next = percentDecode(decodeEntities(lenientNumeric(head))).replace(HIDDEN, '')
    if (next === head) return head
    head = next
  }
  return null
}

function effectiveProtocols(options: SanitizeUrlOptions): ReadonlySet<string> {
  const safe: readonly string[] = options.image ? SAFE_IMAGE_PROTOCOLS : SAFE_LINK_PROTOCOLS
  if (!Array.isArray(options.allowedProtocols)) return new Set(safe)
  const wanted = options.allowedProtocols.map((p) => String(p).toLowerCase().replace(/:$/, ''))
  return new Set(safe.filter((p) => wanted.includes(p)))
}

/**
 * Check a link or image destination against the allow-list. Returns the URL to put in `href`/`src`
 * (control characters removed, surrounding space trimmed) or `null` when it must not be used.
 * Allowed: relative paths, `#fragments`, `?queries`, protocol-relative `//host`, and the allowed schemes.
 * Rejected: anything with another scheme (javascript, vbscript, data except raster images, file, blob ...)
 * including mixed case, embedded whitespace or control characters, entity or percent encoded schemes, and empty values.
 */
export function sanitizeUrl(url: unknown, options: SanitizeUrlOptions = {}): string | null {
  if (typeof url !== 'string') return null
  const cleaned = url.replace(CONTROL, '').trim()
  if (cleaned === '') return null
  const head = visiblePrefix(url)
  if (head === null || head === '') return null
  const match = SCHEME.exec(head)
  if (!match) return cleaned
  const scheme = match[1].toLowerCase()
  const allowed = effectiveProtocols(options)
  if (!allowed.has(scheme)) return null
  if (scheme === 'data' && !DATA_IMAGE.test(head)) return null
  return cleaned
}

/** True for absolute http(s) and protocol-relative URLs: links that leave the current site. */
export function isExternalUrl(url: string): boolean {
  const head = visiblePrefix(String(url))
  return head !== null && /^(?:https?:)?[/\\]{2}|^https?:/i.test(head)
}

/** Resolve a relative `url` against `baseUrl`. Fragments, queries and absolute URLs are returned unchanged. */
export function resolveUrl(url: string, baseUrl: string | undefined): string {
  if (!baseUrl || url === '' || url.startsWith('#') || url.startsWith('?')) return url
  const head = visiblePrefix(url)
  if (head === null || SCHEME.test(head) || /^[/\\]{2}/.test(head)) return url
  try {
    return new URL(url, baseUrl).href
  } catch {
    // `baseUrl` is not absolute: join by hand.
    if (url.startsWith('/')) return url
    return `${baseUrl.replace(/[^/]*$/, '')}${url.replace(/^\.\//, '')}`
  }
}
