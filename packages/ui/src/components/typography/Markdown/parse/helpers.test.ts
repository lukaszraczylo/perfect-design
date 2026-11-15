import { describe, expect, it } from 'vitest'
import { decodeEntities, unescapeString } from './entities'
import { clampOffset, extractHeadings, headingMap } from './headings'
import { parseInfo } from './info'
import { createSlugger, slugify } from './slug'
import { renderMarkdownToText } from './text'
import { inlineToText } from './inline'
import { parseMarkdown, type Root } from './index'
import * as api from './index'

describe('entities', () => {
  it('decodes numeric and named references', () => expect(decodeEntities('&amp;&lt;&gt;&quot;&#65;&#x42;&nbsp;')).toBe('&<>"AB '))
  it('leaves unknown, incomplete and bare ampersands', () => expect(decodeEntities('&bogus; &amp &#; a & b')).toBe('&bogus; &amp &#; a & b'))
  it('is a no-op without ampersands', () => expect(decodeEntities('plain')).toBe('plain'))
  it('is not recursive', () => expect(decodeEntities('&amp;lt;')).toBe('&lt;'))
  it('named references are an own-property lookup', () => expect(decodeEntities('&constructor; &__proto__; &toString;')).toBe('&constructor; &__proto__; &toString;'))
  it('unescapeString resolves backslashes and entities', () => expect(unescapeString('a\\*b&amp;c\\q')).toBe('a*b&c\\q'))
  it('unescapeString returns plain text unchanged', () => expect(unescapeString('abc')).toBe('abc'))
})

describe('slugify', () => {
  it.each([
    ['Hello World', 'hello-world'],
    ['  Spaces   everywhere  ', 'spaces-everywhere'],
    ["What's new? (v2.0)", 'whats-new-v20'],
    ['snake_case stays', 'snake_case-stays'],
    ['a - b -- c', 'a-b-c'],
    ['Café crème', 'café-crème'],
    ['العربية نص', 'العربية-نص'],
    ['日本語 見出し', '日本語-見出し'],
    ['Step 1: Install', 'step-1-install'],
    ['!!!', ''],
    ['', ''],
    ['<script>alert(1)</script>', 'scriptalert1script'],
    ['a\tb\nc', 'a-b-c'],
  ])('%j -> %j', (text, slug) => expect(slugify(text)).toBe(slug))
  it('caps the length', () => expect(slugify('a'.repeat(1000)).length).toBeLessThanOrEqual(100))
  it('coerces non-strings', () => {
    expect(slugify(undefined as unknown as string)).toBe('')
    expect(slugify(12 as unknown as string)).toBe('12')
  })
})

describe('createSlugger', () => {
  it('suffixes duplicates with -1, -2', () => {
    const slug = createSlugger()
    expect([slug('A'), slug('A'), slug('A'), slug('b')]).toEqual(['a', 'a-1', 'a-2', 'b'])
  })
  it('does not collide with a heading that already looks like a suffix', () => {
    const slug = createSlugger()
    expect([slug('a'), slug('a-1'), slug('a')]).toEqual(['a', 'a-1', 'a-2'])
  })
  it('falls back to section for empty text', () => {
    const slug = createSlugger()
    expect([slug(''), slug('!!!'), slug('')]).toEqual(['section', 'section-1', 'section-2'])
  })
  it('applies a prefix', () => {
    const slug = createSlugger('doc')
    expect([slug('Intro'), slug('Intro'), slug('')]).toEqual(['doc-intro', 'doc-intro-1', 'doc-section'])
  })
  it('instances are independent', () => {
    expect(createSlugger()('x')).toBe('x')
    expect(createSlugger()('x')).toBe('x')
  })
})

