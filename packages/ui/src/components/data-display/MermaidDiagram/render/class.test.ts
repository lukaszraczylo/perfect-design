import { describe, expect, it } from 'vitest'
import { parseMermaid } from '../parse'
import { renderModel } from '../render'
import { measureText } from '../../_diagram/text'
import type { RenderModel, RenderOptions, RPath, RShape, RText } from '../../_diagram/types'

const draw = (src: string, opts: RenderOptions = {}): RenderModel => {
  const p = parseMermaid(src)
  if (!p.ok) throw new Error(JSON.stringify(p.errors))
  const r = renderModel(p.ast, opts)
  if (!r.ok) throw new Error(JSON.stringify(r.error))
  return r.model
}
const fails = (src: string, opts: RenderOptions = {}) => {
  const p = parseMermaid(src)
  if (!p.ok) throw new Error(JSON.stringify(p.errors))
  const r = renderModel(p.ast, opts)
  if (r.ok) throw new Error('expected a render error')
  return r.error
}

interface Bbox { x0: number; y0: number; x1: number; y1: number }
function bbox(d: string): Bbox {
  const b: Bbox = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
  let cx = 0
  let cy = 0
  const add = (x: number, y: number) => {
    b.x0 = Math.min(b.x0, x)
    b.y0 = Math.min(b.y0, y)
    b.x1 = Math.max(b.x1, x)
    b.y1 = Math.max(b.y1, y)
  }
  for (const m of d.matchAll(/([MLHVCQAZ])([^MLHVCQAZ]*)/g)) {
    const n = (m[2]!.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
    switch (m[1]) {
      case 'M': case 'L': cx = n[0]!; cy = n[1]!; add(cx, cy); break
      case 'H': cx = n[0]!; add(cx, cy); break
      case 'V': cy = n[0]!; add(cx, cy); break
      case 'A': cx = n[5]!; cy = n[6]!; add(cx, cy); break
      case 'C': case 'Q': for (let i = 0; i < n.length; i += 2) add(n[i]!, n[i + 1]!); cx = n[n.length - 2]!; cy = n[n.length - 1]!; break
    }
  }
  return b
}
const shapes = (m: RenderModel) => m.items.filter((i): i is RShape => i.kind === 'shape')
const paths = (m: RenderModel) => m.items.filter((i): i is RPath => i.kind === 'path')
const texts = (m: RenderModel) => m.items.filter((i): i is RText => i.kind === 'text')
const nodeBoxes = (m: RenderModel) => shapes(m).filter((s) => s.role === 'node' || s.role === 'note').map((s) => ({ s, b: bbox(s.d) }))
const box = (m: RenderModel, id: string) => bbox(shapes(m).find((s) => s.id === id)!.d)
const edge = (m: RenderModel, i: number) => paths(m).find((p) => p.id === `r${i}`)!
const inside = (p: { x: number; y: number }, b: Bbox, tol = 2) => p.x >= b.x0 - tol && p.x <= b.x1 + tol && p.y >= b.y0 - tol && p.y <= b.y1 + tol
const ends = (d: string) => {
  const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  return { start: { x: n[0]!, y: n[1]! }, end: { x: n[n.length - 2]!, y: n[n.length - 1]! } }
}

const ZOO = `classDiagram
  direction TB
  class Animal {
    <<abstract>>
    +String name
    -int age
    +speak()* String
    +count()$ int
  }
  class Dog {
    +fetch(Ball b) bool
  }
  class Cat
  class Walker {
    <<interface>>
    +walk()
  }
  class Box~T~ {
    +T value
  }
  namespace Shop {
    class Order {
      +id int
    }
    class OrderLine
  }
  Animal <|-- Dog : extends
  Animal <|-- Cat
  Dog ..|> Walker
  Dog --> Order : buys
  Order "1" *-- "1..*" OrderLine : lines
  Order o-- Box
  Cat ..> Box : uses
  Cat -- Dog
  note for Dog "good boy"
  note "free note"`

const check = (m: RenderModel) => {
  for (const it of m.items) {
    const strings = it.kind === 'text' ? it.lines : [it.d]
    for (const s of strings) expect(s).not.toMatch(/NaN|undefined|Infinity/)
    if (it.kind === 'text') {
      expect(it.x).toBeGreaterThanOrEqual(0)
      expect(it.x).toBeLessThanOrEqual(m.width)
      expect(it.y).toBeGreaterThanOrEqual(0)
      expect(it.y).toBeLessThanOrEqual(m.height)
      expect(it.size).toBeGreaterThanOrEqual(m.fontSize)
    } else {
      const b = bbox(it.d)
      expect(b.x0).toBeGreaterThanOrEqual(-0.5)
      expect(b.y0).toBeGreaterThanOrEqual(-0.5)
      expect(b.x1).toBeLessThanOrEqual(m.width + 0.5)
      expect(b.y1).toBeLessThanOrEqual(m.height + 0.5)
    }
  }
  const boxes = nodeBoxes(m)
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!.b
      const c = boxes[j]!.b
      const overlap = a.x0 < c.x1 - 0.5 && c.x0 < a.x1 - 0.5 && a.y0 < c.y1 - 0.5 && c.y0 < a.y1 - 0.5
      expect(overlap, `${boxes[i]!.s.id} overlaps ${boxes[j]!.s.id}`).toBe(false)
    }
  }
}

