export interface GoLiteralOptions {
  /** `natural` writes `42` and `3.5` (an `int` and a `float64` once stored in `any`); `float64` writes every number as `float64(42)`, matching `encoding/json`. */
  numbers?: 'natural' | 'float64'
}

export interface GoPackageOptions extends GoLiteralOptions {
  /** Go package name. Invalid identifiers fall back to `main`. */
  packageName?: string
  /** Variable that receives the literal. Invalid identifiers fall back to `data`. */
  variable?: string
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/
const RAW_UNSAFE = /[`\r\u0000-\u0008\u000b-\u001f\u007f-\u009f\u2028\u2029\ufeff]/

/** Go interpreted string literal: escapes `\\`, `"`, control characters and characters Go source treats specially. */
export function goQuote(s: string): string {
  let out = '"'
  for (const ch of s) {
    const code = ch.codePointAt(0)!
    if (ch === '"') out += '\\"'
    else if (ch === '\\') out += '\\\\'
    else if (ch === '\n') out += '\\n'
    else if (ch === '\t') out += '\\t'
    else if (ch === '\r') out += '\\r'
    else if (code < 0x20 || code === 0x7f) out += `\\x${code.toString(16).padStart(2, '0')}`
    else if ((code >= 0x80 && code <= 0x9f) || code === 0x2028 || code === 0x2029 || code === 0xfeff) out += `\\u${code.toString(16).padStart(4, '0')}`
    else if (code >= 0xd800 && code <= 0xdfff) out += '\\ufffd'
    else out += ch
  }
  return `${out}"`
}

/** Multi-line strings without backticks or control characters read better as raw literals; everything else is quoted. */
function goString(s: string): string {
  return s.includes('\n') && !RAW_UNSAFE.test(s) ? `\`${s}\`` : goQuote(s)
}

function goNumber(n: number, mode: 'natural' | 'float64'): { text: string; math: boolean } {
  if (Number.isNaN(n)) return { text: 'math.NaN()', math: true }
  if (n === Infinity) return { text: 'math.Inf(1)', math: true }
  if (n === -Infinity) return { text: 'math.Inf(-1)', math: true }
  const text = Object.is(n, -0) ? 'math.Copysign(0, -1)' : String(n)
  const math = Object.is(n, -0)
  const wide = !Number.isSafeInteger(n) && Number.isInteger(n) // 1e21 prints as 1e+21, which is a float constant already
  if (mode === 'float64') return { text: `float64(${text})`, math }
  return { text: wide ? `float64(${text})` : text, math }
}

/**
 * Render a JS value as a Go composite literal in gofmt style (tabs, trailing commas, aligned map values).
 * Objects and Maps become `map[string]any{...}`, arrays and Sets `[]any{...}`, `null`/`undefined` `nil`, Dates their ISO 8601 string.
 * `NaN` and infinities use `math.NaN()` / `math.Inf`, so the result needs `import "math"`. Functions and symbols are skipped in maps and `nil` in slices.
 * Circular references throw a `TypeError` naming the path.
 */
export function goLiteral(value: unknown, options: GoLiteralOptions = {}): string {
  return build(value, options).text
}

interface Built {
  text: string
  math: boolean
}

function build(value: unknown, options: GoLiteralOptions): Built {
  const mode = options.numbers === 'float64' ? 'float64' : 'natural'
  const stack: object[] = []
  let math = false
  const skipped = (v: unknown) => v === undefined || typeof v === 'function' || typeof v === 'symbol'

  function node(v: unknown, depth: number, path: string): string {
    if (v === null || skipped(v)) return 'nil'
    if (typeof v === 'string') return goString(v)
    if (typeof v === 'boolean') return String(v)
    if (typeof v === 'bigint') return `int64(${v})`
    if (typeof v === 'number') {
      const n = goNumber(v, mode)
      math ||= n.math
      return n.text
    }
    const obj = v as object
    if (obj instanceof Date) return Number.isNaN(obj.getTime()) ? 'nil' : goQuote(obj.toISOString())
    if (stack.includes(obj)) throw new TypeError(`Cannot render a circular structure as a Go literal (cycle at ${path})`)
    stack.push(obj)
    try {
      if (Array.isArray(obj) || obj instanceof Set || ArrayBuffer.isView(obj)) return slice(Array.from(obj as Iterable<unknown>), depth, path)
      const items = obj instanceof Map ? [...obj.entries()].map(([k, val]): [string, unknown] => [String(k), val]) : Object.entries(obj)
      return map(items, depth, path)
    } finally {
      stack.pop()
    }
  }

  function slice(items: unknown[], depth: number, path: string): string {
    if (items.length === 0) return '[]any{}'
    const pad = '\t'.repeat(depth + 1)
    const lines = items.map((item, i) => `${pad}${node(item, depth + 1, `${path}[${i}]`)},`)
    return `[]any{\n${lines.join('\n')}\n${'\t'.repeat(depth)}}`
  }

  function map(items: [string, unknown][], depth: number, path: string): string {
    const kept = items.filter(([, v]) => !skipped(v))
    if (kept.length === 0) return 'map[string]any{}'
    const pad = '\t'.repeat(depth + 1)
    const rows = kept.map(([k, v]) => ({ key: `${goQuote(k)}:`, value: node(v, depth + 1, `${path}.${k}`) }))
    // gofmt aligns values of consecutive single-line entries; a multi-line value ends the run.
    const lines: string[] = []
    for (let i = 0; i < rows.length; ) {
      let j = i
      while (j < rows.length && !rows[j].value.includes('\n')) j++
      const run = rows.slice(i, Math.max(j, i + 1))
      const width = Math.max(...run.map((r) => r.key.length))
      for (const r of run) lines.push(`${pad}${r.key.padEnd(width)} ${r.value},`)
      i += run.length
    }
    return `map[string]any{\n${lines.join('\n')}\n${'\t'.repeat(depth)}}`
  }

  const text = node(value, 0, '$')
  return { text, math }
}

/** Wrap the literal in a minimal compilable file: `package`, an `import "math"` when needed and `var data = ...`. */
export function goPackageSource(value: unknown, options: GoPackageOptions = {}): string {
  const pkg = options.packageName && IDENT.test(options.packageName) ? options.packageName : 'main'
  const name = options.variable && IDENT.test(options.variable) ? options.variable : 'data'
  const { text, math } = build(value, options)
  return `package ${pkg}\n\n${math ? 'import "math"\n\n' : ''}var ${name} = ${text}`
}
