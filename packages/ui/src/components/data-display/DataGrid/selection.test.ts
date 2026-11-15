import { describe, expect, it } from 'vitest'
import { applyRange, headerState, setAll, toggleId } from './selection'

const ids = ['a', 'b', 'c', 'd', 'e']

describe('headerState', () => {
  it('reports none, some and all', () => {
    expect(headerState(new Set(), ids)).toBe('none')
    expect(headerState(new Set(['a', 'c']), ids)).toBe('some')
    expect(headerState(new Set(ids), ids)).toBe('all')
  })
  it('ignores selected ids that are not in the list and handles an empty list', () => {
    expect(headerState(new Set(['zzz']), ids)).toBe('none')
    expect(headerState(new Set(['a']), [])).toBe('none')
  })
})

describe('toggleId', () => {
  it('adds and removes without mutating', () => {
    const start = ['a']
    expect(toggleId(start, 'b')).toEqual(['a', 'b'])
    expect(toggleId(start, 'a')).toEqual([])
    expect(start).toEqual(['a'])
  })
  it('honours an explicit state', () => {
    expect(toggleId(['a'], 'a', true)).toEqual(['a'])
    expect(toggleId(['a'], 'b', false)).toEqual(['a'])
  })
})

describe('applyRange', () => {
  it('selects an inclusive range in either direction', () => {
    expect(applyRange([], ids, 1, 3, true)).toEqual(['b', 'c', 'd'])
    expect(applyRange([], ids, 3, 1, true)).toEqual(['b', 'c', 'd'])
  })
  it('deselects and keeps other ids', () => {
    expect(applyRange(['a', 'b', 'c', 'e'], ids, 1, 2, false)).toEqual(['a', 'e'])
  })
  it('clamps out-of-range positions', () => {
    expect(applyRange([], ids, -5, 99, true)).toEqual(ids)
    expect(applyRange([], [], 0, 3, true)).toEqual([])
  })
})

describe('setAll', () => {
  it('selects or clears the listed ids and keeps ids outside the list', () => {
    expect(setAll(['x'], ids, true)).toEqual(['x', ...ids])
    expect(setAll(['x', 'a', 'b'], ids, false)).toEqual(['x'])
  })
})