describe('extractHeadings', () => {
  const doc = '# Title\n\n## Install\n\ntext\n\n### Install\n\n## `code` and *em*\n\n> ## Quoted\n\n- ## In list'
  it('lists headings with level, text and id in document order', () => {
    expect(extractHeadings(doc)).toEqual([
      { level: 1, text: 'Title', id: 'title' },
      { level: 2, text: 'Install', id: 'install' },
      { level: 3, text: 'Install', id: 'install-1' },
      { level: 2, text: 'code and em', id: 'code-and-em' },
      { level: 2, text: 'Quoted', id: 'quoted' },
      { level: 2, text: 'In list', id: 'in-list' },
    ])
  })
  it('applies headingOffset and clamps at 6', () => {
    expect(extractHeadings('# a\n###### b', { headingOffset: 2 }).map((h) => h.level)).toEqual([3, 6])
    expect(extractHeadings('#### a\n##### b', { headingOffset: 5 }).map((h) => h.level)).toEqual([6, 6])
  })
  it('clampOffset bounds and coerces', () => {
    expect([clampOffset(-3), clampOffset(0), clampOffset(2.9), clampOffset(9), clampOffset(Number.NaN), clampOffset('3'), clampOffset(undefined), clampOffset(Infinity)]).toEqual([0, 0, 2, 5, 0, 3, 0, 0])
  })
  it('uses an id prefix', () => expect(extractHeadings('# A\n# A', { idPrefix: 'x' }).map((h) => h.id)).toEqual(['x-a', 'x-a-1']))
  it('gives empty headings a fallback id', () => expect(extractHeadings('#\n#')).toEqual([{ level: 1, text: '', id: 'section' }, { level: 1, text: '', id: 'section-1' }]))
  it('accepts a parsed tree', () => expect(extractHeadings(parseMarkdown('# a'))).toHaveLength(1))
  it('ignores headings inside code', () => expect(extractHeadings('```\n# no\n```\n\n    # no')).toEqual([]))
  it('headingMap is keyed by node', () => {
    const root = parseMarkdown('# a\n\n## b')
    const map = headingMap(root)
    expect(map.size).toBe(2)
    expect(map.get(root.children[1] as never)).toMatchObject({ text: 'b', level: 2 })
  })
  it('treats hostile heading text as text', () => {
    const [h] = extractHeadings('# <img src=x onerror=alert(1)>')
    expect(h.text).toBe('<img src=x onerror=alert(1)>')
    expect(h.id).not.toMatch(/[<>=\s]/)
  })
})

describe('parseInfo', () => {
  it.each([
    ['yaml', { language: 'yaml' }],
    ['', { language: '' }],
    ['go title="main.go"', { language: 'go', filename: 'main.go' }],
    ["go title='my file.go'", { language: 'go', filename: 'my file.go' }],
    ['yaml filename=values.yaml', { language: 'yaml', filename: 'values.yaml' }],
    ['yaml FILENAME=a.yml', { language: 'yaml', filename: 'a.yml' }],
    ['json title="a" filename=b', { language: 'json', filename: 'a' }],
    ['json filename=b title="a"', { language: 'json', filename: 'a' }],
    ['sh title="unterminated', { language: 'sh', filename: 'unterminated' }],
    ['sh title=', { language: 'sh' }],
    ['sh title=""', { language: 'sh' }],
    ['sh {1,3} showLineNumbers', { language: 'sh' }],
    ['sh =x', { language: 'sh' }],
    ['  go   title="x"  ', { language: 'go', filename: 'x' }],
    ['go title="<script>alert(1)</script>"', { language: 'go', filename: '<script>alert(1)</script>' }],
  ])('%j', (info, out) => expect(parseInfo(info)).toEqual(out))
  it('ignores prototype keys', () => expect(parseInfo('x __proto__=a constructor=b')).toEqual({ language: 'x' }))
  it('coerces non-strings', () => expect(parseInfo(undefined as unknown as string)).toEqual({ language: '' }))
})

