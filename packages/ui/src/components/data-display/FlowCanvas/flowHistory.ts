/**
 * Bounded undo and redo. Each entry is the state BEFORE a change plus a short label for the announcement. Undoing swaps
 * the entry with the current state, so redo is the same move in the other direction.
 */
import type { FlowEdge, FlowNode } from './types'

export interface FlowSnapshot {
  nodes: FlowNode[]
  edges: FlowEdge[]
}
interface Entry {
  state: FlowSnapshot
  label: string
  key?: string
  at: number
}

export const COALESCE_MS = 1000

export const cloneSnapshot = (nodes: readonly FlowNode[], edges: readonly FlowEdge[]): FlowSnapshot => ({
  nodes: nodes.map((n) => ({ ...n })),
  edges: edges.map((e) => ({ ...e })),
})

export function historyLimit(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(500, Math.max(1, Math.floor(value))) : 50
}

export interface FlowHistory {
  /** Remember `before` as the state to return to. Entries with the same `key` within one second merge into one step. */
  record: (before: FlowSnapshot, label: string, now: number, key?: string) => void
  undo: (current: FlowSnapshot) => { state: FlowSnapshot; label: string } | null
  redo: (current: FlowSnapshot) => { state: FlowSnapshot; label: string } | null
  clear: () => void
  setLimit: (limit: number) => void
  readonly undoSize: number
  readonly redoSize: number
}

export function createHistory(limit: number): FlowHistory {
  let max = limit
  let past: Entry[] = []
  let future: Entry[] = []
  const trim = () => {
    if (past.length > max) past = past.slice(past.length - max)
    if (future.length > max) future = future.slice(future.length - max)
  }
  return {
    record(before, label, now, key) {
      const last = past[past.length - 1]
      future = []
      if (key && last && last.key === key && now - last.at < COALESCE_MS) {
        last.at = now
        return
      }
      past.push({ state: before, label, key, at: now })
      trim()
    },
    undo(current) {
      const entry = past.pop()
      if (!entry) return null
      future.push({ state: current, label: entry.label, at: entry.at })
      trim()
      return { state: entry.state, label: entry.label }
    },
    redo(current) {
      const entry = future.pop()
      if (!entry) return null
      past.push({ state: current, label: entry.label, at: entry.at })
      trim()
      return { state: entry.state, label: entry.label }
    },
    clear() {
      past = []
      future = []
    },
    setLimit(limit) {
      max = limit
      trim()
    },
    get undoSize() {
      return past.length
    },
    get redoSize() {
      return future.length
    },
  }
}
