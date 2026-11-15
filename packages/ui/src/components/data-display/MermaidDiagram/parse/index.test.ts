import { describe, expect, it } from 'vitest'
import { parseMermaid } from '.'
import { prepareSource, splitSource } from '../../_diagram/source'
import { ParseFail } from '../../_diagram/types'

const errors = (src: unknown) => {
  const r = parseMermaid(src)
  if (r.ok) throw new Error('expected errors')
  return r.errors
}

describe('parseMermaid: empty and odd input', () => {
  it.each([[''], ['   '], ['\n\n\t\n'], ['%% only a comment'], ['%% one\n%% two\n'], ['%%{init: {}}%%'], ['---\ntitle: x\n---\n']])('%j is an empty diagram', (src) => {
    const [e] = errors(src)
    expect(e).toMatchObject({ code: 'empty', line: 1, column: 1 })
    expect(e!.message).toContain('empty')
  })
  it.each([[undefined], [null], [42], [{}], [[]], [true]])('%j never throws', (src) => {
    const r = parseMermaid(src)
    expect(typeof r.ok).toBe('boolean')
  })
  it('treats a number or an object as text and says what the first line should be', () => {
    expect(errors(42)[0]!.message).toContain('Expected a diagram type')
    expect(errors({})[0]!.message).toContain('Expected a diagram type')
  })
  it('handles a byte order mark and CRLF', () => {
    const r = parseMermaid('﻿flowchart TD\r\n  A --> B\r\n')
    expect(r.ok).toBe(true)
  })
  it('reports headerLine after comments and blank lines', () => {
    const r = parseMermaid('\n%% c\n\nflowchart TD\n A')
    expect(r.ok && r.ast.headerLine).toBe(4)
  })
})

describe('parseMermaid: unsupported and unknown types', () => {
  it.each(['gitGraph', 'quadrantChart', 'sankey-beta', 'xychart-beta', 'requirementDiagram', 'C4Context', 'block-beta', 'packet-beta', 'architecture-beta', 'kanban'])('%s is unsupported and named', (kw) => {
    const [e] = errors(`${kw}\n  anything`)
    expect(e).toMatchObject({ code: 'unsupported', diagramType: kw, line: 1, column: 1 })
    expect(e!.message).toContain(`"${kw}" is not supported`)
    expect(e!.sourceLine).toBe(kw)
  })
  it('names the supported types in the message', () => {
    const [e] = errors('gitGraph')
    for (const t of ['flowchart', 'sequenceDiagram', 'pie', 'stateDiagram-v2', 'erDiagram', 'classDiagram', 'gantt', 'mindmap', 'timeline', 'journey']) expect(e!.message).toContain(t)
  })
  it('an unknown word is a syntax error naming it', () => {
    const [e] = errors('hello world')
    expect(e).toMatchObject({ code: 'syntax', diagramType: 'hello' })
    expect(e!.message).toContain('Unknown diagram type "hello"')
  })
  it('keywords are case sensitive, like Mermaid', () => {
    expect(errors('Flowchart TD\n A')[0]!.code).toBe('syntax')
  })
  it('prototype names are not parsers', () => {
    expect(errors('constructor')[0]!.code).toBe('syntax')
    expect(errors('__proto__')[0]!.code).toBe('syntax')
    expect(errors('toString')[0]!.code).toBe('syntax')
  })
  it('a first line that is not a word is a syntax error at its column', () => {
    expect(errors('  --> A')[0]).toMatchObject({ code: 'syntax', line: 1, column: 3 })
  })
})

describe('parseMermaid: front matter, directives and accessibility lines', () => {
  it('reads the title from front matter', () => {
    const r = parseMermaid('---\ntitle: My plan\nconfig:\n  theme: dark\n---\nflowchart TD\n A --> B')
    expect(r.ok && r.ast.meta.title).toBe('My plan')
  })
  it('unquotes a quoted front matter title and ignores indented title keys', () => {
    expect((parseMermaid('---\ntitle: "Quoted: title"\n---\nflowchart TD\n A') as { ast: { meta: { title: string } } }).ast.meta.title).toBe('Quoted: title')
    expect((parseMermaid("---\ntitle: 'Single'\n---\nflowchart TD\n A") as { ast: { meta: { title: string } } }).ast.meta.title).toBe('Single')
    const r = parseMermaid('---\nconfig:\n  title: nested\n---\nflowchart TD\n A')
    expect(r.ok && r.ast.meta.title).toBeUndefined()
  })
  it('reports unclosed front matter at the opener', () => {
    expect(errors('---\ntitle: x\nflowchart TD\n A')[0]).toMatchObject({ code: 'syntax', line: 1, column: 1 })
    expect(errors('\n  ---\ntitle: x')[0]).toMatchObject({ line: 2, column: 3 })
  })
  it('skips single-line and multi-line init directives', () => {
    expect(parseMermaid('%%{init: {"theme":"dark"}}%%\nflowchart TD\n A --> B').ok).toBe(true)
    expect(parseMermaid('%%{\n  init: {\n "theme": "dark" }\n}%%\nflowchart TD\n A --> B').ok).toBe(true)
    expect(parseMermaid('flowchart TD\n%%{init: {}}%%\n A --> B').ok).toBe(true)
  })
  it('reports an unclosed directive at its line and column', () => {
    expect(errors('flowchart TD\n  %%{init: {"a": 1}\n A --> B')[0]).toMatchObject({ code: 'syntax', line: 2, column: 3 })
  })
  it('reads accTitle and a single-line accDescr', () => {
    const r = parseMermaid('flowchart TD\n accTitle: Parcel flow\n accDescr: A parcel moves.\n A --> B')
    expect(r.ok && r.ast.meta).toEqual({ accTitle: 'Parcel flow', accDescr: 'A parcel moves.' })
  })
  it('reads a multi-line accDescr block', () => {
    const r = parseMermaid('flowchart TD\n accDescr {\n  First line\n  second line\n }\n A --> B')
    expect(r.ok && r.ast.meta.accDescr).toBe('First line second line')
    expect(r.ok && r.ast.type === 'flowchart' && r.ast.edges).toHaveLength(1)
  })
  it('reads an accDescr block that opens and closes on one line', () => {
    const r = parseMermaid('flowchart TD\n accDescr { one liner }\n A --> B')
    expect(r.ok && r.ast.meta.accDescr).toBe('one liner')
  })
  it('reports an unclosed accDescr block and a block accTitle', () => {
    expect(errors('flowchart TD\n  accDescr {\n text\n A --> B')[0]).toMatchObject({ line: 2, column: 12 })
    expect(errors('flowchart TD\n accTitle {\n}')[0].message).toContain('single line')
  })
  it('a node called accTitle without a colon is just a node', () => {
    const r = parseMermaid('flowchart TD\n accTitle --> B')
    expect(r.ok && r.ast.type === 'flowchart' && r.ast.nodes[0]!.id).toBe('accTitle')
  })
})

