import { describe, expect, it } from 'vitest'
import { parseMermaid } from '.'
import type { TimelineAst } from './timeline'

const ok = (src: string): TimelineAst => {
  const r = parseMermaid(src)
  if (!r.ok) throw new Error(JSON.stringify(r.errors))
  return r.ast as TimelineAst
}
const bad = (src: string) => {
  const r = parseMermaid(src)
  if (r.ok) throw new Error('expected failure')
  return r.errors[0]!
}

describe('timeline parse: good', () => {
  it('periods, several events, continuation lines, sections and title', () => {
    const a = ok(`timeline
  title History of Orchard Mill
  section Early years
    1998 : Founded by two brothers
    2002 : Opened the first store : Hired a baker
         : Started delivery
  section Growth
    2010 : Second mill
    Spring 2015 : Merged with Brightwater Co : New logo<br>and name
`)
    expect(a.type).toBe('timeline')
    expect(a.meta.title).toBe('History of Orchard Mill')
    expect(a.sections.map((s) => s.name)).toEqual(['Early years', 'Growth'])
    expect(a.periods.map((p) => [p.label, p.section, p.events])).toEqual([
      ['1998', 0, ['Founded by two brothers']],
      ['2002', 0, ['Opened the first store', 'Hired a baker', 'Started delivery']],
      ['2010', 1, ['Second mill']],
      ['Spring 2015', 1, ['Merged with Brightwater Co', 'New logo<br>and name']],
    ])
  })

  it('period without events, and periods before any section', () => {
    const a = ok('timeline\n2001\n2002 : A\nsection S\n2003 : B')
    expect(a.periods[0]).toMatchObject({ label: '2001', events: [], section: -1 })
    expect(a.periods[2]!.section).toBe(0)
  })

  it('a continuation may follow a period without events and may hold several events', () => {
    const a = ok('timeline\n2001\n: A : B')
    expect(a.periods[0]!.events).toEqual(['A', 'B'])
  })

  it('period text can be anything', () => {
    const a = ok('timeline\nQ1 / Q2 - launch window : Go\n"Quoted" period : x\n日本 : y')
    expect(a.periods.map((p) => p.label)).toEqual(['Q1 / Q2 - launch window', '"Quoted" period', '日本'])
  })

  it('hostile text is kept as plain text', () => {
    const a = ok('timeline\nsection <script>alert(1)</script>\n"><img src=x onerror=alert(1)> : javascript alert(1)')
    expect(a.sections[0]!.name).toBe('<script>alert(1)</script>')
    expect(a.periods[0]!.label).toContain('onerror')
  })

  it('CRLF and comments', () => {
    const a = ok('timeline\r\n%% note\r\n2000 : A\r\n')
    expect(a.periods).toHaveLength(1)
  })

  it('title and section keywords with a colon are periods', () => {
    const a = ok('timeline\ntitle: not a title : yes\nsection : x')
    expect(a.periods.map((p) => p.label)).toEqual(['title', 'section'])
    expect(a.meta.title).toBeUndefined()
  })

  it('empty body and only a title', () => {
    expect(ok('timeline').periods).toEqual([])
    expect(ok('timeline\ntitle Only').meta.title).toBe('Only')
    expect(ok('timeline\ntitle').meta.title).toBeUndefined()
  })

  it('front matter title', () => {
    expect(ok('---\ntitle: Front\n---\ntimeline\n2000 : A').meta.title).toBe('Front')
  })

  it('very long labels', () => {
    const a = ok(`timeline\n${'period '.repeat(200)} : ${'event '.repeat(500)}`)
    expect(a.periods[0]!.events[0]!.length).toBeGreaterThan(2000)
  })

  it('1000 lines parse quickly', () => {
    const lines = ['timeline']
    for (let i = 0; i < 1000; i++) lines.push(i % 3 === 0 ? `${2000 + i} : Event ${i} : Other ${i}` : `  : More ${i}`)
    const t0 = performance.now()
    const a = ok(lines.join('\n'))
    expect(performance.now() - t0).toBeLessThan(200)
    expect(a.periods.length).toBe(334)
  })
})

describe('timeline parse: bad', () => {
  it('event line before any period', () => {
    const e = bad('timeline\ntitle X\n   : orphan event')
    expect(e).toMatchObject({ line: 3, column: 4 })
    expect(e.message).toBe('This event has no period to belong to. Write a period first, for example "2004 : Event".')
  })

  it('empty event after a colon', () => {
    const e = bad('timeline\n2004 : A :')
    expect(e).toMatchObject({ line: 2, column: 11 })
    expect(e.message).toContain('This event is empty')
    expect(bad('timeline\n2004 : A : : B')).toMatchObject({ line: 2, column: 12 })
    expect(bad('timeline\n2004 :')).toMatchObject({ line: 2, column: 7 })
  })

  it('empty continuation', () => {
    const e = bad('timeline\n2004 : A\n  :')
    expect(e).toMatchObject({ line: 3, column: 4 })
    expect(e.message).toContain('This event is empty')
    expect(bad('timeline\n2004 : A\n : B : ')).toMatchObject({ line: 3, column: 7 })
  })

  it('section without a name', () => {
    expect(bad('timeline\n  section')).toMatchObject({ line: 2, column: 10 })
  })

  it('error line numbers skip comments and blank lines', () => {
    expect(bad('timeline\n%% c\n\n: lost').line).toBe(4)
  })
})
