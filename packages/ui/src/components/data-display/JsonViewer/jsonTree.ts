/**
 * Pure helpers that turn any JS value into the flat list of visible rows the JsonViewer renders.
 * Everything here is iterative (no recursion) and guarded, so circular references, hostile getters, revoked
 * proxies and absurdly deep or wide data cannot hang or crash the viewer.
 */

export type JsonViewerValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'bigint'
  | 'symbol'
  | 'function'
  | 'date'
  | 'error'
  | 'object'
  | 'array'
  | 'map'
  | 'set'
  | 'circular'
  | 'unreadable'

export interface JsonViewerRow {
  /** `node` = a value, `more` = the "show N more" expander, `note` = the global row-budget notice. */
  kind: 'node' | 'more' | 'note'
  /** Unique, stable key (the JSON path for nodes). */
  key: string
  /** JSON path of the value, e.g. `$.users[0].name` (for `more` rows: of the container being extended). */
  path: string
  /** Zero-based nesting depth. */
  depth: number
  /** Key / index shown before the value. Undefined for the root. */
  label?: string
  /** True when the label is an array/set index (rendered muted). */
  indexLabel: boolean
  type: JsonViewerValueType
  /** Text shown for the value (leaf) or the summary (container). */
  text: string
  /** Longer text for a native tooltip when `text` was truncated. */
  title?: string
  truncated: boolean
  expandable: boolean
  expanded: boolean
  /** Number of children for containers. */
  size: number
  posinset: number
  setsize: number
  /** Row key of the parent (for ArrowLeft navigation). */
  parentKey?: string
  /** `more` rows: items still hidden and how many the click reveals. */
  remaining: number
  chunk: number
  /** `circular` rows: path of the ancestor the value points back to. */
  circularPath?: string
}

export interface JsonViewerBuildOptions {
  /** Expanded paths. `null` = nothing chosen yet, use `defaultDepth`. */
  expanded: ReadonlySet<string> | null
  /** Containers shallower than this are open when `expanded` is null. */
  defaultDepth: number
  /** Children rendered per container before the "show more" row. */
  maxItems: number
  /** Strings longer than this are cut with an ellipsis. */
  maxStringLength: number
  /** Extra children revealed per container path through "show more". */
  extra: ReadonlyMap<string, number>
  rootLabel?: string
}

/** Hard ceilings so hostile input cannot freeze the page. */
export const JSON_VIEWER_MAX_ROWS = 10_000
export const JSON_VIEWER_MAX_AUTO_DEPTH = 32
const MAX_COLLECT_VISITS = 50_000
const MAX_COLLECT_PATHS = 5_000
const TITLE_LIMIT = 1_000

const UNREADABLE = Symbol('unreadable')
const IDENT = /^[A-Za-z_$][\w$]*$/

interface Entry {
  label: string
  path: string
  value: unknown
  isIndex: boolean
}

interface Container {
  type: 'object' | 'array' | 'map' | 'set'
  size: number
  name: string
  entry(i: number, parentPath: string): Entry
}

interface Leaf {
  type: Exclude<JsonViewerValueType, 'object' | 'array' | 'map' | 'set' | 'circular'>
  text: string
  title?: string
  truncated: boolean
}

type Classified = { container: Container; leaf?: undefined } | { leaf: Leaf; container?: undefined }

export function propertyPath(parent: string, key: string): string {
  return IDENT.test(key) ? `${parent}.${key}` : `${parent}[${JSON.stringify(key)}]`
}

function primitiveKey(k: unknown): string | null {
  switch (typeof k) {
    case 'string':
      return JSON.stringify(k)
    case 'number':
    case 'boolean':
    case 'undefined':
      return String(k)
    case 'bigint':
      return `${k}n`
    case 'symbol':
      return k.toString()
    default:
      return k === null ? 'null' : null
  }
}

function safeGet(obj: object, key: string | number): unknown {
  try {
    return (obj as Record<string | number, unknown>)[key]
  } catch {
    return UNREADABLE
  }
}