describe('class render: model', () => {
  it('draws a diagram that uses every feature without overlaps or bad numbers', () => {
    for (const direction of ['TB', 'BT', 'LR', 'RL'] as const) {
      const m = draw(ZOO, { direction })
      check(m)
      expect(m.type).toBe('class')
      expect(m.nodes).toBe(7)
      expect(m.edges).toBe(8)
    }
  })

  it('writes the summary', () => {
    expect(draw(ZOO).summary).toBe('Class diagram with 7 classes and 8 relationships, in 1 namespace, top to bottom')
    expect(draw('classDiagram\nclass A').summary).toBe('Class diagram with 1 class and 0 relationships, top to bottom')
    expect(draw('classDiagram\nA --> B', { direction: 'LR' }).summary).toBe('Class diagram with 2 classes and 1 relationship, left to right')
  })

  it('draws a class as a header, hairlines and compartments', () => {
    const m = draw('classDiagram\nclass A {\n  <<interface>>\n  +x int\n  -y\n  +run() void\n}')
    const b = box(m, 'A')
    const rules = paths(m).filter((p) => p.role === 'class-divider')
    expect(rules).toHaveLength(2)
    expect(rules.every((r) => r.faint)).toBe(true)
    for (const r of rules) {
      const rb = bbox(r.d)
      expect(rb.x0).toBeCloseTo(b.x0, 1)
      expect(rb.x1).toBeCloseTo(b.x1, 1)
    }
    const ann = texts(m).find((t) => t.role === 'class-annotation')!
    const name = texts(m).find((t) => t.role === 'node-label')!
    const attrs = texts(m).filter((t) => t.role === 'class-attribute')
    const methods = texts(m).filter((t) => t.role === 'class-method')
    expect(ann.lines).toEqual(['<<interface>>'])
    expect(ann.muted).toBe(true)
    expect(name.bold).toBe(true)
    expect(name.anchor).toBe('middle')
    expect(attrs.map((t) => t.lines[0])).toEqual(['+x int', '-y'])
    expect(methods.map((t) => t.lines[0])).toEqual(['+run() void'])
    const ys = [ann.y, name.y, bbox(rules[0]!.d).y0, attrs[0]!.y, attrs[1]!.y, bbox(rules[1]!.d).y0, methods[0]!.y]
    expect(ys).toEqual([...ys].sort((a, c) => a - c))
    expect(new Set(ys).size).toBe(ys.length)
    for (const t of [...attrs, ...methods]) {
      expect(t.anchor).toBe('start')
      expect(t.x).toBeGreaterThan(b.x0)
      expect(t.y).toBeGreaterThan(b.y0)
      expect(t.y).toBeLessThan(b.y1)
    }
  })

  it('collapses empty compartments', () => {
    const none = draw('classDiagram\nclass A')
    expect(paths(none).filter((p) => p.role === 'class-divider')).toHaveLength(0)
    const onlyMethods = draw('classDiagram\nclass A {\n  +run()\n}')
    expect(paths(onlyMethods).filter((p) => p.role === 'class-divider')).toHaveLength(1)
    const onlyAttrs = draw('classDiagram\nclass A {\n  +x\n}')
    expect(paths(onlyAttrs).filter((p) => p.role === 'class-divider')).toHaveLength(1)
    const h = (m: RenderModel) => box(m, 'A').y1 - box(m, 'A').y0
    expect(h(none)).toBeLessThan(h(onlyMethods))
    expect(h(onlyMethods)).toBeLessThan(h(draw('classDiagram\nclass A {\n  +x\n  +run()\n}')))
  })

  it('grows the box for long members instead of wrapping or truncating them', () => {
    const long = '+someVeryLongMethodName(String firstArgument, String secondArgument, Map~String, Integer~ third) Result'
    const m = draw(`classDiagram\nclass A {\n  ${long}\n  +x\n}`)
    const t = texts(m).find((x) => x.role === 'class-method')!
    expect(t.lines).toEqual([long.replace('~String, Integer~', '<String, Integer>')])
    const b = box(m, 'A')
    expect(b.x1 - b.x0).toBeGreaterThan(400)
    expect(t.title).toBeUndefined()
    const huge = draw(`classDiagram\nclass A {\n  +${'x'.repeat(2000)}\n}`)
    check(huge)
  })

  it('shows generics as Name<T> and uses a label when given', () => {
    const m = draw('classDiagram\nclass Box~T~\nclass Map~K, V~\nclass B["Pretty name"]')
    expect(texts(m).filter((t) => t.role === 'node-label').map((t) => t.lines[0]).sort()).toEqual(['Box<T>', 'Map<K, V>', 'Pretty name'])
  })

  it('draws abstract classes and members in italic and keeps the static dollar', () => {
    const m = draw('classDiagram\nclass Shape {\n  <<abstract>>\n  +area()* float\n  +make()$ Shape\n}')
    expect(texts(m).find((t) => t.role === 'node-label')!.italic).toBe(true)
    const [area, make] = texts(m).filter((t) => t.role === 'class-method')
    expect(area!.italic).toBe(true)
    expect(area!.lines[0]).toBe('+area() float')
    expect(make!.italic).toBeUndefined()
    expect(make!.lines[0]).toBe('+make()$ Shape')
    expect(texts(draw('classDiagram\nclass P {\n  +x()\n}')).find((t) => t.role === 'node-label')!.italic).toBeUndefined()
  })

  it('maps each relation to line style and markers at the right end', () => {
    const cases: [string, 'solid' | 'dashed', string | undefined, string | undefined][] = [
      ['<|--', 'solid', 'triangle', undefined],
      ['--|>', 'solid', undefined, 'triangle'],
      ['*--', 'solid', 'diamond-filled', undefined],
      ['--*', 'solid', undefined, 'diamond-filled'],
      ['o--', 'solid', 'diamond', undefined],
      ['--o', 'solid', undefined, 'diamond'],
      ['-->', 'solid', undefined, 'open'],
      ['<--', 'solid', 'open', undefined],
      ['--', 'solid', undefined, undefined],
      ['..>', 'dashed', undefined, 'open'],
      ['..|>', 'dashed', undefined, 'triangle'],
      ['<|..', 'dashed', 'triangle', undefined],
      ['..', 'dashed', undefined, undefined],
    ]
    for (const [op, style, start, end] of cases) {
      const m = draw(`classDiagram\nA ${op} B`)
      const p = edge(m, 0)
      expect(p.style, op).toBe(style)
      expect(p.markerStart, op).toBe(start)
      expect(p.markerEnd, op).toBe(end)
    }
  })

  it('puts the parent of an inheritance above the child and the marker at the parent', () => {
    const m = draw('classDiagram\nAnimal <|-- Dog')
    const a = box(m, 'Animal')
    const d = box(m, 'Dog')
    expect(a.y1).toBeLessThan(d.y0)
    const p = edge(m, 0)
    expect(p.markerStart).toBe('triangle')
    expect(inside(ends(p.d).start, a)).toBe(true)
    expect(inside(ends(p.d).end, d)).toBe(true)
  })

  it('connects every relation between its two classes', () => {
    const m = draw(ZOO)
    const rels: [number, string, string][] = [[0, 'Animal', 'Dog'], [1, 'Animal', 'Cat'], [2, 'Dog', 'Walker'], [3, 'Dog', 'Order'], [4, 'Order', 'OrderLine'], [5, 'Order', 'Box'], [6, 'Cat', 'Box'], [7, 'Cat', 'Dog']]
    for (const [i, a, b] of rels) {
      const p = edge(m, i)
      expect(inside(ends(p.d).start, box(m, a)), `start ${a}->${b}`).toBe(true)
      expect(inside(ends(p.d).end, box(m, b)), `end ${a}->${b}`).toBe(true)
    }
  })

  it('draws edge labels on plates and cardinalities beside both ends', () => {
    const m = draw('classDiagram\nCustomer "1" --> "0..*" Ticket : buys')
    expect(texts(m).some((t) => t.role === 'edge-label' && t.lines[0] === 'buys')).toBe(true)
    const cards = texts(m).filter((t) => t.role === 'cardinality')
    expect(cards.map((t) => t.lines[0])).toEqual(['1', '0..*'])
    const p = edge(m, 0)
    const { start, end } = ends(p.d)
    expect(Math.hypot(cards[0]!.x - start.x, cards[0]!.y - start.y)).toBeLessThan(45)
    expect(Math.hypot(cards[1]!.x - end.x, cards[1]!.y - end.y)).toBeLessThan(45)
    // not on top of the line itself
    expect(Math.abs(cards[0]!.x - start.x)).toBeGreaterThan(4)
    expect(cards.every((t) => t.size >= m.fontSize)).toBe(true)
    check(m)
  })

  it('keeps cardinalities inside the canvas in every direction and edge style', () => {
    for (const direction of ['TB', 'BT', 'LR', 'RL'] as const) {
      for (const edgeStyle of ['curved', 'straight', 'orthogonal'] as const) {
        check(draw('classDiagram\nA "1" --> "*" B : x\nB "many" <-- "1" C\nC "0..1" -- "n" A', { direction, edgeStyle }))
      }
    }
  })

  it('draws a self relation as a loop', () => {
    const m = draw('classDiagram\nNode --> Node : parent')
    check(m)
    expect(edge(m, 0).d).toContain('C')
  })

  it('draws namespaces as clusters around their classes', () => {
    const m = draw(ZOO)
    const cluster = shapes(m).find((s) => s.role === 'cluster')!
    expect(cluster.id).toBe('ns:Shop')
    const cb = bbox(cluster.d)
    for (const id of ['Order', 'OrderLine']) {
      const b = box(m, id)
      expect(b.x0).toBeGreaterThan(cb.x0)
      expect(b.x1).toBeLessThan(cb.x1)
      expect(b.y0).toBeGreaterThan(cb.y0)
      expect(b.y1).toBeLessThan(cb.y1)
    }
    expect(texts(m).find((t) => t.role === 'cluster-title')!.lines[0]).toBe('Shop')
    expect(inside({ x: 0, y: 0 }, cb, 0)).toBe(false)
    expect(box(m, 'Dog').x1 < cb.x0 || box(m, 'Dog').x0 > cb.x1 || box(m, 'Dog').y1 < cb.y0 || box(m, 'Dog').y0 > cb.y1).toBe(true)
  })

  it('draws notes as folded boxes, attached ones with a dotted connector', () => {
    const m = draw('classDiagram\nclass Dog\nnote for Dog "good boy\\nvery good"\nnote "free"')
    check(m)
    expect(shapes(m).filter((s) => s.role === 'note')).toHaveLength(2)
    expect(paths(m).filter((p) => p.role === 'note-fold')).toHaveLength(2)
    expect(paths(m).filter((p) => p.style === 'dotted')).toHaveLength(1)
    expect(texts(m).find((t) => t.role === 'note-text' && t.lines.includes('good boy'))!.lines).toEqual(['good boy', 'very good'])
  })

  it('keeps a note for a namespaced class inside the namespace', () => {
    const m = draw('classDiagram\nnamespace Shop {\n  class Order\n}\nnote for Order "paid in full"')
    check(m)
    const cb = bbox(shapes(m).find((s) => s.role === 'cluster')!.d)
    const note = bbox(shapes(m).find((s) => s.role === 'note')!.d)
    expect(note.x0).toBeGreaterThan(cb.x0)
    expect(note.x1).toBeLessThan(cb.x1)
  })

  it('maps classes to tone, dashed and thick and honours the tone option', () => {
    const m = draw('classDiagram\nclassDef bad stroke:#f00,stroke-width:3px\nclassDef soft stroke-dasharray:4\nclass A:::bad\nclass B:::soft\nclass C\ncssClass "C" success')
    expect(shapes(m).find((s) => s.id === 'A')!.paint).toMatchObject({ tone: 'danger', stroke: 'thick' })
    expect(shapes(m).find((s) => s.id === 'B')!.paint).toMatchObject({ dash: 'dashed', stroke: 'normal' })
    expect(shapes(m).find((s) => s.id === 'C')!.paint.tone).toBe('success')
    expect(shapes(draw('classDiagram\nclass A', { tone: 'warning' })).find((s) => s.id === 'A')!.paint.tone).toBe('warning')
  })

  it('follows the rounded prop for the box corners', () => {
    expect(shapes(draw('classDiagram\nclass A', { rounded: 'none' })).find((s) => s.id === 'A')!.d).not.toContain('A')
    expect(shapes(draw('classDiagram\nclass A', { rounded: 'full' })).find((s) => s.id === 'A')!.d).toContain('A8,8')
  })

  it('never emits colours, html or markup', () => {
    expect(JSON.stringify(draw(ZOO).items)).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|<svg|<div|style=/i)
  })

  it('does not draw the diagram title and passes it on', () => {
    const m = draw('---\ntitle: Orchard Mill orders\n---\nclassDiagram\nclass A')
    expect(m.title).toBe('Orchard Mill orders')
    expect(texts(m).some((t) => t.lines.join(' ').includes('Orchard'))).toBe(false)
  })

  it('is deterministic', () => {
    expect(draw(ZOO)).toEqual(draw(ZOO))
    expect(draw(ZOO, { direction: 'LR', edgeStyle: 'orthogonal' })).toEqual(draw(ZOO, { direction: 'LR', edgeStyle: 'orthogonal' }))
  })
})