describe('parseMermaid: trailing comments and semicolons', () => {
  it('cuts a %% comment after a statement in every diagram type, never inside quotes or brackets', () => {
    for (const src of ['sequenceDiagram %% c\n A->>B: hi %% note', 'pie %% c\n "A" : 1 %% n', 'stateDiagram-v2\n [*] --> A %% n', 'erDiagram\n A ||--o{ B : has %% n', 'classDiagram\n A <|-- B %% n', 'mindmap\n root %% n\n  child %% n', 'journey\n section S %% n\n  T: 3: Me %% n']) {
      expect(parseMermaid(src).ok, src).toBe(true)
    }
    const r = parseMermaid('sequenceDiagram\n A->>B: "100%% sure" %% gone')
    expect(r.ok && JSON.stringify(r.ast)).toContain('100%% sure')
    expect(r.ok && JSON.stringify(r.ast)).not.toContain('gone')
  })
  it('a line that is only a trailing comment after spaces is blank', () => {
    expect(parseMermaid('flowchart TD\n   %% hi\n A --> B').ok).toBe(true)
  })
  it('splits statements on ; in sequence, state, class and ER diagrams', () => {
    const seq = parseMermaid('sequenceDiagram; participant A; participant B; A->>B: hi; B-->>A: ok;')
    expect(seq.ok && seq.ast.type === 'sequence' && seq.ast.participants).toHaveLength(2)
    const st = parseMermaid('stateDiagram-v2; [*] --> A; A --> B: go; B --> [*]')
    expect(st.ok && st.ast.type === 'state' && st.ast.transitions).toHaveLength(3)
    const cls = parseMermaid('classDiagram; class A; class B; A <|-- B; B : +x')
    expect(cls.ok && cls.ast.type === 'class' && cls.ast.relations).toHaveLength(1)
    const er = parseMermaid('erDiagram; A ||--o{ B : has; B ||--|| C : owns')
    expect(er.ok && er.ast.type === 'er' && er.ast.relationships).toHaveLength(2)
  })
  it('reports errors after a ; at the right line and column', () => {
    const r = parseMermaid('sequenceDiagram\n A->>B: ok; A=>>B: bad')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors[0]).toMatchObject({ line: 2, column: 14 })
  })
  it('does not split inside quotes or entity codes', () => {
    const r = parseMermaid('sequenceDiagram\n A->>B: "a; b"; B->>A: x #59; y &amp; z')
    expect(r.ok && r.ast.type === 'sequence' && r.ast.events).toHaveLength(2)
  })
  it('does not split other types, where ; is text', () => {
    const r = parseMermaid('mindmap\n root\n  a; b')
    expect(r.ok && JSON.stringify(r.ast)).toContain('a; b')
  })
})

describe('parseMermaid: parser failures never escape', () => {
  it('converts a thrown ParseFail into a typed error with the source line', () => {
    const [e] = errors('flowchart TD\n  A[Open')
    expect(e).toMatchObject({ code: 'syntax', line: 2, column: 4, sourceLine: '  A[Open' })
  })
  it('1000 lines of every supported header never throw', () => {
    for (const h of ['flowchart TD', 'sequenceDiagram', 'pie', 'stateDiagram-v2', 'erDiagram', 'classDiagram', 'gantt', 'mindmap', 'timeline', 'journey']) {
      const body = Array.from({ length: 1000 }, (_, i) => `  line ${i} ??? [`).join('\n')
      expect(() => parseMermaid(`${h}\n${body}`)).not.toThrow()
    }
  })
})

describe('source helpers', () => {
  it('splitSource handles every line ending and non-strings', () => {
    expect(splitSource('a\r\nb\rc\nd')).toEqual(['a', 'b', 'c', 'd'])
    expect(splitSource(undefined)).toEqual([''])
    expect(splitSource(12)).toEqual(['12'])
  })
  it('prepareSource counts a tab as four columns of indent', () => {
    const p = prepareSource('mindmap\n\troot\n  \tdeep')
    expect(p.lines.map((l) => l.indent)).toEqual([4, 6])
    expect(p.lines[0]).toMatchObject({ no: 2, col: 2, text: 'root' })
  })
  it('prepareSource throws ParseFail for empty input', () => {
    expect(() => prepareSource('')).toThrow(ParseFail)
  })
})