function describe(v: object): Container {
  if (Array.isArray(v) || (ArrayBuffer.isView(v) && !(v instanceof DataView))) {
    const arr = v as ArrayLike<unknown>
    const name = Array.isArray(v) ? '' : (v.constructor?.name ?? 'TypedArray')
    return {
      type: 'array',
      size: arr.length,
      name,
      entry: (i, p) => ({ label: String(i), path: `${p}[${i}]`, value: safeGet(arr as object, i), isIndex: true }),
    }
  }
  if (v instanceof Map) {
    let items: [unknown, unknown][] | undefined
    return {
      type: 'map',
      size: v.size,
      name: 'Map',
      entry: (i, p) => {
        const [k, val] = (items ??= Array.from(v))[i]
        const pk = primitiveKey(k)
        return pk === null ? { label: `#${i}`, path: `${p}.get(#${i})`, value: val, isIndex: true } : { label: pk, path: `${p}.get(${pk})`, value: val, isIndex: false }
      },
    }
  }
  if (v instanceof Set) {
    let items: unknown[] | undefined
    return { type: 'set', size: v.size, name: 'Set', entry: (i, p) => ({ label: String(i), path: `${p}.values()[${i}]`, value: (items ??= Array.from(v))[i], isIndex: true }) }
  }
  const keys = Object.keys(v)
  const ctor = (v as { constructor?: { name?: unknown } }).constructor
  const ctorName = typeof ctor?.name === 'string' ? ctor.name : ''
  return {
    type: 'object',
    size: keys.length,
    name: ctorName === 'Object' ? '' : ctorName,
    entry: (i, p) => ({ label: keys[i], path: propertyPath(p, keys[i]), value: safeGet(v, keys[i]), isIndex: false }),
  }
}

function truncate(text: string, max: number): { text: string; title?: string; truncated: boolean } {
  if (text.length <= max) return { text: JSON.stringify(text), truncated: false }
  return { text: `"${JSON.stringify(text.slice(0, max)).slice(1, -1)}…"`, title: text.length > TITLE_LIMIT ? `${text.slice(0, TITLE_LIMIT)}…` : text, truncated: true }
}

function classify(v: unknown, maxStringLength: number): Classified {
  const leaf = (type: Leaf['type'], text: string): Classified => ({ leaf: { type, text, truncated: false } })
  try {
    if (v === UNREADABLE) return leaf('unreadable', '[unreadable]')
    switch (typeof v) {
      case 'string':
        return { leaf: { type: 'string', ...truncate(v, maxStringLength) } }
      case 'number':
        return leaf('number', Object.is(v, -0) ? '-0' : String(v))
      case 'boolean':
        return leaf('boolean', String(v))
      case 'undefined':
        return leaf('undefined', 'undefined')
      case 'bigint':
        return leaf('bigint', `${v}n`)
      case 'symbol':
        return leaf('symbol', v.toString())
      case 'function':
        return leaf('function', `ƒ ${v.name || 'anonymous'}()`)
    }
    if (v === null) return leaf('null', 'null')
    const obj = v as object
    if (obj instanceof Date) return leaf('date', Number.isNaN(obj.getTime()) ? 'Invalid Date' : obj.toISOString())
    if (obj instanceof Error) return leaf('error', `${obj.name}: ${obj.message}`)
    return { container: describe(obj) }
  } catch {
    return leaf('unreadable', '[unreadable]') // revoked proxies, throwing getters on exotic objects, ...
  }
}

function summary(c: Container): string {
  switch (c.type) {
    case 'array':
      return `${c.name ? `${c.name} ` : ''}[${c.size}]`
    case 'map':
    case 'set':
      return `${c.name}(${c.size})`
    default:
      return `${c.name ? `${c.name} ` : ''}{${c.size}}`
  }
}

const isObj = (v: unknown): v is object => typeof v === 'object' && v !== null

interface Frame {
  c: Container
  obj: object
  path: string
  depth: number
  key: string
  next: number
  end: number
}

