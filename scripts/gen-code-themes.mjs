/**
 * Generates packages/ui/src/styles/code-themes.css and packages/ui/src/lib/code-themes.ts from the published VS Code
 * themes listed in SOURCES (all MIT licensed). Colours come from the released .vsix files, resolved per token type by
 * TextMate scope. A colour below 4.5:1 against its background is moved in OKLCH lightness only (hue and chroma kept) until
 * it passes, so every theme meets WCAG 1.4.3. Run: node scripts/gen-code-themes.mjs (needs network and `unzip`).
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'

// Ranked by marketplace installs (colour themes only; icon packs, the deprecated Material Theme and the paid Monokai Pro
// are excluded). Names are neutral: the docs credit the source theme, the attribute value is not a brand.
const SOURCES = [
  { name: 'midnight', mode: 'dark', ext: 'GitHub/github-vscode-theme', file: 'themes/dark-default.json', credit: 'GitHub Dark Default (GitHub Theme)' },
  { name: 'dusk', mode: 'dark', ext: 'zhuangtongfa/Material-theme', file: 'themes/OneDark-Pro.json', credit: 'One Dark Pro' },
  { name: 'orchid', mode: 'dark', ext: 'dracula-theme/theme-dracula', file: 'theme/dracula.json', credit: 'Dracula Theme Official' },
  { name: 'ember', mode: 'dark', ext: 'teabyii/ayu', file: 'ayu-dark.json', credit: 'Ayu Dark' },
  { name: 'fjord', mode: 'dark', ext: 'johnpapa/winteriscoming', file: 'themes/WinterIsComing-dark-blue-color-theme.json', credit: 'Winter is Coming (Dark Blue)' },
  { name: 'daylight', mode: 'light', ext: 'GitHub/github-vscode-theme', file: 'themes/light-default.json', credit: 'GitHub Light Default (GitHub Theme)' },
  { name: 'citrus', mode: 'light', ext: 'teabyii/ayu', file: 'ayu-light.json', credit: 'Ayu Light' },
  { name: 'frost', mode: 'light', ext: 'johnpapa/winteriscoming', file: 'themes/WinterIsComing-light-color-theme.json', credit: 'Winter is Coming (Light)' },
  { name: 'dawn', mode: 'light', ext: 'sdras/night-owl', file: 'themes/Night Owl-Light-color-theme.json', credit: 'Night Owl Light' },
  { name: 'mist', mode: 'light', ext: 'enkia/tokyo-night', file: 'themes/tokyo-night-light-color-theme.json', credit: 'Tokyo Night Light' },
]

// Token types of CodeViewer (data-type on [data-slot=code-viewer-token]) and the scopes that colour them, most specific first.
const SCOPES = {
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
const MIN_RATIO = 4.6 // 4.5 plus a margin for rounding to hex

const root = new URL('..', import.meta.url).pathname
const work = mkdtempSync(join(tmpdir(), 'pd-code-themes-'))

const jsonc = (s) => JSON.parse(s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'])\/\/.*$/gm, '$1').replace(/,(\s*[}\]])/g, '$1'))

async function extension(ext) {
  const [pub, name] = ext.split('/')
  const out = join(work, name)
  try {
    readFileSync(join(out, 'extension/package.json'))
    return out
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
  return out
}

function resolve(rules, scope) {
  let best = null
  let bestLen = -1
  for (const r of rules) {
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

// --- colour maths (sRGB, WCAG luminance, OKLab) -----------------------------------------------------------------------
const parse = (hex) => {
  const h = hex.replace('#', '')
  const full = h.length <= 4 ? [...h].map((c) => c + c).join('') : h
  const n = (i) => parseInt(full.slice(i, i + 2), 16) / 255
  return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? n(6) : 1 }
}
const over = (c, bg) => ({ r: c.r * c.a + bg.r * (1 - c.a), g: c.g * c.a + bg.g * (1 - c.a), b: c.b * c.a + bg.b * (1 - c.a), a: 1 })
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const unlin = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
function toOklch({ r, g, b }) {
  const [R, G, B] = [lin(r), lin(g), lin(b)]
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { L, C: Math.hypot(A, Bb), h: Math.atan2(Bb, A) }
}
function fromOklch({ L, C, h }) {
  const A = C * Math.cos(h)
  const Bb = C * Math.sin(h)
  const l = (L + 0.3963377774 * A + 0.2158037573 * Bb) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * Bb) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * Bb) ** 3
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
  return rgb.map(unlin)
}
function inGamut(lch) {
  return fromOklch(lch).every((v) => v >= -1e-4 && v <= 1 + 1e-4)
}
const toHex = (rgb) => `#${rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('')}`

/** Move lightness away from the background until the colour reaches MIN_RATIO; reduce chroma only if out of gamut. */
function legible(hex, bgHex, dark) {
  const bg = parse(bgHex)
  const flat = over(parse(hex), bg)
  if (ratio(flat, bg) >= MIN_RATIO) return { hex: toHex([flat.r, flat.g, flat.b]), moved: false }
  const start = toOklch(flat)
  for (let step = 1; step <= 200; step++) {
    const L = Math.min(1, Math.max(0, start.L + (dark ? 1 : -1) * step * 0.005))
    let C = start.C
    while (C > 0 && !inGamut({ L, C, h: start.h })) C -= 0.002
    const rgb = fromOklch({ L, C: Math.max(0, C), h: start.h })
    const c = { r: rgb[0], g: rgb[1], b: rgb[2], a: 1 }
    if (ratio(c, bg) >= MIN_RATIO) return { hex: toHex(rgb), moved: true }
  }
  throw new Error(`${hex} cannot reach ${MIN_RATIO}:1 on ${bgHex}`)
}

