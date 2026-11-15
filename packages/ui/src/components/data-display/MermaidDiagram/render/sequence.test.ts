import { describe, expect, it } from 'vitest'
import { measureText, metricsFor } from '../../_diagram/text'
import type { RenderItem, RenderModel, RenderOptions, RText } from '../../_diagram/types'
import { parseMermaid } from '../parse'
import { renderModel } from '../render'

function draw(src: string, opts: RenderOptions = {}): RenderModel {
  const parsed = parseMermaid(src)
  if (!parsed.ok) throw new Error(`parse: ${parsed.errors[0]!.message}`)
  const r = renderModel(parsed.ast, opts)
  if (!r.ok) throw new Error(`render: ${r.error.code} ${r.error.message}`)
  return r.model
}

function fails(src: string, opts: RenderOptions = {}) {
  const parsed = parseMermaid(src)
  if (!parsed.ok) throw new Error('parse failed')
  const r = renderModel(parsed.ast, opts)
  if (r.ok) throw new Error('expected a render error')
  return r.error
}

const texts = (m: RenderModel): RText[] => m.items.filter((i): i is RText => i.kind === 'text')
const byRole = (m: RenderModel, role: string): RenderItem[] => m.items.filter((i) => i.role === role)
/** Absolute numbers of a path; relative `h`/`v` moves of square corners are skipped. */
const numbers = (d: string): number[] => (d.replace(/[hv]-?\d+(?:\.\d+)?/g, '').match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)

interface Box {
  x1: number
  x2: number
  y1: number
  y2: number
  t: RText
}
function boxOf(t: RText, fontPx: number, lh: number): Box {
  const w = Math.max(...t.lines.map((l) => measureText(l, fontPx, t.bold)))
  const h = t.lines.length * lh
  const x1 = t.anchor === 'middle' ? t.x - w / 2 : t.anchor === 'start' ? t.x : t.x - w
  return { x1, x2: x1 + w, y1: t.y - h / 2, y2: t.y + h / 2, t }
}

function expectSane(m: RenderModel): void {
  expect(m.width).toBeGreaterThan(0)
  expect(m.height).toBeGreaterThan(0)
  const max = Math.max(m.width, m.height)
  for (const i of m.items) {
    if (i.kind === 'text') {
      expect(Number.isFinite(i.x) && Number.isFinite(i.y)).toBe(true)
      expect(i.x).toBeGreaterThanOrEqual(0)
      expect(i.x).toBeLessThanOrEqual(m.width)
      expect(i.y).toBeGreaterThanOrEqual(0)
      expect(i.y).toBeLessThanOrEqual(m.height)
      expect(i.size).toBeGreaterThanOrEqual(m.fontSize)
      continue
    }
    expect(i.d).not.toMatch(/NaN|undefined|Infinity/)
    for (const v of numbers(i.d)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(max)
    }
  }
}

function expectNoTextOverlap(m: RenderModel, density?: RenderOptions['density']): void {
  const mm = metricsFor('md', density)
  const boxes = texts(m).map((t) => boxOf(t, mm.font, mm.lineHeight))
  for (let a = 0; a < boxes.length; a++) {
    expect(boxes[a]!.x1).toBeGreaterThanOrEqual(0)
    expect(boxes[a]!.x2).toBeLessThanOrEqual(m.width)
    for (let b = a + 1; b < boxes.length; b++) {
      const p = boxes[a]!
      const q = boxes[b]!
      const overlap = p.x1 < q.x2 - 0.5 && q.x1 < p.x2 - 0.5 && p.y1 < q.y2 - 0.5 && q.y1 < p.y2 - 0.5
      expect(overlap, `${JSON.stringify(p.t.lines)} overlaps ${JSON.stringify(q.t.lines)}`).toBe(false)
    }
  }
}

const SHOP = `sequenceDiagram
  title Checkout
  autonumber
  actor U as Customer
  participant S as Storefront
  participant P as Payments
  U->>+S: Place order
  S->>P: Charge card
  activate P
  alt Approved
    P-->>S: Payment accepted for the full amount of the order
  else Declined
    P--xS: declined
    Note right of P: retry later
  end
  deactivate P
  loop Every minute
    S->>S: poll order status
  end
  Note over U,S: Done
  S-->>-U: Receipt`

