import { describe, expect, it } from 'vitest'
import { parseMermaid } from '../parse'
import { genericsToAngle, RELATION_HELP, type ClassAst, type ClassDef } from './class'

const ok = (src: string): ClassAst => {
  const r = parseMermaid(src)
  if (!r.ok) throw new Error(JSON.stringify(r.errors))
  return r.ast as ClassAst
}
const bad = (src: string) => {
  const r = parseMermaid(src)
  if (r.ok) throw new Error('expected a parse error')
  expect(r.errors).toHaveLength(1)
  return r.errors[0]!
}
const cls = (ast: ClassAst, id: string): ClassDef => {
  const c = ast.classes.find((x) => x.id === id)
  if (!c) throw new Error(`no class ${id}`)
  return c
}
const ids = (ast: ClassAst) => ast.classes.map((c) => c.id)
const rel = (ast: ClassAst, i = 0) => ast.relations[i]!

describe('class parse: good', () => {
  it('reads classes, members and the header', () => {
    const ast = ok(`classDiagram
class Animal {
  +String name
  -int age
  #weight
  ~secret
  +getName() String
  +add(int a, int b) int
  name : String
}
class Dog`)
    expect(ast.type).toBe('class')
    expect(ast.direction).toBe('TB')
    expect(ids(ast)).toEqual(['Animal', 'Dog'])
    expect(cls(ast, 'Animal').attributes.map((a) => [a.text, a.visibility])).toEqual([
      ['+String name', '+'], ['-int age', '-'], ['#weight', '#'], ['~secret', '~'], ['name : String', undefined],
    ])
    expect(cls(ast, 'Animal').methods.map((a) => a.text)).toEqual(['+getName() String', '+add(int a, int b) int'])
    expect(cls(ast, 'Dog').attributes).toEqual([])
  })

  it('accepts the classDiagram-v2 keyword', () => {
    expect(ok('classDiagram-v2\nclass A').keyword).toBe('classDiagram-v2')
  })

  it('reads `Name : member` lines and creates the class', () => {
    const ast = ok('classDiagram\nDog : +bark() void\nDog : +int legs\nDog:name')
    expect(ids(ast)).toEqual(['Dog'])
    expect(cls(ast, 'Dog').methods).toHaveLength(1)
    expect(cls(ast, 'Dog').attributes.map((a) => a.text)).toEqual(['+int legs', 'name'])
  })

  it('reads static and abstract classifiers', () => {
    const ast = ok(`classDiagram
class A {
  +speak()* String
  +count()$ int
  +total$
  +other()*
  +name String*
  +make() A$
}`)
    const a = cls(ast, 'A')
    expect(a.methods.map((m) => [m.text, m.abstract, m.static])).toEqual([
      ['+speak() String', true, false],
      ['+count()$ int', false, true],
      ['+other()', true, false],
      ['+make() A$', false, true],
    ])
    expect(a.attributes.map((m) => [m.text, m.abstract, m.static])).toEqual([['+total$', false, true], ['+name String', true, false]])
  })

  it('reads generics on classes and in members', () => {
    const ast = ok(`classDiagram
class Box~T~
class Map~K, V~ {
  +List~List~int~~ items
  +get(K key) V
}
Box~T~ <|-- Crate~String~
Pair~A,B~ : +first A`)
    expect(cls(ast, 'Box').generic).toBe('T')
    expect(cls(ast, 'Map').generic).toBe('K, V')
    expect(cls(ast, 'Map').attributes[0]!.text).toBe('+List<List<int>> items')
    expect(cls(ast, 'Crate').generic).toBe('String')
    expect(cls(ast, 'Pair').generic).toBe('A,B')
    expect(genericsToAngle('~y')).toBe('<y')
    expect(genericsToAngle('List~int~')).toBe('List<int>')
  })

  it('reads annotations in every form', () => {
    const ast = ok(`classDiagram
class Shape {
  <<abstract>>
  +area() float
}
class Walker
<<interface>> Walker
class Color {
  <<enumeration>>
  RED
  GREEN
}
Service : <<service>>
class Repo {
  <<interface>>
  <<service>>
  <<interface>>
}`)
    expect(cls(ast, 'Shape').annotations).toEqual(['abstract'])
    expect(cls(ast, 'Walker').annotations).toEqual(['interface'])
    expect(cls(ast, 'Color').annotations).toEqual(['enumeration'])
    expect(cls(ast, 'Color').attributes.map((a) => a.text)).toEqual(['RED', 'GREEN'])
    expect(cls(ast, 'Service').annotations).toEqual(['service'])
    expect(cls(ast, 'Repo').annotations).toEqual(['interface', 'service'])
  })

  it('reads every relation operator with the right ends and line', () => {
    const table: [string, string | undefined, string | undefined, boolean][] = [
      ['<|--', 'triangle', undefined, false],
      ['--|>', undefined, 'triangle', false],
      ['*--', 'diamond-filled', undefined, false],
      ['--*', undefined, 'diamond-filled', false],
      ['o--', 'diamond', undefined, false],
      ['--o', undefined, 'diamond', false],
      ['-->', undefined, 'open', false],
      ['<--', 'open', undefined, false],
      ['--', undefined, undefined, false],
      ['..>', undefined, 'open', true],
      ['<..', 'open', undefined, true],
      ['..|>', undefined, 'triangle', true],
      ['<|..', 'triangle', undefined, true],
      ['..', undefined, undefined, true],
    ]
    for (const [op, fromEnd, toEnd, dashed] of table) {
      for (const src of op.startsWith('o') ? [`classDiagram\nA ${op} B`] : [`classDiagram\nA ${op} B`, `classDiagram\nA${op}B`]) {
        const r = rel(ok(src))
        expect(r, `${op} in ${src}`).toMatchObject({ from: 'A', to: 'B', dashed })
        expect(r.fromEnd, op).toBe(fromEnd)
        expect(r.toEnd, op).toBe(toEnd)
      }
    }
  })

  it('reads cardinalities and labels', () => {
    const ast = ok(`classDiagram
Customer "1" --> "*" Ticket : buys
Order "1" *-- "1..*" OrderLine
A "0..1" -- B : "quoted label"
C --> "n" D`)
    expect(ast.relations.map((r) => [r.from, r.to, r.fromCard, r.toCard, r.label])).toEqual([
      ['Customer', 'Ticket', '1', '*', 'buys'],
      ['Order', 'OrderLine', '1', '1..*', undefined],
      ['A', 'B', '0..1', undefined, 'quoted label'],
      ['C', 'D', undefined, 'n', undefined],
    ])
  })

  it('reads dotted and dashed names, backticks and entity names', () => {
    const ast = ok('classDiagram\nmy-class --> Foo.Bar\n`Odd Name` --> A\nclass `Other One`')
    expect(ids(ast)).toEqual(['my-class', 'Foo.Bar', 'Odd Name', 'A', 'Other One'])
  })

  it('reads nested generics in a declaration and an empty label or cardinality', () => {
    const ast = ok('classDiagram\nclass Repo~List~Item~~\nclass E[""]\nA "" --> B : ""\nnamespace X {\n  class P\n}\nnamespace X {\n  class Q\n}\nclassDef a,,b stroke:#f00\ncssClass "A,,B" a')
    expect(cls(ast, 'Repo').generic).toBe('List<Item>')
    expect(cls(ast, 'E').label).toBeUndefined()
    expect(rel(ast)).toMatchObject({ fromCard: undefined, label: undefined })
    expect(ast.namespaces).toHaveLength(1)
    expect(Object.keys(ast.classDefs)).toEqual(['a', 'b'])
    expect(cls(ast, 'B').classes).toEqual(['a'])
  })

  it('reads a display label', () => {
    const ast = ok('classDiagram\nclass Animal["Animal with a label"]\nclass B[plain]')
    expect(cls(ast, 'Animal').label).toBe('Animal with a label')
    expect(cls(ast, 'B').label).toBe('plain')
  })

  it('reads namespaces', () => {
    const ast = ok(`classDiagram
namespace Shop {
  class Order {
    +id int
  }
  class Line
}
namespace Billing {
  class Invoice
}
Order --> Invoice
Order --> Outside`)
    expect(ast.namespaces.map((n) => n.id)).toEqual(['Shop', 'Billing'])
    expect(cls(ast, 'Order').namespace).toBe('Shop')
    expect(cls(ast, 'Line').namespace).toBe('Shop')
    expect(cls(ast, 'Invoice').namespace).toBe('Billing')
    expect(cls(ast, 'Outside').namespace).toBeUndefined()
    expect(cls(ast, 'Order').attributes).toHaveLength(1)
  })

  it('reads notes', () => {
    const ast = ok('classDiagram\nclass Dog\nnote "free floating"\nnote for Dog "can bark\\nloudly"')
    expect(ast.notes).toEqual([
      { index: 0, target: undefined, text: 'free floating', line: 3 },
      { index: 1, target: 'Dog', text: 'can bark\\nloudly', line: 4 },
    ])
  })

  it('reads classDef, cssClass, class names and :::', () => {
    const ast = ok(`classDiagram
classDef important fill:#f96,stroke:#333
classDef a,b stroke-dasharray:3
class A:::important
class B["B label"]:::a
C:::b --> A
cssClass "A,C" b
cssClass D a`)
    expect(ast.classDefs.important).toEqual({ fill: '#f96', stroke: '#333' })
    expect(ast.classDefs.b).toEqual({ 'stroke-dasharray': '3' })
    expect(cls(ast, 'A').classes).toEqual(['important', 'b'])
    expect(cls(ast, 'B').classes).toEqual(['a'])
    expect(cls(ast, 'C').classes).toEqual(['b'])
    expect(cls(ast, 'D').classes).toEqual(['a'])
  })

  it('reads direction', () => {
    expect(ok('classDiagram\ndirection RL\nclass A').direction).toBe('RL')
    expect(ok('classDiagram\ndirection lr\nclass A').direction).toBe('LR')
    expect(ok('classDiagram\ndirection TD\nclass A').direction).toBe('TB')
  })

  it('ignores click, link, callback and style lines', () => {
    const ast = ok('classDiagram\nclass A\nclick A href "https://example.com"\nlink A "https://example.com"\ncallback A "cb"\nstyle A fill:#f00')
    expect(ids(ast)).toEqual(['A'])
  })

  it('keeps front matter title and strips comments', () => {
    const ast = ok('---\ntitle: Orchard Mill domain\n---\nclassDiagram\n%% comment\nclass A')
    expect(ast.meta.title).toBe('Orchard Mill domain')
  })

  it('treats words like class, note or link as names when they take part in a relation', () => {
    const ast = ok('classDiagram\nlink --> note\nclass --> A\nstyle : +x')
    expect(ids(ast)).toEqual(['link', 'note', 'class', 'A', 'style'])
  })

  it('accepts an inline empty body and a lone class mention', () => {
    const ast = ok('classDiagram\nclass A {}\nclass B { }\nLonely')
    expect(ids(ast)).toEqual(['A', 'B', 'Lonely'])
  })

  it('decodes entities in members', () => {
    expect(cls(ok('classDiagram\nclass A {\n  +x #quot;hi#quot;\n}'), 'A').attributes[0]!.text).toBe('+x "hi"')
  })
})