describe('renderMarkdownToText', () => {
  it('strips markup and keeps one line per block', () => {
    const text = renderMarkdownToText('# Title\n\nSome *emphasis*, **bold**, `code`, [a link](https://x.y) and ![alt text](i.png).\n\n- one\n- two\n  - three\n\n> quoted\n\n---\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```go\nfmt.Println(1)\n```')
    expect(text).toBe('Title\nSome emphasis, bold, code, a link and alt text.\none\ntwo\nthree\nquoted\na b\n1 2\nfmt.Println(1)')
  })
  it('keeps raw HTML as typed text', () => expect(renderMarkdownToText('<b>x</b>')).toBe('<b>x</b>'))
  it('is empty for empty input', () => expect(renderMarkdownToText('')).toBe(''))
  it('accepts a parsed tree and options', () => {
    expect(renderMarkdownToText(parseMarkdown('a *b*'))).toBe('a b')
    expect(renderMarkdownToText('> a', { maxDepth: 1 })).toBe('a')
  })
  it('turns breaks into spaces', () => expect(renderMarkdownToText('a  \nb\nc')).toBe('a b c'))
  it('inlineToText can keep newlines', () => {
    const root = parseMarkdown('a\nb')
    expect(inlineToText((root.children[0] as unknown as { children: never[] }).children, '\n')).toBe('a\nb')
  })
})

describe('parseMarkdown limits and options', () => {
  it('over-long input becomes one plain paragraph', () => {
    const root = parseMarkdown('# not a heading\n\n**not bold**', { maxLength: 10 })
    expect(root.plain).toBe(true)
    expect(root.children).toEqual([{ type: 'paragraph', children: [{ type: 'text', value: '# not a heading\n\n**not bold**' }] }])
  })
  it('input at exactly maxLength is parsed', () => expect(parseMarkdown('# a', { maxLength: 3 }).plain).toBeUndefined())
  it('the default limit is one million characters', () => {
    expect(parseMarkdown('a'.repeat(1_000_000)).plain).toBeUndefined()
    expect(parseMarkdown('a'.repeat(1_000_001)).plain).toBe(true)
  })
  it('empty input parses to nothing even with a zero limit', () => expect(parseMarkdown('', { maxLength: 0 }).children).toEqual([]))
  it('invalid limits fall back to defaults', () => {
    expect(parseMarkdown('# a', { maxLength: Number.NaN }).plain).toBeUndefined()
    expect(parseMarkdown('# a', { maxDepth: Number.NaN }).children).toHaveLength(1)
  })
  it('inline mode ignores block syntax', () => {
    const root = parseMarkdown('# not heading\n- not list\n**bold**\r\nmore', { inline: true })
    expect(root.children).toHaveLength(1)
    expect(root.children[0].type).toBe('paragraph')
    expect(inlineToText((root.children[0] as unknown as { children: never[] }).children)).toContain('# not heading')
  })
  it('inline mode has no reference definitions', () => expect(inlineToText((parseMarkdown('[a]: /u\n[a]', { inline: true }).children[0] as unknown as { children: never[] }).children)).toContain('[a]'))
  it('inline mode trims', () => expect(parseMarkdown('  \n x \n ', { inline: true }).children[0]).toMatchObject({ children: [{ value: 'x' }] }))
  it('exposes the public helpers', () => {
    for (const name of ['parseMarkdown', 'renderMarkdownToText', 'extractHeadings', 'slugify', 'sanitizeUrl', 'createSlugger', 'parseInfo', 'isExternalUrl', 'resolveUrl'] as const) expect(typeof api[name]).toBe('function')
  })
  it('never throws on any input type', () => {
    for (const v of [null, undefined, 0, NaN, {}, [], Symbol.iterator.toString(), () => 1]) expect(() => parseMarkdown(v)).not.toThrow()
  })
  it('a tree is plain data (JSON round-trips)', () => {
    const root: Root = parseMarkdown('# a\n\n- b\n\n| a |\n|---|\n| c |\n\n```x\ny\n```\n\n[l](u) ![i](j) **s**')
    expect(JSON.parse(JSON.stringify(root))).toEqual(root)
  })
})