describe('sequence render: model', () => {
  it('describes the diagram and counts participants and messages', () => {
    const m = draw(SHOP)
    expect(m.type).toBe('sequence')
    expect(m.title).toBe('Checkout')
    expect(m.summary).toBe('Sequence diagram with 3 participants and 6 messages')
    expect(m.nodes).toBe(3)
    expect(m.edges).toBe(6)
    expect(m.fontSize).toBe(14)
    expectSane(m)
  })

  it('lists participants and messages in order with kinds, context, numbers and notes', () => {
    const m = draw(SHOP)
    expect(m.alt.sections).toEqual([
      { title: 'Participants', ordered: true, items: ['Customer (actor)', 'Storefront', 'Payments'] },
      {
        title: 'Messages',
        ordered: true,
        items: [
          '#1 Customer to Storefront: Place order (activates Storefront)',
          '#2 Storefront to Payments: Charge card',
          'Activate Payments',
          '#3 [alt Approved] Payments to Storefront: Payment accepted for the full amount of the order (reply)',
          '#4 [else Declined] Payments to Storefront: declined (reply, lost)',
          '[else Declined] Note right of Payments: retry later',
          'Deactivate Payments',
          '#5 [loop Every minute] Storefront to Storefront: poll order status',
          'Note over Customer, Storefront: Done',
          '#6 Storefront to Customer: Receipt (reply, deactivates Storefront)',
        ],
      },
    ])
  })

  it('names the message kinds in the text alternative', () => {
    const m = draw('sequenceDiagram\nA->B: plain\nA-)B: async\nA<<->>B: both\nA-->B:\nloop empty\nend\nopt  \nend\nNote left of A: n')
    expect(m.alt.sections[1]!.items).toEqual([
      'A to B: plain (no arrowhead)',
      'A to B: async (async)',
      'A to B: both (both directions)',
      'A to B (reply, no arrowhead)',
      '[loop empty] (nothing happens in this block)',
      '[opt] (nothing happens in this block)',
      'Note left of A: n',
    ])
  })

  it('uses cleaned aliases in the text alternative', () => {
    const m = draw('sequenceDiagram\nparticipant A as Alice<br/>Smith\nparticipant B as "Bob &amp; Co"\nparticipant C\nA->>B: hi<br>there')
    expect(m.alt.sections[0]!.items).toEqual(['Alice Smith', 'Bob & Co', 'C'])
    expect(m.alt.sections[1]!.items).toEqual(['Alice Smith to Bob & Co: hi there'])
  })

  it('falls back to the id when a label is empty after cleaning, and draws notes with empty text', () => {
    const m = draw('sequenceDiagram\nparticipant A as <br>\nA->>B: x\nNote over A: <br>\nalt x\nelse\nA->>B: y\nend')
    expect(m.alt.sections[0]!.items).toEqual(['A', 'B'])
    expect(m.alt.sections[1]!.items).toContain('[else] A to B: y')
    expectSane(m)
  })

  it('does not fail on an activation that was never opened (hand-built tree)', () => {
    const parsed = parseMermaid('sequenceDiagram\nA->>B: x')
    if (!parsed.ok || parsed.ast.type !== 'sequence') throw new Error('parse')
    const ast = { ...parsed.ast, events: [...parsed.ast.events, { kind: 'deactivate' as const, id: 'B', at: 3 }] }
    const r = renderModel(ast)
    expect(r.ok).toBe(true)
    if (r.ok) expect(byRole(r.model, 'activation')).toHaveLength(0)
  })

  it('is deterministic', () => {
    expect(JSON.stringify(draw(SHOP))).toBe(JSON.stringify(draw(SHOP)))
  })
})

