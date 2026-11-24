/** Colour and contrast helpers shared by the WCAG gates: token parsing, OKLCH to sRGB, luminance, ratio and alpha blending. */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'

export const stylesDir = resolvePath(process.cwd(), 'src/styles') + '/' // vitest runs from packages/ui
export const themeCss = { 'theme.css': readFileSync(`${stylesDir}theme.css`, 'utf8') } as Record<string, string>
// Accent presets (themes/) and whole-interface palettes (palettes/) pass the same gate.
export const presetCss = Object.fromEntries(['themes', 'palettes'].flatMap((dir) => readdirSync(`${stylesDir}${dir}`).filter((f) => f.endsWith('.css')).map((f) => [`/${f}`, readFileSync(`${stylesDir}${dir}/${f}`, 'utf8')]))) as Record<string, string>

export type Tokens = Record<string, string>
export type RGB = [number, number, number]

export function parseBlocks(css: string): { selector: string; tokens: Tokens }[] {
  const out: { selector: string; tokens: Tokens }[] = []
  const re = /([^{}@;]+?)\{([^{}]*)\}/g
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(re)) {
    const selector = m[1].trim()
    const tokens: Tokens = {}
    for (const d of m[2].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) tokens[d[1]] = d[2].trim()
    if (Object.keys(tokens).length) out.push({ selector, tokens })
  }
  return out
}

export function oklchToRgb(l: number, c: number, hDeg: number): RGB {
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_, -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_, -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_]
  return lin.map((v) => {
    const c2 = Math.min(1, Math.max(0, v))
    return c2 <= 0.0031308 ? 12.92 * c2 : 1.055 * c2 ** (1 / 2.4) - 0.055
  }) as RGB
}

export function parseColor(value: string): { rgb: RGB; alpha: number } {
  const m = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)$/)
  if (!m) throw new Error(`Unsupported colour: ${value}`)
  return { rgb: oklchToRgb(+m[1], +m[2], +m[3]), alpha: m[4] ? +m[4] : 1 }
}

export const lum = ([r, g, b]: RGB) => {
  const f = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
export const ratio = (a: RGB, b: RGB) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
export const over = (fg: { rgb: RGB; alpha: number }, bg: RGB): RGB => fg.rgb.map((v, i) => v * fg.alpha + bg[i] * (1 - fg.alpha)) as RGB

export function resolve(mode: 'light' | 'dark', preset: string | null): Tokens {
  const base = parseBlocks(Object.values(themeCss)[0])
  const tokens: Tokens = {}
  Object.assign(tokens, base.find((b) => b.selector === ':root')!.tokens)
  if (mode === 'dark') Object.assign(tokens, base.find((b) => b.selector === '.dark')!.tokens)
  if (preset) {
    const css = Object.entries(presetCss).find(([k]) => k.endsWith(`/${preset}.css`))![1]
    for (const b of parseBlocks(css)) {
      const isDark = b.selector.endsWith('.dark')
      if (isDark === (mode === 'dark')) Object.assign(tokens, b.tokens)
    }
  }
  return tokens
}

export const presets = [null, ...Object.keys(presetCss).map((k) => k.match(/([^/]+)\.css$/)![1])]
export const color = (t: Tokens, name: string) => parseColor(t[`--${name}`])
export const rgbOf = (t: Tokens, name: string) => color(t, name).rgb