describe('class render: options', () => {
  it('changes the layout with the direction option and the direction line', () => {
    const src = 'classDiagram\nA <|-- B\nB <|-- C\nC <|-- D'
    const tb = draw(src)
    const lr = draw(src, { direction: 'LR' })
    expect(tb.height).toBeGreaterThan(tb.width)
    expect(lr.width).toBeGreaterThan(lr.height)
    expect(draw('classDiagram\ndirection LR\nA <|-- B\nB <|-- C\nC <|-- D')).toEqual(lr)
    const bt = draw(src, { direction: 'BT' })
    expect(box(bt, 'A').y0).toBeGreaterThan(box(bt, 'D').y0)
    const rl = draw(src, { direction: 'RL' })
    expect(box(rl, 'A').x0).toBeGreaterThan(box(rl, 'D').x0)
  })

  it('changes the paths with the edge style', () => {
    const src = 'classDiagram\nA <|-- B\nA <|-- C\nB --> D\nC --> D\nA --> D'
    const get = (edgeStyle: 'curved' | 'straight' | 'orthogonal') => paths(draw(src, { edgeStyle })).filter((p) => p.role === 'edge').map((p) => p.d)
    expect(get('curved')).not.toEqual(get('straight'))
    expect(get('curved')).not.toEqual(get('orthogonal'))
    expect(get('straight')).not.toEqual(get('orthogonal'))
    expect(get('straight').every((d) => !d.includes('C'))).toBe(true)
  })

  it('scales with size and density', () => {
    const src = 'classDiagram\nclass A {\n  +x\n}\nA --> B'
    expect(draw(src, { size: 'lg' }).fontSize).toBe(16)
    expect(draw(src, { size: 'sm' }).fontSize).toBe(12)
    expect(draw(src, { size: 'lg' }).width).toBeGreaterThan(draw(src).width)
    for (const size of ['sm', 'md', 'lg'] as const) check(draw(ZOO, { size, density: 'compact', rounded: 'full' }))
    check(draw(ZOO, { density: 'spacious' }))
  })
})

