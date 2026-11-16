import { describe, expect, it } from 'vitest'
import type { Block, Inline, Root } from './ast'
import { parseMarkdown } from './parse'

// Stress test: about 2 s locally, up to 6 s on a shared CI runner under coverage; the 5 s default is too tight.
const STRESS_TIMEOUT = 20_000

/** Every link and image URL anywhere in the tree. The renderer checks these; the parser must keep them as data. */
function urls(root: Root): string[] {
  const out: string[] = []
  const inl = (nodes: Inline[]) => {
    for (const n of nodes) {
      if (n.type === 'link') {
        out.push(n.url)
        inl(n.children)
      } else if (n.type === 'image') out.push(n.url)
      else if (n.type === 'emphasis' || n.type === 'strong' || n.type === 'delete') inl(n.children)
    }
  }
  const blocks = (list: Block[]) => {
    for (const b of list) {
      if (b.type === 'paragraph' || b.type === 'heading') inl(b.children)
      else if (b.type === 'blockquote') blocks(b.children)
      else if (b.type === 'list') b.children.forEach((i) => blocks(i.children))
      else if (b.type === 'table') [b.head, ...b.rows].forEach((r) => r.forEach(inl))
    }
  }
  blocks(root.children)
  return out
}

const timed = (fn: () => void) => {
  const t = performance.now()
  fn()
  return performance.now() - t
}

describe('parser keeps hostile input as data', () => {
  it('no node type can carry HTML', () => {
    const root = parseMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1)) <b onclick=x>')
    expect(JSON.stringify(root)).not.toMatch(/"type":"(html|raw)/)
  })
  it('tricky link destinations are surfaced verbatim for the renderer to reject', () => {
    expect(urls(parseMarkdown('[x](javascript:alert(1)) [y](  JaVaScRiPt:alert(1)) [z](&#106;avascript:alert(1))'))).toEqual(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'javascript:alert(1)'])
  })
  it('a newline inside a destination makes it not a link at all', () => expect(urls(parseMarkdown('[x](java\nscript:alert(1))'))).toEqual([]))
  it('a title cannot break out of the destination', () => expect(urls(parseMarkdown('[x](a "b" onerror="alert(1)")'))).toEqual([]))
  it('an image alt cannot carry markup', () => {
    const [p] = parseMarkdown('![<img src=x onerror=alert(1)>](a.png)').children
    expect(p).toMatchObject({ children: [{ type: 'image', alt: '<img src=x onerror=alert(1)>' }] })
  })
  it('an attribute-breaking image destination is not an image', () => expect(urls(parseMarkdown('![x](x" onerror="alert(1))'))).toEqual([]))
  it('an attribute-breaking destination in angle brackets is data', () => expect(urls(parseMarkdown('![x](<x" onerror="alert(1)>)'))).toEqual(['x" onerror="alert(1)']))
  it('reference definitions with hostile destinations are still data', () => expect(urls(parseMarkdown('[a]: javascript:alert(1)\n\n[a]'))).toEqual(['javascript:alert(1)']))
  it('code info strings are data', () => {
    const [code] = parseMarkdown('```"><script>alert(1)</script>\nx\n```').children
    expect(code).toMatchObject({ type: 'code', lang: '"><script>alert(1)</script>' })
  })
  it('entities cannot smuggle a tag', () => expect(JSON.stringify(parseMarkdown('&lt;script&gt;'))).toContain('<script>'))
})