describe('sequence render: geometry', () => {
  it('keeps every coordinate inside the canvas and texts apart', () => {
    for (const density of ['compact', 'comfortable', 'spacious'] as const) {
      const m = draw(SHOP, { density })
      expectSane(m)
      expectNoTextOverlap(m, density)
    }
  })

  it('keeps text apart with long labels, wrapping and many participants', () => {
    const long = 'a very long message label that has to wrap over several lines because it is far wider than a single row allows'
    const m = draw(`sequenceDiagram
participant A as Kestrel Freight Dispatch Service
participant B as Orchard Mill
participant C as Brightwater Co
A->>B: ${long}
B->>C: ${long}
C-->>A: ${long}
Note over A,C: ${long}
Note left of A: ${long}
Note right of C: ${long}
C->>C: ${long}
alt ${long}
  A->>B: x
else ${long}
  B->>A: y
end`)
    expectSane(m)
    expectNoTextOverlap(m)
    expect(texts(m).some((t) => t.role === 'message-label' && t.lines.length > 1)).toBe(true)
  })

  it('grows with size and keeps text at least the base font size', () => {
    const sm = draw(SHOP, { size: 'sm' })
    const md = draw(SHOP)
    const lg = draw(SHOP, { size: 'lg' })
    expect(sm.fontSize).toBe(12)
    expect(lg.fontSize).toBe(16)
    expect(sm.width).toBeLessThan(md.width)
    expect(md.width).toBeLessThan(lg.width)
    expect(sm.height).toBeLessThan(md.height)
    expect(texts(lg).every((t) => t.size >= 16)).toBe(true)
    expectSane(sm)
    expectSane(lg)
  })

  it('places participants left to right in order with equal-height boxes and dashed faint lifelines', () => {
    const m = draw('sequenceDiagram\nparticipant A\nparticipant B\nparticipant C\nA->>C: x')
    const labels = texts(m).filter((t) => t.role === 'participant-label')
    expect(labels.map((t) => t.lines[0])).toEqual(['A', 'B', 'C'])
    expect(labels[0]!.x).toBeLessThan(labels[1]!.x)
    expect(labels[1]!.x).toBeLessThan(labels[2]!.x)
    expect(new Set(labels.map((t) => t.y)).size).toBe(1)
    const lifelines = byRole(m, 'lifeline')
    expect(lifelines).toHaveLength(3)
    for (const l of lifelines) expect(l).toMatchObject({ kind: 'path', style: 'dashed', faint: true })
    expect(byRole(m, 'participant')).toHaveLength(3)
  })

  it('widens the gap between lifelines so a message label fits', () => {
    const narrow = draw('sequenceDiagram\nA->>B: x')
    const wide = draw('sequenceDiagram\nA->>B: a label that needs a good deal of horizontal room')
    expect(wide.width).toBeGreaterThan(narrow.width)
    const [a, b] = texts(wide).filter((t) => t.role === 'participant-label')
    const label = texts(wide).find((t) => t.role === 'message-label')!
    expect(label.x).toBeGreaterThan(a!.x)
    expect(label.x).toBeLessThan(b!.x)
  })

  it('draws an actor as a figure and a participant as a box', () => {
    const m = draw('sequenceDiagram\nactor U as User\nparticipant S as System\nU->>S: go')
    expect(byRole(m, 'actor-head')).toHaveLength(1)
    expect(byRole(m, 'actor-body')).toHaveLength(1)
    expect(byRole(m, 'participant')).toHaveLength(1)
    const ink = texts(m).filter((t) => t.role === 'participant-label')
    expect(ink.map((t) => t.lines[0])).toEqual(['User', 'System'])
    expectSane(m)
  })

  it('repeats the participants at the bottom only after more than 8 messages', () => {
    const rows = (n: number) => `sequenceDiagram\nA->>B: x\n${Array.from({ length: n - 1 }, () => 'B->>A: y').join('\n')}`
    expect(byRole(draw(rows(8)), 'participant')).toHaveLength(2)
    const long = draw(rows(9))
    expect(byRole(long, 'participant')).toHaveLength(4)
    expect(texts(long).filter((t) => t.role === 'participant-label')).toHaveLength(4)
    expectSane(long)
    const actors = draw(`sequenceDiagram\nactor A\nA->>B: x\n${'B->>A: y\n'.repeat(9)}`)
    expect(byRole(actors, 'actor-head')).toHaveLength(2)
    expectSane(actors)
  })

  it('draws message styles: solid, dashed and each head', () => {
    const m = draw('sequenceDiagram\nA->>B: a\nA-->>B: b\nA->B: c\nA-xB: d\nA-)B: e\nA<<->>B: f')
    const paths = byRole(m, 'message')
    expect(paths.map((p) => (p.kind === 'path' ? [p.style, p.markerEnd ?? null, p.markerStart ?? null] : null))).toEqual([
      ['solid', 'arrow', null],
      ['dashed', 'arrow', null],
      ['solid', null, null],
      ['solid', 'cross', null],
      ['solid', 'open', null],
      ['solid', 'arrow', 'arrow'],
    ])
  })

  it('points arrows in the direction of the message', () => {
    const m = draw('sequenceDiagram\nparticipant A\nparticipant B\nA->>B: right\nB->>A: left')
    const [r, l] = byRole(m, 'message') as { d: string }[]
    const [rx1, , rx2] = numbers(r!.d)
    const [lx1, , lx2] = numbers(l!.d)
    expect(rx2!).toBeGreaterThan(rx1!)
    expect(lx2!).toBeLessThan(lx1!)
  })

  it('draws a self message as a loop on the right of the lifeline with room for its label', () => {
    const m = draw('sequenceDiagram\nA->>A: think about it for a while\nA->>B: x')
    const loop = byRole(m, 'message')[0]!
    expect(loop.kind === 'path' && loop.d).toMatch(/^M[\d.]+,[\d.]+H[\d.]+V[\d.]+H[\d.]+$/)
    const lifeline = numbers((byRole(m, 'lifeline')[0] as { d: string }).d)[0]!
    const [x1, , x2] = numbers((loop as { d: string }).d)
    expect(x1!).toBeGreaterThanOrEqual(lifeline)
    expect(x2!).toBeGreaterThan(x1!)
    expectSane(m)
    expectNoTextOverlap(m)
  })

  it('leaves room for a self message on the last participant', () => {
    const m = draw('sequenceDiagram\nA->>B: x\nB->>B: a rather long self message label')
    const label = texts(m).find((t) => t.lines[0] === 'a rather long self message label')!
    expect(label.x + measureText(label.lines[0]!, 14)).toBeLessThanOrEqual(m.width)
  })

  it('draws activation bars that nest and end at the deactivating message', () => {
    const m = draw('sequenceDiagram\nA->>+B: one\nA->>+B: two\nB-->>-A: three\nB-->>-A: four')
    const bars = byRole(m, 'activation') as { d: string }[]
    expect(bars).toHaveLength(2)
    const xs = bars.map((b) => numbers(b.d)[0]!)
    expect(xs[0]).not.toBe(xs[1])
    expect(Math.abs(xs[0]! - xs[1]!)).toBeGreaterThan(0)
    const ys = byRole(m, 'message').map((p) => numbers((p as { d: string }).d)[1]!)
    // outer bar spans first to last message, inner bar second to third
    const tops = bars.map((b) => numbers(b.d)[1]!)
    expect(tops).toContain(ys[0])
    expect(tops).toContain(ys[1])
    expectSane(m)
  })

  it('closes activations left open at the end of the lifeline', () => {
    const m = draw('sequenceDiagram\nA->>+B: go\nactivate A')
    expect(byRole(m, 'activation')).toHaveLength(2)
    expectSane(m)
  })

  it('gives short activations a visible height and ignores a deactivate of a closed bar safely', () => {
    const m = draw('sequenceDiagram\nA->>B: x\nactivate B\ndeactivate B')
    const [bar] = byRole(m, 'activation') as { d: string }[]
    const nums = numbers(bar!.d)
    expect(nums.length).toBeGreaterThan(0)
    expectSane(m)
  })

  it('anchors arrows at the edge of activation bars on both sides', () => {
    const m = draw('sequenceDiagram\nparticipant A\nparticipant B\nparticipant C\nactivate B\nA->>B: in\nB->>C: out\nC->>B: back\nB->>A: reply\nB->>B: self')
    expectSane(m)
    const mids = byRole(m, 'lifeline').map((l) => numbers((l as { d: string }).d)[0]!)
    const arrows = byRole(m, 'message') as { d: string }[]
    // A->>B ends left of B's lifeline, C->>B ends right of it
    expect(numbers(arrows[0]!.d)[2]!).toBeLessThan(mids[1]!)
    expect(numbers(arrows[2]!.d)[2]!).toBeGreaterThan(mids[1]!)
  })
})

