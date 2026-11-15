// One-off/idempotent solver: nudges token lightness (keeping chroma/hue) to the nearest value that satisfies WCAG AA in every theme.
// Usage: node scripts/tune-tokens.mjs [--write]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
const dir = 'packages/ui/src/styles/'
const write = process.argv.includes('--write')

const oklchToRgb = (l, c, hd) => { const h = hd * Math.PI / 180, a = c * Math.cos(h), b = c * Math.sin(h)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3, m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3, s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_, -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_, -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_]
    .map((v) => { const x = Math.min(1, Math.max(0, v)); return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055 }) }
const lum = ([r, g, b]) => { const f = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05) }
const over = (rgb, alpha, bg) => rgb.map((v, i) => v * alpha + bg[i] * (1 - alpha))
const parse = (s) => { const m = s.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/); return { l: +m[1], c: +m[2], h: +m[3] } }
const fmt = (o) => `oklch(${(+o.l.toFixed(3))} ${o.c} ${o.h})`

function blocks(css) { const out = []; const re = /([^{}@;]+?)\{([^{}]*)\}/g; let m; const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  while ((m = re.exec(clean))) { const t = {}; for (const d of m[2].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) t[d[1]] = d[2].trim(); if (Object.keys(t).length) out.push({ selector: m[1].trim(), tokens: t }) } return out }

const core = readFileSync(dir + 'theme.css', 'utf8')
const files = { 'theme.css': core, ...Object.fromEntries(readdirSync(dir + 'themes').map((f) => [`themes/${f}`, readFileSync(dir + 'themes/' + f, 'utf8')])) }
const baseBlocks = blocks(core)
const resolve = (mode, preset) => { const t = { ...baseBlocks.find((b) => b.selector === ':root').tokens }
  if (mode === 'dark') Object.assign(t, baseBlocks.find((b) => b.selector === '.dark').tokens)
  if (preset) for (const b of blocks(files[`themes/${preset}.css`])) if (b.selector.endsWith('.dark') === (mode === 'dark')) Object.assign(t, b.tokens)
  return t }
const rgb = (t, n) => { const c = parse(t[`--${n}`]); return oklchToRgb(c.l, c.c, c.h) }

// constraint sets: [token to move, test(t) => boolean]
const checks = {
  input: (t) => ratio(rgb(t, 'input'), rgb(t, 'background')) >= 3.05 && ratio(rgb(t, 'input'), rgb(t, 'card')) >= 3.05,
  success: (t) => ratio(rgb(t, 'success-foreground'), rgb(t, 'success')) >= 4.55 && ratio(rgb(t, 'success'), rgb(t, 'background')) >= 4.55 && ratio(rgb(t, 'success'), over(rgb(t, 'success'), 0.15, rgb(t, 'background'))) >= 4.85 && ratio(rgb(t, 'success'), rgb(t, 'card')) >= 4.55,
  info: (t) => ratio(rgb(t, 'info-foreground'), rgb(t, 'info')) >= 4.55 && ratio(rgb(t, 'info'), rgb(t, 'background')) >= 4.55 && ratio(rgb(t, 'info'), over(rgb(t, 'info'), 0.15, rgb(t, 'background'))) >= 4.85 && ratio(rgb(t, 'info'), rgb(t, 'card')) >= 4.55,
  destructive: (t) => ratio(rgb(t, 'destructive-foreground'), rgb(t, 'destructive')) >= 4.55 && ratio(rgb(t, 'destructive'), rgb(t, 'background')) >= 4.55 && ratio(rgb(t, 'destructive'), over(rgb(t, 'destructive'), 0.1, rgb(t, 'background'))) >= 4.85 && ratio(rgb(t, 'destructive-foreground'), over(rgb(t, 'destructive'), 0.9, rgb(t, 'background'))) >= 4.55,
  primary: (t) => ratio(rgb(t, 'primary-foreground'), rgb(t, 'primary')) >= 4.55 && ratio(rgb(t, 'primary-foreground'), over(rgb(t, 'primary'), 0.9, rgb(t, 'background'))) >= 4.55 && ratio(rgb(t, 'primary'), rgb(t, 'background')) >= 4.55 && ratio(rgb(t, 'primary'), rgb(t, 'card')) >= 4.55 && ratio(rgb(t, 'primary'), over(rgb(t, 'primary'), 0.1, rgb(t, 'background'))) >= 4.85,
}
const alsoMove = { primary: ['ring', 'chart-1'], input: [] }

function solve(mode, preset, name) {
  const t = resolve(mode, preset); const orig = parse(t[`--${name}`])
  if (checks[name](t)) return null
  const dir = mode === 'light' ? -1 : 1 // light themes darken the colour, dark themes lighten it
  for (let step = 0; step <= 400; step++) {
    const l = orig.l + dir * step * 0.005; if (l < 0.05 || l > 0.98) break
    const trial = { ...t, [`--${name}`]: fmt({ ...orig, l }) }
    if (checks[name](trial)) return { ...orig, l }
  }
  throw new Error(`no solution for ${name} ${mode} ${preset}`)
}

const edits = [] // {file, selectorTest, name, value}
const targets = [['theme.css', null], ...readdirSync(dir + 'themes').map((f) => [`themes/${f}`, f.replace('.css', '')])]
for (const [file, preset] of targets) for (const mode of ['light', 'dark']) {
  const names = preset === 'lime' ? ['primary', 'input', 'success', 'info'] : preset ? ['primary'] : ['input', 'success', 'info', 'destructive', 'primary']
  for (const name of names) {
    const t = resolve(mode, preset)
    // presets without their own value for this mode fall back to core: only solve where this file defines it
    const defined = blocks(files[file]).some((b) => (b.selector.endsWith('.dark') === (mode === 'dark')) && b.tokens[`--${name}`])
    if (!defined) continue
    const r = solve(mode, preset, name)
    if (r) edits.push({ file, mode, preset, name, value: fmt(r) })
  }
}
for (const e of edits) console.log(`${e.file} ${e.mode} --${e.name} → ${e.value}`)
if (write) {
  for (const e of edits) {
    let css = readFileSync(dir + e.file, 'utf8')
    const isDarkSel = (sel) => sel.trim().endsWith('.dark')
    const re = /([^{}@;]+?)\{([^{}]*)\}/g
    css = css.replace(re, (whole, sel, body) => {
      if (isDarkSel(sel) !== (e.mode === 'dark')) return whole
      if (!/^\s*(:root|\.dark)/.test(sel.replace(/\/\*[\s\S]*?\*\//g, '').trim()) && !sel.includes('data-theme')) return whole
      const names = [e.name, ...(e.name === 'primary' && e.preset ? ['ring', 'chart-1'] : e.name === 'primary' ? ['ring', 'chart-1'] : [])]
      let b = body
      for (const n of names) b = b.replace(new RegExp(`(--${n}\\s*:\\s*)oklch\\([^)]*\\)`), `$1${e.value}`)
      return sel + '{' + b + '}'
    })
    writeFileSync(dir + e.file, css)
  }
  console.log('written')
}
