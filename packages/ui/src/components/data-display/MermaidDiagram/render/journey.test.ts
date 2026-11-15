import { describe, expect, it } from 'vitest'
import type { RPath, RShape, RText } from '../../_diagram/types'
import { expectNoTextOverlap, expectSane, model, pathPoints, renderError, texts } from './timelineKit/testing'

const SAMPLE = `journey
  title Booking a freight slot
  section Plan
    Check availability: 5: Dispatcher
    Compare quotes: 3: Dispatcher, Carrier
  section Ship
    Load the truck: 1: Driver, Dispatcher
    Sign the receipt: 4
    Pay the invoice: 2: Carrier, Driver, Clerk, Auditor, Manager
`

const roles = <T extends RText | RShape | RPath>(m: ReturnType<typeof model>, kind: T['kind'], role: string) => m.items.filter((i): i is T => i.kind === kind && i.role === role)

describe('journey render', () => {
  it('builds a sane model with counts, title, summary and alt', () => {
    const m = model(SAMPLE)
    expectSane(m)
    expectNoTextOverlap(m)
    expect(m.type).toBe('journey')
    expect(m.title).toBe('Booking a freight slot')
    expect(m.nodes).toBe(5)
    expect(m.edges).toBe(0)
    expect(m.summary).toBe('User journey with 5 tasks in 2 sections and 6 actors')
    expect(m.alt.sections[0]).toEqual({
      title: 'Tasks',
      ordered: true,
      items: [
        'Plan / Check availability: score 5 of 5, actors Dispatcher',
        'Plan / Compare quotes: score 3 of 5, actors Dispatcher, Carrier',
        'Ship / Load the truck: score 1 of 5, actors Driver, Dispatcher',
        'Ship / Sign the receipt: score 4 of 5',
        'Ship / Pay the invoice: score 2 of 5, actors Carrier, Driver, Clerk, Auditor, Manager',
      ],
    })
    expect(m.alt.sections[1]).toEqual({ title: 'Actors', ordered: false, items: ['Dispatcher', 'Carrier', 'Driver', 'Clerk', 'Auditor', 'Manager'] })
    expect(texts(m)).not.toContain('Booking a freight slot')
  })

  it('score is printed as text and drives the face height', () => {
    const m = model(SAMPLE)
    const scores = roles<RText>(m, 'text', 'score-text')
    expect(scores.map((s) => s.lines[0])).toEqual(['5 of 5', '3 of 5', '1 of 5', '4 of 5', '2 of 5'])
    const ys = scores.map((s) => s.y)
    expect(ys[0]!).toBeLessThan(ys[1]!)
    expect(ys[1]!).toBeLessThan(ys[2]!)
    expect(ys[3]!).toBeLessThan(ys[1]!)
  })

  it('faces: circle, two eyes, mouth that curves with the score', () => {
    const m = model('journey\nA: 1\nB: 3\nC: 5')
    expect(roles(m, 'shape', 'face')).toHaveLength(3)
    expect(roles(m, 'shape', 'face-eye')).toHaveLength(6)
    const mouths = roles<RPath>(m, 'path', 'face-mouth')
    const ctrl = mouths.map((p) => Number(/Q[\d.-]+,([\d.-]+)/.exec(p.d)![1]))
    const base = mouths.map((p) => Number(/M[\d.-]+,([\d.-]+)/.exec(p.d)![1]))
    expect(ctrl[0]! - base[0]!).toBeLessThan(0) // frown bends up
    expect(ctrl[1]! - base[1]!).toBe(0) // flat
    expect(ctrl[2]! - base[2]!).toBeGreaterThan(0) // smile bends down
  })

  it('score line joins the faces of a row', () => {
    const m = model(SAMPLE)
    const line = roles<RPath>(m, 'path', 'score-line')
    expect(line).toHaveLength(1)
    expect(pathPoints(line[0]!.d)).toHaveLength(5)
    expect(roles(model('journey\nA: 3'), 'path', 'score-line')).toHaveLength(0)
  })

  it('legend lists actors with distinct marker shapes cycling', () => {
    const m = model(SAMPLE)
    const legend = roles<RText>(m, 'text', 'legend-label').map((t) => t.lines[0])
    expect(legend).toEqual(['Dispatcher', 'Carrier', 'Driver', 'Clerk', 'Auditor', 'Manager'])
    const markers = roles<RShape>(m, 'shape', 'legend-marker')
    expect(markers).toHaveLength(6)
    const kinds = markers.map((s) => (s.d.includes('A') ? 'circle' : s.d.includes('H') ? 'square' : s.d.match(/L/g)?.length === 3 ? 'diamond' : 'triangle'))
    expect(kinds.slice(0, 4)).toEqual(['circle', 'square', 'diamond', 'triangle'])
    expect(kinds[4]).toBe(kinds[0])
    expect(new Set(markers.slice(0, 4).map((s) => s.d.replace(/[\d.-]+/g, ''))).size).toBe(4)
  })

  it('actors repeat under each task with the same marker as the legend', () => {
    const m = model(SAMPLE)
    expect(roles(m, 'shape', 'actor-marker')).toHaveLength(10)
    expect(roles<RText>(m, 'text', 'actor-label').map((t) => t.lines[0]).slice(0, 3)).toEqual(['Dispatcher', 'Dispatcher', 'Carrier'])
  })

  it('no actors means no legend', () => {
    const m = model('journey\nA: 3\nB: 4')
    expect(roles(m, 'text', 'legend-label')).toHaveLength(0)
    expect(m.summary).toBe('User journey with 2 tasks')
    expect(m.alt.sections).toHaveLength(1)
    expectSane(m)
    expectNoTextOverlap(m)
  })

  it('section bands name their tasks and alternate; unnamed section has none', () => {
    const m = model(SAMPLE)
    const bands = roles<RShape>(m, 'shape', 'section-band')
    expect(bands.map((b) => b.paint.stroke)).toEqual(['none', 'thin'])
    expect(roles<RText>(m, 'text', 'section-label').map((t) => t.lines[0])).toEqual(['Plan', 'Ship'])
    const plain = model('journey\nA: 3\nB: 4')
    expect(roles(plain, 'shape', 'section-band')).toHaveLength(0)
    const mixed = model('journey\nA: 3\nsection S\nB: 4')
    expect(roles(mixed, 'shape', 'section-band')).toHaveLength(1)
    expect(mixed.alt.sections[0]!.items[0]).toBe('A: score 3 of 5')
    expect(mixed.summary).toBe('User journey with 2 tasks in 1 section')
  })

  it('wraps rows when too wide', () => {
    const lines = ['journey', 'section Many']
    for (let i = 0; i < 14; i++) lines.push(`Step number ${i} of the long path: ${(i % 5) + 1}: Actor ${i % 3}`)
    const m = model(lines.join('\n'))
    expectSane(m)
    expectNoTextOverlap(m)
    expect(roles(m, 'path', 'score-line').length).toBeGreaterThan(1)
    expect(roles(m, 'shape', 'section-band').length).toBeGreaterThan(1)
    expect(m.width).toBeLessThanOrEqual(1000)
  })

  it('wide legend wraps to more lines', () => {
    const lines = ['journey']
    for (let i = 0; i < 12; i++) lines.push(`T${i}: 3: Actor number ${i} with a long name`)
    const m = model(lines.join('\n'))
    const ys = new Set(roles<RText>(m, 'text', 'legend-label').map((t) => t.y))
    expect(ys.size).toBeGreaterThan(1)
    expectSane(m)
    expectNoTextOverlap(m)
  })

  it('long task names wrap and long actor names truncate with a title', () => {
    const m = model(`journey\n${'Reconcile the delivery notes '.repeat(5)}: 4: ${'Warehouse supervisor '.repeat(5)}`)
    expectSane(m)
    expect(roles<RText>(m, 'text', 'task-label')[0]!.lines.length).toBeGreaterThan(3)
    const actor = roles<RText>(m, 'text', 'actor-label')[0]!
    expect(actor.title).toContain('Warehouse supervisor')
    expect(actor.lines[0]!.endsWith('…')).toBe(true)
  })

  it('long section names truncate', () => {
    const m = model(`journey\nsection ${'Long section '.repeat(20)}\nA: 3`)
    const l = roles<RText>(m, 'text', 'section-label')[0]!
    expect(l.title).toContain('Long section')
    expectSane(m)
  })

  it('is deterministic and scales with size, density, rounded and tone', () => {
    expect(JSON.stringify(model(SAMPLE))).toBe(JSON.stringify(model(SAMPLE)))
    const base = model(SAMPLE)
    const big = model(SAMPLE, { size: 'lg', density: 'spacious', rounded: 'full', tone: 'info' })
    const small = model(SAMPLE, { size: 'sm', density: 'compact', rounded: 'none' })
    expect(big.height).toBeGreaterThan(base.height)
    expect(small.height).toBeLessThan(base.height)
    expect(roles<RPath>(big, 'path', 'score-line')[0]!.tone).toBe('info')
    expect(roles<RPath>(base, 'path', 'score-line')[0]!.tone).toBe('primary')
    for (const m of [big, small]) {
      expectSane(m)
      expectNoTextOverlap(m)
    }
  })

  it('hostile text stays in text lines', () => {
    const m = model('journey\nsection <script>alert(1)</script>\n"><img src=x onerror=alert(1)>: 3: javascript alert(1), <b onmouseover=x>')
    for (const i of m.items) if (i.kind !== 'text') expect(i.d).not.toMatch(/script|onerror|javascript/)
    expect(texts(m).join(' ')).toContain('alert(1)')
    expect(texts(m).join(' ')).not.toMatch(/<(img|b|script)/)
    expectSane(m)
  })

  it('unicode and entities', () => {
    const m = model('journey\nZażółć &amp; gęślą: 5: 日本')
    expect(m.alt.sections[0]!.items[0]).toBe('Zażółć & gęślą: score 5 of 5, actors 日本')
    expectSane(m)
  })

  it('limits and empty', () => {
    const lines = ['journey']
    for (let i = 0; i < 301; i++) lines.push(`T${i}: 3`)
    expect(renderError(lines.join('\n'))).toMatchObject({ code: 'limit', diagramType: 'journey' })
    expect(renderError('journey')).toMatchObject({ code: 'empty' })
    const t0 = performance.now()
    expect(model(lines.join('\n'), { maxNodes: 1000 }).nodes).toBe(301)
    expect(performance.now() - t0).toBeLessThan(500)
  })
})
