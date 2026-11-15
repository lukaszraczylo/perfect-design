import { describe, expect, it } from 'vitest'
import { compareValues, isMissing, nextSort, sortRows } from './sort'

const get = (r: Record<string, unknown>, k: string) => r[k]
const vals = (rows: Record<string, unknown>[]) => rows.map((r) => r.v)
const mk = (...vs: unknown[]) => vs.map((v, i) => ({ v, i }))

describe('sortRows', () => {
  it('sorts numbers numerically (not lexicographically) asc and desc', () => {
    const rows = mk(10, 9, 100, 1)
    expect(vals(sortRows(rows, { key: 'v', direction: 'asc' }, get))).toEqual([1, 9, 10, 100])
    expect(vals(sortRows(rows, { key: 'v', direction: 'desc' }, get))).toEqual([100, 10, 9, 1])
  })

  it('null sort returns a copy in source order', () => {
    const rows = mk(3, 1, 2)
    const out = sortRows(rows, null, get)
    expect(out).toEqual(rows)
    expect(out).not.toBe(rows)
    expect(sortRows(rows, undefined, get)).toEqual(rows)
  })

  it('does not mutate the input', () => {
    const rows = mk(3, 1, 2)
    sortRows(rows, { key: 'v', direction: 'asc' }, get)
    expect(vals(rows)).toEqual([3, 1, 2])
  })

  it('empty and single row', () => {
    expect(sortRows([], { key: 'v', direction: 'asc' }, get)).toEqual([])
    const one = mk(5)
    expect(sortRows(one, { key: 'v', direction: 'desc' }, get)).toEqual(one)
  })

  it('missing values (null/undefined/NaN/Invalid Date) are last in both directions', () => {
    const rows = mk(2, null, NaN, 1, undefined, new Date('x'), 3)
    const asc = vals(sortRows(rows, { key: 'v', direction: 'asc' }, get))
    const desc = vals(sortRows(rows, { key: 'v', direction: 'desc' }, get))
    expect(asc.slice(0, 3)).toEqual([1, 2, 3])
    expect(desc.slice(0, 3)).toEqual([3, 2, 1])
    for (const out of [asc, desc]) expect(out.slice(3).every(isMissing)).toBe(true)
    // missing among themselves keep source order
    expect(asc.slice(3)[0]).toBeNull()
    expect(desc.slice(3)[0]).toBeNull()
  })

  it('Infinity / -Infinity sort as numbers', () => {
    const rows = mk(0, Infinity, -Infinity, 5)
    expect(vals(sortRows(rows, { key: 'v', direction: 'asc' }, get))).toEqual([-Infinity, 0, 5, Infinity])
  })

  it('Dates sort by time', () => {
    const a = new Date('2020-01-01')
    const b = new Date('2021-01-01')
    const c = new Date('2019-01-01')
    expect(vals(sortRows(mk(a, b, c), { key: 'v', direction: 'asc' }, get))).toEqual([c, a, b])
  })

  it('booleans: false before true', () => {
    expect(vals(sortRows(mk(true, false, true, false), { key: 'v', direction: 'asc' }, get))).toEqual([false, false, true, true])
  })

  it('strings: numeric-aware, case/accents-insensitive', () => {
    const out = vals(sortRows(mk('item10', 'Item2', 'item1', 'écrou', 'Eagle'), { key: 'v', direction: 'asc' }, get))
    expect(out).toEqual(['Eagle', 'écrou', 'item1', 'Item2', 'item10'])
  })

  it('mixed types are ranked number < boolean < string deterministically', () => {
    const rows = mk('b', 2, true, 'a', 1, false)
    const asc = vals(sortRows(rows, { key: 'v', direction: 'asc' }, get))
    expect(asc).toEqual([1, 2, false, true, 'a', 'b'])
    expect(vals(sortRows(rows, { key: 'v', direction: 'desc' }, get))).toEqual(['b', 'a', true, false, 2, 1])
    expect(vals(sortRows(mk(...asc.slice().reverse()), { key: 'v', direction: 'asc' }, get))).toEqual(asc)
  })

  it('bigint compares with numbers; objects compare as strings', () => {
    expect(vals(sortRows(mk(3n, 1, 2n), { key: 'v', direction: 'asc' }, get))).toEqual([1, 2n, 3n])
    expect(compareValues({}, 'zzz')).not.toBeNaN()
  })

  it('is stable for ties in both directions', () => {
    const rows = [
      { v: 1, id: 'a' },
      { v: 2, id: 'b' },
      { v: 1, id: 'c' },
      { v: 2, id: 'd' },
      { v: 1, id: 'e' },
    ]
    const asc = sortRows(rows, { key: 'v', direction: 'asc' }, get).map((r) => r.id)
    const desc = sortRows(rows, { key: 'v', direction: 'desc' }, get).map((r) => r.id)
    expect(asc).toEqual(['a', 'c', 'e', 'b', 'd'])
    expect(desc).toEqual(['b', 'd', 'a', 'c', 'e'])
  })

  it('strings equal under base sensitivity tie-break by index', () => {
    const rows = [{ v: 'A', id: 1 }, { v: 'a', id: 2 }, { v: 'á', id: 3 }]
    expect(sortRows(rows, { key: 'v', direction: 'asc' }, get).map((r) => r.id)).toEqual([1, 2, 3])
  })

  it('unicode / RTL strings do not throw and are deterministic', () => {
    const rows = mk('שלום', 'مرحبا', '日本語', '😀', 'abc')
    const a = vals(sortRows(rows, { key: 'v', direction: 'asc' }, get))
    expect(a).toHaveLength(5)
    expect(vals(sortRows(rows, { key: 'v', direction: 'asc' }, get))).toEqual(a)
  })

  it('10k rows sort quickly', () => {
    const rows = Array.from({ length: 10_000 }, (_, i) => ({ v: (i * 7919) % 10_007, i }))
    const t = performance.now()
    const out = sortRows(rows, { key: 'v', direction: 'asc' }, get)
    const ms = performance.now() - t
    expect(out).toHaveLength(10_000)
    expect(out[0]!.v).toBeLessThanOrEqual(out[9_999]!.v)
    expect(ms).toBeLessThan(1000)
  })
})

describe('isMissing / nextSort', () => {
  it('isMissing', () => {
    expect([null, undefined, NaN, new Date('x')].every(isMissing)).toBe(true)
    expect([0, '', false, new Date(0), Infinity, 'NaN'].some(isMissing)).toBe(false)
  })

  it('cycles none -> asc -> desc -> none and restarts on another key', () => {
    const a = nextSort(null, 'x')
    expect(a).toEqual({ key: 'x', direction: 'asc' })
    const d = nextSort(a, 'x')
    expect(d).toEqual({ key: 'x', direction: 'desc' })
    expect(nextSort(d, 'x')).toBeNull()
    expect(nextSort(d, 'y')).toEqual({ key: 'y', direction: 'asc' })
    expect(nextSort(undefined, 'z')).toEqual({ key: 'z', direction: 'asc' })
  })
})
