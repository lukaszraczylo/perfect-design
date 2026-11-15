import { describe, expect, it } from 'vitest'
import type { RShape, RText } from '../../_diagram/types'
import { expectNoTextOverlap, expectSane, model, renderError, texts } from './timelineKit/testing'

const SAMPLE = `timeline
  title History of Orchard Mill
  section Early years
    1998 : Founded by two brothers
    2002 : Opened the first store : Hired a baker
         : Started delivery
  section Growth
    2010 : Second mill
    Spring 2015 : Merged with Brightwater Co : New logo<br>and name
`

const byRole = <T extends RText | RShape>(m: ReturnType<typeof model>, kind: T['kind'], role: string) => m.items.filter((i): i is T => i.kind === kind && i.role === role)

describe('timeline render', () => {
  it('builds a sane model with counts, title, summary and alt', () => {
    const m = model(SAMPLE)
    expectSane(m)
    expectNoTextOverlap(m)
    expect(m.type).toBe('timeline')
    expect(m.title).toBe('History of Orchard Mill')
    expect(m.nodes).toBe(7)
    expect(m.edges).toBe(0)
    expect(m.summary).toBe('Timeline with 4 periods and 7 events in 2 sections')
    expect(m.alt.sections).toEqual([
      { title: 'Periods', ordered: true, items: ['1998: Founded by two brothers', '2002: Opened the first store, Hired a baker, Started delivery', '2010: Second mill', 'Spring 2015: Merged with Brightwater Co, New logo and name'] },
      { title: 'Sections', ordered: false, items: ['Early years: 1998, 2002', 'Growth: 2010, Spring 2015'] },
    ])
    expect(texts(m)).not.toContain('History of Orchard Mill')
  })

  it('one dot per period, one card per event, labels bold above', () => {
    const m = model(SAMPLE)
    expect(byRole(m, 'shape', 'period-dot')).toHaveLength(4)
    expect(byRole(m, 'shape', 'event-card')).toHaveLength(7)
    const labels = byRole<RText>(m, 'text', 'period-label')
    expect(labels.map((l) => l.lines.join(' '))).toEqual(['1998', '2002', '2010', 'Spring 2015'])
    expect(labels.every((l) => l.bold)).toBe(true)
    expect(byRole<RText>(m, 'text', 'event-label')[6]!.lines).toEqual(['New logo', 'and name'])
  })

  it('section bands carry the section name as text and alternate paint', () => {
    const m = model(SAMPLE)
    const bands = byRole<RShape>(m, 'shape', 'section-band')
    expect(bands).toHaveLength(2)
    expect(bands.map((b) => b.paint.stroke)).toEqual(['none', 'thin'])
    expect(bands.every((b) => b.paint.fill === 'muted')).toBe(true)
    expect(byRole<RText>(m, 'text', 'section-label').map((t) => t.lines[0])).toEqual(['Early years', 'Growth'])
    expect(byRole(m, 'shape', 'section-body')).toHaveLength(1)
  })

  it('without sections there are no bands', () => {
    const m = model('timeline\n2000 : A\n2001 : B')
    expect(byRole(m, 'shape', 'section-band')).toHaveLength(0)
    expect(m.alt.sections).toHaveLength(1)
    expect(m.summary).toBe('Timeline with 2 periods and 2 events')
  })

  it('period before the first section has no band; period without events draws only a dot', () => {
    const m = model('timeline\n1999\n2000 : A\nsection S\n2001 : B')
    expectSane(m)
    expect(byRole(m, 'shape', 'section-band')).toHaveLength(1)
    expect(byRole(m, 'shape', 'period-dot')).toHaveLength(3)
    expect(byRole(m, 'shape', 'event-card')).toHaveLength(2)
    expect(m.alt.sections[1]!.items).toEqual(['S: 2001'])
  })

  it('a section without periods is listed as empty', () => {
    const m = model('timeline\nsection Empty\nsection Full\n2000 : A')
    expect(m.alt.sections[1]!.items).toEqual(['Empty: no periods', 'Full: 2000'])
  })

  it('wraps to several rows when too wide', () => {
    const lines = ['timeline']
    for (let i = 0; i < 12; i++) lines.push(`Year ${2000 + i} : A fairly long event text number ${i}`)
    const m = model(lines.join('\n'))
    expectSane(m)
    expectNoTextOverlap(m)
    const axes = m.items.filter((i) => i.kind === 'path' && i.role === 'axis')
    expect(axes.length).toBeGreaterThan(1)
    expect(m.width).toBeLessThanOrEqual(1000)
    expect(m.alt.sections[0]!.items).toHaveLength(12)
  })

  it('one very wide column still gets its own row', () => {
    const m = model(`timeline\n${'Averyveryverylongperiodword'.repeat(8)} : x\n2000 : y`)
    expectSane(m)
    expectNoTextOverlap(m)
  })

  it('wrapped rows repeat the section band', () => {
    const lines = ['timeline', 'section One']
    for (let i = 0; i < 10; i++) lines.push(`Year ${i} : Long enough event text ${i}`)
    const m = model(lines.join('\n'))
    expect(byRole(m, 'shape', 'section-band').length).toBeGreaterThan(1)
    expectSane(m)
    expectNoTextOverlap(m)
  })

  it('long events wrap to m.wrap and long section names truncate with a title', () => {
    const m = model(`timeline\nsection ${'Quite a long section name '.repeat(6)}\n2000 : ${'word '.repeat(60)}`)
    expectSane(m)
    const card = byRole<RText>(m, 'text', 'event-label')[0]!
    expect(card.lines.length).toBeGreaterThan(5)
    const sec = byRole<RText>(m, 'text', 'section-label')[0]!
    expect(sec.title).toContain('Quite a long')
    expect(sec.lines[0]!.endsWith('…')).toBe(true)
  })

  it('is deterministic and responds to size, density, rounded and tone', () => {
    expect(JSON.stringify(model(SAMPLE))).toBe(JSON.stringify(model(SAMPLE)))
    const base = model(SAMPLE)
    const big = model(SAMPLE, { size: 'lg', density: 'spacious', rounded: 'full', tone: 'success' })
    const small = model(SAMPLE, { size: 'sm', density: 'compact', rounded: 'none' })
    expect(big.height).toBeGreaterThan(base.height)
    expect(small.height).toBeLessThan(base.height)
    expect(byRole<RShape>(big, 'shape', 'period-dot')[0]!.paint.tone).toBe('success')
    expect(byRole<RShape>(base, 'shape', 'period-dot')[0]!.paint.tone).toBe('primary')
    for (const m of [big, small]) {
      expectSane(m)
      expectNoTextOverlap(m)
    }
  })

  it('hostile text stays in text lines', () => {
    const m = model('timeline\nsection "><img src=x onerror=alert(1)>\n<script>alert(1)</script> : javascript alert(1) : <b onmouseover=x>hi</b>')
    for (const i of m.items) if (i.kind !== 'text') expect(i.d).not.toMatch(/script|onerror|javascript/)
    expect(texts(m).join(' ')).toContain('alert(1)')
    expect(texts(m).join(' ')).not.toMatch(/<(img|b|script)/)
    expectSane(m)
  })

  it('unicode and entities', () => {
    const m = model('timeline\n日本の歴史 : 縄文時代 : Zażółć &amp; gęślą #35;')
    expect(texts(m)).toContain('日本の歴史')
    expect(m.alt.sections[0]!.items[0]).toContain('Zażółć & gęślą #')
    expectSane(m)
  })

  it('limits and empty', () => {
    const lines = ['timeline', '2000 : a']
    for (let i = 0; i < 400; i++) lines.push(`: e${i}`)
    expect(renderError(lines.join('\n'))).toMatchObject({ code: 'limit', diagramType: 'timeline' })
    expect(model(lines.join('\n'), { maxNodes: 500 }).nodes).toBe(401)
    expect(renderError('timeline')).toMatchObject({ code: 'empty' })
    expect(renderError('timeline\ntitle Only')).toMatchObject({ code: 'empty' })
  })

  it('1000 events render quickly when the limit is raised', () => {
    const lines = ['timeline']
    for (let i = 0; i < 250; i++) lines.push(`P${i} : a${i} : b${i} : c${i} : d${i}`)
    const t0 = performance.now()
    const m = model(lines.join('\n'), { maxNodes: 2000 })
    expect(performance.now() - t0).toBeLessThan(500)
    expect(m.nodes).toBe(1000)
  })
})
