export interface YamlStringifyOptions {
  /** Spaces per nesting level: 2 or 4. Anything else falls back to 2. */
  indent?: 2 | 4
}

const RESERVED = /^(?:true|false|yes|no|on|off|y|n|null|~)$/i
const NUMERIC = /^[-+]?(?:0x[0-9a-f_]+|0o[0-7_]+|0b[01_]+|\d[\d_,]*(?:\.\d*)?(?:e[-+]?\d+)?|\.\d[\d_]*(?:e[-+]?\d+)?|\.(?:inf|nan))$/i
const TIMESTAMP = /^\d{4}-\d{1,2}-\d{1,2}(?:$|[Tt\s])/
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\ufeff]/
const BLOCK_UNSAFE = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u2028\u2029\ufeff]/

type Node = { kind: 'inline'; text: string } | { kind: 'scalar'; header: string; lines: string[] } | { kind: 'block'; lines: string[] }

/** True when `s` can be written without quotes and still read back as the same string. */
export function isPlainSafe(s: string): boolean {
  if (s === '' || s !== s.trim() || CONTROL.test(s)) return false
  if (RESERVED.test(s) || NUMERIC.test(s) || TIMESTAMP.test(s) || s === '<<') return false
  if (/^[-?:](?:\s|$)/.test(s) || /^[,[\]{}#&*!|>'"%@`]/.test(s) || /^(?:---|\.\.\.)/.test(s)) return false
  return !(s.includes(': ') || s.includes(' #') || s.endsWith(':'))
}

/** Double-quoted YAML scalar. JSON string syntax is valid YAML; the extra characters YAML treats as line breaks are escaped. */
export function quote(s: string): string {
  return JSON.stringify(s).replace(/[\u0080-\u009f\u2028\u2029\ufeff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
}

function scalarString(s: string, col: number, allowBlock: boolean): Node {
  if (isPlainSafe(s)) return { kind: 'inline', text: s }
  if (allowBlock && s.includes('\n') && !BLOCK_UNSAFE.test(s) && /^[^\s]|^\t/.test(s) && s.trim() !== '') {
    const trailing = /\n*$/.exec(s)![0].length
    const body = s.slice(0, s.length - trailing).split('\n')
    const lines = body.map((l) => (l ? ' '.repeat(col) + l : ''))
    for (let i = 1; i < trailing; i++) lines.push('')
    return { kind: 'scalar', header: trailing === 0 ? '|-' : trailing === 1 ? '|' : '|+', lines }
  }
  return { kind: 'inline', text: quote(s) }
}

function number(n: number): string {
  if (Number.isNaN(n)) return '.nan'
  if (n === Infinity) return '.inf'
  if (n === -Infinity) return '-.inf'
  return Object.is(n, -0) ? '-0.0' : String(n)
}

/**
 * Serialise a JS value to block-style YAML 1.2 text (no trailing newline).
 * Strings are quoted only when plain text would change meaning (`yes`, `null`, `12`, `a: b`, leading `-`, `#`...); multi-line strings become
 * `|` blocks with the right chomping indicator. `undefined`, functions and symbols are skipped in maps and written as `null` in lists.
 * Date -> ISO 8601, Map -> mapping, Set and typed arrays -> sequence, bigint -> integer. Key order is the engine's own order (insertion order,
 * except integer-like keys, which JS sorts first). Circular references throw a `TypeError` naming the path; shared (non-circular) references are written twice.
 */
export function yamlStringify(value: unknown, options: YamlStringifyOptions = {}): string {
  const indent = options.indent === 4 ? 4 : 2
  const stack: object[] = []

  function skipped(v: unknown): boolean {
    return v === undefined || typeof v === 'function' || typeof v === 'symbol'
  }

  function entries(v: object): [string, unknown][] {
    if (v instanceof Map) return [...v.entries()].map(([k, val]) => [String(k), val])
    return Object.entries(v)
  }

  function node(v: unknown, col: number, path: string): Node {
    if (v === null || skipped(v)) return { kind: 'inline', text: 'null' }
    if (typeof v === 'string') return scalarString(v, col === 0 ? indent : col, true)
    if (typeof v === 'number') return { kind: 'inline', text: number(v) }
    if (typeof v === 'boolean' || typeof v === 'bigint') return { kind: 'inline', text: String(v) }
    const obj = v as object
    if (obj instanceof Date) return { kind: 'inline', text: Number.isNaN(obj.getTime()) ? 'null' : obj.toISOString() }
    const toJSON = (obj as { toJSON?: unknown }).toJSON
    if (typeof toJSON === 'function') return node(toJSON.call(obj), col, path)
    if (stack.includes(obj)) throw new TypeError(`Cannot stringify a circular structure to YAML (cycle at ${path})`)
    stack.push(obj)
    try {
      const isSeq = Array.isArray(obj) || obj instanceof Set || ArrayBuffer.isView(obj)
      if (isSeq) return sequence(Array.from(obj as Iterable<unknown>), col, path)
      return mapping(entries(obj), col, path)
    } finally {
      stack.pop()
    }
  }

  function mapping(items: [string, unknown][], col: number, path: string): Node {
    const pad = ' '.repeat(col)
    const lines: string[] = []
    for (const [k, val] of items) {
      if (skipped(val)) continue
      const keyNode = scalarString(k, 0, false)
      const key = keyNode.kind === 'inline' ? keyNode.text : quote(k)
      const child = node(val, col + indent, `${path}.${k}`)
      if (child.kind === 'inline') lines.push(`${pad}${key}: ${child.text}`)
      else if (child.kind === 'scalar') lines.push(`${pad}${key}: ${child.header}`, ...child.lines)
      else lines.push(`${pad}${key}:`, ...child.lines)
    }
    return lines.length ? { kind: 'block', lines } : { kind: 'inline', text: '{}' }
  }

  function sequence(items: unknown[], col: number, path: string): Node {
    if (items.length === 0) return { kind: 'inline', text: '[]' }
    const pad = ' '.repeat(col)
    const lines: string[] = []
    items.forEach((item, i) => {
      const child = node(item, col + 2, `${path}[${i}]`)
      if (child.kind === 'inline') lines.push(`${pad}- ${child.text}`)
      else if (child.kind === 'scalar') lines.push(`${pad}- ${child.header}`, ...child.lines)
      else lines.push(`${pad}- ${child.lines[0].slice(col + 2)}`, ...child.lines.slice(1))
    })
    return { kind: 'block', lines }
  }

  const root = node(value, 0, '$')
  if (root.kind === 'inline') return root.text
  if (root.kind === 'scalar') return [root.header, ...root.lines].join('\n')
  return root.lines.join('\n')
}
