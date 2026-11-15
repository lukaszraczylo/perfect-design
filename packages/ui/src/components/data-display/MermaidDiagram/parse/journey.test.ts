import { describe, expect, it } from 'vitest'
import { parseMermaid } from '.'
import type { JourneyAst } from './journey'

const ok = (src: string): JourneyAst => {
  const r = parseMermaid(src)
  if (!r.ok) throw new Error(JSON.stringify(r.errors))
  return r.ast as JourneyAst
}
const bad = (src: string) => {
  const r = parseMermaid(src)
  if (r.ok) throw new Error('expected failure')
  return r.errors[0]!
}

describe('journey parse: good', () => {
  it('sections, tasks, scores and actors', () => {
    const a = ok(`journey
  title Booking a freight slot
  section Plan
    Check availability: 5: Dispatcher
    Compare quotes: 3: Dispatcher, Carrier
  section Ship
    Load the truck: 1: Driver, Dispatcher
    Sign the receipt: 4
`)
    expect(a.type).toBe('journey')
    expect(a.meta.title).toBe('Booking a freight slot')
    expect(a.sections.map((s) => s.name)).toEqual(['Plan', 'Ship'])
    expect(a.tasks.map((t) => [t.name, t.score, t.actors, t.section])).toEqual([
      ['Check availability', 5, ['Dispatcher'], 0],
      ['Compare quotes', 3, ['Dispatcher', 'Carrier'], 0],
      ['Load the truck', 1, ['Driver', 'Dispatcher'], 1],
      ['Sign the receipt', 4, [], 1],
    ])
    expect(a.actors).toEqual(['Dispatcher', 'Carrier', 'Driver'])
  })

  it('task before any section goes to an unnamed section', () => {
    const a = ok('journey\nWake up: 2: Me\nsection Day\nWork: 3: Me')
    expect(a.sections.map((s) => s.name)).toEqual(['', 'Day'])
    expect(a.tasks.map((t) => t.section)).toEqual([0, 1])
  })

  it('whitespace around colons and duplicate actors', () => {
    const a = ok('journey\n  Task   :   4   :  A ,B,  A  \n')
    expect(a.tasks[0]).toMatchObject({ name: 'Task', score: 4, actors: ['A', 'B'] })
  })

  it('empty actor list after the second colon', () => {
    expect(ok('journey\nT: 3:').tasks[0]!.actors).toEqual([])
    expect(ok('journey\nT: 3:   ').tasks[0]!.actors).toEqual([])
  })

  it('hostile text and unicode', () => {
    const a = ok('journey\nsection <img src=x onerror=alert(1)>\nZażółć "gęślą" <script>: 2: "><svg onload=1>, 日本')
    expect(a.tasks[0]!.name).toContain('<script>')
    expect(a.tasks[0]!.actors).toEqual(['"><svg onload=1>', '日本'])
  })

  it('CRLF, comments, front matter', () => {
    expect(ok('---\ntitle: Front\n---\njourney\r\n%% c\r\nA: 1\r\n').meta.title).toBe('Front')
  })

  it('empty body', () => {
    expect(ok('journey').tasks).toEqual([])
    expect(ok('journey\ntitle').meta.title).toBeUndefined()
  })

  it('1000 tasks parse quickly', () => {
    const lines = ['journey']
    for (let i = 0; i < 1000; i++) lines.push(`Task ${i}: ${(i % 5) + 1}: A${i % 7}, B${i % 3}`)
    const t0 = performance.now()
    const a = ok(lines.join('\n'))
    expect(performance.now() - t0).toBeLessThan(200)
    expect(a.tasks).toHaveLength(1000)
    expect(a.actors).toHaveLength(10)
  })

  it('very long task names', () => {
    expect(ok(`journey\n${'x '.repeat(1000)}: 3`).tasks[0]!.name.length).toBeGreaterThan(1500)
  })
})

describe('journey parse: bad', () => {
  it('missing colon', () => {
    const e = bad('journey\nsection A\n  Just a name')
    expect(e).toMatchObject({ line: 3, column: 14 })
    expect(e.message).toContain('is not a task')
    expect(e.message).toContain('score from 1 to 5')
  })

  it('missing score', () => {
    const e = bad('journey\nTask:')
    expect(e).toMatchObject({ line: 2, column: 6 })
    expect(e.message).toContain('has no score')
    expect(bad('journey\nTask::Me').message).toContain('has no score')
    expect(bad('journey\nTask:   : Me').column).toBe(6)
  })

  it('score out of range or not an integer', () => {
    for (const s of ['0', '6', '10', '4.5', '-1', 'high', '4x', '٣']) {
      const e = bad(`journey\nTask: ${s}: Me`)
      expect(e, s).toMatchObject({ line: 2, column: 7 })
      expect(e.message).toBe(`"${s}" is not a valid score. Use a whole number from 1 (worst) to 5 (best).`)
    }
  })

  it('score column follows the indent', () => {
    expect(bad('journey\n    Task:   9').column).toBe(13)
  })

  it('no task name', () => {
    expect(bad('journey\n: 3: Me')).toMatchObject({ line: 2, column: 1 })
  })

  it('too many colons and empty actor', () => {
    const e = bad('journey\nTask: 3: Me: You')
    expect(e).toMatchObject({ line: 2, column: 12 })
    expect(e.message).toContain('Too many colons')
    expect(bad('journey\nTask: 3: Me,, You')).toMatchObject({ line: 2, column: 13 })
    expect(bad('journey\nTask: 3: Me,')).toMatchObject({ line: 2, column: 13 })
  })

  it('section without a name', () => {
    expect(bad('journey\nsection')).toMatchObject({ line: 2, column: 8 })
  })

  it('line numbers skip comments', () => {
    expect(bad('journey\n%% x\n\nbroken').line).toBe(4)
  })
})
