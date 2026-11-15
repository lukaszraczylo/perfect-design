import { describe, expect, it } from 'vitest'
import { DEFAULT_MAX_NODES, MAX_NODES_LIMIT, describeEdge, formatPlain, graphNotes, nodeId, normalizeGraph, normalizeMaxNodes } from './graphData'

const nodes = [
  { id: 'a', label: 'Alpha', group: 'one' },
  { id: 'b', group: 'two' },
  { id: 'c', size: 5 },
]
const edges = [{ from: 'a', to: 'b', weight: 3 }, { from: 'b', to: 'c', directed: true, label: 'ships' }, { from: 'c', to: 'c' }]

describe('nodeId', () => {
  it('accepts non-empty strings and finite numbers only', () => {
    expect(nodeId('x')).toBe('x')
    expect(nodeId(4)).toBe('4')
    expect(nodeId('  ')).toBeNull()
    expect(nodeId('')).toBeNull()
    expect(nodeId(NaN)).toBeNull()
    expect(nodeId(Infinity)).toBeNull()
    expect(nodeId(null)).toBeNull()
    expect(nodeId({})).toBeNull()
  })
})

describe('normalizeMaxNodes', () => {
  it('floors and clamps to 1..5000, bad values give the default', () => {
    expect(normalizeMaxNodes(10.9)).toBe(10)
    expect(normalizeMaxNodes(0)).toBe(1)
    expect(normalizeMaxNodes(-5)).toBe(1)
    expect(normalizeMaxNodes(1e9)).toBe(MAX_NODES_LIMIT)
    expect(normalizeMaxNodes(NaN)).toBe(DEFAULT_MAX_NODES)
    expect(normalizeMaxNodes('7')).toBe(DEFAULT_MAX_NODES)
    expect(normalizeMaxNodes(undefined)).toBe(DEFAULT_MAX_NODES)
  })
})

