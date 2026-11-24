/**
 * Corner shapes guard: every corner is defined, documented in DESIGN.md, registered in the store and exported. The CSS
 * is progressive enhancement only (inside @supports), touches nothing but corner geometry, keeps fully round shapes
 * round and leaves the default output unchanged.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { __unstable__loadDesignSystem } from '@tailwindcss/node'
import { describe, expect, it } from 'vitest'
import { THEME_CORNERS } from '../stores/theme'

const stylesDir = resolve(process.cwd(), 'src/styles')
const css = readFileSync(`${stylesDir}/corners.css`, 'utf8')
const theme = readFileSync(`${stylesDir}/theme.css`, 'utf8')
const design = readFileSync(resolve(process.cwd(), '../../DESIGN.md'), 'utf8')
const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { exports: Record<string, unknown> }
const code = css.replace(/\/\*[\s\S]*?\*\//g, '')

const SUPPORTS = '@supports (corner-shape: squircle)'
const supportsStart = code.indexOf(SUPPORTS)
const open = code.indexOf('{', supportsStart)
let depth = 0
let close = -1
for (let i = open; i < code.length; i++) {
  if (code[i] === '{') depth++
  else if (code[i] === '}' && --depth === 0) {
    close = i
    break
  }
}
const inner = supportsStart < 0 ? '' : code.slice(open + 1, close)
const outside = supportsStart < 0 ? code : code.slice(0, supportsStart) + code.slice(close + 1)
const rules = [...inner.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim().replace(/\s+/g, ' '), body: m[2] }))
const scopeRules = rules.filter((r) => /^\[data-corner="[a-z]+"\]$/.test(r.selector))

/** Removes every balanced `:where(...)`: its content adds no specificity, so nothing outside it may name a scope. */
function stripWhere(selector: string): string {
  let out = ''
  for (let i = 0; i < selector.length; i++) {
    if (selector.startsWith(':where(', i)) {
      let d = 0
      let j = i + ':where'.length
      for (; j < selector.length; j++) {
        if (selector[j] === '(') d++
        else if (selector[j] === ')' && --d === 0) break
      }
      i = j
    } else out += selector[i]
  }
  return out
}

describe('corner shapes: registry', () => {
  it('every store corner has exactly one scope rule and every scope rule is a store corner', () => {
    expect(scopeRules.map((r) => r.selector.match(/"([a-z]+)"/)![1]).sort()).toEqual([...THEME_CORNERS].sort())
  })
  it('each scope rule sets the radius scale and the inherited corner shape', () => {
    for (const r of scopeRules) {
      expect(r.body, r.selector).toMatch(/--radius-scale:\s*[\d.]+;/)
      expect(r.body, r.selector).toMatch(/--corner-shape:\s*(?:round|squircle);/)
    }
  })
  it('squircle scales the radius up and uses the squircle shape', () => {
    const body = scopeRules.find((r) => r.selector.includes('"squircle"'))!.body
    expect(body).toMatch(/--radius-scale:\s*1\.5;/)
    expect(body).toMatch(/--corner-shape:\s*squircle;/)
  })
  it('round restores the core: scale 1 and the plain round shape, so a nested scope can undo squircle', () => {
    const body = scopeRules.find((r) => r.selector.includes('"round"'))!.body
    expect(body).toMatch(/--radius-scale:\s*1;/)
    expect(body).toMatch(/--corner-shape:\s*round;/)
  })
  it('every corner is documented in DESIGN.md with a brief', () => {
    const section = design.slice(design.indexOf('## 12. Corner shapes'))
    expect(section.length).toBeGreaterThan(300)
    for (const name of THEME_CORNERS) expect(section, name).toMatch(new RegExp(`\\| \`${name}\` \\|[^|]+\\|`))
  })
  it('is exported as @perfect-design/ui/corners.css', () => {
    expect(pkg.exports['./corners.css']).toBe('./src/styles/corners.css')
  })
})

