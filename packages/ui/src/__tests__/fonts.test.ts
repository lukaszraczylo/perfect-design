/**
 * Font families guard: every family is defined, documented in DESIGN.md, registered in the store and stays inside the
 * slop rules (platform stacks only, no hard-coded colour, no web-font loading, no effects).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { THEME_FONTS } from '../stores/theme'

const stylesDir = resolve(process.cwd(), 'src/styles')
const css = readFileSync(`${stylesDir}/fonts.css`, 'utf8')
const design = readFileSync(resolve(process.cwd(), '../../DESIGN.md'), 'utf8')
const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { exports: Record<string, unknown> }
const code = css.replace(/\/\*[\s\S]*?\*\//g, '')
const rules = [...code.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim(), body: m[2] }))

describe('font families: registry', () => {
  it('every store font has exactly one rule and every rule is a store font', () => {
    const names = rules.map((r) => r.selector.match(/^\[data-font="([a-z]+)"\]$/)?.[1])
    expect(names.sort()).toEqual([...THEME_FONTS].sort())
  })
  it('every rule sets font-family, --font-sans and --font-display together', () => {
    for (const r of rules) {
      expect(r.body, r.selector).toMatch(/font-family:\s*var\(--font-sans\)/)
      expect(r.body, r.selector).toMatch(/--font-sans:\s*[^;]+;/)
      expect(r.body, r.selector).toMatch(/--font-display:\s*var\(--font-sans\)/)
    }
  })
  it('every family is documented in DESIGN.md with a brief', () => {
    const section = design.slice(design.indexOf('## 10. Font families'))
    expect(section.length).toBeGreaterThan(300)
    for (const name of THEME_FONTS) expect(section, name).toMatch(new RegExp(`\\| \`${name}\` \\|[^|]+\\|`))
  })
  it('is exported as @perfect-design/ui/fonts.css', () => {
    expect(pkg.exports['./fonts.css']).toBe('./src/styles/fonts.css')
  })
})

describe('font families: safety rules', () => {
  it('ships no font file and loads nothing', () => {
    expect(code).not.toMatch(/@font-face|url\(|@import/)
  })
  it('has no colour, gradient, blur or effect, and sets nothing but font tokens', () => {
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|oklch\(|gradient\(|blur\(|backdrop-filter|transition|animation|transform/)
    for (const r of rules) {
      const props = [...r.body.matchAll(/(?:^|;)\s*(-{0,2}[a-z][a-z-]*)\s*:/g)].map((m) => m[1])
      expect(props.sort(), r.selector).toEqual(['--font-display', '--font-sans', 'font-family'])
    }
  })
  it('every stack ends in a generic family so a missing font never falls back to the browser default', () => {
    for (const r of rules) {
      const stack = r.body.match(/--font-sans:\s*([^;]+);/)![1]
      expect(stack.trim(), r.selector).toMatch(/(sans-serif|serif|monospace)$/)
    }
  })
  it('default mirrors the IBM Plex stack in theme.css', () => {
    const theme = readFileSync(`${stylesDir}/theme.css`, 'utf8')
    const core = theme.match(/--font-sans:\s*([^;]+);/)![1]
    expect(rules.find((r) => r.selector.includes('"default"'))!.body).toContain(core)
  })
})
