import type { DataGridRowId } from './types'

export type HeaderState = 'none' | 'some' | 'all'

/** State of the select-all checkbox for the ids currently in the grid. */
export function headerState(selected: ReadonlySet<DataGridRowId>, ids: readonly DataGridRowId[]): HeaderState {
  if (ids.length === 0 || selected.size === 0) return 'none'
  let hit = 0
  for (const id of ids) if (selected.has(id)) hit++
  return hit === 0 ? 'none' : hit === ids.length ? 'all' : 'some'
}

/** Toggle one id. Returns a new array. */
export function toggleId(selected: readonly DataGridRowId[], id: DataGridRowId, on?: boolean): DataGridRowId[] {
  const has = selected.includes(id)
  const want = on ?? !has
  if (want === has) return selected.slice()
  return want ? [...selected, id] : selected.filter((x) => x !== id)
}

/** Select or deselect every row between two positions of the visible order (inclusive, either direction). */
export function applyRange(selected: readonly DataGridRowId[], order: readonly DataGridRowId[], from: number, to: number, on: boolean): DataGridRowId[] {
  const lo = Math.max(0, Math.min(from, to))
  const hi = Math.min(order.length - 1, Math.max(from, to))
  const set = new Set(selected)
  for (let i = lo; i <= hi; i++) {
    if (on) set.add(order[i])
    else set.delete(order[i])
  }
  return [...set]
}

/** Select all ids (keeping any selected id that is not in the list, e.g. filtered out) or clear them. */
export function setAll(selected: readonly DataGridRowId[], ids: readonly DataGridRowId[], on: boolean): DataGridRowId[] {
  const set = new Set(selected)
  for (const id of ids) {
    if (on) set.add(id)
    else set.delete(id)
  }
  return [...set]
}
