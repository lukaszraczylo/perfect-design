import { describe, expect, it } from 'vitest'
import { parseMarkdown } from './parse'
import { html } from './testing'

describe('tables', () => {
  it('header, alignment row and body', () => {
    expect(html('| a | b |\n|---|---|\n| 1 | 2 |')).toBe('<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>')
  })
  it('reads alignment from the colons', () => {
    const [t] = parseMarkdown('| a | b | c | d |\n|:--|:-:|--:|---|\n').children
    expect(t).toMatchObject({ type: 'table', align: ['left', 'center', 'right', null] })
  })
  it('outer pipes are optional', () => expect(html('a | b\n--- | ---\n1 | 2')).toBe('<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>'))
  it('a table with no body rows', () => expect(html('| a |\n|---|')).toBe('<table><thead><tr><th>a</th></tr></thead></table>'))
  it('a single column needs a pipe in the delimiter row', () => {
    expect(html('| a |\n| - |\n| b |')).toContain('<table>')
    expect(html('a\n---')).toBe('<h2>a</h2>')
  })
  it('escaped pipes stay in the cell, also inside code', () => {
    expect(html('| a | b |\n|---|---|\n| x \\| y | `p \\| q` |')).toBe('<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>x | y</td><td><code>p | q</code></td></tr></tbody></table>')
  })
  it('an escaped trailing pipe belongs to the last cell', () => {
    const [t] = parseMarkdown('| a | b \\|\n|---|---|\n| 1 | 2 \\|').children
    expect(t).toMatchObject({ head: [[{ value: 'a' }], [{ value: 'b |' }]] })
  })
  it('short rows are padded and long rows truncated', () => {
    const [t] = parseMarkdown('| a | b |\n|---|---|\n| 1 |\n| 1 | 2 | 3 |\n||').children as unknown as [{ rows: unknown[][] }]
    expect(t.rows.map((r) => r.length)).toEqual([2, 2, 2])
    expect(t.rows[0][1]).toEqual([])
  })
  it('a delimiter row with the wrong number of cells is not a table', () => expect(html('| a | b |\n|---|\n| 1 | 2 |')).not.toContain('<table'))
  it('a delimiter row with other text is not a table', () => expect(html('| a | b |\n| x | y |\n')).not.toContain('<table'))
  it('inline syntax works inside cells', () => {
    expect(html('| a |\n|---|\n| **b** [c](/u) `d` |')).toContain('<td><strong>b</strong> <a href="/u">c</a> <code>d</code></td>')
  })
  it('reference links work inside cells', () => expect(html('| a |\n|---|\n| [x] |\n\n[x]: /u')).toContain('<a href="/u">x</a>'))
  it('a blank line ends the table', () => expect(html('| a |\n|---|\n| 1 |\n\nafter')).toBe('<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>\n<p>after</p>'))
  it('another block ends the table', () => expect(html('| a |\n|---|\n| 1 |\n# h\n> q')).toBe('<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>\n<h1>h</h1>\n<blockquote>\n<p>q</p>\n</blockquote>'))
  it('a row without pipes still belongs to the table', () => expect(html('| a | b |\n|---|---|\nplain')).toContain('<td>plain</td>'))
  it('lines before the header stay a paragraph', () => expect(html('intro\n| a |\n|---|\n| 1 |')).toBe('<p>intro</p>\n<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>'))
  it('works inside block quotes and list items', () => {
    expect(html('> | a |\n> |---|\n> | 1 |')).toContain('<blockquote>\n<table>')
    expect(html('- | a |\n  |---|\n  | 1 |')).toContain('<li><table>')
  })
  it('works with leading indentation of up to three spaces', () => expect(html('   | a |\n   |---|')).toContain('<table>'))
  it('cells with whitespace and tabs are trimmed', () => expect(html('|\ta\t|\n|---|\n|\t1\t|')).toContain('<th>a</th>'))
  it('a table is not started by a thematic break row', () => expect(html('a | b\n---')).not.toContain('<table'))
  it('empty header cells are kept', () => {
    const [t] = parseMarkdown('| | b |\n|---|---|\n| 1 | 2 |').children
    expect(t).toMatchObject({ head: [[], [{ value: 'b' }]] })
  })
  it('wide tables parse', () => {
    const cols = 200
    const row = (c: string) => `|${Array.from({ length: cols }, () => c).join('|')}|`
    const [t] = parseMarkdown(`${row('h')}\n${row('-')}\n${row('x')}`).children as unknown as [{ head: unknown[]; rows: unknown[][] }]
    expect(t.head).toHaveLength(cols)
    expect(t.rows[0]).toHaveLength(cols)
  })
  it('cell content is never interpreted as HTML', () => expect(html('| <img src=x onerror=alert(1)> |\n|---|')).toContain('&lt;img src=x onerror=alert(1)&gt;'))
  it('the delimiter row alone does not make a table', () => expect(html('|---|---|')).not.toContain('<table'))
  it('a header row followed by a blank line is a paragraph', () => expect(html('| a | b |\n\n|---|---|')).not.toContain('<table'))
})

describe('GFM extras interplay', () => {
  it('task items with inline formatting', () => expect(html('- [ ] **bold** task')).toContain('<strong>bold</strong> task'))
  it('task items with nested lists', () => expect(html('- [x] a\n  - [ ] b')).toContain('<ul>\n<li><input disabled="" type="checkbox" /> b</li>'))
  it('strikethrough inside a table cell', () => expect(html('| a |\n|---|\n| ~~x~~ |')).toContain('<del>x</del>'))
  it('bare URL inside a table cell', () => expect(html('| a |\n|---|\n| https://x.y |')).toContain('<a href="https://x.y">'))
})