describe('class render: text alternative', () => {
  it('describes classes with annotations, members and namespaces in flow order', () => {
    const m = draw(ZOO)
    const classes = m.alt.sections.find((s) => s.title === 'Classes')!
    expect(classes.ordered).toBe(true)
    expect(classes.items[0]).toBe('Animal (abstract): attributes +String name, -int age; methods +speak() String (abstract), +count()$ int')
    expect(classes.items).toContain('Walker (interface): methods +walk()')
    expect(classes.items).toContain('Box<T>: attributes +T value')
    expect(classes.items).toContain('Cat')
    expect(classes.items).toContain('Order (in namespace Shop): attributes +id int')
    expect(classes.items.indexOf('Cat')).toBeGreaterThan(0)
    expect(classes.items.findIndex((i) => i.startsWith('Dog'))).toBeGreaterThan(0)
    expect(classes.items.findIndex((i) => i.startsWith('OrderLine'))).toBeGreaterThan(classes.items.findIndex((i) => i.startsWith('Order (')))
    expect(classes.items).toHaveLength(7)
  })

  it('describes every relation in words, in source order', () => {
    const m = draw(ZOO)
    expect(m.alt.sections.find((s) => s.title === 'Relationships')!.items).toEqual([
      'Dog inherits from Animal: extends',
      'Cat inherits from Animal',
      'Dog implements Walker',
      'Dog is associated with Order: buys',
      'Order is composed of OrderLine: lines (cardinality Order: 1, OrderLine: 1..*)',
      'Order aggregates Box<T>',
      'Cat depends on Box<T>: uses',
      'Cat is linked to Dog',
    ])
  })

  it('covers the reverse and dashed wordings', () => {
    const words = (op: string) => draw(`classDiagram\nA ${op} B : l`).alt.sections[1]!.items[0]
    expect(words('--|>')).toBe('A inherits from B: l')
    expect(words('<|--')).toBe('B inherits from A: l')
    expect(words('--*')).toBe('B is composed of A: l')
    expect(words('o--')).toBe('A aggregates B: l')
    expect(words('--o')).toBe('B aggregates A: l')
    expect(words('<--')).toBe('B is associated with A: l')
    expect(words('<|..')).toBe('B implements A: l')
    expect(words('<..')).toBe('B depends on A: l')
    expect(words('..')).toBe('A has a dashed link to B: l')
    expect(words('--')).toBe('A is linked to B: l')
    expect(words('<|--|>')).toBe('A is linked to B: l')
    expect(draw('classDiagram\nA "1" -- B').alt.sections[1]!.items[0]).toBe('A is linked to B (cardinality A: 1)')
    expect(draw('classDiagram\nA -- "2" B').alt.sections[1]!.items[0]).toBe('A is linked to B (cardinality B: 2)')
  })

  it('lists notes', () => {
    const m = draw(ZOO)
    expect(m.alt.sections.find((s) => s.title === 'Notes')!.items).toEqual(['Note for Dog: good boy', 'Note: free note'])
    expect(draw('classDiagram\nclass A').alt.sections.map((s) => s.title)).toEqual(['Classes', 'Relationships'])
  })

  it('orders classes along the flow in every direction', () => {
    const src = 'classDiagram\nA <|-- B\nB <|-- C'
    for (const direction of ['TB', 'BT', 'LR', 'RL'] as const) {
      expect(draw(src, { direction }).alt.sections[0]!.items).toEqual(['A', 'B', 'C'])
    }
  })

  it('keeps hostile text as inert text', () => {
    const m = draw('classDiagram\nclass A {\n  +"><img src=x onerror=alert(1)>\n}\nA --> B : <script>alert(1)</script>\nnote for A "javascript:alert(1)"')
    expect(texts(m).flatMap((t) => t.lines).join('\n')).toContain('<img src=x onerror=alert(1)>')
    expect(JSON.stringify(m.items.filter((i) => i.kind !== 'text'))).not.toMatch(/script|onerror|javascript/)
  })
})