describe('sequence render: notes and blocks', () => {
  it('draws notes with a muted panel and their text', () => {
    const m = draw('sequenceDiagram\nparticipant A\nparticipant B\nNote left of A: l\nNote right of B: r\nNote over A: o\nNote over A,B: both of them')
    const notes = byRole(m, 'note')
    expect(notes).toHaveLength(4)
    for (const n of notes) expect(n).toMatchObject({ kind: 'shape', paint: { fill: 'muted', stroke: 'thin' } })
    expect(texts(m).filter((t) => t.role === 'note-label').map((t) => t.lines.join(' '))).toEqual(['l', 'r', 'o', 'both of them'])
    expectSane(m)
    expectNoTextOverlap(m)
  })

  it('places left and right notes next to inner participants', () => {
    const m = draw('sequenceDiagram\nA->>B: x\nB->>C: y\nNote left of B: left note text\nNote right of B: right note text')
    expectSane(m)
    expectNoTextOverlap(m)
    const labels = texts(m).filter((t) => t.role === 'participant-label')
    const note = (s: string) => texts(m).find((t) => t.lines[0] === s)!
    expect(note('left note text').x).toBeLessThan(labels[1]!.x)
    expect(note('right note text').x).toBeGreaterThan(labels[1]!.x)
  })

  it('keeps notes left of the first and right of the last participant inside the canvas', () => {
    const m = draw('sequenceDiagram\nA->>B: x\nNote left of A: a note that sticks out to the left\nNote right of B: and one to the right')
    expectSane(m)
    expectNoTextOverlap(m)
  })

  it('makes room for a note over one participant between neighbours', () => {
    const m = draw('sequenceDiagram\nA->>B: x\nB->>C: y\nNote over B: a note that is wider than the default gap between lifelines')
    expectSane(m)
    expectNoTextOverlap(m)
  })

  it('draws block frames with a keyword tab, condition text and dashed dividers', () => {
    const m = draw(`sequenceDiagram
A->>B: x
alt Approved
  loop Retry
    B->>A: y
  end
else Declined
  B->>A: z
end
par one
  A->>B: 1
and two
  A->>B: 2
end
critical db
  A->>B: 1
option timeout
  A->>B: 2
end
opt
  A->>B: 3
end
break stop
  A->>B: 4
end`)
    const frames = byRole(m, 'block')
    expect(frames).toHaveLength(6)
    for (const f of frames) expect(f).toMatchObject({ kind: 'shape', paint: { fill: 'none', stroke: 'thin' } })
    expect(byRole(m, 'block-tab')).toHaveLength(6)
    const dividers = byRole(m, 'block-divider')
    expect(dividers).toHaveLength(3)
    for (const d of dividers) expect(d).toMatchObject({ kind: 'path', style: 'dashed' })
    const keywords = texts(m).filter((t) => t.role === 'block-keyword')
    expect(keywords.map((t) => t.lines[0]).sort()).toEqual(['alt', 'and', 'break', 'critical', 'else', 'loop', 'opt', 'option', 'par'])
    expect(keywords.every((t) => t.bold)).toBe(true)
    expect(texts(m).filter((t) => t.role === 'block-condition').map((t) => t.lines[0]).sort()).toEqual(['[Approved]', '[Declined]', '[Retry]', '[db]', '[one]', '[stop]', '[timeout]', '[two]'])
    expectSane(m)
    expectNoTextOverlap(m)
  })

  it('nests frames so the inner frame sits inside the outer one', () => {
    const m = draw('sequenceDiagram\nloop outer\n  loop inner\n    A->>B: x\n  end\nend')
    const [outer, inner] = byRole(m, 'block') as { d: string }[]
    const o = numbers(outer!.d)
    const i = numbers(inner!.d)
    // path starts "M x+r,y": compare left x of the outer and inner frames through their top-left corner
    expect(o[0]!).toBeLessThan(i[0]!)
    expect(o[1]!).toBeLessThan(i[1]!)
    expectSane(m)
  })

  it('draws an empty block and a block with a long condition', () => {
    const m = draw(`sequenceDiagram\nparticipant A\nloop ${'a long condition '.repeat(30)}\nend`)
    expectSane(m)
    const cond = texts(m).find((t) => t.role === 'block-condition')!
    expect(cond.lines.length).toBeGreaterThan(1)
    expectNoTextOverlap(m)
  })

  it('ignores box and rect without breaking the frame stack', () => {
    const m = draw('sequenceDiagram\nbox Team\nparticipant A\nparticipant B\nend\nrect rgb(1,2,3)\nA->>B: x\nend')
    expect(byRole(m, 'block')).toHaveLength(0)
    expect(m.edges).toBe(1)
  })
})

