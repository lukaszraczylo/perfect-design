/**
 * Data normalisation for NetworkGraph. Pure and tolerant: bad entries are counted and dropped, never thrown on.
 */
import { isFiniteNumber } from '../_chart/chartMath'

export interface GraphNode {
  /** Unique id; edges refer to it. A repeated id is ignored (the first node wins). */
  id: string
  /** Visible and accessible name. Defaults to the id. */
  label?: string
  /** Group name: colour and marker shape of the node, and one hull in `variant="grouped"`. */
  group?: string
  /** Relative size. Without it the node grows with its weighted degree. */
  size?: number
}

export interface GraphEdge {
  from: string
  to: string
  /** Relative strength (positive number). Drives the line width; counts towards the node degree. */
  weight?: number
  /** Draw an arrowhead at `to`. Overrides the `directed` prop. */
  directed?: boolean
  /** Short text on the line (variant `labelled`) and in the text alternative. */
  label?: string
}

export interface NormNode {
  id: string
  label: string
  group: string | null
  /** Index of `group` in `NormGraph.groups`, -1 without a group. */
  groupIndex: number
  /** Explicit valid `size`, otherwise null. */
  size: number | null
  /** Sum of the weights of the incident edges (a self loop counts once). */
  degree: number
  /** Number of incident edges (a self loop counts once). */
  connections: number
}

export interface NormEdge {
  from: number
  to: number
  /** Valid explicit weight, otherwise null. */
  weight: number | null
  directed: boolean
  label: string
  self: boolean
}

export interface NormGraph {
  nodes: NormNode[]
  edges: NormEdge[]
  groups: string[]
  /** Unique valid nodes before the `maxNodes` cap. */
  total: number
  capped: boolean
  /** Entries repeating an id that was already taken. */
  duplicates: number
  /** Node entries without a usable id. */
  invalidNodes: number
  /** Edges dropped because an endpoint is unknown (or was cut by the cap), or the entry is not an edge. */
  skippedEdges: number
}

export const DEFAULT_MAX_NODES = 300
export const MAX_NODES_LIMIT = 5000
const MAX_WEIGHT = 1e12

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** An id is a non-empty string or a finite number; anything else is unusable. */
export function nodeId(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() === '' ? null : v
  if (isFiniteNumber(v)) return String(v)
  return null
}

/** `maxNodes` as an integer in 1..5000; anything else is the default of 300. */
export function normalizeMaxNodes(v: unknown): number {
  if (!isFiniteNumber(v)) return DEFAULT_MAX_NODES
  return Math.min(MAX_NODES_LIMIT, Math.max(1, Math.floor(v)))
}

export function normalizeGraph(nodes: unknown, edges: unknown, maxNodes: unknown, defaultDirected = false): NormGraph {
  const cap = normalizeMaxNodes(maxNodes)
  const index = new Map<string, number>()
  const out: NormNode[] = []
  const groups: string[] = []
  let duplicates = 0
  let invalidNodes = 0
  let total = 0
  for (const raw of Array.isArray(nodes) ? nodes : []) {
    const id = isRecord(raw) ? nodeId(raw.id) : null
    if (id === null) {
      invalidNodes++
      continue
    }
    if (index.has(id)) {
      duplicates++
      continue
    }
    total++
    if (out.length >= cap) {
      index.set(id, -1)
      continue
    }
    const r = raw as Record<string, unknown>
    const g = typeof r.group === 'string' && r.group.trim() !== '' ? r.group : null
    let groupIndex = -1
    if (g !== null) {
      groupIndex = groups.indexOf(g)
      if (groupIndex < 0) groupIndex = groups.push(g) - 1
    }
    index.set(id, out.length)
    out.push({
      id,
      label: typeof r.label === 'string' && r.label.trim() !== '' ? r.label : isFiniteNumber(r.label) ? String(r.label) : id,
      group: g,
      groupIndex,
      size: isFiniteNumber(r.size) && r.size > 0 ? Math.min(r.size, MAX_WEIGHT) : null,
      degree: 0,
      connections: 0,
    })
  }
  const list: NormEdge[] = []
  let skippedEdges = 0
  for (const raw of Array.isArray(edges) ? edges : []) {
    const a = isRecord(raw) ? nodeId(raw.from) : null
    const b = isRecord(raw) ? nodeId(raw.to) : null
    const ia = a === null ? undefined : index.get(a)
    const ib = b === null ? undefined : index.get(b)
    if (ia === undefined || ib === undefined || ia < 0 || ib < 0) {
      skippedEdges++
      continue
    }
    const r = raw as Record<string, unknown>
    const weight = isFiniteNumber(r.weight) && r.weight > 0 ? Math.min(r.weight, MAX_WEIGHT) : null
    list.push({
      from: ia,
      to: ib,
      weight,
      directed: typeof r.directed === 'boolean' ? r.directed : defaultDirected,
      label: typeof r.label === 'string' ? r.label : '',
      self: ia === ib,
    })
  }
  for (const e of list) {
    const w = e.weight ?? 1
    out[e.from]!.degree = Math.min(MAX_WEIGHT, out[e.from]!.degree + w)
    out[e.from]!.connections++
    if (!e.self) {
      out[e.to]!.degree = Math.min(MAX_WEIGHT, out[e.to]!.degree + w)
      out[e.to]!.connections++
    }
  }
  return { nodes: out, edges: list, groups, total, capped: total > out.length, duplicates, invalidNodes, skippedEdges }
}

/** `A to B` for a directed connection, `A and B` otherwise, plus weight and label when present. */
export function describeEdge(g: NormGraph, e: NormEdge): string {
  const a = g.nodes[e.from]!.label
  const b = g.nodes[e.to]!.label
  const extra = [e.weight !== null ? `weight ${formatPlain(e.weight)}` : '', e.label].filter(Boolean).join(', ')
  return `${a} ${e.directed ? 'to' : 'and'} ${b}${extra ? ` (${extra})` : ''}`
}

export function formatPlain(n: number): string {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(n)
}

/** Messages shown under the chart when the data was cut or cleaned. */
export function graphNotes(g: NormGraph): string[] {
  const out: string[] = []
  if (g.capped) out.push(`Showing the first ${g.nodes.length} of ${g.total} nodes`)
  if (g.duplicates) out.push(`${g.duplicates} duplicate node ${g.duplicates === 1 ? 'id' : 'ids'} ignored`)
  if (g.invalidNodes) out.push(`${g.invalidNodes} ${g.invalidNodes === 1 ? 'entry' : 'entries'} without an id ignored`)
  if (g.skippedEdges) out.push(`${g.skippedEdges} ${g.skippedEdges === 1 ? 'connection' : 'connections'} skipped: unknown node id`)
  return out
}