describe('class render: limits and empty', () => {
  it('reports an empty diagram', () => {
    expect(fails('classDiagram')).toMatchObject({ code: 'empty', message: 'This class diagram has no classes. Add one such as "class Animal" or "Animal <|-- Dog".' })
  })

  it('enforces maxNodes and maxEdges', () => {
    const src = 'classDiagram\nA --> B\nB --> C\nC --> A'
    expect(fails(src, { maxNodes: 2 })).toMatchObject({ code: 'limit' })
    expect(fails(src, { maxEdges: 2 })).toMatchObject({ code: 'limit' })
    expect(draw(src, { maxNodes: 3, maxEdges: 3 }).nodes).toBe(3)
  })

  it('draws a large diagram fast', () => {
    const lines = ['classDiagram']
    for (let i = 0; i < 40; i++) lines.push(`class C${i} {`, '  +String name', '  +run() void', '}', `C${i} <|-- C${i + 1}`, `C${i} --> C${(i * 7) % 40} : uses`)
    const t0 = performance.now()
    const m = draw(lines.join('\n'))
    expect(performance.now() - t0).toBeLessThan(1500)
    check(m)
  })
})

// ---- cardinality placement ----
interface Rel { from: string; to: string; fromCard?: string; toCard?: string; label?: string }
const CARD_CASES: { name: string; src: string; rels: Rel[] }[] = [
  { name: 'short labelled edge with both cardinalities', src: 'classDiagram\nA "1" *-- "many" B : holds', rels: [{ from: 'A', to: 'B', fromCard: '1', toCard: 'many', label: 'holds' }] },
  { name: 'unlabelled edge with both cardinalities', src: 'classDiagram\nA "1" -- "*" B', rels: [{ from: 'A', to: 'B', fromCard: '1', toCard: '*' }] },
  { name: 'only the target cardinality', src: 'classDiagram\nA --> "0..1" B : x', rels: [{ from: 'A', to: 'B', toCard: '0..1', label: 'x' }] },
  { name: 'only the source cardinality', src: 'classDiagram\nA "0..*" <|-- B', rels: [{ from: 'A', to: 'B', fromCard: '0..*' }] },
  { name: 'dashed with a long label', src: 'classDiagram\nOrder "1" ..> "1..*" Line : is made of several billing lines', rels: [{ from: 'Order', to: 'Line', fromCard: '1', toCard: '1..*', label: 'is made of several billing lines' }] },
  { name: 'chain with a long edge', src: 'classDiagram\nA --> B\nB --> C\nA "1" o-- "many" C : spans', rels: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'A', to: 'C', fromCard: '1', toCard: 'many', label: 'spans' }] },
  {
    name: 'many relations on one class',
    src: 'classDiagram\nHub "1" --> "*" A : one\nHub "1" --> "0..1" B : two\nHub "1" --> "many" C\nD "*" --> "1" Hub : four\nE "n" --> "m" Hub\nHub "1" *-- "1..*" F : six',
    rels: [
      { from: 'Hub', to: 'A', fromCard: '1', toCard: '*', label: 'one' },
      { from: 'Hub', to: 'B', fromCard: '1', toCard: '0..1', label: 'two' },
      { from: 'Hub', to: 'C', fromCard: '1', toCard: 'many' },
      { from: 'D', to: 'Hub', fromCard: '*', toCard: '1', label: 'four' },
      { from: 'E', to: 'Hub', fromCard: 'n', toCard: 'm' },
      { from: 'Hub', to: 'F', fromCard: '1', toCard: '1..*', label: 'six' },
    ],
  },
  { name: 'self relation', src: 'classDiagram\nNode "1" --> "*" Node : children', rels: [{ from: 'Node', to: 'Node', fromCard: '1', toCard: '*', label: 'children' }] },
  { name: 'self relation without label', src: 'classDiagram\nNode "1" --> "*" Node', rels: [{ from: 'Node', to: 'Node', fromCard: '1', toCard: '*' }] },
  { name: 'cycle', src: 'classDiagram\nA "1" --> "2" B : ab\nB "3" --> "4" C : bc\nC "5" --> "6" A : ca', rels: [{ from: 'A', to: 'B', fromCard: '1', toCard: '2', label: 'ab' }, { from: 'B', to: 'C', fromCard: '3', toCard: '4', label: 'bc' }, { from: 'C', to: 'A', fromCard: '5', toCard: '6', label: 'ca' }] },
  { name: 'entities in a cardinality', src: 'classDiagram\nA "#quot;x#quot;" -- "a b" B : l', rels: [{ from: 'A', to: 'B', fromCard: '"x"', toCard: 'a b', label: 'l' }] },
]