// --- build ------------------------------------------------------------------------------------------------------------
const themes = []
for (const src of SOURCES) {
  const dir = await extension(src.ext)
  const pkg = JSON.parse(readFileSync(join(dir, 'extension/package.json'), 'utf8'))
  const theme = jsonc(readFileSync(join(dir, 'extension', src.file), 'utf8'))
  const c = theme.colors ?? {}
  const rules = theme.tokenColors ?? []
  const bg = toHex(Object.values(over(parse(c['editor.background']), { r: 1, g: 1, b: 1, a: 1 })).slice(0, 3))
  const fg = c['editor.foreground']
  const header = c['editorGroupHeader.tabsBackground'] ?? c['tab.inactiveBackground'] ?? c['editor.background']
  const vars = { bg, header: toHex(Object.values(over(parse(header), parse(bg))).slice(0, 3)) }
  const moved = []
  const set = (key, value) => {
    const r = legible(value ?? fg, bg, src.mode === 'dark')
    vars[key] = r.hex
    if (r.moved) moved.push(key)
  }
  set('fg', fg)
  set('muted', c['editorLineNumber.foreground'] ?? fg)
  for (const [type, scopes] of Object.entries(SCOPES)) set(type, scopes.map((s) => resolve(rules, s)).find(Boolean))
  // The header text sits on the header colour, so check the muted colour there too.
  vars['header-fg'] = legible(vars.muted, vars.header, src.mode === 'dark').hex
  themes.push({ ...src, version: pkg.version, vars, moved })
}

const header = [
  '/*',
  ' * Code colour themes for CodeViewer, CodeBlock and the code blocks of Markdown (YamlViewer, GoViewer). Generated by',
  ' * scripts/gen-code-themes.mjs; do not edit by hand. Select one with data-code-theme on <html>, on any region, or on the',
  ' * component itself:  <html data-code-theme="midnight">.  Import after theme.css: @import "@perfect-design/ui/code-themes.css";',
  ' * Palettes come from these MIT-licensed VS Code themes; colours below 4.5:1 were moved in lightness only to pass WCAG 1.4.3.',
  ...themes.map((t) => ` *   ${t.name.padEnd(9)} ${t.mode.padEnd(5)} ${t.credit} ${t.version}${t.moved.length ? ` (adjusted: ${t.moved.join(', ')})` : ''}`),
  ' */',
]
const blocks = themes.map((t) => `[data-code-theme="${t.name}"] {\n  color-scheme: ${t.mode};\n${Object.entries(t.vars).map(([k, v]) => `  --code-${k}: ${v};`).join('\n')}\n}`)
const SURFACE = ':is([data-code-theme] [data-slot="code-viewer"], [data-slot="code-viewer"][data-code-theme], [data-code-theme] [data-slot="code-block"], [data-slot="code-block"][data-code-theme])'
// The surface also redefines the semantic tokens its parts use (titles, tabs, copy button, focus ring), so a dark code
// theme inside a light page keeps every label and ring legible.
const rules = [
  `${SURFACE} {\n  --foreground: var(--code-fg);\n  --muted-foreground: var(--code-header-fg);\n  --muted: var(--code-header);\n  --card: var(--code-bg);\n  --accent: color-mix(in oklab, var(--code-fg) 12%, var(--code-bg));\n  --accent-foreground: var(--code-fg);\n  --border: color-mix(in oklab, var(--code-fg) 18%, var(--code-bg));\n  --ring: var(--code-fg);\n  background-color: var(--code-bg);\n  color: var(--code-fg);\n  border-color: var(--border);\n}`,
  `${SURFACE} :is([data-slot="code-viewer-header"], [data-slot="code-block-header"]) {\n  background-color: var(--code-header);\n  color: var(--code-header-fg);\n  border-color: color-mix(in oklab, var(--code-fg) 18%, var(--code-bg));\n}`,
  `${SURFACE} :is([data-slot="code-viewer-gutter"], [data-slot="code-block-line-number"]) {\n  color: var(--code-muted);\n}`,
  ...Object.keys(SCOPES).map((type) => `${SURFACE} [data-slot="code-viewer-token"][data-type="${type}"] {\n  color: var(--code-${type});\n}`),
]
writeFileSync(join(root, 'packages/ui/src/styles/code-themes.css'), `${header.join('\n')}\n\n${blocks.join('\n\n')}\n\n${rules.join('\n\n')}\n`)

const ts = `/** Code colour themes in styles/code-themes.css (generated by scripts/gen-code-themes.mjs). */
export const CODE_THEMES = ${JSON.stringify(themes.map((t) => t.name))} as const
export type CodeTheme = (typeof CODE_THEMES)[number]
/** Whether each theme is a dark or a light palette, for pairing with the colour mode. */
export const CODE_THEME_MODES: Record<CodeTheme, 'dark' | 'light'> = ${JSON.stringify(Object.fromEntries(themes.map((t) => [t.name, t.mode])))}
`
writeFileSync(join(root, 'packages/ui/src/lib/code-themes.ts'), ts)
rmSync(work, { recursive: true, force: true })
for (const t of themes) console.log(`${t.name.padEnd(9)} ${t.mode.padEnd(5)} ${t.credit} ${t.version}  adjusted: ${t.moved.join(', ') || 'none'}`)
