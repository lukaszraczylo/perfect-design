import type { IconDefinition } from '../../../lib/icons-tools'

export interface TreeItem {
  /** Unique id. Duplicate ids are ignored (first wins). */
  id: string
  label: string
  children?: TreeItem[]
  icon?: IconDefinition
  /** Disabled nodes can be focused but not selected or toggled. */
  disabled?: boolean
}

export interface FlatTreeNode {
  item: TreeItem
  /** 1-based depth (ARIA `aria-level`). */
  level: number
  parentId: string | null
  /** 1-based position among siblings (ARIA `aria-posinset`). */
  posinset: number
  /** Sibling count (ARIA `aria-setsize`). */
  setsize: number
  hasChildren: boolean
}

/**
 * Flatten the visible part of a tree (children of collapsed nodes are skipped) in display order.
 * Robust against duplicate ids, shared node objects (cycles) and non-array `children`.
 */
export function flattenTree(items: readonly TreeItem[], expanded: ReadonlySet<string>): FlatTreeNode[] {
  const out: FlatTreeNode[] = []
  const seenIds = new Set<string>()
  const seenObjects = new Set<TreeItem>()
  const walk = (nodes: readonly TreeItem[], level: number, parentId: string | null) => {
    const valid = nodes.filter((n) => n && typeof n === 'object' && !seenObjects.has(n) && !seenIds.has(n.id))
    // Also drop duplicates that occur inside this very sibling list.
    const unique = valid.filter((n, i) => valid.findIndex((m) => m.id === n.id) === i)
    unique.forEach((item, i) => {
      seenIds.add(item.id)
      seenObjects.add(item)
      const kids = Array.isArray(item.children) ? item.children : []
      out.push({ item, level, parentId, posinset: i + 1, setsize: unique.length, hasChildren: kids.length > 0 })
      if (kids.length > 0 && expanded.has(item.id)) walk(kids, level + 1, item.id)
    })
  }
  walk(Array.isArray(items) ? items : [], 1, null)
  return out
}

/** Ids of every node that has children (used by expand-all). */
export function branchIds(items: readonly TreeItem[]): string[] {
  const ids: string[] = []
  const seen = new Set<TreeItem>()
  const walk = (nodes: readonly TreeItem[]) => {
    for (const n of nodes) {
      if (!n || seen.has(n)) continue
      seen.add(n)
      if (Array.isArray(n.children) && n.children.length > 0) {
        ids.push(n.id)
        walk(n.children)
      }
    }
  }
  walk(Array.isArray(items) ? items : [])
  return ids
}

export type TreeCheckState = 'checked' | 'unchecked' | 'indeterminate'

/** Ids of the leaf nodes under (and including, when it is a leaf) `item`; guards cycles and junk. */
export function leafIds(item: TreeItem): string[] {
  const out: string[] = []
  const seen = new Set<TreeItem>()
  const walk = (n: TreeItem) => {
    if (!n || typeof n !== 'object' || seen.has(n)) return
    seen.add(n)
    if (Array.isArray(n.children) && n.children.length > 0) n.children.forEach(walk)
    else out.push(n.id)
  }
  walk(item)
  return out
}

/** Check state of a node: a leaf is checked when its id is in `checked`; a branch derives from its leaves. */
export function checkState(item: TreeItem, checked: ReadonlySet<string>): TreeCheckState {
  const leaves = leafIds(item)
  const count = leaves.filter((id) => checked.has(id)).length
  if (count === 0) return 'unchecked'
  return count === leaves.length ? 'checked' : 'indeterminate'
}

export interface TreeGuide {
  /** Ancestor depth the vertical rule belongs to (1-based). */
  depth: number
  /** Rule only covers the top half of the row (it ends at this row: the "elbow"). */
  half: boolean
}

/**
 * Connector-line geometry for visible nodes: for every node, which ancestor rules pass through its row.
 * A rule for depth `d` continues while the ancestor-or-self at level `d + 1` has later siblings.
 */
export function connectorGuides(flat: readonly FlatTreeNode[]): Map<string, TreeGuide[]> {
  const out = new Map<string, TreeGuide[]>()
  const lastAt: boolean[] = []
  for (const node of flat) {
    lastAt[node.level] = node.posinset === node.setsize
    lastAt.length = node.level + 1
    const guides: TreeGuide[] = []
    for (let d = 1; d < node.level; d++) {
      if (d === node.level - 1) guides.push({ depth: d, half: lastAt[node.level]! })
      else if (!lastAt[d + 1]) guides.push({ depth: d, half: false })
    }
    out.set(node.item.id, guides)
  }
  return out
}
