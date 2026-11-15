/**
 * ANSI SGR parsing for log lines. The output is plain data (text plus a style of named colours and flags); the component maps
 * the names to design tokens and renders the text with interpolation, so nothing from the input ever becomes markup or a raw
 * colour. Every escape sequence that is not a supported colour or weight code is removed, as are other control characters.
 */
export type AnsiColor = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'

export interface AnsiStyle {
  fg?: AnsiColor
  bg?: AnsiColor
  bold?: boolean
  dim?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  inverse?: boolean
}
export interface AnsiSegment extends AnsiStyle {
  text: string
}

const NAMES: AnsiColor[] = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']

/** True when the text holds an escape or a control character other than tab and newline (so it needs parsing). */
export const hasEscapes = (text: string): boolean => /[\u0000-\u0008\u000a-\u001f\u007f-\u009f]/.test(text)

/** Nearest named colour for an RGB triple. Only used to classify; the value is never rendered. */
export function rgbToColor(r: number, g: number, b: number): AnsiColor {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max - min < 40) return max < 128 ? 'black' : 'white'
  let hue: number
  if (max === r) hue = ((g - b) / (max - min)) * 60
  else if (max === g) hue = (2 + (b - r) / (max - min)) * 60
  else hue = (4 + (r - g) / (max - min)) * 60
  if (hue < 0) hue += 360
  if (hue < 20 || hue >= 340) return 'red'
  if (hue < 70) return 'yellow'
  if (hue < 165) return 'green'
  if (hue < 200) return 'cyan'
  if (hue < 260) return 'blue'
  return 'magenta'
}

function color256(n: number): AnsiColor | undefined {
  if (!Number.isInteger(n) || n < 0 || n > 255) return undefined
  if (n < 16) return NAMES[n % 8]
  if (n >= 232) return n < 244 ? 'black' : 'white'
  const i = n - 16
  const level = (v: number) => (v === 0 ? 0 : 55 + v * 40)
  return rgbToColor(level(Math.floor(i / 36)), level(Math.floor(i / 6) % 6), level(i % 6))
}

function applySgr(style: AnsiStyle, params: number[]): AnsiStyle {
  let s: AnsiStyle = { ...style }
  const codes = params.length ? params : [0]
  for (let i = 0; i < codes.length; i++) {
    const c = codes[i]
    if (c === 0) s = {}
    else if (c === 1) s.bold = true
    else if (c === 2) s.dim = true
    else if (c === 3) s.italic = true
    else if (c === 4) s.underline = true
    else if (c === 7) s.inverse = true
    else if (c === 9) s.strike = true
    else if (c === 22) s = { ...s, bold: undefined, dim: undefined }
    else if (c === 23) s.italic = undefined
    else if (c === 24) s.underline = undefined
    else if (c === 27) s.inverse = undefined
    else if (c === 29) s.strike = undefined
    else if (c >= 30 && c <= 37) s.fg = NAMES[c - 30]
    else if (c >= 90 && c <= 97) s.fg = NAMES[c - 90]
    else if (c === 39) s.fg = undefined
    else if (c >= 40 && c <= 47) s.bg = NAMES[c - 40]
    else if (c >= 100 && c <= 107) s.bg = NAMES[c - 100]
    else if (c === 49) s.bg = undefined
    else if (c === 38 || c === 48) {
      const key = c === 38 ? 'fg' : 'bg'
      if (codes[i + 1] === 5) {
        s[key] = color256(codes[i + 2])
        i += 2
      } else if (codes[i + 1] === 2) {
        const [r, g, b] = [codes[i + 2], codes[i + 3], codes[i + 4]]
        s[key] = [r, g, b].every((v) => Number.isInteger(v) && v >= 0 && v <= 255) ? rgbToColor(r, g, b) : undefined
        i += 4
      } else i = codes.length
    }
  }
  return s
}

const sameStyle = (a: AnsiStyle, b: AnsiStyle) =>
  a.fg === b.fg && a.bg === b.bg && !a.bold === !b.bold && !a.dim === !b.dim && !a.italic === !b.italic && !a.underline === !b.underline && !a.strike === !b.strike && !a.inverse === !b.inverse

/** Split text into styled segments. Unsupported escapes and control characters are dropped. Never throws. */
export function parseAnsi(input: string): AnsiSegment[] {
  const text = String(input ?? '')
  const out: AnsiSegment[] = []
  let style: AnsiStyle = {}
  let buf = ''
  const flush = () => {
    if (!buf) return
    const last = out[out.length - 1]
    if (last && sameStyle(last, style)) last.text += buf
    else out.push({ ...style, text: buf })
    buf = ''
  }
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    const code = ch.charCodeAt(0)
    if (ch === '\u001b' || ch === '\u009b') {
      let j = i + 1
      let csi = ch === '\u009b'
      if (!csi && text[j] === '[') {
        csi = true
        j++
      }
      if (csi) {
        const start = j
        while (j < text.length && text.charCodeAt(j) >= 0x30 && text.charCodeAt(j) <= 0x3f) j++
        while (j < text.length && text.charCodeAt(j) >= 0x20 && text.charCodeAt(j) <= 0x2f) j++
        const final = text[j]
        if (final !== undefined && text.charCodeAt(j) >= 0x40 && text.charCodeAt(j) <= 0x7e) {
          if (final === 'm') {
            const raw = text.slice(start, j)
            if (/^[0-9;:]*$/.test(raw)) {
              flush()
              style = applySgr(style, raw === '' ? [] : raw.split(/[;:]/).map((p) => (p === '' ? 0 : Number(p))))
            }
          }
          j++
        }
        i = j
        continue
      }
      if (text[j] === ']' || text[j] === 'P' || text[j] === '^' || text[j] === '_') {
        // OSC and string controls end at BEL or ST (ESC \).
        j++
        while (j < text.length && text[j] !== '\u0007' && !(text[j] === '\u001b' && text[j + 1] === '\\')) j++
        i = text[j] === '\u001b' ? j + 2 : j + 1
        continue
      }
      i = j + (text[j] === '(' || text[j] === ')' ? 2 : 1)
      continue
    }
    if (ch === '\t' || ch === '\n' || (code > 0x1f && (code < 0x7f || code > 0x9f))) buf += ch
    i++
  }
  flush()
  return out
}

/** The visible text of a line with every escape sequence and control character removed. */
export function stripAnsi(input: string): string {
  const text = String(input ?? '')
  return hasEscapes(text) ? parseAnsi(text).map((s) => s.text).join('') : text
}