describe('hostile input finishes quickly', () => {
  const N = 100_000
  const inputs: Record<string, string> = {
    stars: '*'.repeat(N),
    'unmatched emphasis': '*a '.repeat(N / 3),
    'interleaved emphasis': '*a_'.repeat(N / 3) + '_a*'.repeat(N / 3),
    'deep emphasis pairs': '*a'.repeat(N / 4) + 'a*'.repeat(N / 4),
    'open brackets': '['.repeat(N),
    'close brackets': ']'.repeat(N),
    'bracket pairs': '[a]'.repeat(N / 3),
    'half links': '[a]('.repeat(N / 4),
    'half titles': '[a](b "'.repeat(N / 7),
    'half angle links': '[a](<'.repeat(N / 5),
    'half images': '![a]('.repeat(N / 5),
    'nested links': '[a '.repeat(N / 3) + ']'.repeat(N / 3),
    backticks: '`'.repeat(N),
    'mixed backtick runs': '`a``b```c````'.repeat(N / 13),
    'growing backtick runs': Array.from({ length: 400 }, (_, i) => '`'.repeat(i + 1) + 'x').join(' '),
    'block quote markers': '>'.repeat(N),
    'quote lines': '> a\n'.repeat(N / 4),
    'staircase lists': Array.from({ length: 2000 }, (_, k) => `${' '.repeat(k % 40)}- x`).join('\n'),
    'list markers': '1. '.repeat(N / 3),
    'long emphasis': '*' + 'word '.repeat(N / 5),
    'one long line': 'a'.repeat(N * 5),
    'leading spaces': ' '.repeat(N) + 'x',
    'trailing spaces': ('a' + ' '.repeat(100) + '\n').repeat(N / 100),
    hashes: '#'.repeat(N),
    'heading with spaces': '# ' + ' '.repeat(N) + '#',
    fences: '```\n'.repeat(N / 4),
    'fence then backticks': '```' + '`'.repeat(N) + 'x',
    pipes: '|'.repeat(N),
    'table body': '| a | b |\n|---|---|\n' + '| 1 | 2 |\n'.repeat(N / 10),
    'header rows': '|a|b|\n'.repeat(N / 6),
    ampersands: '&'.repeat(N),
    entities: '&amp;'.repeat(N / 5),
    'angle brackets': '<'.repeat(N),
    'autolink openers': '<http://'.repeat(N / 8),
    'bare url openers': 'http://a'.repeat(N / 8),
    'bare url parens': 'https://x.y/' + '('.repeat(N),
    backslashes: '\\'.repeat(N),
    'reference openers': '[a]: '.repeat(N / 5),
    'reference definitions': Array.from({ length: 5000 }, (_, i) => `[r${i}]: /u${i} "t"`).join('\n') + '\n\n' + Array.from({ length: 5000 }, (_, i) => `[r${i}]`).join(' '),
    'setext candidates': 'a\n'.repeat(N / 2) + '---',
    'emphasis soup': '*_*_*_**__'.repeat(N / 10),
    tildes: '~~a '.repeat(N / 4),
    'every special': '*a_[b`c~~d<e&f\\g!'.repeat(N / 17),
    tabs: '\t'.repeat(N) + 'x',
    newlines: '\n'.repeat(N),
    'task items': '- [ ] a\n'.repeat(N / 8),
  }
  it.each(Object.entries(inputs))('%s', (_, src) => {
    // 100 KB of any of these takes a few milliseconds; the bound is loose enough for slow CI and tight enough to catch quadratic time.
    expect(timed(() => parseMarkdown(src))).toBeLessThan(1500)
    expect(timed(() => parseMarkdown(src, { streaming: true }))).toBeLessThan(1500)
  })

  it('time grows roughly linearly', () => {
    const run = (n: number) => timed(() => parseMarkdown('[a]('.repeat(n) + '*a '.repeat(n) + '`'.repeat(n)))
    run(2000)
    const small = Math.max(run(10_000), 1)
    const large = run(40_000)
    expect(large).toBeLessThan(small * 40 + 50)
  })

  it('does not blow the stack on deep nesting', () => {
    expect(() => parseMarkdown('>'.repeat(50_000))).not.toThrow()
    expect(() => parseMarkdown('> '.repeat(50_000))).not.toThrow()
    expect(() => parseMarkdown(Array.from({ length: 5000 }, (_, k) => `${' '.repeat(k)}- x`).join('\n'))).not.toThrow()
    expect(() => parseMarkdown('*'.repeat(10_000) + 'a' + '*'.repeat(10_000))).not.toThrow()
    expect(() => parseMarkdown('['.repeat(20_000) + 'a' + '](u)'.repeat(20_000))).not.toThrow()
    expect(() => parseMarkdown('![a'.repeat(20_000) + ']()'.repeat(20_000))).not.toThrow()
  }, STRESS_TIMEOUT)

  it('nesting stays within the configured depth', () => {
    const depthOf = (node: unknown): number => {
      if (!node || typeof node !== 'object') return 0
      const kids = (node as { children?: unknown[] }).children
      return 1 + (Array.isArray(kids) ? Math.max(0, ...kids.map(depthOf)) : 0)
    }
    const quotes = parseMarkdown('> '.repeat(1000) + 'x')
    expect(depthOf(quotes)).toBeLessThanOrEqual(1 + 32 + 2)
    const em = parseMarkdown('*a '.repeat(500) + 'x' + ' a*'.repeat(500))
    expect(depthOf(em)).toBeLessThanOrEqual(2 + 33)
    const lists = parseMarkdown(Array.from({ length: 500 }, (_, k) => `${' '.repeat(k * 2)}- x`).join('\n'))
    expect(depthOf(lists)).toBeLessThanOrEqual(1 + 3 * 32 + 3)
  })
})

describe('random input never throws and never falls back', () => {
  let seed = 20240607
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)
  const alphabet = ['*', '_', '~', '`', '[', ']', '(', ')', '!', '<', '>', '&', '#', '-', '+', '|', ':', '\\', '"', "'", ' ', ' ', '\n', '\n', '\t', '1.', '- ', '> ', '```', '~~~', '    ', 'a', 'b', 'http://x.y', '[ ]', '[x]', ';', '=', '---', '|-|', '&amp;', '\r']
  it('fuzz', () => {
    for (let n = 0; n < 1500; n += 1) {
      let s = ''
      const len = 1 + Math.floor(rnd() * 300)
      for (let i = 0; i < len; i += 1) s += alphabet[Math.floor(rnd() * alphabet.length)]
      for (const options of [{}, { streaming: true }, { inline: true }, { maxDepth: 2 }]) {
        const root = parseMarkdown(s, options)
        expect(root.plain, JSON.stringify(s)).toBeUndefined()
      }
    }
  })
})

describe('performance smoke', () => {
  it('parses a 200 KB document within a generous bound', () => {
    const block =
      '# Heading\n\nSome *text* with `code` and [a link](https://example.com) and **bold** and https://example.org/path.\n\n- a\n- b\n  - c\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```yaml\nk: v\n```\n\n> quote\n\n1. one\n2. two\n\n'
    const doc = block.repeat(Math.ceil(200_000 / block.length))
    expect(doc.length).toBeGreaterThanOrEqual(200_000)
    expect(timed(() => parseMarkdown(doc))).toBeLessThan(2000)
  })
})