const cardRects = (m: RenderModel) =>
  texts(m)
    .filter((t) => t.role === 'cardinality')
    .map((t) => {
      const w = measureText(t.lines[0]!, t.size)
      const h = Math.round(t.size * 1.2)
      return { t, x0: t.x - w / 2, x1: t.x + w / 2, y0: t.y - h / 2, y1: t.y + h / 2 }
    })
const hit = (a: Bbox, b: Bbox, tol = 0.5) => a.x0 < b.x1 - tol && b.x0 < a.x1 - tol && a.y0 < b.y1 - tol && b.y0 < a.y1 - tol
const distToBox = (p: { x: number; y: number }, b: Bbox) => Math.hypot(Math.max(b.x0 - p.x, 0, p.x - b.x1), Math.max(b.y0 - p.y, 0, p.y - b.y1))

describe('class render: cardinality placement', () => {
  const checkCards = (label: string, src: string, rels: Rel[], opts: RenderOptions = {}) => {
    const m = draw(src, opts)
    check(m)
    const cards = cardRects(m)
    const expected = rels.flatMap((r) => [r.fromCard && { rel: r, end: 'from' as const, text: r.fromCard }, r.toCard && { rel: r, end: 'to' as const, text: r.toCard }]).filter(Boolean) as { rel: Rel; end: 'from' | 'to'; text: string }[]
    expect(cards.map((c) => c.t.lines[0]), label).toEqual(expected.map((e) => e.text))
    const plates = shapes(m).filter((s) => s.role === 'edge-label-plate').map((s) => bbox(s.d))
    const boxes = nodeBoxes(m)
    cards.forEach((c, i) => {
      const tag = `${label} #${i} "${c.t.lines[0]}"`
      expect(c.x0, tag).toBeGreaterThanOrEqual(0)
      expect(c.y0, tag).toBeGreaterThanOrEqual(0)
      expect(c.x1, tag).toBeLessThanOrEqual(m.width)
      expect(c.y1, tag).toBeLessThanOrEqual(m.height)
      for (const p of plates) expect(hit(c, p), `${tag} overlaps a label plate`).toBe(false)
      for (const n of boxes) expect(hit(c, n.b), `${tag} overlaps node ${n.s.id}`).toBe(false)
      for (let j = i + 1; j < cards.length; j++) expect(hit(c, cards[j]!), `${tag} overlaps #${j}`).toBe(false)
      const { rel, end } = expected[i]!
      const own = box(m, end === 'from' ? rel.from : rel.to)
      const other = box(m, end === 'from' ? rel.to : rel.from)
      if (rel.from !== rel.to) expect(distToBox(c.t, own), `${tag} is nearer its own node`).toBeLessThanOrEqual(distToBox(c.t, other))
    })
    return m
  }

  for (const c of CARD_CASES) {
    it(`keeps cardinalities clear and near their node: ${c.name}`, () => {
      for (const direction of ['TB', 'BT', 'LR', 'RL'] as const) {
        for (const edgeStyle of ['curved', 'straight', 'orthogonal'] as const) {
          checkCards(`${c.name} ${direction} ${edgeStyle}`, c.src, c.rels, { direction, edgeStyle })
        }
      }
    })
  }

  it('is deterministic', () => {
    for (const c of CARD_CASES) expect(draw(c.src, { direction: 'LR' })).toEqual(draw(c.src, { direction: 'LR' }))
  })

  it('reads the direction from the source', () => {
    checkCards('lr source', 'classDiagram\ndirection LR\nA "1" *-- "many" B : holds', [{ from: 'A', to: 'B', fromCard: '1', toCard: 'many', label: 'holds' }])
  })

  it('leaves more room on a decorated edge than on a bare one', () => {
    const gap = (src: string) => {
      const m = draw(src)
      return box(m, 'B').y0 - box(m, 'A').y1
    }
    const bare = gap('classDiagram\nA *-- B')
    const full = gap('classDiagram\nA "1" *-- "many" B : holds')
    expect(full).toBeGreaterThan(bare)
    // label plate + two cardinalities + marker + padding fit between the boxes
    expect(full).toBeGreaterThanOrEqual(17 + 2 * 17 + 11)
    expect(gap('classDiagram\nA "1" *-- B')).toBeGreaterThan(bare)
  })

  it('keeps cardinalities on a diagram whose box sizes differ and sit in a namespace', () => {
    const src = 'classDiagram\nnamespace Core {\n  class A {\n    +int a\n    +run() void\n  }\n  class B\n}\nclass C\nA "1" --> "*" B : in\nB "0..1" --> "1" C : out\nnote for A "n"\nC "*" --> "*" A'
    for (const direction of ['TB', 'LR'] as const) {
      const m = draw(src, { direction })
      check(m)
      const cards = cardRects(m)
      expect(cards).toHaveLength(6)
      const boxes = nodeBoxes(m)
      for (const c of cards) for (const n of boxes) expect(hit(c, n.b)).toBe(false)
    }
  })

  it('still places a cardinality when the canvas is tiny and everything is crowded', () => {
    const rels = Array.from({ length: 14 }, (_, i) => `Hub "${i}..*" -- "${i}" L${i} : r${i}`)
    const m = draw(['classDiagram', ...rels].join('\n'), { size: 'lg', density: 'compact' } as RenderOptions)
    check(m)
    expect(cardRects(m)).toHaveLength(28)
  })
})
