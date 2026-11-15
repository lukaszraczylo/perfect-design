import { describe, expect, it } from 'vitest'
import { parseMermaid } from '../parse'
import type { PieAst } from './pie'

function ok(src: string): PieAst {
  const r = parseMermaid(src)
  if (!r.ok) throw new Error(`${r.errors[0]!.line}:${r.errors[0]!.column} ${r.errors[0]!.message}`)
  expect(r.ast.type).toBe('pie')
  return r.ast as PieAst
}

function bad(src: string): { line: number; column: number; message: string; code: string } {
  const r = parseMermaid(src)
  if (r.ok) throw new Error('expected an error')
  return r.errors[0]!
}

const pairs = (a: PieAst): [string, number][] => a.slices.map((s) => [s.label, s.value])

describe('pie parse: good input', () => {
  it('reads quoted slices', () => {
    const ast = ok('pie\n  "Dogs" : 386\n  "Cats" : 85.5\n  "Rats" : 15')
    expect(pairs(ast)).toEqual([['Dogs', 386], ['Cats', 85.5], ['Rats', 15]])
    expect(ast.showData).toBe(false)
    expect(ast.meta.title).toBeUndefined()
    expect(ast.slices.map((s) => s.line)).toEqual([2, 3, 4])
  })

  it('reads showData and titles from the header and from a title line', () => {
    expect(ok('pie showData\n"A" : 1')).toMatchObject({ showData: true, meta: {} })
    expect(ok('pie title Pets adopted\n"A" : 1').meta.title).toBe('Pets adopted')
    const both = ok('pie showData title Pets adopted\n"A" : 1')
    expect(both.showData).toBe(true)
    expect(both.meta.title).toBe('Pets adopted')
    expect(ok('pie\ntitle Later title\n"A" : 1').meta.title).toBe('Later title')
    expect(ok('pie title   Spaced   \n"A" : 1').meta.title).toBe('Spaced')
    expect(ok('---\ntitle: Front\n---\npie\n"A" : 1').meta.title).toBe('Front')
    expect(ok('---\ntitle: Front\n---\npie title Header wins later\n"A" : 1').meta.title).toBe('Header wins later')
  })

  it('accepts unquoted labels without a colon and spacing variations', () => {
    expect(pairs(ok('pie\nDogs : 3\nBig cats:4\n  "Tight":5\n"Spaced"   :   6'))).toEqual([['Dogs', 3], ['Big cats', 4], ['Tight', 5], ['Spaced', 6]])
  })

  it('keeps colons, quotes, markup and entities of a quoted label as written', () => {
    const ast = ok(`pie
"Ratio 3:1" : 4
"<script>alert(1)</script>" : 1
"Say #quot;hi#quot; &amp; bye" : 2
"it's" : 1`)
    expect(ast.slices.map((s) => s.label)).toEqual(['Ratio 3:1', '<script>alert(1)</script>', 'Say #quot;hi#quot; &amp; bye', "it's"])
  })

  it('allows duplicate labels, zero, decimals without integer part and big numbers', () => {
    expect(pairs(ok('pie\n"A" : 1\n"A" : 2\n"Zero" : 0\n"Half" : .5\n"Big" : 123456789012'))).toEqual([['A', 1], ['A', 2], ['Zero', 0], ['Half', 0.5], ['Big', 123456789012]])
  })

  it('handles unicode and very long labels', () => {
    const long = 'Label '.repeat(300).trim()
    expect(pairs(ok(`pie\n"日本語 ü" : 1\n"${long}" : 2`))).toEqual([['日本語 ü', 1], [long, 2]])
  })

  it('handles CRLF, comments, directives and tabs', () => {
    const ast = ok('%%{init: {"pie": {"textPosition": 0.5}}}%%\r\npie title T\r\n%% comment\r\n\t"A" : 1\r\n\r\n"B" : 2\r\n')
    expect(pairs(ast)).toEqual([['A', 1], ['B', 2]])
    expect(ast.meta.title).toBe('T')
  })

  it('parses an empty body and a comments-only body', () => {
    expect(ok('pie').slices).toEqual([])
    expect(ok('pie showData\n%% nothing').slices).toEqual([])
  })

  it('parses 1000 lines quickly', () => {
    const lines = ['pie showData']
    for (let i = 0; i < 1000; i++) lines.push(`"Slice ${i}" : ${i}.5`)
    const t = performance.now()
    const ast = ok(lines.join('\n'))
    expect(performance.now() - t).toBeLessThan(200)
    expect(ast.slices).toHaveLength(1000)
  })

  it('treats an unquoted label called title with a colon as a slice', () => {
    expect(pairs(ok('pie\ntitle: 5'))).toEqual([['title', 5]])
  })
})

