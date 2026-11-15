import { describe, expect, it } from 'vitest'
import { DIRECTION_PHRASE, checkLimits, drawGraph, rectPath, type GraphEdge, type GraphNode } from './graph'
import { metricsFor } from './text'
import { ParseFail, type RPath, type RText } from './types'

const m = metricsFor()
const node = (id: string, parent?: string, w = 80, h = 40): GraphNode => ({
  id, width: w, height: h, parent,
  draw: (b) => [{ kind: 'shape', role: 'node', id, d: rectPath(b), paint: { fill: 'surface', tone: 'neutral', stroke: 'normal' } }],
})
const edge = (from: string, to: string, extra: Partial<GraphEdge> = {}): GraphEdge => ({ id: `${from}-${to}`, from, to, style: 'solid', ...extra })

describe('rectPath', () => {
  it('draws a closed rectangle, with rounded corners when asked, never rounder than half a side', () => {
    expect(rectPath({ x: 1, y: 2, width: 10, height: 20 })).toBe('M1,2h10v20h-10Z')
    expect(rectPath({ x: 0, y: 0, width: 10, height: 20 }, 4)).toContain('A4,4')
    expect(rectPath({ x: 0, y: 0, width: 10, height: 6 }, 99)).toContain('A3,3')
  })
})

describe('checkLimits', () => {
  it('passes within the defaults and throws a limit error beyond them', () => {
    expect(() => checkLimits(300, 600, {})).not.toThrow()
    expect(() => checkLimits(301, 0, {})).toThrow(ParseFail)
    try {
      checkLimits(5, 0, { maxNodes: 3 })
    } catch (e) {
      expect(e).toMatchObject({ code: 'limit', line: 1, column: 1 })
      expect((e as Error).message).toContain('5 nodes')
    }
    expect(() => checkLimits(1, 601, {})).toThrow(/601 connections/)
    expect(() => checkLimits(1, 5, { maxEdges: 4 })).toThrow(/maxEdges/)
  })
})

describe('drawGraph', () => {
  it('draws nodes, edges, label plates and cluster frames in paint order', () => {
    const d = drawGraph({
      direction: 'TB',
      nodes: [node('a', 'g'), node('b', 'g'), node('c')],
      edges: [edge('a', 'b', { label: 'go' }), edge('b', 'c', { style: 'dashed', thick: true, markerEnd: 'arrow' })],
      clusters: [{ id: 'g', title: 'Group' }, { id: 'h', parent: 'g', title: 'Inner' }],
    }, m, 'curved')
    const roles = d.items.map((i) => i.role)
    expect(roles.indexOf('cluster')).toBeLessThan(roles.indexOf('edge'))
    expect(roles.indexOf('edge')).toBeLessThan(roles.indexOf('node'))
    expect(roles.lastIndexOf('node')).toBeLessThan(roles.indexOf('edge-label'))
    expect(d.items.filter((i) => i.role === 'cluster')).toHaveLength(2)
    expect(d.width).toBeGreaterThan(80)
    expect(JSON.stringify(d.items)).not.toMatch(/NaN|Infinity/)
  })
  it('adds the margin around the layout', () => {
    const d = drawGraph({ direction: 'TB', nodes: [node('a')], edges: [] }, m, 'curved')
    expect([d.width, d.height]).toEqual([80 + 2 * m.margin, 40 + 2 * m.margin])
    expect(d.layout.nodes.get('a')).toMatchObject({ x: 0, y: 0 })
  })
  it('puts nodes at margin-shifted boxes so edges end on the drawn outline', () => {
    const d = drawGraph({ direction: 'TB', nodes: [node('a'), node('b')], edges: [edge('a', 'b', { markerEnd: 'arrow' })] }, m, 'straight')
    const p = d.items.find((i): i is RPath => i.kind === 'path')!
    const nums = p.d.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
    const b = d.layout.nodes.get('b')!
    expect(nums[nums.length - 1]).toBeCloseTo(b.y + m.margin)
  })
  it('skips hidden edges and edges that point at unknown nodes', () => {
    const d = drawGraph({ direction: 'TB', nodes: [node('a'), node('b')], edges: [edge('a', 'b', { hidden: true }), edge('a', 'zzz'), edge('zzz', 'b')] }, m, 'curved')
    expect(d.items.filter((i) => i.kind === 'path')).toHaveLength(0)
  })
  it('ignores blank labels and wraps long ones', () => {
    const blank = drawGraph({ direction: 'TB', nodes: [node('a'), node('b')], edges: [edge('a', 'b', { label: '  ' }), edge('b', 'a', { label: '<br/>' })] }, m, 'curved')
    expect(blank.items.some((i) => i.role === 'edge-label')).toBe(false)
    const long = drawGraph({ direction: 'TB', nodes: [node('a'), node('b')], edges: [edge('a', 'b', { label: 'a very long label that has to wrap across lines '.repeat(3) })] }, m, 'curved')
    const label = long.items.find((i): i is RText => i.role === 'edge-label')!
    expect(label.lines.length).toBeGreaterThan(1)
  })
  it('labels direct cluster edges at the middle of the path', () => {
    const d = drawGraph({
      direction: 'TB', nodes: [node('a', 'g')], edges: [edge('g', 'a', { label: 'inside' })], clusters: [{ id: 'g', title: 'G' }],
    }, m, 'curved')
    expect(d.items.some((i) => i.role === 'edge-label')).toBe(true)
  })
  it('draws self loops with their label', () => {
    const d = drawGraph({ direction: 'LR', nodes: [node('a')], edges: [edge('a', 'a', { label: 'again' })] }, m, 'curved')
    expect(d.items.filter((i) => i.kind === 'path')).toHaveLength(1)
    expect(d.items.find((i): i is RText => i.role === 'edge-label')!.lines).toEqual(['again'])
  })
  it('a custom paint and direction override on clusters', () => {
    const d = drawGraph({
      direction: 'TB', nodes: [node('a', 'g'), node('b', 'g')], edges: [edge('a', 'b')],
      clusters: [{ id: 'g', title: 'G', direction: 'LR', paint: { fill: 'none', tone: 'info', stroke: 'thick' } }],
    }, m, 'orthogonal')
    expect(d.items.find((i) => i.role === 'cluster')).toMatchObject({ paint: { fill: 'none', tone: 'info', stroke: 'thick' } })
    expect(d.layout.nodes.get('a')!.x).toBeLessThan(d.layout.nodes.get('b')!.x)
  })
  it('names the directions in words', () => {
    expect(DIRECTION_PHRASE).toEqual({ TB: 'top to bottom', BT: 'bottom to top', LR: 'left to right', RL: 'right to left' })
  })
})
