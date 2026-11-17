/**
 * Shared helpers for the generators that adapt published VS Code themes (gen-code-themes.mjs, gen-palettes.mjs): download
 * a released .vsix, read a theme file, resolve token colours by TextMate scope, and the colour maths that keeps every
 * adapted colour legible (WCAG luminance, OKLCH conversion, lightness-only adjustment).
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'

const work = mkdtempSync(join(tmpdir(), 'pd-vscode-themes-'))
export const cleanup = () => rmSync(work, { recursive: true, force: true })

const jsonc = (s) => JSON.parse(s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'])\/\/.*$/gm, '$1').replace(/,(\s*[}\]])/g, '$1'))

/** Download (once) and unpack a Marketplace extension, e.g. `GitHub/github-vscode-theme`. Returns its folder and version. */
export async function extension(ext) {
  const [pub, name] = ext.split('/')
  const out = join(work, name)
  try {
    const pkg = JSON.parse(readFileSync(join(out, 'extension/package.json'), 'utf8'))
    return { dir: out, version: pkg.version }
  } catch {
    /* not downloaded yet */
  }
  const res = await fetch(`https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${pub}/vsextensions/${name}/latest/vspackage`)
  if (!res.ok) throw new Error(`${ext}: HTTP ${res.status}`)
  let buf = Buffer.from(await res.arrayBuffer())
  if (buf[0] === 0x1f && buf[1] === 0x8b) buf = gunzipSync(buf)
  mkdirSync(out, { recursive: true })
  writeFileSync(`${out}.vsix`, buf)
  execFileSync('unzip', ['-q', '-o', `${out}.vsix`, '-d', out])
  const pkg = JSON.parse(readFileSync(join(out, 'extension/package.json'), 'utf8'))
  return { dir: out, version: pkg.version }
}

export async function theme(ext, file) {
  const { dir, version } = await extension(ext)
  return { ...jsonc(readFileSync(join(dir, 'extension', file), 'utf8')), version }
}

/** Token types of CodeViewer (data-type on [data-slot=code-viewer-token]) and the scopes that colour them, most specific first. */
export const SCOPES = {
  keyword: ['keyword.control', 'keyword', 'storage.type'],
  string: ['string.quoted.double', 'string'],
  number: ['constant.numeric'],
  comment: ['comment.line', 'comment'],
  type: ['entity.name.type', 'support.type', 'storage.type'],
  function: ['entity.name.function', 'support.function'],
  key: ['support.type.property-name.json', 'support.type.property-name', 'entity.name.tag.yaml'],
  constant: ['constant.language', 'constant'],
  punctuation: ['punctuation.separator', 'punctuation'],
  operator: ['keyword.operator'],
  tag: ['entity.name.tag'],
  anchor: ['variable.other.alias.yaml', 'entity.name.type.anchor.yaml', 'variable'],
}

/** Foreground of the most specific single-scope rule matching `scope`. */
export function resolveScope(rules, scope) {
  let best = null
  let bestLen = -1
  for (const r of rules ?? []) {
    if (!r.settings?.foreground) continue
    const selectors = (Array.isArray(r.scope) ? r.scope : String(r.scope ?? '').split(',')).map((s) => s.trim())
    for (const sel of selectors) {
      if (!sel || sel.includes(' ')) continue // descendant selectors do not apply to a single token
      if ((scope === sel || scope.startsWith(`${sel}.`)) && sel.length >= bestLen) {
        best = r.settings.foreground
        bestLen = sel.length
      }
    }
  }
  return best
}

// --- colour maths ---------------------------------------------------------------------------------------------------
/** `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` to channels in 0..1. */
export function parseHex(hex) {
  const h = hex.replace('#', '')
  const full = h.length <= 4 ? [...h].map((c) => c + c).join('') : h
  const n = (i) => parseInt(full.slice(i, i + 2), 16) / 255
  return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? n(6) : 1 }
}
/** Composite a translucent colour over an opaque one. */
export const over = (c, bg) => ({ r: c.r * c.a + bg.r * (1 - c.a), g: c.g * c.a + bg.g * (1 - c.a), b: c.b * c.a + bg.b * (1 - c.a), a: 1 })
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const unlin = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
export const luminance = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
export function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
export function toOklch({ r, g, b }) {
  const [R, G, B] = [lin(r), lin(g), lin(b)]
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { L, C: Math.hypot(A, Bb), h: Math.atan2(Bb, A) }
}
export function fromOklch({ L, C, h }) {
  const A = C * Math.cos(h)
  const Bb = C * Math.sin(h)
  const l = (L + 0.3963377774 * A + 0.2158037573 * Bb) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * Bb) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * Bb) ** 3
  const [r, g, b] = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(unlin)
  return { r, g, b, a: 1 }
}
const inGamut = (c) => [c.r, c.g, c.b].every((v) => v >= -1e-4 && v <= 1 + 1e-4)
const clamp = (c) => ({ r: Math.min(1, Math.max(0, c.r)), g: Math.min(1, Math.max(0, c.g)), b: Math.min(1, Math.max(0, c.b)), a: 1 })
export const toHex = (c) => `#${[c.r, c.g, c.b].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('')}`
/** oklch() string as theme.css writes it (3 decimals, 0 for achromatic hue). */
export function toOklchString(c) {
  const { L, C, h } = toOklch(c)
  const hue = C < 0.002 ? 0 : ((h * 180) / Math.PI + 360) % 360
  return `oklch(${+L.toFixed(3)} ${+C.toFixed(3)} ${+hue.toFixed(1)})`
}

/** Set the OKLCH lightness of a colour, reducing chroma only as far as needed to stay in the sRGB gamut. */
export function withLightness(c, L) {
  const lch = toOklch(c)
  let C = lch.C
  let out = fromOklch({ L, C, h: lch.h })
  while (C > 0 && !inGamut(out)) {
    C = Math.max(0, C - 0.002)
    out = fromOklch({ L, C, h: lch.h })
  }
  return clamp(out)
}

/**
 * Move `ink` in lightness, away from the surfaces (darker on light surfaces, lighter on dark ones), until `test(ink)` holds.
 * Returns the original colour when it already passes.
 */
export function adjustUntil(ink, dark, test) {
  if (test(ink)) return ink
  const start = toOklch(ink).L
  for (let step = 1; step <= 400; step++) {
    const L = Math.min(1, Math.max(0, start + (dark ? 1 : -1) * step * 0.0025))
    const c = withLightness(ink, L)
    if (test(c)) return c
    if (L === 0 || L === 1) break
  }
  throw new Error(`cannot reach the required contrast for ${toHex(ink)}`)
}