describe('corner shapes: safety rules', () => {
  it('has the @supports block and nothing outside it, so browsers without corner-shape keep plain rounded corners', () => {
    expect(supportsStart).toBeGreaterThanOrEqual(0)
    expect(outside.trim()).toBe('')
  })
  it('uses no clip-path or mask (they cut borders, shadows and focus rings)', () => {
    expect(code).not.toMatch(/clip-path|mask|url\(|@import/)
  })
  it('has no colour, gradient, blur, effect or motion, and sets only corner geometry', () => {
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|oklch\(|gradient\(|blur\(|backdrop-filter|box-shadow|transition|animation|transform/)
    for (const r of rules) {
      const props = [...r.body.matchAll(/(?:^|;)\s*(-{0,2}[a-z][a-z-]*)\s*:/g)].map((m) => m[1])
      for (const p of props) expect(['--radius-scale', '--corner-shape', 'corner-shape'], `${r.selector} sets ${p}`).toContain(p)
    }
  })
  it('every selector is scoped to a data-corner attribute, so nothing changes until one is set', () => {
    for (const r of rules) expect(r.selector, r.selector).toContain('[data-corner')
  })
  it('structural rules use :where() so component and consumer rules are never out-ranked', () => {
    for (const r of rules.filter((x) => x.body.includes('corner-shape:') && !x.body.includes('--corner-shape'))) {
      expect(stripWhere(r.selector), r.selector).not.toMatch(/\[data-corner|\[class/)
    }
  })
  it('applies to the scope, every descendant and the pseudo-elements', () => {
    const apply = rules.find((r) => /corner-shape:\s*var\(--corner-shape,\s*round\)/.test(r.body))
    expect(apply, 'rule applying corner-shape: var(--corner-shape, round)').toBeTruthy()
    expect(apply!.selector).toMatch(/\[data-corner\]\s*\*/)
    expect(apply!.selector).toContain('::before')
    expect(apply!.selector).toContain('::after')
  })
})

describe('corner shapes: fully round shapes stay round', () => {
  const reset = rules.find((r) => /corner-shape:\s*round;/.test(r.body) && r.selector.includes('rounded-full'))
  it('has a reset rule that sets corner-shape: round after the generic rule, so it wins at equal specificity', () => {
    expect(reset).toBeTruthy()
    const apply = rules.findIndex((r) => /corner-shape:\s*var\(--corner-shape/.test(r.body))
    expect(rules.indexOf(reset!)).toBeGreaterThan(apply)
  })
  it('covers every rounded-*-full form used by the components, including variant prefixes', () => {
    const files = import.meta.glob(['../components/**/*.vue', '../components/**/*.ts', '!../**/*.test.ts', '!../**/*.docs.ts'], { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
    const forms = new Set<string>()
    for (const text of Object.values(files)) for (const m of text.matchAll(/rounded(?:-[a-z]{1,2})?-full/g)) forms.add(m[0])
    expect(forms.size).toBeGreaterThan(3)
    for (const f of forms) expect(reset!.selector, f).toContain(`[class*="${f}"]`)
  })
  it('matches variant forms such as data-[state=checked]:rounded-full by substring', () => {
    expect(reset!.selector).toContain('[class*="rounded-full"]')
  })
  it('lets rounded-[inherit] follow its parent, so an avatar image stays circular', () => {
    const inherit = rules.find((r) => r.selector.includes('rounded-[inherit]'))
    expect(inherit?.body).toMatch(/corner-shape:\s*inherit;/)
    expect(rules.indexOf(inherit!)).toBeGreaterThan(rules.indexOf(reset!))
  })
})

describe('corner shapes: radius scale', () => {
  const tokens = Object.fromEntries([...theme.matchAll(/--radius-(xs|sm|md|lg|xl|2xl):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
  const BASE = 8 // --radius: 0.5rem
  const LEGACY = { xs: 2, sm: 4, md: 6, lg: 8, xl: 12, '2xl': 16 } as const
  const evaluate = (expr: string, scale: number) => {
    const px = expr.replace(/var\(--radius-scale,\s*1\)/g, String(scale)).replace(/var\(--radius\)/g, `${BASE}`).replace(/(\d+(?:\.\d+)?)px/g, '$1')
    return Function(`return ${px.replace(/calc/g, '')}`)() as number
  }
  it('every derived radius token multiplies the base by --radius-scale', () => {
    expect(Object.keys(tokens).sort()).toEqual(Object.keys(LEGACY).sort())
    for (const [k, v] of Object.entries(tokens)) expect(v, k).toContain('var(--radius-scale, 1)')
  })
  it('at the default scale every token keeps its previous value', () => {
    for (const [k, px] of Object.entries(LEGACY)) expect(evaluate(tokens[k], 1), k).toBe(px)
  })
  it('a larger scale makes every step larger', () => {
    for (const k of Object.keys(LEGACY)) expect(evaluate(tokens[k], 1.5), k).toBeGreaterThan(evaluate(tokens[k], 1))
  })
  it('the scale reaches the generated rounded-* utilities (they inline the token)', async () => {
    const design = await __unstable__loadDesignSystem(`@import "tailwindcss";\n${theme}`, { base: stylesDir })
    const out = design.candidatesToCss(['rounded-xs', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full'])
    for (const [i, css] of out.entries()) {
      if (i === 6) expect(css, 'rounded-full').toContain('infinity')
      else expect(css, `utility ${i}`).toContain('var(--radius-scale, 1)')
    }
  })
})