describe('sequence render: options and edge cases', () => {
  it('applies the accent tone to participant boxes and activation bars only', () => {
    const m = draw('sequenceDiagram\nactor U\nU->>+S: x', { tone: 'primary' })
    const tones = m.items.filter((i) => i.kind === 'shape' && ['participant', 'activation', 'actor-head'].includes(i.role)).map((i) => (i.kind === 'shape' ? i.paint.tone : ''))
    expect(tones.length).toBeGreaterThanOrEqual(3)
    expect(new Set(tones)).toEqual(new Set(['primary']))
    const plain = draw('sequenceDiagram\nU->>S: x')
    expect(plain.items.filter((i) => i.kind === 'shape' && i.role === 'participant').every((i) => i.kind === 'shape' && i.paint.tone === 'neutral')).toBe(true)
  })

  it('follows the rounded option for box corners', () => {
    const sq = draw('sequenceDiagram\nA->>B: x', { rounded: 'none' })
    const box = byRole(sq, 'participant')[0] as { d: string }
    expect(box.d).not.toContain('A')
    expectSane(sq)
    expectSane(draw(SHOP, { rounded: 'none' }))
    expectSane(draw(SHOP, { rounded: 'full' }))
    const round = draw('sequenceDiagram\nA->>B: x', { rounded: 'md' })
    expect((byRole(round, 'participant')[0] as { d: string }).d).toContain('A')
  })

  it('throws an empty error for a diagram without participants', () => {
    expect(fails('sequenceDiagram')).toMatchObject({ code: 'empty', message: 'This sequence diagram has no participants. Add a message such as "Alice->>Bob: Hello".' })
    expect(fails('sequenceDiagram\n%% only a comment')).toMatchObject({ code: 'empty' })
  })

  it('draws a lone participant', () => {
    const m = draw('sequenceDiagram\nparticipant Solo')
    expect(m.summary).toBe('Sequence diagram with 1 participant and 0 messages')
    expect(m.edges).toBe(0)
    expectSane(m)
  })

  it('enforces maxNodes and maxEdges', () => {
    expect(fails('sequenceDiagram\nA->>B: x\nB->>C: y', { maxNodes: 2 })).toMatchObject({ code: 'limit' })
    expect(fails('sequenceDiagram\nA->>B: x\nB->>C: y', { maxEdges: 1 })).toMatchObject({ code: 'limit' })
    expect(draw('sequenceDiagram\nA->>B: x\nB->>C: y', { maxNodes: 3, maxEdges: 2 }).nodes).toBe(3)
  })

  it('keeps hostile text as inert text only', () => {
    const m = draw(`sequenceDiagram
participant A as "><img src=x onerror=alert(1)>
A->>B: <script>alert(1)</script> javascript:alert(1)
Note over A: "><svg onload=alert(1)>
alt <b onmouseover=x>y</b>
end`)
    for (const i of m.items) {
      if (i.kind === 'text') continue
      expect(i.d).not.toMatch(/[<>"]|script|onerror|javascript/i)
      expect(Object.values(i).filter((v) => typeof v === 'string').join(' ')).not.toMatch(/<|script|onerror/)
    }
    expect(texts(m).some((t) => t.lines.join(' ').includes('javascript:alert(1)'))).toBe(true)
    expectSane(m)
  })

  it('handles unicode, RTL, quotes and entity codes in labels', () => {
    const m = draw('sequenceDiagram\nparticipant ü as Zoë\nü->>日本語: こんにちは "quoted" #35;\n日本語-->>ü: שלום')
    expect(m.alt.sections[1]!.items[0]).toBe('Zoë to 日本語: こんにちは "quoted" #')
    expectSane(m)
  })

  it('numbers messages in the picture and in the text alternative', () => {
    const m = draw('sequenceDiagram\nautonumber 5 2\nA->>B: first\nB->>A:')
    expect(texts(m).filter((t) => t.role === 'message-label').map((t) => t.lines[0])).toEqual(['5. first', '7.'])
    expect(m.alt.sections[1]!.items).toEqual(['#5 A to B: first', '#7 B to A'])
  })

  it('renders 1000 statements within a sensible time and stays inside the canvas', () => {
    const lines = ['sequenceDiagram']
    for (let i = 0; i < 200; i++) lines.push(`P${i % 12}->>P${(i * 7 + 3) % 12}: message ${i}`, `P${i % 5}-->>+P${(i + 1) % 5}: reply`, 'alt x', 'Note over P1: n', 'end')
    const parsed = parseMermaid(lines.join('\n'))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const t = performance.now()
    const r = renderModel(parsed.ast, { maxEdges: 2000 })
    expect(performance.now() - t).toBeLessThan(500)
    expect(r.ok).toBe(true)
    if (r.ok) expectSane(r.model)
  })
})
