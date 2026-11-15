/**
 * Mermaid `classDef`, `style` and `linkStyle` declarations are interpreted, not copied: arbitrary colours are never
 * used. A fill or stroke colour is mapped to the nearest tone of the design system by hue, a class named like a tone
 * (`success`, `danger`...) picks that tone, `stroke-dasharray` makes the outline dashed and a stroke width of 3px or more
 * makes it thick. An explicit `tone:success` property wins over everything.
 */
import { DIAGRAM_TONES, type DiagramTone } from './types'

export type StyleDecl = Record<string, string>

export interface NodeStyle {
  tone?: DiagramTone
  dashed?: boolean
  thick?: boolean
}

const CLASS_TONES: Record<string, DiagramTone> = {
  success: 'success', ok: 'success', done: 'success', passed: 'success', healthy: 'success',
  danger: 'danger', error: 'danger', failed: 'danger', fail: 'danger', critical: 'danger',
  warning: 'warning', warn: 'warning', pending: 'warning', caution: 'warning',
  info: 'info', note: 'info',
  primary: 'primary', active: 'primary', highlight: 'primary',
  neutral: 'neutral', muted: 'neutral',
}

const NAMED: Record<string, DiagramTone> = {
  red: 'danger', crimson: 'danger', tomato: 'danger', firebrick: 'danger', pink: 'danger', salmon: 'danger',
  green: 'success', lime: 'success', limegreen: 'success', forestgreen: 'success', seagreen: 'success', lightgreen: 'success',
  blue: 'info', navy: 'info', skyblue: 'info', lightblue: 'info', royalblue: 'info', dodgerblue: 'info',
  yellow: 'warning', orange: 'warning', gold: 'warning', amber: 'warning', khaki: 'warning',
  teal: 'primary', cyan: 'primary', aqua: 'primary', turquoise: 'primary', purple: 'primary', violet: 'primary',
  gray: 'neutral', grey: 'neutral', black: 'neutral', white: 'neutral', silver: 'neutral', lightgray: 'neutral', lightgrey: 'neutral',
}

/** Parse `key:value, key:value` (commas inside parentheses are kept together). Keys are lower-cased. */
export function parseDecl(text: string): StyleDecl {
  const out: StyleDecl = {}
  let depth = 0
  let start = 0
  const parts: string[] = []
  for (let i = 0; i <= text.length; i++) {
    const ch = text[i]
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    else if ((ch === ',' && depth === 0) || i === text.length) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }
  for (const part of parts) {
    const at = part.indexOf(':')
    if (at < 1) continue
    const key = part.slice(0, at).trim().toLowerCase()
    const value = part.slice(at + 1).trim().replace(/;$/, '')
    if (key && value) out[key] = value
  }
  return out
}

function hueTone(r: number, g: number, b: number): DiagramTone {
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const l = (max + min) / 2
  const d = max - min
  if (d < 0.12 || l > 0.96 || l < 0.08) return 'neutral'
  let h: number
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  if (max === rr) h = ((gg - bb) / d) % 6
  else if (max === gg) h = (bb - rr) / d + 2
  else h = (rr - gg) / d + 4
  h = (h * 60 + 360) % 360
  if (h < 20 || h >= 330) return 'danger'
  if (h < 70) return 'warning'
  if (h < 170) return 'success'
  if (h < 200) return 'primary'
  if (h < 265) return 'info'
  return 'primary'
}

/** Nearest tone of a CSS colour value (hex, rgb(), or a common colour name), or undefined when it carries no colour. */
export function colorTone(value: string | undefined): DiagramTone | undefined {
  if (!value) return undefined
  const v = value.trim().toLowerCase()
  if (v === 'none' || v === 'transparent' || v === 'inherit' || v === 'currentcolor') return undefined
  const hex = /^#([0-9a-f]{3,8})$/.exec(v)
  if (hex) {
    const h = hex[1]!
    if (h.length === 3 || h.length === 4) return hueTone(parseInt(h[0]! + h[0], 16), parseInt(h[1]! + h[1], 16), parseInt(h[2]! + h[2], 16))
    if (h.length === 6 || h.length === 8) return hueTone(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16))
    return undefined
  }
  const rgb = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/.exec(v)
  if (rgb) return hueTone(Math.min(255, +rgb[1]!), Math.min(255, +rgb[2]!), Math.min(255, +rgb[3]!))
  return NAMED[v]
}

export function interpretStyle(decl: StyleDecl | undefined, className?: string): NodeStyle {
  const out: NodeStyle = {}
  const byName = className ? CLASS_TONES[className.toLowerCase()] : undefined
  if (byName) out.tone = byName
  if (!decl) return out
  const explicit = decl.tone?.toLowerCase()
  const fill = colorTone(decl.fill)
  const stroke = colorTone(decl.stroke)
  const picked = (DIAGRAM_TONES as readonly string[]).includes(explicit ?? '') ? (explicit as DiagramTone) : (fill && fill !== 'neutral' ? fill : stroke && stroke !== 'neutral' ? stroke : (fill ?? stroke))
  if (picked) out.tone = picked
  const dash = decl['stroke-dasharray']
  if (dash && dash !== '0' && dash !== 'none') out.dashed = true
  const width = parseFloat(decl['stroke-width'] ?? '')
  if (Number.isFinite(width) && width >= 3) out.thick = true
  return out
}

/** Merge styles; later wins per field. */
export function mergeStyles(...list: (NodeStyle | undefined)[]): NodeStyle {
  const out: NodeStyle = {}
  for (const s of list) if (s) Object.assign(out, Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined)))
  return out
}