describe('class parse: errors', () => {
  it('reports an unterminated class body at its opening line', () => {
    expect(bad('classDiagram\nclass Animal {\n  +String name')).toMatchObject({
      code: 'syntax', line: 2, column: 1, message: 'The class "Animal" opened here is never closed. Add a "}" line after its members.',
    })
    expect(bad('classDiagram\n  class Animal {')).toMatchObject({ line: 2, column: 3 })
  })

  it('reports an unterminated namespace', () => {
    expect(bad('classDiagram\nnamespace Shop {\n  class A')).toMatchObject({
      line: 2, column: 1, message: 'The namespace "Shop" opened here is never closed. Add a "}" line after its classes.',
    })
  })

  it('reports a stray closing brace', () => {
    expect(bad('classDiagram\nclass A\n  }')).toMatchObject({
      line: 3, column: 3, message: 'Unexpected "}": nothing is open. Remove it, or open a block with "class Name {" or "namespace Name {".',
    })
  })

  it('reports unknown relation operators and lists the valid ones', () => {
    expect(bad('classDiagram\nA -> B')).toMatchObject({ line: 2, column: 3, message: `Unknown relation "->" after "A". ${RELATION_HELP}` })
    expect(bad('classDiagram\nA ==> B')).toMatchObject({ line: 2, column: 3, message: `Unknown relation "==>" after "A". ${RELATION_HELP}` })
    expect(bad('classDiagram\nA ---> B').message).toContain('Unknown relation "--->"')
    expect(bad('classDiagram\nA "1" ~~ B').message).toContain('Unknown relation "~~"')
    expect(bad('classDiagram\nA <|--|-- B').message).toContain('Unknown relation "<|--|--"')
    expect(bad('classDiagram\nA "1"')).toMatchObject({ line: 2, column: 6, message: `Expected a relation after "A". ${RELATION_HELP}` })
    expect(bad('classDiagram\nA "1" "2" --> B').message).toContain('Expected a relation after "A"')
    expect(bad(`classDiagram\n${'L'.repeat(60)} -> B`).message).toContain(`after "${'L'.repeat(40)}..."`)
    expect(bad('classDiagram\nA B')).toMatchObject({ line: 2, column: 3 })
    expect(bad('classDiagram\nA B').message).toContain('"<|--"')
    expect(RELATION_HELP).toContain('"..|>"')
  })

  it('reports a relation without a second class', () => {
    expect(bad('classDiagram\nA -->')).toMatchObject({
      line: 2, column: 6, message: 'This relation has no second class. Write the class after the relation, for example "A --> Other".',
    })
    expect(bad('classDiagram\nA --> : label').message).toContain('no second class')
  })

  it('reports a relation without a first class', () => {
    expect(bad('classDiagram\n--> B')).toMatchObject({ line: 2, column: 1, message: 'Expected a class name, for example "Animal" or "Animal~T~".' })
  })

  it('reports missing class names', () => {
    expect(bad('classDiagram\nclass')).toMatchObject({ line: 2, column: 6, message: 'Expected a class name after "class", for example "Animal" or "Animal~T~".' })
    expect(bad('classDiagram\nclass {')).toMatchObject({ line: 2, column: 7 })
    expect(bad('classDiagram\nnamespace {')).toMatchObject({ line: 2, column: 11 })
    expect(bad('classDiagram\nnote for "x"')).toMatchObject({ line: 2, column: 10 })
  })

  it('reports problems after a class name', () => {
    expect(bad('classDiagram\nclass A junk')).toMatchObject({
      line: 2, column: 9, message: 'Unexpected "junk". A class declaration ends after its name or "{"; put members on their own lines.',
    })
    expect(bad('classDiagram\nclass A["label')).toMatchObject({ line: 2, column: 8, message: 'This label is never closed. Write class Name["Label"].' })
    expect(bad('classDiagram\nclass A:::')).toMatchObject({ line: 2, column: 11, message: 'Expected a class name after ":::".' })
    expect(bad('classDiagram\nA --> B junk')).toMatchObject({ line: 2, column: 9, message: 'Unexpected "junk". Add a label with ":", for example "A --> B : label".' })
    expect(bad('classDiagram\nA :')).toMatchObject({ line: 2, column: 3, message: '"A :" needs a member or annotation after the colon, for example "A : +name String".' })
  })

  it('reports an unclosed generic or backtick', () => {
    expect(bad('classDiagram\nclass Box~T')).toMatchObject({ line: 2, column: 10, message: 'The generic type "~T" is never closed. Write it as Box~T~.' })
    expect(bad('classDiagram\nclass `Box')).toMatchObject({ line: 2, column: 7, message: 'This backtick name is never closed. End it with a second backtick.' })
    expect(bad('classDiagram\nclass ``')).toMatchObject({ line: 2, column: 7 })
  })

  it('reports an unclosed cardinality', () => {
    expect(bad('classDiagram\nA "1 --> B')).toMatchObject({
      line: 2, column: 3, message: 'This cardinality is never closed. End it with a closing quote, for example "1" or "0..*".',
    })
    expect(bad('classDiagram\nA --> "1 B').message).toContain('cardinality is never closed')
  })

  it('reports bad notes', () => {
    expect(bad('classDiagram\nnote hello')).toMatchObject({ line: 2, column: 6, message: 'Note text must be quoted: note "text" or note for Name "text".' })
    expect(bad('classDiagram\nnote "hello')).toMatchObject({ line: 2, column: 6, message: 'This note text is never closed. End it with a closing quote.' })
    expect(bad('classDiagram\nnote ""')).toMatchObject({ line: 2, column: 6, message: 'This note has no text. Write the text between the quotes.' })
    expect(bad('classDiagram\nnote "x" y')).toMatchObject({ line: 2, column: 10, message: 'Unexpected "y" after the note text.' })
  })

  it('reports bad direction, classDef, cssClass and namespace', () => {
    expect(bad('classDiagram\ndirection UP')).toMatchObject({ line: 2, column: 11, message: 'Unknown direction "UP". Use TB, BT, LR or RL.' })
    expect(bad('classDiagram\ndirection')).toMatchObject({ message: 'direction needs a value: TB, BT, LR or RL.' })
    expect(bad('classDiagram\nclassDef')).toMatchObject({ line: 2, column: 1, message: 'classDef needs a name and styles: "classDef name stroke-width:2px".' })
    expect(bad('classDiagram\ncssClass')).toMatchObject({ line: 2, column: 1, message: 'cssClass needs class names and a style class: cssClass "Animal,Dog" name.' })
    expect(bad('classDiagram\nnamespace Shop')).toMatchObject({ line: 2, column: 15, message: 'A namespace needs a body: namespace Shop {' })
    expect(bad('classDiagram\nnamespace Shop { class A')).toMatchObject({ line: 2, column: 18, message: 'Put the classes of a namespace on their own lines after "{".' })
    expect(bad('classDiagram\nnamespace A {\nnamespace B {\n}\n}')).toMatchObject({ line: 3, column: 1, message: 'Namespaces cannot be nested. Close the open namespace with "}" first.' })
  })

  it('reports text after the header', () => {
    expect(bad('classDiagram direction LR\nclass A')).toMatchObject({ line: 1, column: 14, message: 'Put "direction LR" on its own line below classDiagram.' })
  })

  it('reports an empty source', () => {
    const r = parseMermaid('')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors[0]!.code).toBe('empty')
  })
})

