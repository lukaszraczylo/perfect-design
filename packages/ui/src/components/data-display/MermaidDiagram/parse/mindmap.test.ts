import { describe, expect, it } from 'vitest'
import { parseMermaid } from '.'
import type { MindmapAst } from './mindmap'

function ok(source: string): MindmapAst {
  const r = parseMermaid(source)
  if (!r.ok) throw new Error(`${r.errors[0]!.line}:${r.errors[0]!.column} ${r.errors[0]!.message}`)
  expect(r.ast.type).toBe('mindmap')
  return r.ast as MindmapAst
}

function bad(source: string) {
  const r = parseMermaid(source)
  if (r.ok) throw new Error('expected a parse error')
  expect(r.errors).toHaveLength(1)
  return r.errors[0]!
}

const outline = (a: MindmapAst) => a.nodes.map((n) => `${n.depth}:${n.text}`)

describe('mindmap parse: good input', () => {
  it('builds the tree from indentation', () => {
    const ast = ok(`mindmap
  root
    Origins
      Long history
      Popularisation
        British author
    Research
      On effectiveness
    Tools`)
    expect(outline(ast)).toEqual(['0:root', '1:Origins', '2:Long history', '2:Popularisation', '3:British author', '1:Research', '2:On effectiveness', '1:Tools'])
    expect(ast.nodes.map((n) => n.parent)).toEqual([undefined, 0, 1, 1, 3, 0, 5, 0])
    expect(ast.nodes[4]!.line).toBe(6)
  })

  it('reads all node shapes', () => {
    const ast = ok(`mindmap
  root((Topic))
    a[Square]
    b(Rounded)
    c((Circle))
    d))Bang((
    e)Cloud(
    f{{Hexagon}}
    Plain words
    [No id]
    ((Bare circle))`)
    expect(ast.nodes.map((n) => [n.id, n.text, n.shape])).toEqual([
      ['root', 'Topic', 'circle'],
      ['a', 'Square', 'square'],
      ['b', 'Rounded', 'rounded'],
      ['c', 'Circle', 'circle'],
      ['d', 'Bang', 'bang'],
      ['e', 'Cloud', 'cloud'],
      ['f', 'Hexagon', 'hexagon'],
      ['', 'Plain words', 'default'],
      ['', 'No id', 'square'],
      ['', 'Bare circle', 'circle'],
    ])
  })

  it('accepts quoted text with brackets and markdown strings', () => {
    const ast = ok('mindmap\n  root\n    a["Text (with) [brackets]"]\n    b["`**Bold** and *italic*`"]\n    c[ "spaced" ]\n    "quoted plain"')
    expect(ast.nodes.slice(1).map((n) => [n.text, n.shape])).toEqual([
      ['Text (with) [brackets]', 'square'],
      ['`**Bold** and *italic*`', 'square'],
      ['spaced', 'square'],
      ['quoted plain', 'default'],
    ])
  })

  it('treats brackets after a space or an odd id as plain text', () => {
    const ast = ok('mindmap\n  root\n    Lists (a, b)\n    javascript:alert(1)\n    Hello [world]\n    f(x)\n    only ) close')
    expect(ast.nodes.slice(1).map((n) => [n.text, n.shape])).toEqual([
      ['Lists (a, b)', 'default'],
      ['javascript:alert(1)', 'default'],
      ['Hello [world]', 'default'],
      ['x', 'rounded'],
      ['only ) close', 'default'],
    ])
  })

  it('keeps <br/> in the text for the renderer', () => {
    expect(ok('mindmap\n  root\n    a[Line one<br/>line two]').nodes[1]!.text).toBe('Line one<br/>line two')
  })

  it('accepts icon and class lines and keeps them on the node above', () => {
    const ast = ok(`mindmap
  root
    A
    ::icon(fa fa-book)
    :::urgent large
    :::urgent
    B:::danger
    C
      D`)
    expect(ast.nodes[1]).toMatchObject({ text: 'A', icon: 'fa fa-book', classes: ['urgent', 'large'] })
    expect(ast.nodes[2]).toMatchObject({ text: 'B', classes: ['danger'] })
    expect(ast.nodes[3]!.classes).toEqual([])
    expect(ast.nodes).toHaveLength(5)
    expect(ast.nodes[4]!.parent).toBe(3)
  })

  it('accepts inconsistent but valid indentation', () => {
    const ast = ok('mindmap\n  root\n      deep\n    middle\n        deeper\n   odd\n        again')
    expect(ast.nodes.map((n) => [n.text, n.depth])).toEqual([['root', 0], ['deep', 1], ['middle', 1], ['deeper', 2], ['odd', 1], ['again', 2]])
  })

  it('accepts tabs, mixed tabs and spaces, and a root that is not at column one', () => {
    const ast = ok('mindmap\n\t\troot\n\t\t\tone\n\t\t    two\n\t\t\t\tthree')
    expect(ast.nodes.map((n) => [n.text, n.depth])).toEqual([['root', 0], ['one', 1], ['two', 1], ['three', 2]])
    expect(ok('mindmap\nroot\n a\n  b').nodes.map((n) => n.depth)).toEqual([0, 1, 2])
  })

  it('accepts a first node that is indented more than the later lines of its subtree start', () => {
    expect(ok('mindmap\n          root\n            child').nodes).toHaveLength(2)
  })

  it('handles unicode and entity codes as text', () => {
    const ast = ok('mindmap\n  корень((根 😀))\n    Ünï #quot;x#quot;')
    expect(ast.nodes.map((n) => n.text)).toEqual(['根 😀', 'Ünï #quot;x#quot;'])
    expect(ast.nodes[0]!.id).toBe('корень')
  })

  it('keeps hostile text as plain data', () => {
    const ast = ok(`mindmap
  root
    <script>alert(1)</script>
    "><img src=x onerror=alert(1)>
    a["<img src=x onerror=alert(1)>"]
    javascript:alert(1)`)
    expect(ast.nodes.slice(1).map((n) => n.text)).toEqual([
      '<script>alert(1)</script>',
      '"><img src=x onerror=alert(1)>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
    ])
  })

  it('accepts very long text', () => {
    const long = 'long '.repeat(2000).trim()
    expect(ok(`mindmap\n  root\n    ${long}\n    a[${long}]`).nodes.map((n) => n.text.length)).toEqual([4, 9999, 9999])
  })

  it('reads CRLF source and comments', () => {
    const ast = ok('mindmap\r\n  %% comment\r\n  root\r\n    a\r\n\r\n    b\r\n')
    expect(outline(ast)).toEqual(['0:root', '1:a', '1:b'])
  })

  it('takes front matter and accessibility lines', () => {
    const ast = ok('---\ntitle: Kestrel Freight plan\n---\nmindmap\n  accTitle: Plan\n  root\n    a')
    expect(ast.meta).toMatchObject({ title: 'Kestrel Freight plan', accTitle: 'Plan' })
  })

  it('accepts an empty mind map and a mind map of only comments', () => {
    expect(ok('mindmap').nodes).toEqual([])
    expect(ok('mindmap\n  %% nothing\n').nodes).toEqual([])
  })

  it('accepts duplicate texts and ids', () => {
    const ast = ok('mindmap\n  root\n    a[Same]\n    a[Same]\n      a[Same]')
    expect(ast.nodes).toHaveLength(4)
  })

  it('parses 1000 lines quickly', () => {
    const rows = Array.from({ length: 999 }, (_, i) => `${i % 7 === 0 ? '    ' : '      '}node ${i}`)
    const t = performance.now()
    const ast = ok(`mindmap\n  root\n${rows.join('\n')}`)
    expect(performance.now() - t).toBeLessThan(200)
    expect(ast.nodes).toHaveLength(1000)
  })

  it('parses a very deep chain without overflowing the stack', () => {
    const rows = Array.from({ length: 1000 }, (_, i) => `${' '.repeat(i + 3)}n${i}`)
    const t = performance.now()
    const ast = ok(`mindmap\n  root\n${rows.join('\n')}`)
    expect(performance.now() - t).toBeLessThan(200)
    expect(ast.nodes[1000]!.depth).toBe(1000)
  })
})