/** Flatten `value` into the rows visible under the given expansion state. */
export function buildRows(root: unknown, o: JsonViewerBuildOptions): JsonViewerRow[] {
  const rows: JsonViewerRow[] = []
  const ancestors = new Map<object, string>()
  const stack: Frame[] = []

  function add(label: string | undefined, indexLabel: boolean, path: string, value: unknown, depth: number, posinset: number, setsize: number, parentKey: string | undefined) {
    const circular = isObj(value) ? ancestors.get(value) : undefined
    const base = { kind: 'node' as const, key: path, path, depth, label, indexLabel, posinset, setsize, parentKey, remaining: 0, chunk: 0 }
    if (circular !== undefined) {
      rows.push({ ...base, type: 'circular', text: '[Circular]', truncated: false, expandable: false, expanded: false, size: 0, circularPath: circular })
      return
    }
    const cls = classify(value, o.maxStringLength)
    if (cls.leaf) {
      rows.push({ ...base, type: cls.leaf.type, text: cls.leaf.text, title: cls.leaf.title, truncated: cls.leaf.truncated, expandable: false, expanded: false, size: 0 })
      return
    }
    const c = cls.container
    const expandable = c.size > 0
    const expanded = expandable && (o.expanded ? o.expanded.has(path) : depth < o.defaultDepth)
    rows.push({ ...base, type: c.type, text: summary(c), truncated: false, expandable, expanded, size: c.size })
    if (expanded) {
      const shown = Math.min(c.size, o.maxItems + (o.extra.get(path) ?? 0))
      stack.push({ c, obj: value as object, path, depth, key: path, next: 0, end: shown })
      ancestors.set(value as object, path)
    }
  }

  add(o.rootLabel, false, '$', root, 0, 1, 1, undefined)

  while (stack.length > 0) {
    if (rows.length >= JSON_VIEWER_MAX_ROWS) {
      rows.push({
        kind: 'note',
        key: '#note',
        path: '$',
        depth: 0,
        indexLabel: false,
        type: 'undefined',
        text: `Output truncated after ${JSON_VIEWER_MAX_ROWS.toLocaleString('en-US')} rows`,
        truncated: true,
        expandable: false,
        expanded: false,
        size: 0,
        posinset: 1,
        setsize: 1,
        remaining: 0,
        chunk: 0,
      })
      break
    }
    const f = stack[stack.length - 1]
    if (f.next >= f.end) {
      if (f.end < f.c.size) {
        const remaining = f.c.size - f.end
        rows.push({
          kind: 'more',
          key: `${f.path}::more`,
          path: f.path,
          depth: f.depth + 1,
          indexLabel: false,
          type: 'undefined',
          text: '',
          truncated: false,
          expandable: false,
          expanded: false,
          size: 0,
          posinset: f.end + 1,
          setsize: f.c.size,
          parentKey: f.key,
          remaining,
          chunk: Math.min(remaining, o.maxItems),
        })
      }
      stack.pop()
      ancestors.delete(f.obj)
      continue
    }
    const e = f.c.entry(f.next, f.path)
    add(e.label, e.isIndex, e.path, e.value, f.depth + 1, f.next + 1, f.c.size, f.key)
    f.next++
  }
  return rows
}

/**
 * Paths of containers that have children, down to `maxDepth` levels (exclusive), skipping circular back-references.
 * Bounded by visit/path ceilings so generated or enormous data cannot stall it.
 */
export function collectExpandablePaths(root: unknown, maxDepth: number): string[] {
  const out: string[] = []
  if (!isObj(root)) return out
  const ancestors = new Set<object>()
  const stack: { c: Container; obj: object; path: string; depth: number; next: number }[] = []
  let visits = 0

  function open(value: unknown, path: string, depth: number) {
    if (!isObj(value) || ancestors.has(value) || depth >= maxDepth || out.length >= MAX_COLLECT_PATHS) return
    const cls = classify(value, 0)
    if (!cls.container || cls.container.size === 0) return
    out.push(path)
    ancestors.add(value)
    stack.push({ c: cls.container, obj: value, path, depth, next: 0 })
  }

  open(root, '$', 0)
  while (stack.length > 0 && visits < MAX_COLLECT_VISITS) {
    const f = stack[stack.length - 1]
    if (f.next >= f.c.size) {
      stack.pop()
      ancestors.delete(f.obj)
      continue
    }
    const e = f.c.entry(f.next++, f.path)
    visits++
    open(e.value, e.path, f.depth + 1)
  }
  return out
}