describe('class parse: edge cases', () => {
  it('accepts a header with no body', () => {
    expect(ok('classDiagram').classes).toEqual([])
    expect(ok('classDiagram\n%% just a comment').classes).toEqual([])
  })

  it('handles CRLF and unicode', () => {
    const ast = ok('classDiagram\r\nclass Zażółć {\r\n  +imię String\r\n}\r\n状態 --> Zażółć : 日本語\r\n')
    expect(ids(ast)).toEqual(['Zażółć', '状態'])
    expect(cls(ast, 'Zażółć').attributes[0]!.text).toBe('+imię String')
    expect(rel(ast).label).toBe('日本語')
  })

  it('keeps very long members and labels as text', () => {
    const long = 'x'.repeat(5000)
    const ast = ok(`classDiagram\nclass A {\n  +${long} f\n}\nA --> B : ${long}`)
    expect(cls(ast, 'A').attributes[0]!.text).toHaveLength(5003)
    expect(rel(ast).label).toHaveLength(5000)
  })

  it('merges duplicate declarations', () => {
    const ast = ok('classDiagram\nclass A {\n  +x\n}\nclass A {\n  +y\n}\nA : +z\nA --> A')
    expect(ids(ast)).toEqual(['A'])
    expect(cls(ast, 'A').attributes.map((a) => a.text)).toEqual(['+x', '+y', '+z'])
    expect(ast.relations).toHaveLength(1)
  })

  it('keeps hostile text as plain text', () => {
    const ast = ok(`classDiagram
class A {
  +<script>alert(1)</script> f
  +"><img src=x onerror=alert(1)>
}
A --> B : javascript:alert(1)
note for A "<img onerror=alert(1)>"`)
    expect(cls(ast, 'A').methods.map((a) => a.text)).toEqual(['+<script>alert(1)</script> f', '+"><img src=x onerror=alert(1)>'])
    expect(rel(ast).label).toBe('javascript:alert(1)')
    expect(ast.notes[0]!.text).toBe('<img onerror=alert(1)>')
  })

  it('parses 1000 lines quickly', () => {
    const lines = ['classDiagram']
    for (let i = 0; i < 120; i++) {
      lines.push(`class C${i} {`, '  +String name', '  -int age', '  +run() void', '}', `C${i} <|-- C${i + 1} : extends`, `C${i} "1" --> "*" C${i + 2}`, `C${i} : +extra${i}`)
    }
    const t0 = performance.now()
    const ast = ok(lines.join('\n'))
    expect(performance.now() - t0).toBeLessThan(200)
    expect(ast.relations).toHaveLength(240)
  })

  it('never throws on arbitrary garbage', () => {
    const junk = ['}', '{', '--', '-->', '<|--', '"', '`', '~', ':::', ':', 'A --> ', 'class', 'class A {', 'namespace', 'note', '<<', '>>', '*', 'o--', '..|>', '\t']
    for (let i = 0; i < 200; i++) {
      const src = ['classDiagram', ...Array.from({ length: 5 }, (_, k) => junk[(i * 7 + k * 11) % junk.length]! + ' ' + junk[(i * 3 + k) % junk.length]!)].join('\n')
      expect(() => parseMermaid(src)).not.toThrow()
    }
  })
})

describe('classDiagram annotations on hostile whitespace', () => {
  // Inputs large enough that the old super-linear code took seconds; the linear code takes milliseconds, so the bound survives slow CI.
  const spaces = ' '.repeat(80000)
  it.each([
    ['member line', `classDiagram\nclass A {\n  <<${spaces}x\n}`],
    ['standalone line', `classDiagram\nclass A\n<<${spaces}x`],
  ])('a %s with an unclosed annotation parses in linear time', (_name, src) => {
    const start = performance.now()
    parseMermaid(src)
    expect(performance.now() - start).toBeLessThan(2000)
  })
  it('padded annotations keep their trimmed name', () => {
    const ast = ok(`classDiagram\nclass A {\n  <<   interface   >>\n}\n<<  service  >> A`)
    expect(cls(ast, 'A').annotations).toEqual(['interface', 'service'])
  })
})
