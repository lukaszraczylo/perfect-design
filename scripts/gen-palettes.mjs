/**
 * Generates whole-interface colour palettes from published VS Code themes (all MIT licensed) that ship both a light and a
 * dark variant. Each family becomes packages/ui/src/styles/palettes/<name>.css with a light block (`:root[data-palette]`)
 * and a dark block (`.dark`), plus code colours for CodeViewer. Surfaces keep the editor's colours; text, accents, borders
 * and the focus ring move in OKLCH lightness only until every pair that src/__tests__/contrast.test.ts checks passes.
 * Run: node scripts/gen-palettes.mjs (needs network and `unzip`).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { adjustUntil, cleanup, over, parseHex, ratio, resolveScope, SCOPES, theme, toHex, toOklch, toOklchString, withLightness } from './lib/vscode-themes.mjs'

// The five most-installed colour themes on the VS Code Marketplace that publish a light and a dark variant (queried
// 2026-11-16). Names are neutral; the credit is in DESIGN.md and in each file header.
const FAMILIES = [
  { name: 'graphite', credit: 'GitHub Theme (GitHub Light Default / GitHub Dark Default)', ext: 'GitHub/github-vscode-theme', light: 'themes/light-default.json', dark: 'themes/dark-default.json' },
  { name: 'saffron', credit: 'Ayu (Ayu Light / Ayu Dark)', ext: 'teabyii/ayu', light: 'ayu-light.json', dark: 'ayu-dark.json' },
  { name: 'glacier', credit: 'Winter is Coming (Light / Dark Blue)', ext: 'johnpapa/winteriscoming', light: 'themes/WinterIsComing-light-color-theme.json', dark: 'themes/WinterIsComing-dark-blue-color-theme.json' },
  { name: 'nocturne', credit: 'Night Owl (Night Owl Light / Night Owl)', ext: 'sdras/night-owl', light: 'themes/Night Owl-Light-color-theme.json', dark: 'themes/Night Owl-color-theme.json' },
  { name: 'harbor', credit: 'Tokyo Night (Tokyo Night Light / Tokyo Night)', ext: 'enkia/tokyo-night', light: 'themes/tokyo-night-light-color-theme.json', dark: 'themes/tokyo-night-color-theme.json' },
]

const TEXT = 4.6 // 4.5 plus a margin for rounding to oklch with three decimals
const TINT = 4.8 // contrast.test.ts asks 4.7 for text on its own tint (oklab blend in Tailwind, sRGB in the test)
const UI = 3.1 // 3:1 for borders, rings and strokes

const WHITE = { r: 1, g: 1, b: 1, a: 1 }
const INK_DARK = { r: 0.09, g: 0.1, b: 0.12, a: 1 }

function build(t, dark) {
  const c = t.colors ?? {}
  const pick = (...keys) => keys.map((k) => c[k]).find(Boolean)
  const bg = over(parseHex(pick('editor.background')), dark ? INK_DARK : WHITE)
  const solid = (hex, base = bg) => (hex ? over(parseHex(hex), base) : undefined)

  // Surfaces keep the editor's colours.
  const s = {
    background: bg,
    card: solid(pick('editorWidget.background', 'sideBar.background')) ?? bg,
    popover: solid(pick('editorWidget.background', 'dropdown.background')) ?? bg,
    muted: solid(pick('sideBar.background')) ?? bg,
    secondary: solid(pick('button.secondaryBackground', 'list.hoverBackground')) ?? bg,
    accent: solid(pick('list.hoverBackground')) ?? bg,
    sidebar: solid(pick('sideBar.background')) ?? bg,
    'sidebar-accent': solid(pick('list.activeSelectionBackground', 'list.hoverBackground')) ?? bg,
  }
  // In the core theme these tokens are subtle surfaces near the page colour. Some editors use a strong fill for selection or
  // secondary buttons, so keep each surface within 0.1 OKLCH lightness of the background (hue kept).
  const bgL = toOklch(bg).L
  for (const k of Object.keys(s)) {
    if (k === 'background') continue
    const L = toOklch(s[k]).L
    if (Math.abs(L - bgL) > 0.1) s[k] = withLightness(s[k], bgL + Math.sign(L - bgL) * 0.1)
  }
  const fg = solid(pick('editor.foreground', 'foreground'))
  const ink = {
    foreground: fg,
    'muted-foreground': solid(pick('descriptionForeground', 'editorLineNumber.foreground')) ?? fg,
    'sidebar-foreground': solid(pick('sideBar.foreground', 'foreground')) ?? fg,
    primary: solid(pick('button.background', 'focusBorder')),
    destructive: solid(pick('errorForeground', 'editorError.foreground', 'terminal.ansiRed')),
    success: solid(pick('terminal.ansiGreen')),
    info: solid(pick('editorInfo.foreground', 'textLink.foreground', 'terminal.ansiBlue')),
    warning: solid(pick('editorWarning.foreground', 'terminal.ansiYellow')),
    input: solid(pick('input.border', 'panel.border')) ?? fg,
    ring: solid(pick('focusBorder', 'button.background')),
    border: solid(pick('panel.border', 'editorGroup.border')) ?? fg,
    'sidebar-border': solid(pick('sideBar.border', 'panel.border')) ?? fg,
    'chart-2': solid(pick('terminal.ansiCyan')),
    'chart-3': solid(pick('terminal.ansiYellow')),
    'chart-4': solid(pick('terminal.ansiMagenta')),
    'chart-5': solid(pick('terminal.ansiGreen')),
  }

  const textOn = (x, surfaces, min = TEXT) => surfaces.every((sf) => ratio(x, sf) >= min)
  const tint = (tone, alpha, base) => over({ ...tone, a: alpha }, base)
  const fillText = (fill) => [WHITE, INK_DARK].sort((a, b) => ratio(b, fill) - ratio(a, fill))[0]
  // A solid fill (buttons, badges) must leave room for white or near-black text on it, including the 90% hover state.
  const readsOn = (fill, extra = []) => [fill, ...extra].every((sf) => ratio(fillText(fill), sf) >= TEXT)

  for (let round = 0; round < 8; round++) {
    const { background, card, popover, muted, secondary, accent, sidebar } = s
    const sa = s['sidebar-accent']
    // Status colours first: the foreground must also read on their tints.
    ink.success = adjustUntil(ink.success, dark, (x) => readsOn(x) && textOn(x, [background, card], TEXT) && ratio(x, tint(x, 0.15, background)) >= TINT && ratio(x, tint(x, 0.15, card)) >= TEXT)
    ink.destructive = adjustUntil(ink.destructive, dark, (x) => readsOn(x) && textOn(x, [background, card, muted], TEXT) && ratio(x, tint(x, 0.1, background)) >= TINT && ratio(x, tint(x, 0.1, card)) >= TEXT)
    ink.info = adjustUntil(ink.info, dark, (x) => readsOn(x) && textOn(x, [background, card], TEXT) && ratio(x, tint(x, 0.15, background)) >= TINT)
    ink.primary = adjustUntil(ink.primary, dark, (x) => readsOn(x, [tint(x, 0.9, background)]) && textOn(x, [background, card, secondary, muted], TEXT) && ratio(x, tint(x, 0.1, background)) >= TINT)
    const tints = [tint(ink.success, 0.15, card), tint(ink.success, 0.3, card), tint(ink.destructive, 0.1, card), tint(ink.destructive, 0.2, card)]
    ink.foreground = adjustUntil(ink.foreground, dark, (x) => textOn(x, [background, card, popover, muted, secondary, accent, sa, ...tints]))
    ink['muted-foreground'] = adjustUntil(ink['muted-foreground'], dark, (x) => textOn(x, [background, card, muted, secondary, popover]))
    ink['sidebar-foreground'] = adjustUntil(ink['sidebar-foreground'], dark, (x) => textOn(x, [sidebar]))
    // Warning: a light fill with dark text in light mode; light text on its tint in dark mode.
    if (dark) {
      ink.warning = adjustUntil(ink.warning, dark, (x) => textOn(x, [background, card], UI) && ratio(x, tint(x, 0.2, background)) >= TINT && ratio(fillText(x), x) >= TEXT)
      ink['warning-foreground'] = fillText(ink.warning)
    } else {
      ink.warning = withLightness(ink.warning, Math.max(toOklch(ink.warning).L, 0.78))
      ink['warning-foreground'] = adjustUntil(withLightness(ink.warning, 0.35), false, (x) => ratio(x, ink.warning) >= TEXT && ratio(x, tint(ink.warning, 0.2, background)) >= TINT && textOn(x, [background, card], UI))
    }
    for (const k of ['input', 'ring']) ink[k] = adjustUntil(ink[k], dark, (x) => textOn(x, [background, card], UI))
    for (const k of ['chart-2', 'chart-3', 'chart-4', 'chart-5']) ink[k] = adjustUntil(ink[k], dark, (x) => textOn(x, [background], UI))
    // Dark filled fields (card) must stay distinct from the outline field fill (input at 30%) over page and card.
    if (dark) {
      const distinct = (cd) => [background, cd].every((sf) => ratio(cd, tint(ink.input, 0.3, sf)) >= 1.16)
      if (!distinct(card)) {
        s.card = adjustUntil(card, true, distinct)
        continue // surfaces changed: solve the inks again
      }
    }
    break
  }

  // Text on solid fills: the button's own text colour when it passes, else white or near-black, whichever reads better.
  const onFill = (fill, preferred, extra = []) => {
    for (const cand of [preferred, fillText(fill)].filter(Boolean)) if ([fill, ...extra].every((sf) => ratio(cand, sf) >= TEXT)) return cand
    throw new Error(`no text colour reads on ${toHex(fill)}`)
  }
  const out = {
    ...s,
    foreground: ink.foreground,
    'card-foreground': ink.foreground,
    'popover-foreground': ink.foreground,
    'secondary-foreground': ink.foreground,
    'accent-foreground': ink.foreground,
    'muted-foreground': ink['muted-foreground'],
    primary: ink.primary,
    'primary-foreground': onFill(ink.primary, solid(pick('button.foreground')), [tint(ink.primary, 0.9, bg)]),
    destructive: ink.destructive,
    'destructive-foreground': onFill(ink.destructive),
    success: ink.success,
    'success-foreground': onFill(ink.success),
    info: ink.info,
    'info-foreground': onFill(ink.info),
    warning: ink.warning,
    'warning-foreground': ink['warning-foreground'],
    border: ink.border,
    input: ink.input,
    ring: ink.ring,
    'chart-1': ink.primary,
    'chart-2': ink['chart-2'],
    'chart-3': ink['chart-3'],
    'chart-4': ink['chart-4'],
    'chart-5': ink['chart-5'],
    'sidebar-foreground': ink['sidebar-foreground'],
    'sidebar-accent-foreground': ink.foreground,
    'sidebar-border': ink['sidebar-border'],
  }

  // Code colours on the palette's own background, each at least 4.5:1.
  const code = { bg: toHex(bg), fg: toHex(ink.foreground), muted: toHex(ink['muted-foreground']), header: toHex(s.muted), 'header-fg': toHex(adjustUntil(ink['muted-foreground'], dark, (x) => ratio(x, s.muted) >= TEXT)) }
  for (const [type, scopes] of Object.entries(SCOPES)) {
    const raw = scopes.map((sc) => resolveScope(t.tokenColors, sc)).find(Boolean)
    code[type] = toHex(adjustUntil(raw ? solid(raw) : ink.foreground, dark, (x) => ratio(x, bg) >= TEXT))
  }
  return { tokens: out, code }
}

const block = (selector, tokens) => `${selector} {\n${Object.entries(tokens).map(([k, v]) => `  --${k}: ${v};`).join('\n')}\n}`
const root = new URL('..', import.meta.url).pathname
const dir = join(root, 'packages/ui/src/styles/palettes')
mkdirSync(dir, { recursive: true })
const summary = []
for (const f of FAMILIES) {
  const light = await theme(f.ext, f.light)
  const darkT = await theme(f.ext, f.dark)
  const L = build(light, false)
  const D = build(darkT, true)
  const css = [
    `/* Palette "${f.name}": apply with <html data-palette="${f.name}"> (see useThemeStore) or on any region. The second selector of each block scopes a region. Generated by scripts/gen-palettes.mjs from the`,
    ` * MIT-licensed VS Code theme ${f.credit} ${light.version}; do not edit by hand. Surfaces keep the editor colours; text,`,
    ' * accents, borders and the ring were moved in lightness only where needed to pass src/__tests__/contrast.test.ts. */',
    block(`:root[data-palette="${f.name}"], [data-palette="${f.name}"]`, Object.fromEntries(Object.entries(L.tokens).map(([k, v]) => [k, toOklchString(v)]))),
    block(`.dark [data-palette="${f.name}"], :root[data-palette="${f.name}"].dark`, Object.fromEntries(Object.entries(D.tokens).map(([k, v]) => [k, toOklchString(v)]))),
    '/* Code colours follow the palette unless a data-code-theme is set on the same element. */',
    block(`[data-palette="${f.name}"]:not([data-code-theme])`, Object.fromEntries(Object.entries(L.code).map(([k, v]) => [`code-${k}`, v]))),
    block(`.dark [data-palette="${f.name}"]:not([data-code-theme]), [data-palette="${f.name}"]:not([data-code-theme]).dark`, Object.fromEntries(Object.entries(D.code).map(([k, v]) => [`code-${k}`, v]))),
    '',
  ].join('\n')
  writeFileSync(join(dir, `${f.name}.css`), css)
  summary.push(`${f.name.padEnd(9)} ${f.credit} ${light.version}`)
}
const names = FAMILIES.map((f) => f.name)
writeFileSync(join(root, 'packages/ui/src/styles/palettes.css'), `/* All palettes. Import after theme.css and the accent presets, before packs.css: @import "@perfect-design/ui/palettes.css"; (or single palettes from ./palettes/*.css). Generated by scripts/gen-palettes.mjs. */\n${names.map((n) => `@import "./palettes/${n}.css";`).join('\n')}\n@import "./palette-code.css";\n`)
writeFileSync(join(root, 'packages/ui/src/lib/palettes.ts'), `/** Whole-interface palettes in styles/palettes (generated by scripts/gen-palettes.mjs). \`default\` is the core look and needs no attribute. */\nexport const THEME_PALETTES = ${JSON.stringify(['default', ...names]).replace(/"/g, "'").replace(/,/g, ', ')} as const\nexport type ThemePalette = (typeof THEME_PALETTES)[number]\n/** The VS Code theme each palette adapts, for credits in pickers and docs. */\nexport const PALETTE_SOURCES: Record<Exclude<ThemePalette, 'default'>, string> = ${JSON.stringify(Object.fromEntries(FAMILIES.map((f) => [f.name, f.credit.replace(/ \(.*$/, '')])), null, 2).replace(/"/g, "'")}\n`)
cleanup()
console.log(summary.join('\n'))