describe('normalizeGraph', () => {
  it('normalises nodes, groups, degrees and edges', () => {
    const g = normalizeGraph(nodes, edges, 300)
    expect(g.nodes.map((n) => n.label)).toEqual(['Alpha', 'b', 'c'])
    expect(g.groups).toEqual(['one', 'two'])
    expect(g.nodes.map((n) => n.groupIndex)).toEqual([0, 1, -1])
    expect(g.nodes[2]!.size).toBe(5)
    expect(g.nodes.map((n) => n.degree)).toEqual([3, 4, 2])
    expect(g.nodes.map((n) => n.connections)).toEqual([1, 2, 2])
    expect(g.edges.map((e) => [e.from, e.to, e.weight, e.directed, e.self])).toEqual([[0, 1, 3, false, false], [1, 2, null, true, false], [2, 2, null, false, true]])
    expect(g.total).toBe(3)
    expect(g.capped).toBe(false)
  })
  it('the default direction applies unless an edge sets its own', () => {
    const g = normalizeGraph(nodes, [{ from: 'a', to: 'b' }, { from: 'b', to: 'a', directed: false }], 300, true)
    expect(g.edges.map((e) => e.directed)).toEqual([true, false])
  })
  it('keeps the first of a duplicate id and counts the rest', () => {
    const g = normalizeGraph([{ id: 'a', label: 'First' }, { id: 'a', label: 'Second' }, { id: 'a' }], [], 300)
    expect(g.nodes).toHaveLength(1)
    expect(g.nodes[0]!.label).toBe('First')
    expect(g.duplicates).toBe(2)
  })
  it('drops entries without a usable id', () => {
    const g = normalizeGraph([null, 'x', { label: 'no id' }, { id: '' }, { id: NaN }, { id: 7 }, [], { id: 'ok' }], [], 300)
    expect(g.nodes.map((n) => n.id)).toEqual(['7', 'ok'])
    expect(g.invalidNodes).toBe(6)
  })
  it('skips edges with unknown endpoints or the wrong shape', () => {
    const g = normalizeGraph(nodes, [{ from: 'a', to: 'zzz' }, { from: 'q', to: 'a' }, null, 'a-b', { from: 'a' }, { from: 'a', to: 'b' }], 300)
    expect(g.edges).toHaveLength(1)
    expect(g.skippedEdges).toBe(5)
  })
  it('cuts at maxNodes, counts the total and skips edges to cut nodes', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ id: `n${i}` }))
    const g = normalizeGraph(many, [{ from: 'n0', to: 'n1' }, { from: 'n0', to: 'n9' }], 4)
    expect(g.nodes).toHaveLength(4)
    expect(g.total).toBe(10)
    expect(g.capped).toBe(true)
    expect(g.edges).toHaveLength(1)
    expect(g.skippedEdges).toBe(1)
  })
  it('a duplicate of a node that was cut by the cap is still a duplicate', () => {
    const g = normalizeGraph([{ id: 'a' }, { id: 'b' }, { id: 'b' }], [], 1)
    expect(g.duplicates).toBe(1)
    expect(g.total).toBe(2)
  })
  it('bad weights, sizes and labels fall back', () => {
    const g = normalizeGraph(
      [{ id: 'a', label: 5, size: -1 }, { id: 'b', label: '  ', size: Infinity }, { id: 'c', size: 1e300 }],
      [{ from: 'a', to: 'b', weight: 0 }, { from: 'a', to: 'b', weight: -2 }, { from: 'a', to: 'b', weight: NaN }, { from: 'a', to: 'b', weight: Infinity }, { from: 'a', to: 'b', weight: 1e300, label: 4 as never }],
      300,
    )
    expect(g.nodes.map((n) => n.label)).toEqual(['5', 'b', 'c'])
    expect(g.nodes.map((n) => n.size)).toEqual([null, null, 1e12])
    expect(g.edges.map((e) => e.weight)).toEqual([null, null, null, null, 1e12])
    expect(g.edges[4]!.label).toBe('')
    expect(Number.isFinite(g.nodes[0]!.degree)).toBe(true)
  })
  it('non-array input is empty', () => {
    const g = normalizeGraph('nope', 42, undefined)
    expect(g.nodes).toEqual([])
    expect(g.edges).toEqual([])
  })
})

describe('describeEdge, formatPlain and graphNotes', () => {
  it('describes directed, undirected, weighted and labelled connections', () => {
    const g = normalizeGraph(nodes, edges, 300)
    expect(describeEdge(g, g.edges[0]!)).toBe('Alpha and b (weight 3)')
    expect(describeEdge(g, g.edges[1]!)).toBe('b to c (ships)')
    expect(describeEdge(g, g.edges[2]!)).toBe('c and c')
    expect(describeEdge(g, { ...g.edges[0]!, weight: 2, label: 'x', directed: true })).toBe('Alpha to b (weight 2, x)')
  })
  it('formats numbers plainly', () => {
    expect(formatPlain(1234.567)).toBe('1,234.57')
  })
  it('notes: none for clean data, one per problem otherwise', () => {
    expect(graphNotes(normalizeGraph(nodes, edges, 300))).toEqual([])
    const bad = normalizeGraph([{ id: 'a' }, { id: 'a' }, { id: 'b' }, {}], [{ from: 'a', to: 'x' }], 1)
    expect(graphNotes(bad)).toEqual(['Showing the first 1 of 2 nodes', '1 duplicate node id ignored', '1 entry without an id ignored', '1 connection skipped: unknown node id'])
    const plural = normalizeGraph([{ id: 'a' }, { id: 'a' }, { id: 'a' }, {}, {}], [{ from: 'a', to: 'x' }, { from: 'a', to: 'y' }], 300)
    expect(graphNotes(plural)).toEqual(['2 duplicate node ids ignored', '2 entries without an id ignored', '2 connections skipped: unknown node id'])
  })
})
