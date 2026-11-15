import { describe, expect, it } from 'vitest'
import { COALESCE_MS, cloneSnapshot, createHistory, historyLimit } from './flowHistory'
import type { FlowNode } from './types'

const snap = (x: number) => ({ nodes: [{ id: 'a', x, y: 0 }] as FlowNode[], edges: [] })

describe('historyLimit', () => {
  it('floors, clamps to 1..500 and defaults to 50', () => {
    expect(historyLimit(10.9)).toBe(10)
    expect(historyLimit(0)).toBe(1)
    expect(historyLimit(-4)).toBe(1)
    expect(historyLimit(9999)).toBe(500)
    for (const bad of [undefined, NaN, 'x', null, Infinity]) expect(historyLimit(bad)).toBe(50)
  })
})

describe('cloneSnapshot', () => {
  it('copies nodes and edges one level deep', () => {
    const nodes: FlowNode[] = [{ id: 'a', x: 1, y: 2 }]
    const c = cloneSnapshot(nodes, [{ id: 'e', from: 'a', to: 'a' }])
    c.nodes[0]!.x = 99
    expect(nodes[0]!.x).toBe(1)
    expect(c.edges[0]).toEqual({ id: 'e', from: 'a', to: 'a' })
  })
})

describe('createHistory', () => {
  it('undoes and redoes in order, swapping the current state', () => {
    const h = createHistory(10)
    h.record(snap(0), 'one', 0)
    h.record(snap(1), 'two', 10)
    expect([h.undoSize, h.redoSize]).toEqual([2, 0])
    const u1 = h.undo(snap(2))!
    expect(u1.label).toBe('two')
    expect(u1.state.nodes[0]!.x).toBe(1)
    const u2 = h.undo(snap(1))!
    expect(u2.state.nodes[0]!.x).toBe(0)
    expect(h.undo(snap(0))).toBeNull()
    expect(h.redoSize).toBe(2)
    expect(h.redo(snap(0))!.state.nodes[0]!.x).toBe(1)
    expect(h.redo(snap(1))!.state.nodes[0]!.x).toBe(2)
    expect(h.redo(snap(2))).toBeNull()
    expect(h.undoSize).toBe(2)
  })
  it('a new change clears the redo stack', () => {
    const h = createHistory(10)
    h.record(snap(0), 'one', 0)
    h.undo(snap(1))
    expect(h.redoSize).toBe(1)
    h.record(snap(1), 'two', 5)
    expect(h.redoSize).toBe(0)
  })
  it('is bounded: the oldest steps fall off', () => {
    const h = createHistory(3)
    for (let i = 0; i < 10; i++) h.record(snap(i), `s${i}`, i * 5000)
    expect(h.undoSize).toBe(3)
    expect(h.undo(snap(10))!.label).toBe('s9')
    h.undo(snap(9))
    expect(h.undo(snap(8))!.label).toBe('s7')
    expect(h.undo(snap(7))).toBeNull()
  })
  it('bounds the redo stack too and honours a lowered limit', () => {
    const h = createHistory(10)
    for (let i = 0; i < 6; i++) h.record(snap(i), `s${i}`, i * 5000)
    for (let i = 0; i < 6; i++) h.undo(snap(i))
    expect(h.redoSize).toBe(6)
    h.setLimit(2)
    expect(h.redoSize).toBe(2)
    expect(h.undoSize).toBe(0)
  })
  it('merges entries with the same key within a second', () => {
    const h = createHistory(10)
    h.record(snap(0), 'move', 1000, 'k')
    h.record(snap(1), 'move', 1000 + COALESCE_MS - 1, 'k')
    expect(h.undoSize).toBe(1)
    // the merge refreshes the clock, so a steady stream stays one step
    h.record(snap(2), 'move', 1000 + 2 * COALESCE_MS - 2, 'k')
    expect(h.undoSize).toBe(1)
    expect(h.undo(snap(3))!.state.nodes[0]!.x).toBe(0)
  })
  it('does not merge after a pause, with another key or without a key', () => {
    const h = createHistory(10)
    h.record(snap(0), 'a', 0, 'k')
    h.record(snap(1), 'a', COALESCE_MS + 1, 'k')
    h.record(snap(2), 'b', COALESCE_MS + 2, 'other')
    h.record(snap(3), 'c', COALESCE_MS + 3)
    h.record(snap(4), 'c', COALESCE_MS + 4)
    expect(h.undoSize).toBe(5)
  })
  it('clear forgets everything', () => {
    const h = createHistory(10)
    h.record(snap(0), 'a', 0)
    h.undo(snap(1))
    h.clear()
    expect([h.undoSize, h.redoSize]).toEqual([0, 0])
  })
})
