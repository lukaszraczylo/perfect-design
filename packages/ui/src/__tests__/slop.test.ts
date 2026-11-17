/**
 * LLMSlop guard. Mechanical checks from `LLMSlop.md` section 12 over shipped source (components, styles,
 * composables, lib) and over the component docs/examples. A hit is a prompt to justify: add the path to the
 * matching allow-list below AND to DESIGN.md section 7, with the reason. Never loosen a pattern to pass.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const shipped = import.meta.glob(
  [
    '../**/*.vue',
    '../**/*.ts',
    '!../**/*.test.ts',
    '!../**/*.docs.ts',
    '!../__tests__/**',
    '!../**/*.d.ts',
    '!../**/testing.ts',
  ],
  { eager: true, query: '?raw', import: 'default' },
) as Record<string, string>

const docs = import.meta.glob('../**/*.docs.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

/** Strip comments so a rule explained in a comment does not trip the scan. */
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1').replace(/<!--[\s\S]*?-->/g, '')

function hits(files: Record<string, string>, re: RegExp, allow: string[] = []): string[] {
  const out: string[] = []
  for (const [path, text] of Object.entries(files)) {
    if (allow.some((a) => path.includes(a))) continue
    const lines = code(text).split('\n')
    lines.forEach((line, i) => {
      if (re.test(line)) out.push(`${path.replace('../', 'src/')}:${i + 1}: ${line.trim().slice(0, 100)}`)
    })
  }
  return out
}

// CSS is read from disk: Vitest turns CSS imports into empty strings, even with ?raw.
// Tests run with packages/ui as the working directory.
const src = (rel: string) => resolve(process.cwd(), 'src', rel)
const read = (rel: string) => readFileSync(src(rel), 'utf8')
const themeCss = read('styles/theme.css')
const themeFiles: [string, string][] = readdirSync(src('styles/themes'))
  .filter((f) => f.endsWith('.css'))
  .map((f) => [`styles/themes/${f}`, read(`styles/themes/${f}`)])

describe('slop guard: scan covers real files', () => {
  it('sees components and the theme', () => {
    expect(Object.keys(shipped).length).toBeGreaterThan(300)
    expect(Object.keys(docs).length).toBeGreaterThan(100)
    expect(themeCss.length).toBeGreaterThan(1000)
  })
})

describe('slop guard: colour (C1 to C5, C8)', () => {
  it('no indigo, violet or purple utilities in components', () => {
    expect(hits(shipped, /\b(?:bg|text|border|ring|from|via|to|shadow)-(?:indigo|violet|purple)-\d/)).toEqual([])
  })
  it('no gradients (C2) and no gradient-clipped text (C3)', () => {
    // mask-image fades (Marquee edges) hide content, they are not a visible gradient.
    expect(hits(shipped, /\b(?:bg-gradient-|bg-linear-|bg-radial-|bg-conic-|bg-clip-text)|(?<!mask-image:)\blinear-gradient\(|radial-gradient\(/, ['Marquee/'])).toEqual([])
  })
  it('no blurred glows or coloured shadows (C4, C5)', () => {
    expect(hits(shipped, /\b(?:blur-(?:2xl|3xl)|shadow-(?:indigo|violet|purple|blue|pink|primary)\b|drop-shadow-\[)/)).toEqual([])
  })
  it('default --primary hue is not indigo/violet/purple (C1)', () => {
    const light = /:root\s*\{[\s\S]*?--primary:\s*oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+)/.exec(themeCss)
    expect(light, 'light --primary not found').not.toBeNull()
    const hue = Number(light![1])
    expect(hue < 245 || hue > 330, `--primary hue ${hue} is in the indigo/violet/purple band (245 to 330)`).toBe(true)
  })
  it('--card is not pure white (C8)', () => {
    expect(/--card:\s*oklch\(\s*1\s+0\s+0\s*\)/.test(themeCss)).toBe(false)
  })
  it('accent presets: only the documented brand overrides may be indigo/violet/purple', () => {
    const bad = themeFiles
      .filter(([p]) => !/(?:indigo|violet|lime|neon)\.css$/.test(p))
      .filter(([, t]) => {
        const m = /--primary:\s*oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+)/.exec(t)
        return m && Number(m[1]) >= 245 && Number(m[1]) <= 330
      })
      .map(([p]) => p)
    expect(bad).toEqual([])
  })
})

describe('slop guard: typography (T1, T2, T4, T5)', () => {
  it('opt-in font families never name Inter, Space Grotesk, Geist or Instrument Serif', () => {
    const fonts = readFileSync(resolve(process.cwd(), 'src/styles/fonts.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(fonts).not.toMatch(/\b(?:Inter|Space Grotesk|Geist|Instrument Serif)\b/i)
  })
  it('font tokens are not Inter, Space Grotesk, Geist or Instrument Serif', () => {
    const fam = [...themeCss.matchAll(/--font-(?:sans|display|mono):\s*([^;]+);/g)].map((m) => m[1]).join(' | ')
    expect(fam.length).toBeGreaterThan(0)
    expect(/\b(?:Inter|Space Grotesk|Geist|Instrument Serif|Roboto|Arial)\b/i.test(fam), fam).toBe(false)
  })
  it('no tracked all-caps labels in components (T4, T5)', () => {
    expect(hits(shipped, /\buppercase\b[^'"`]*\btracking-|\btracking-[^'"`]*\buppercase\b/)).toEqual([])
  })
  it('no stray all-caps utility outside the allow-list', () => {
    expect(hits(shipped, /(?:^|[\s'"`])uppercase(?:[\s'"`]|$)/, ['Eyebrow/', 'typography/Text/'])).toEqual([])
  })
})

describe('slop guard: surfaces (S2 to S6)', () => {
  it('no backdrop blur or glass (S4)', () => {
    expect(hits(shipped, /\bbackdrop-blur/)).toEqual([])
  })
  it('radius stops at xl: no rounded-2xl, rounded-3xl (S2)', () => {
    expect(hits(shipped, /\brounded(?:-[tblrse]{1,2})?-(?:2xl|3xl|4xl)\b/)).toEqual([])
  })
  it('no coloured stripe on card edges (S5)', () => {
    expect(hits(shipped, /\bborder-[lt]-(?:4|8)\b/)).toEqual([])
  })
  it('no emoji in source (S6)', () => {
    expect(hits(shipped, /[\u2600-\u27BF\u{1F000}-\u{1FAFF}]/u)).toEqual([])
    expect(hits(docs, /[\u2600-\u27BF\u{1F000}-\u{1FAFF}]/u)).toEqual([])
  })
  it('no default sparkles, shield-check or zap icons (S7)', () => {
    expect(hits(shipped, /\b(?:Sparkles|ShieldCheck|faWandMagicSparkles|faBolt)\b|<Zap\b/)).toEqual([])
    expect(hits(docs, /\b(?:Sparkles|ShieldCheck|faWandMagicSparkles)\b|<Zap\b|['"]sparkles['"]/)).toEqual([])
  })
})

describe('slop guard: motion (M1 to M4, M6)', () => {
  it('no hover scale, hover lift or bounce (M2)', () => {
    expect(hits(shipped, /\b(?:hover:scale-|hover:-translate-y-|group-hover:scale-|animate-bounce|animate-pulse-slow|ease-\[cubic-bezier\([^)]*-)/)).toEqual([])
  })
  it('no scroll-reveal triggers or count-up (M1, M3)', () => {
    expect(hits(shipped, /\b(?:whileInView|data-aos|animate-on-scroll)\b/)).toEqual([])
  })
  it('hero content does not fade in by default (M1)', () => {
    expect(hits(shipped, /animate-ds-fade-in/, ['overlays/', 'navigation/', 'feedback/', 'SectionReveal/', 'styles/'])).toEqual([])
  })
  it('theme honours prefers-reduced-motion (M6)', () => {
    expect(themeCss).toMatch(/prefers-reduced-motion/)
  })
})

describe('slop guard: copy defaults (W2, W6, S12)', () => {
  const BUZZ = /\b(?:seamless(?:ly)?|robust|cutting-edge|supercharge[sd]?|effortless(?:ly)?|streamline[sd]?|empower(?:s|ed|ing)?|revolutioni[sz]e|next-gen(?:eration)?|game-chang\w+|world-class|best-in-class|state-of-the-art)\b/i
  it('no buzzwords in shipped strings', () => {
    expect(hits(shipped, BUZZ)).toEqual([])
  })
  it('no buzzwords in docs and examples', () => {
    expect(hits(docs, BUZZ)).toEqual([])
  })
  it('no stock button labels or openers as defaults or examples', () => {
    const STOCK = /['">`](?:Get started|Learn more|Get Started|Learn More|Stay in the loop|Ready to (?:transform|get started|start)\b[^'"<`]*|Join \d[\d,]*\+? (?:teams|users|developers))/
    expect(hits(shipped, STOCK)).toEqual([])
    // Docs may name the stock labels inside a rule that forbids them.
    const noRuleLines = Object.fromEntries(
      Object.entries(docs).map(([k, v]) => [k, v.split('\n').filter((l) => !/\b(?:never|don't|do not|avoid|not)\b/i.test(l)).join('\n')]),
    )
    expect(hits(noRuleLines, STOCK)).toEqual([])
  })
  it('no "not just X, it\'s Y" frames in docs (W3)', () => {
    expect(hits(docs, /\bnot just\b[^.]{0,60}\b(?:it's|but)\b/i)).toEqual([])
  })
})

describe('slop guard: content honesty (section 10, H3, H7, W12)', () => {
  it('no dead links, lorem or placeholder people and companies', () => {
    const re = /href=["']#["']|\blorem ipsum\b|\bJohn Doe\b|\bJane Doe\b|\bSarah Chen\b|\bAcme\b|\bInitech\b|\bGlobex\b|\bNexus\b|\bSynapse\b|\bFlowbase\b/i
    expect(hits(shipped, re)).toEqual([])
    expect(hits(docs, re)).toEqual([])
  })
  it('no z-index 9999 or 100vw (H7)', () => {
    expect(hits(shipped, /\bz-\[?(?:9999|99999)\]?|z-index:\s*9{3,}|\bw-\[?100vw\]?/)).toEqual([])
  })
  it('no hard-coded colours in components (H6)', () => {
    expect(hits(shipped, /(?:#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?!\w)|\brgba?\(|\bhsla?\()/, ['styles/', '_chart/', 'AccentPicker/', 'ColorPicker/'])).toEqual([])
  })
})