describe('pie parse: errors', () => {
  it('rejects unknown text after pie', () => {
    expect(bad('pie donut')).toMatchObject({ line: 1, column: 5, message: 'After "pie" write "showData", "title Your title", or both: "pie showData title Your title".' })
    expect(bad('pie showData donut')).toMatchObject({ line: 1, column: 14 })
    expect(bad('pie showDataX')).toMatchObject({ line: 1, column: 5 })
  })

  it('rejects an empty title', () => {
    expect(bad('pie title')).toMatchObject({ line: 1, column: 10, message: 'A title needs text, for example "pie title Pets adopted".' })
    expect(bad('pie\ntitle')).toMatchObject({ line: 2, column: 6, message: 'A title needs text, for example "title Pets adopted".' })
  })

  it('rejects a missing colon', () => {
    expect(bad('pie\n"Dogs" 5')).toMatchObject({ line: 2, column: 7, message: 'Expected a colon after the label. Write each slice as "Label" : 42.' })
    expect(bad('pie\n  "Dogs"')).toMatchObject({ line: 2, column: 9 })
    expect(bad('pie\nDogs 42')).toMatchObject({ line: 2, column: 1, message: 'Unknown statement "Dogs": a slice needs a colon and a value. Write each slice as "Label" : 42.' })
  })

  it('rejects an unterminated quote and an empty label', () => {
    expect(bad('pie\n  "Dogs : 5')).toMatchObject({ line: 2, column: 3, message: 'This quoted label is never closed. Add the closing quote: "Label" : 42.' })
    expect(bad('pie\n"" : 5')).toMatchObject({ line: 2, column: 1, message: 'This slice has no label. Write each slice as "Label" : 42.' })
    expect(bad('pie\n   : 5')).toMatchObject({ line: 2, column: 4 })
    expect(bad('pie\n" " : 5')).toMatchObject({ line: 2, column: 1 })
  })

  it('rejects missing, negative and non-numeric values with their position', () => {
    expect(bad('pie\n"A" :')).toMatchObject({ line: 2, column: 6, message: 'This slice has no value after the colon. Write each slice as "Label" : 42.' })
    expect(bad('pie\n"A" :   ')).toMatchObject({ line: 2, column: 6 })
    expect(bad('pie\n"A" : -3')).toMatchObject({ line: 2, column: 7, message: 'Pie values cannot be negative ("-3"). Use 0 or a positive number.' })
    expect(bad('pie\n"A" : 1\n  "B":   -0.5')).toMatchObject({ line: 3, column: 10 })
    expect(bad('pie\n"A" : abc')).toMatchObject({ line: 2, column: 7, message: '"abc" is not a number. Write the value as digits with an optional decimal part, for example 42 or 42.5.' })
    expect(bad('pie\n"A" :  NaN')).toMatchObject({ line: 2, column: 8 })
    expect(bad('pie\n"A" : 1e3').message).toContain('is not a number')
    expect(bad('pie\n"A" : 1,5').message).toContain('is not a number')
    expect(bad('pie\n"A" : 4 5').message).toContain('is not a number')
    expect(bad('pie\nA : 1 : 2').message).toContain('"1 : 2" is not a number')
  })

  it('rejects numbers that are too large to draw', () => {
    const e = bad(`pie\n"A" : ${'9'.repeat(400)}`)
    expect(e).toMatchObject({ line: 2, column: 7 })
    expect(e.message).toBe('"99999999999999999999..." is too large to draw.')
  })

  it('does not choke on regex-hostile input', () => {
    const t = performance.now()
    parseMermaid(`pie\n"${'a'.repeat(20000)}`)
    parseMermaid(`pie\n"A" : ${'1'.repeat(20000)}x`)
    parseMermaid(`pie\n${' '.repeat(20000)}:`)
    expect(performance.now() - t).toBeLessThan(500)
  })
})