describe('mindmap parse: errors', () => {
  it('rejects a second root', () => {
    expect(bad('mindmap\n  root\n  second')).toMatchObject({
      line: 3, column: 3, code: 'syntax', diagramType: 'mindmap',
      message: 'A mind map has one root, but this line is at the same level as it. Indent it to make it a child of a node, or remove it.',
    })
    expect(bad('mindmap\n    root\n      a\n  second').line).toBe(4)
    expect(bad('mindmap\nroot\n\tchild\nsecond')).toMatchObject({ line: 4, column: 1 })
  })

  it('reports an unterminated shape bracket', () => {
    expect(bad('mindmap\n  root\n    a[Text')).toMatchObject({ line: 3, column: 6, message: 'The "[" opened here is never closed. End the text with "]", for example a[Text].' })
    expect(bad('mindmap\n  root\n    a((Text)')).toMatchObject({ line: 3, column: 6, message: expect.stringContaining('"))"') })
    expect(bad('mindmap\n  root\n    a{{Text}')).toMatchObject({ line: 3, column: 6, message: expect.stringContaining('"}}"') })
    expect(bad('mindmap\n  root\n    a))Text')).toMatchObject({ column: 6, message: expect.stringContaining('"(("') })
    expect(bad('mindmap\n  root\n    Smile)')).toMatchObject({ line: 3, column: 10 })
    expect(bad('mindmap\n  root\n    [Text').message).toContain('for example id[Text]')
  })

  it('reports text after the closing bracket', () => {
    expect(bad('mindmap\n  root\n    a[Text] more')).toMatchObject({ line: 3, column: 12, message: 'Nothing may follow "]" on a node line. Put it on its own line, indented to make it a child.' })
    expect(bad('mindmap\n  root\n    a["Text"] x')).toMatchObject({ line: 3, column: 14, message: expect.stringContaining('Nothing may follow "]"') })
  })

  it('reports empty node text', () => {
    expect(bad('mindmap\n  root\n    a[]')).toMatchObject({ line: 3, column: 6, message: 'The text between "[" and "]" is empty. Write the text of the node there.' })
    expect(bad('mindmap\n  root\n    a(( ))').message).toContain('"((" and "))"')
  })

  it('reports an unterminated or misplaced quote', () => {
    expect(bad('mindmap\n  root\n    a["Text')).toMatchObject({ line: 3, column: 7, message: 'This quoted text is never closed. Add the closing ".' })
    expect(bad('mindmap\n  root\n    a["Text" x]')).toMatchObject({ line: 3, column: 14, message: 'Expected "]" after the quoted text, to close the shape opened with "[".' })
  })

  it('reports bad icon and class lines', () => {
    expect(bad('mindmap\n  root\n    ::icon(fa')).toMatchObject({ line: 3, column: 5, message: expect.stringContaining('Expected an icon line') })
    expect(bad('mindmap\n  root\n    ::other(x)').column).toBe(5)
    expect(bad('mindmap\n  root\n    :::')).toMatchObject({ line: 3, column: 5, message: 'Expected a class name after ":::", for example ":::urgent".' })
    expect(bad('mindmap\n  ::icon(x)\n  root')).toMatchObject({ line: 2, column: 3, message: expect.stringContaining('no node above') })
    expect(bad('mindmap\n  :::cls\n  root').line).toBe(2)
  })

  it('reports a root on the header line', () => {
    expect(bad('mindmap root')).toMatchObject({ line: 1, column: 9, message: expect.stringContaining('on its own line below "mindmap"') })
  })

  it('never throws on odd input', () => {
    for (const src of ['mindmap\n\u0000', 'mindmap\n((', 'mindmap\n))', 'mindmap\n[[[', 'mindmap\n"', 'mindmap\n:::a:::b', 'mindmap\n  a\n\tb\n c\n d', 'mindmap\n{{}}']) {
      expect(() => parseMermaid(src)).not.toThrow()
    }
  })
})

describe('mindmap parse: linear time', () => {
  it('a long whitespace run before a class suffix stays fast', () => {
    const t0 = performance.now()
    parseMermaid(`mindmap\n  root\n    a${' '.repeat(80000)}x`)
    parseMermaid(`mindmap\n  root\n    a${' '.repeat(80000)}:::`)
    expect(performance.now() - t0).toBeLessThan(2000)
  })
  it('still reads an inline class', () => {
    const r = parseMermaid('mindmap\n  root\n    child   :::big small')
    expect(r.ok && (r.ast as { nodes: { classes: string[] }[] }).nodes[1]!.classes).toEqual(['big', 'small'])
  })
})
