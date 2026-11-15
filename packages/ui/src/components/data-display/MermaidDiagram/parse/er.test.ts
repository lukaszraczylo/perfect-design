import { describe, expect, it } from 'vitest'
import { parseMermaid } from '.'
import type { ErAst } from './er'

function ok(source: string): ErAst {
  const r = parseMermaid(source)
  if (!r.ok) throw new Error(`${r.errors[0]!.line}:${r.errors[0]!.column} ${r.errors[0]!.message}`)
  expect(r.ast.type).toBe('er')
  return r.ast as ErAst
}

function bad(source: string) {
  const r = parseMermaid(source)
  if (r.ok) throw new Error('expected a parse error')
  expect(r.errors).toHaveLength(1)
  return r.errors[0]!
}

describe('erDiagram parse: good input', () => {
  it('parses relationships with all four cardinalities and both line kinds', () => {
    const ast = ok(`erDiagram
  A ||--o{ B : places
  B }|..|{ C : lists
  C |o--o| D : links
  D }o..|| E : "has many"`)
    expect(ast.entities.map((e) => e.id)).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(ast.relationships.map((r) => [r.from, r.fromCard, r.identifying, r.toCard, r.to, r.label])).toEqual([
      ['A', 'one', true, 'zero-many', 'B', 'places'],
      ['B', 'one-many', false, 'one-many', 'C', 'lists'],
      ['C', 'zero-one', true, 'zero-one', 'D', undefined],
      ['D', 'zero-many', false, 'one', 'E', 'has many'],
    ].map((r, i) => (i === 2 ? [r[0], r[1], r[2], r[3], r[4], 'links'] : r)))
    expect(ast.direction).toBe('TB')
  })

  it('accepts mirrored symbols on either end', () => {
    const ast = ok('erDiagram\n  A o{--}o B\n  A o|--|{ C\n  A |{--|o D')
    expect(ast.relationships.map((r) => [r.fromCard, r.toCard])).toEqual([
      ['zero-many', 'zero-many'],
      ['zero-one', 'one-many'],
      ['one-many', 'zero-one'],
    ])
  })

  it('parses entity blocks with types, keys and comments', () => {
    const ast = ok(`erDiagram
  CUSTOMER {
    string name
    int id PK "surrogate key"
    varchar(100) email UK, FK "login"
    decimal(10,2) credit_limit
    decimal(10, 2) balance
    string[] tags
    string *starred PK FK
  }`)
    const a = ast.entities[0]!.attributes
    expect(a.map((x) => [x.type, x.name, x.keys, x.comment])).toEqual([
      ['string', 'name', [], undefined],
      ['int', 'id', ['PK'], 'surrogate key'],
      ['varchar(100)', 'email', ['UK', 'FK'], 'login'],
      ['decimal(10,2)', 'credit_limit', [], undefined],
      ['decimal(10, 2)', 'balance', [], undefined],
      ['string[]', 'tags', [], undefined],
      ['string', '*starred', ['PK', 'FK'], undefined],
    ])
    expect(a[1]!.line).toBe(4)
  })

  it('accepts lower case keys and drops empty comments', () => {
    const a = ok('erDiagram\n A {\n  int id pk ""\n }').entities[0]!.attributes[0]!
    expect(a.keys).toEqual(['PK'])
    expect(a.comment).toBeUndefined()
  })

  it('accepts one-line, empty and bare entities', () => {
    const ast = ok('erDiagram\n  A {}\n  B { }\n  C { int id PK }\n  D\n  E {\n  }')
    expect(ast.entities.map((e) => [e.id, e.attributes.length])).toEqual([['A', 0], ['B', 0], ['C', 1], ['D', 0], ['E', 0]])
  })

  it('accepts text after "{" that continues on the next lines', () => {
    const ast = ok('erDiagram\n  A { int id\n    string name\n  }')
    expect(ast.entities[0]!.attributes.map((x) => x.name)).toEqual(['id', 'name'])
  })

  it('accepts a closing brace at the end of an attribute line', () => {
    const ast = ok('erDiagram\n  A {\n    int id\n    string name }\n  B')
    expect(ast.entities[0]!.attributes.map((x) => x.name)).toEqual(['id', 'name'])
    expect(ast.entities[1]!.id).toBe('B')
  })

  it('reads aliases and quoted names', () => {
    const ast = ok(`erDiagram
  p[Person] {
    string name
  }
  a["Account holder"]
  "Order Line" ||--|| p : "belongs to"
  hyphen-name }o--o{ under_score : x`)
    const byId = Object.fromEntries(ast.entities.map((e) => [e.id, e]))
    expect(byId.p!.alias).toBe('Person')
    expect(byId.a!.alias).toBe('Account holder')
    expect(byId['Order Line']).toBeDefined()
    expect(byId['hyphen-name']).toBeDefined()
    expect(byId.under_score).toBeDefined()
  })

  it('accepts a name and alias on a relationship end', () => {
    const ast = ok('erDiagram\n  p[Person] ||--o{ o["Open order"] : has')
    expect(ast.entities.map((e) => [e.id, e.alias])).toEqual([['p', 'Person'], ['o', 'Open order']])
  })

  it('accepts relationships without spaces around the symbols', () => {
    const ast = ok('erDiagram\n  A||--o{B : x')
    expect(ast.relationships[0]).toMatchObject({ from: 'A', to: 'B', label: 'x' })
  })

  it('accepts a missing or empty label', () => {
    const ast = ok('erDiagram\n  A ||--o{ B\n  A ||--o{ C :\n  A ||--o{ D : ""\n  A ||--o{ E : many words here')
    expect(ast.relationships.map((r) => r.label)).toEqual([undefined, undefined, undefined, 'many words here'])
  })

  it('reads the word forms of cardinality', () => {
    const ast = ok(`erDiagram
  A only one to zero or more B : a
  A 1 to one or more C : b
  A zero or one optionally to many(0) D : c
  A One Or Zero TO 0+ E : d
  A many(1) optionally to 1+ F : e
  A one or many to zero or many G : f
  A zero or more to zero or one H : g`)
    expect(ast.relationships.map((r) => [r.fromCard, r.identifying, r.toCard])).toEqual([
      ['one', true, 'zero-many'],
      ['one', true, 'one-many'],
      ['zero-one', false, 'zero-many'],
      ['zero-one', true, 'zero-many'],
      ['one-many', false, 'one-many'],
      ['one-many', true, 'zero-many'],
      ['zero-many', true, 'zero-one'],
    ])
  })

  it('reads direction and the optional TD alias', () => {
    expect(ok('erDiagram\n  direction LR\n  A ||--o{ B').direction).toBe('LR')
    expect(ok('erDiagram\n  direction TD\n  A').direction).toBe('TB')
    expect(ok('erDiagram\n  direction RL\n  A').direction).toBe('RL')
    expect(ok('erDiagram\n  direction BT\n  A').direction).toBe('BT')
  })

  it('treats a bare "direction" or "class" word as an entity', () => {
    expect(ok('erDiagram\n  direction\n  class\n  style').entities.map((e) => e.id)).toEqual(['direction', 'class', 'style'])
  })

  it('merges repeated entity blocks and keeps first-appearance order', () => {
    const ast = ok(`erDiagram
  A ||--o{ B : x
  B {
    int id
  }
  B {
    string name
  }
  A[Alpha]`)
    expect(ast.entities.map((e) => e.id)).toEqual(['A', 'B'])
    expect(ast.entities[1]!.attributes.map((a) => a.name)).toEqual(['id', 'name'])
    expect(ast.entities[0]!.alias).toBe('Alpha')
  })

  it('keeps self relationships', () => {
    const ast = ok('erDiagram\n  EMPLOYEE ||--o{ EMPLOYEE : manages')
    expect(ast.entities).toHaveLength(1)
    expect(ast.relationships[0]).toMatchObject({ from: 'EMPLOYEE', to: 'EMPLOYEE' })
  })

  it('accepts the statement on the header line', () => {
    expect(ok('erDiagram A ||--o{ B : x').relationships).toHaveLength(1)
  })

  it('ignores comments, blank lines and directives and takes the front matter title', () => {
    const ast = ok(`---
title: Orchard Mill orders
---
%%{init: {"theme": "dark"}}%%
erDiagram
  %% a comment
  accTitle: Orders
  accDescr: Who orders what

  A ||--o{ B : x`)
    expect(ast.meta).toMatchObject({ title: 'Orchard Mill orders', accTitle: 'Orders', accDescr: 'Who orders what' })
    expect(ast.entities.map((e) => e.id)).toEqual(['A', 'B'])
  })

  it('maps classDef, class, style and ::: to entity styles', () => {
    const ast = ok(`erDiagram
  A:::danger ||--o{ B : x
  classDef danger stroke-width:4px
  classDef default stroke-dasharray:3
  classDef a,b fill:#f00
  class B,Missing a,b
  style A stroke:#00f
  style Nope fill:#fff`)
    expect(ast.classDefs.danger).toEqual({ 'stroke-width': '4px' })
    expect(ast.classDefs.a).toEqual({ fill: '#f00' })
    expect(ast.classDefs.b).toEqual({ fill: '#f00' })
    expect(ast.entities[0]!.classes).toEqual(['danger'])
    expect(ast.entities[0]!.style).toEqual({ stroke: '#00f' })
    expect(ast.entities[1]!.classes).toEqual(['a', 'b'])
  })

  it('handles unicode names, types and comments', () => {
    const ast = ok('erDiagram\n  Заказ {\n    текст имя "комментарий 日本語"\n  }\n  "客户 😀" ||--o{ Заказ : 注文')
    expect(ast.entities.map((e) => e.id)).toEqual(['Заказ', '客户 😀'])
    expect(ast.entities[0]!.attributes[0]!.comment).toBe('комментарий 日本語')
    expect(ast.relationships[0]!.label).toBe('注文')
  })

  it('handles escaped quotes and entity codes in quoted text', () => {
    const ast = ok('erDiagram\n  A {\n    string x "say \\"hi\\" #quot;now#quot;"\n  }\n  A ||--o{ B : "a \\"b\\""')
    expect(ast.entities[0]!.attributes[0]!.comment).toBe('say "hi" #quot;now#quot;')
    expect(ast.relationships[0]!.label).toBe('a "b"')
  })

  it('keeps hostile text as plain data', () => {
    const ast = ok(`erDiagram
  "<script>alert(1)</script>" ||--o{ B : "\\"><img src=x onerror=alert(1)>"
  B {
    string x "javascript:alert(1)"
  }`)
    expect(ast.entities[0]!.id).toBe('<script>alert(1)</script>')
    expect(ast.relationships[0]!.label).toBe('"><img src=x onerror=alert(1)>')
    expect(ast.entities[1]!.attributes[0]!.comment).toBe('javascript:alert(1)')
  })

  it('accepts very long labels', () => {
    const long = 'x'.repeat(5000)
    const ast = ok(`erDiagram\n  A ||--o{ B : ${long}\n  A {\n    string n "${long}"\n  }`)
    expect(ast.relationships[0]!.label).toHaveLength(5000)
    expect(ast.entities[0]!.attributes[0]!.comment).toHaveLength(5000)
  })

  it('reads CRLF source', () => {
    const ast = ok('erDiagram\r\n  A {\r\n    int id PK\r\n  }\r\n  A ||--o{ B : x\r\n')
    expect(ast.entities[0]!.attributes).toHaveLength(1)
    expect(ast.relationships).toHaveLength(1)
  })

  it('accepts an empty body', () => {
    const ast = ok('erDiagram')
    expect(ast.entities).toEqual([])
    expect(ast.relationships).toEqual([])
  })

  it('accepts only comments after the header', () => {
    expect(ok('erDiagram\n%% nothing here\n%% at all').entities).toEqual([])
  })

  it('parses 1000 lines quickly', () => {
    const rows = Array.from({ length: 1000 }, (_, i) => `  E${i} ||--o{ E${i + 1} : r${i}`)
    const t = performance.now()
    const ast = ok(`erDiagram\n${rows.join('\n')}`)
    expect(performance.now() - t).toBeLessThan(200)
    expect(ast.relationships).toHaveLength(1000)
    expect(ast.entities).toHaveLength(1001)
  })

  it('parses a 1000 line entity block quickly', () => {
    const rows = Array.from({ length: 1000 }, (_, i) => `    varchar(${i}) col${i} "c${i}"`)
    const t = performance.now()
    const ast = ok(`erDiagram\n  A {\n${rows.join('\n')}\n  }`)
    expect(performance.now() - t).toBeLessThan(200)
    expect(ast.entities[0]!.attributes).toHaveLength(1000)
  })
})

