import { describe, expect, it } from 'vitest'
import { html } from './testing'
import { parseMarkdown } from './parse'

const live = (src: string) => html(src, { streaming: true })
const row = (rows: [string, string][]) => rows

describe('streaming: dangling syntax is closed, not shown raw', () => {
  it.each(
    row([
      ['Hello **wor', '<p>Hello <strong>wor</strong></p>'],
      ['Hello *wor', '<p>Hello <em>wor</em></p>'],
      ['Hello __wor', '<p>Hello <strong>wor</strong></p>'],
      ['Hello _wor', '<p>Hello <em>wor</em></p>'],
      ['Hello ~~del', '<p>Hello <del>del</del></p>'],
      ['**a *b', '<p><strong>a <em>b</em></strong></p>'],
      ['***a', '<p><em><strong>a</strong></em></p>'],
      ['Hello **', '<p>Hello </p>'],
      ['Use `code', '<p>Use <code>code</code></p>'],
      ['Use ``code`', '<p>Use <code>code`</code></p>'],
      ['See [label', '<p>See label</p>'],
      ['See [label]', '<p>See label</p>'],
      ['See [label](http://ex', '<p>See label</p>'],
      ['See [label](<http://ex', '<p>See label</p>'],
      ['See [label](http://ex "ti', '<p>See label</p>'],
      ['See ![al', '<p>See </p>'],
      ['See ![alt](http://ex', '<p>See </p>'],
      ['# Head **b', '<h1>Head <strong>b</strong></h1>'],
      ['> quote *em', '<blockquote>\n<p>quote <em>em</em></p>\n</blockquote>'],
      ['- item\n- **bo', '<ul>\n<li>item</li>\n<li><strong>bo</strong></li>\n</ul>'],
      ['```yaml\nk: v', '<pre><code class="language-yaml">k: v</code></pre>'],
      ['~~~\nopen', '<pre><code>open</code></pre>'],
    ]),
  )('%j', (src, out) => expect(live(src)).toBe(out))

  it('complete syntax is unchanged', () => {
    for (const src of ['**bold**', '*em*', '`code`', '[a](http://x.y)', '![a](b.png)', '~~d~~', '- [ ] t', '**a** and *b*']) expect(live(src)).toBe(html(src))
  })

  it('syntax that is not last is not auto-closed', () => {
    expect(live('**open\n\nnext')).toBe('<p>**open</p>\n<p>next</p>')
    expect(live('`open\n\nnext')).toBe('<p>`open</p>\n<p>next</p>')
    expect(live('[open\n\nnext')).toBe('<p>[open</p>\n<p>next</p>')
  })

  it('an intraword delimiter is not treated as an opener', () => {
    expect(live('snake_case')).toBe('<p>snake_case</p>')
    expect(live('2*3')).toBe('<p>2*3</p>')
  })

  it('a link reference that is still missing stays text without brackets lost mid-sentence', () => {
    expect(live('see [a] and more')).toBe('<p>see [a] and more</p>')
  })
})

describe('streaming: tables', () => {
  it('a header row without its delimiter row is held back', () => {
    expect(live('| a | b |')).toBe('')
    expect(live('intro\n\n| a | b |')).toBe('<p>intro</p>')
  })
  it('a half-typed delimiter row is held back with its header', () => {
    expect(live('| a | b |\n|-')).toBe('')
    expect(live('| a | b |\n|---')).toBe('')
  })
  it('a delimiter row with the right width starts the table', () => expect(live('| a | b |\n|---|---')).toContain('<table>'))
  it('a half-typed row is padded', () => {
    const out = live('| a | b |\n|---|---|\n| 1')
    expect(out).toContain('<td>1</td><td></td>')
  })
  it('only trailing lines that start with a pipe are held back', () => expect(live('a | b')).toBe('<p>a | b</p>'))
  it('lines before the held back row stay', () => expect(live('x\n| a')).toBe('<p>x</p>'))
  it('a held-back last paragraph inside a quote or list item', () => {
    expect(live('> | a')).toBe('<blockquote>\n\n</blockquote>')
    expect(live('- x\n- | a')).toContain('<li>x</li>')
  })
  it('without streaming the same text is a paragraph', () => expect(html('| a | b |')).toBe('<p>| a | b |</p>'))
})

describe('streaming: every prefix of a long document parses', () => {
  const doc = [
    '# Streaming sample',
    '',
    'A paragraph with *emphasis*, **strong**, ~~deleted~~ text, `inline code`, a [link](https://example.com "title") and an ![image](pic.png "caption").',
    '',
    '- [x] done item',
    '- [ ] open item with **bold**',
    '  1. nested ordered',
    '  2. second',
    '',
    '> A quote with a [reference link][ref]',
    '',
    '| Name | Count |',
    '|:-----|------:|',
    '| a | 1 |',
    '| b \\| c | 22 |',
    '',
    '```yaml title="app.yaml"',
    'key: value',
    '```',
    '',
    'Closing line with https://example.com/path_(x). Done.',
    '',
    '[ref]: https://example.com/ref',
  ].join('\n')

  it('never falls back to plain text and never throws', () => {
    for (let n = 0; n <= doc.length; n += 1) {
      const root = parseMarkdown(doc.slice(0, n), { streaming: true })
      expect(root.plain, `prefix ${n}`).toBeUndefined()
    }
  })

  it('the finished document is the same with and without streaming', () => {
    const ended = `${doc}\n`
    expect(parseMarkdown(ended, { streaming: true })).toEqual(parseMarkdown(ended))
  })

  it('prefix output never contains raw dangling markers at the end of the last paragraph', () => {
    const flat = (src: string) => html(src, { streaming: true })
    for (const cut of ['A paragraph with *emph', 'A paragraph with **str', 'A paragraph with `cod', 'A paragraph with [lin', 'A paragraph with [link](https://exam']) {
      const out = flat(cut)
      expect(out).not.toMatch(/[*`[]/)
      expect(out).not.toContain('](')
    }
  })
})