describe('erDiagram parse: errors', () => {
  it('reports an unterminated block at the opening brace', () => {
    expect(bad('erDiagram\n  A {\n    string x\n')).toMatchObject({
      line: 2, column: 5, code: 'syntax', diagramType: 'erDiagram',
      message: 'The block of "A" opened here is never closed. Add a line with "}" after its attributes.',
    })
  })

  it('reports a new statement inside an open block', () => {
    expect(bad('erDiagram\n  A {\n    B ||--o{ C\n  }')).toMatchObject({
      line: 2, column: 5, message: 'The block of "A" opened here is never closed: line 3 starts a new statement. Add "}" after the attributes.',
    })
    expect(bad('erDiagram\n  A {\n    B {\n  }').line).toBe(2)
  })

  it('reports a stray closing brace', () => {
    expect(bad('erDiagram\n  A {\n    string x\n  }\n  }')).toMatchObject({
      line: 5, column: 3, message: 'This "}" has no matching "{". Remove it, or open the entity block with "NAME {" first.',
    })
  })

  it('reports text after a closing brace', () => {
    expect(bad('erDiagram\n  A { string x } y')).toMatchObject({ line: 2, column: 18, message: 'Nothing may follow "}" on its line. Start the next statement on a new line.' })
    expect(bad('erDiagram\n  A {\n    string x\n  } B')).toMatchObject({ line: 4, column: 5 })
  })

  it('reports an attribute without a name', () => {
    expect(bad('erDiagram\n  A {\n    string\n  }')).toMatchObject({
      line: 3, column: 11, message: 'The attribute type "string" needs a name after it, for example "string name".',
    })
    expect(bad('erDiagram\n  A {\n    string "x"\n  }')).toMatchObject({ line: 3, column: 12, message: 'Expected an attribute name after the type "string", found """.' })
  })

  it('reports a bad attribute type', () => {
    expect(bad('erDiagram\n  A {\n    1x y\n  }')).toMatchObject({ line: 3, column: 5, message: expect.stringContaining('Expected an attribute type such as "string"') })
    expect(bad('erDiagram\n  A {\n    varchar(10 x\n  }')).toMatchObject({
      line: 3, column: 12, message: 'The "(" in this type is never closed. Write for example "varchar(100)" or "decimal(10,2)".',
    })
  })

  it('reports an unknown key', () => {
    expect(bad('erDiagram\n  A {\n    string x ZZ\n  }')).toMatchObject({
      line: 3, column: 14, message: expect.stringContaining('Unknown key "ZZ" on the attribute "x". Use PK, FK or UK'),
    })
    expect(bad('erDiagram\n  A {\n    string x PK2\n  }').column).toBe(14)
  })

  it('reports a dangling comma and stray characters after the name', () => {
    expect(bad('erDiagram\n  A {\n    string x PK,\n  }')).toMatchObject({ line: 3, column: 17, message: 'Expected PK, FK or UK after ",".' })
    expect(bad('erDiagram\n  A {\n    string x ,PK\n  }')).toMatchObject({ line: 3, column: 14, message: expect.stringContaining('Unexpected ","') })
    expect(bad('erDiagram\n  A {\n    string x PK,,FK\n  }')).toMatchObject({ line: 3, column: 17 })
  })

  it('reports an unterminated comment and text after it', () => {
    expect(bad('erDiagram\n  A {\n    string x "c\n  }')).toMatchObject({ line: 3, column: 14, message: 'This comment is never closed. Add the closing ".' })
    expect(bad('erDiagram\n  A {\n    string x "c" extra\n  }')).toMatchObject({ line: 3, column: 18, message: 'Nothing may follow the comment on an attribute line.' })
  })

  it('reports a missing line between cardinalities', () => {
    expect(bad('erDiagram\n  A ||-o{ B : x')).toMatchObject({
      line: 2, column: 7, message: 'Expected "--" (identifying, solid line) or ".." (non-identifying, dashed line) between the cardinalities, found "-o".',
    })
    expect(bad('erDiagram\n  A ||~~o{ B').column).toBe(7)
    expect(bad('erDiagram\n  A ||').message).toContain('found "end of line"')
  })

  it('lists the valid cardinalities for an unknown one', () => {
    const left = bad('erDiagram\n  A |x--o{ B')
    expect(left).toMatchObject({ line: 2, column: 5 })
    expect(left.message).toContain('Unknown left cardinality "|x"')
    expect(left.message).toContain('"||" exactly one')
    expect(left.message).toContain('"|o" or "o|" zero or one')
    expect(left.message).toContain('"}o" or "o{" zero or more')
    expect(left.message).toContain('"}|" or "|{" one or more')
    const right = bad('erDiagram\n  A ||--o~ B')
    expect(right).toMatchObject({ line: 2, column: 9 })
    expect(right.message).toContain('Unknown right cardinality "o~"')
    expect(bad('erDiagram\n  A ||--').message).toContain('The right cardinality is missing')
  })

  it('reports a missing second entity', () => {
    expect(bad('erDiagram\n  A ||--o{ ')).toMatchObject({
      line: 2, column: 11, message: 'The second entity is missing: write its name after the cardinality, for example "A ||--o{ ORDER : places".',
    })
    expect(bad('erDiagram\n  A ||--o{ : x')).toMatchObject({ line: 2, column: 12 })
    expect(bad('erDiagram\n  A ||--o{ !!').message).toContain('Expected the name of the second entity here')
  })

  it('reports an unknown relationship', () => {
    expect(bad('erDiagram\n  A places B')).toMatchObject({
      line: 2, column: 5, message: 'Expected a relationship after "A", for example "A ||--o{ OTHER : label", or "{" to list its attributes.',
    })
    expect(bad('erDiagram\n  A [x]').column).toBe(5)
  })

  it('points a title line to the front matter', () => {
    expect(bad('erDiagram\n  title Orders').message).toContain('front matter')
  })

  it('reports a bad word form', () => {
    expect(bad('erDiagram\n  A one or more B')).toMatchObject({ line: 2, column: 17, message: expect.stringContaining('Expected "to"') })
    expect(bad('erDiagram\n  A one or more to nothing B')).toMatchObject({ line: 2, column: 20, message: expect.stringContaining('Found "nothing B"') })
    expect(bad('erDiagram\n  A one or more to').message).toContain('Found "end of line"')
  })

  it('reports an unterminated quoted label and text after it', () => {
    expect(bad('erDiagram\n  A ||--o{ B : "x')).toMatchObject({ line: 2, column: 16, message: 'This label is never closed. Add the closing ".' })
    expect(bad('erDiagram\n  A ||--o{ B : "x" y')).toMatchObject({ line: 2, column: 20, message: 'Nothing may follow the quoted label on its line.' })
    expect(bad('erDiagram\n  A ||--o{ B x')).toMatchObject({ line: 2, column: 14, message: 'Expected ":" and a label after "B", or the end of the line. Found "x".' })
  })

  it('reports bad entity names and aliases', () => {
    expect(bad('erDiagram\n  "" ||--o{ B')).toMatchObject({ line: 2, column: 3, message: 'An entity name in quotes cannot be empty.' })
    expect(bad('erDiagram\n  "A ||--o{ B')).toMatchObject({ line: 2, column: 3, message: 'This entity name is never closed. Add the closing ".' })
    expect(bad('erDiagram\n  p[ ||--o{ B')).toMatchObject({ line: 2, column: 4, message: expect.stringContaining('never closed') })
    expect(bad('erDiagram\n  p[] ||--o{ B')).toMatchObject({ line: 2, column: 4, message: expect.stringContaining('is empty') })
    expect(bad('erDiagram\n  p["x ||--o{ B').message).toContain('display name is never closed')
    expect(bad('erDiagram\n  p["x" ||--o{ B')).toMatchObject({ column: 9, message: 'Expected "]" after the quoted display name.' })
    expect(bad('erDiagram\n  A:::  ||--o{ B')).toMatchObject({ column: 4, message: 'Expected a class name after ":::".' })
    expect(bad('erDiagram\n  { }')).toMatchObject({ line: 2, column: 3 })
    expect(bad('erDiagram\n  !!!').message).toContain('Expected an entity name here')
    expect(bad('erDiagram\n  ||--o{ A').message).toContain('Expected an entity name here')
  })

  it('reports a bad direction and bad style lines', () => {
    expect(bad('erDiagram\n  direction DOWN')).toMatchObject({ line: 2, column: 13, message: 'Unknown direction "DOWN". Use TB, BT, LR or RL.' })
    expect(bad('erDiagram\n  class A')).toMatchObject({ line: 2, column: 3, message: 'class needs entity names and a class name: "class A,B name".' })
    expect(bad('erDiagram\n  style A')).toMatchObject({ line: 2, column: 3, message: 'style needs an entity name and declarations: "style A stroke-width:2px".' })
  })

  it('reports an unterminated front matter at the right place', () => {
    expect(bad('---\ntitle: x\nerDiagram\n A').line).toBe(1)
  })

  it('never throws on odd input', () => {
    for (const src of ['erDiagram\n\u0000', 'erDiagram\n}{', 'erDiagram\n"', 'erDiagram\n[', 'erDiagram\n:::', 'erDiagram\n\t\t', 'erDiagram\nA ||--o{ B : \\']) {
      expect(() => parseMermaid(src)).not.toThrow()
    }
  })
})
