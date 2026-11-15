/**
 * URL-query helpers for filters. A filter becomes one string `field:operator:value` under one key (default `filter`):
 *
 *   [{ field: 'status', operator: 'eq', value: 'open' }]  ->  { filter: ['status:eq:open'] }
 *
 * The result is a plain object that works with `URLSearchParams`, vue-router `query` and `new URL()`. Inside a segment `%`,
 * `:` and `,` are written `%25`, `%3A` and `%2C`; control characters are dropped. Multi-value filters join their values with
 * `,`. Parsing never throws: malformed, oversized or unknown entries are skipped, field ids that could pollute an object
 * (`__proto__`, `constructor`, `prototype`) are refused in both directions, and nothing is ever assigned to a key taken from
 * the input.
 */
import { CONTROL_CHARS, FORBIDDEN_KEYS, cleanOptions, isFieldType, operatorsFor } from './format'
import type { FilterField, FilterItem, FilterValue } from './types'

export interface FilterQueryOptions {
  /** Query key holding the filters. Default `filter`. */
  key?: string
  /** Most filters written or read. Default 50. */
  maxFilters?: number
  /** Longest single `field:operator:value` entry, in characters. Longer entries are skipped. Default 1000. */
  maxLength?: number
}

export interface QueryToFiltersOptions extends FilterQueryOptions {
  /** Field definitions. With them, unknown fields, operators outside the field's set and values that do not fit the type are skipped, and values are typed (number, boolean, array). Without them every field is accepted and values stay strings. */
  fields?: FilterField[]
}

export type FilterQuery = Record<string, string[]>
type QueryInput = Record<string, unknown> | URLSearchParams | null | undefined

const DEFAULT_KEY = 'filter'
const MAX_MULTI_VALUES = 100
const ESCAPES: Record<string, string> = { '%': '%25', ':': '%3A', ',': '%2C' }
const UNESCAPES: Record<string, string> = { '25': '%', '3A': ':', '2C': ',' }

const encode = (s: string): string => s.replace(CONTROL_CHARS, '').replace(/[%:,]/g, (c) => ESCAPES[c])
const decode = (s: string): string => s.replace(/%(25|3A|2C)/gi, (_m, h: string) => UNESCAPES[h.toUpperCase()]).replace(CONTROL_CHARS, '')

function limit(value: unknown, fallback: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 ? Math.min(Math.floor(value), max) : fallback
}
function queryKey(key: unknown): string {
  return typeof key === 'string' && key !== '' && !FORBIDDEN_KEYS.has(key) ? key : DEFAULT_KEY
}

function serialiseValue(value: unknown): string | null {
  if (typeof value === 'string') return value.replace(CONTROL_CHARS, '') === '' ? null : encode(value)
  if (typeof value === 'number') return Number.isFinite(value) ? encode(String(value)) : null
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) {
    const parts = value.filter((v): v is string | number => (typeof v === 'string' && v.replace(CONTROL_CHARS, '') !== '') || (typeof v === 'number' && Number.isFinite(v))).slice(0, MAX_MULTI_VALUES)
    return parts.length ? parts.map((v) => encode(String(v))).join(',') : null
  }
  return null
}

/** Serialise filters to a plain query object. Invalid entries are skipped. Returns `{}` when nothing remains. */
export function filtersToQuery(filters: readonly FilterItem[] | null | undefined, options: FilterQueryOptions = {}): FilterQuery {
  const key = queryKey(options?.key)
  const maxFilters = limit(options?.maxFilters, 50, 1000)
  const maxLength = limit(options?.maxLength, 1000, 100000)
  const entries: string[] = []
  if (Array.isArray(filters)) {
    for (const f of filters) {
      if (entries.length >= maxFilters) break
      try {
        if (typeof f !== 'object' || f === null || typeof f.field !== 'string') continue
        const field = f.field.replace(CONTROL_CHARS, '')
        if (field === '' || FORBIDDEN_KEYS.has(field)) continue
        const value = serialiseValue(f.value)
        if (value === null) continue
        const operator = typeof f.operator === 'string' ? encode(f.operator) : ''
        const entry = `${encode(field)}:${operator}:${value}`
        if (entry.length <= maxLength) entries.push(entry)
      } catch {
        // a throwing getter on a hostile item: skip it
      }
    }
  }
  const out: FilterQuery = {}
  if (entries.length) out[key] = entries
  return out
}

function rawEntries(query: QueryInput, key: string): unknown[] {
  if (typeof URLSearchParams !== 'undefined' && query instanceof URLSearchParams) return query.getAll(key)
  try {
    if (typeof query !== 'object' || query === null || !Object.prototype.hasOwnProperty.call(query, key)) return []
    const v = (query as Record<string, unknown>)[key]
    return Array.isArray(v) ? v : [v]
  } catch {
    return [] // a throwing getter or proxy
  }
}

const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i
function validDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return false
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]
}

function parseTyped(raw: string, field: FilterField): FilterValue | null {
  const type = isFieldType(field.type) ? field.type : 'text'
  const allowed = new Set(cleanOptions(field.options).map((o) => o.value))
  switch (type) {
    case 'number': {
      const s = decode(raw).trim()
      if (!NUMBER.test(s)) return null
      const n = Number(s)
      return Number.isFinite(n) ? n : null
    }
    case 'boolean':
      return raw === 'true' ? true : raw === 'false' ? false : null
    case 'date': {
      const s = decode(raw)
      return validDate(s) ? s : null
    }
    case 'select': {
      const s = decode(raw)
      return s !== '' && (allowed.size === 0 || allowed.has(s)) ? s : null
    }
    case 'multi-select': {
      const list = [...new Set(raw.split(',', MAX_MULTI_VALUES).map(decode).filter((s) => s !== '' && (allowed.size === 0 || allowed.has(s))))]
      return list.length ? list : null
    }
    default: {
      const s = decode(raw)
      return s.trim() === '' ? null : s
    }
  }
}

/** Parse a query object (or `URLSearchParams`) back into filters. Never throws; unusable entries are skipped. */
export function queryToFilters(query: QueryInput, options: QueryToFiltersOptions = {}): FilterItem[] {
  const key = queryKey(options?.key)
  const maxFilters = limit(options?.maxFilters, 50, 1000)
  const maxLength = limit(options?.maxLength, 1000, 100000)
  const fields = Array.isArray(options?.fields) ? options.fields.filter((f) => typeof f === 'object' && f !== null && typeof f.id === 'string') : undefined
  const out: FilterItem[] = []
  let looked = 0
  for (const entry of rawEntries(query, key)) {
    if (out.length >= maxFilters || ++looked > maxFilters * 4) break
    if (typeof entry !== 'string' || entry.length > maxLength) continue
    const parts = entry.split(':')
    if (parts.length !== 3) continue
    const field = decode(parts[0])
    if (field === '' || FORBIDDEN_KEYS.has(field)) continue
    const operator = decode(parts[1])
    let value: FilterValue | null
    if (fields) {
      const def = fields.find((f) => f.id === field)
      if (!def) continue
      if (operator !== '' && !(operatorsFor(def) as string[]).includes(operator)) continue
      value = parseTyped(parts[2], def)
    } else {
      if (operator !== '' && !/^[A-Za-z0-9_-]{1,32}$/.test(operator)) continue
      const s = decode(parts[2])
      value = s.trim() === '' ? null : s
    }
    if (value === null) continue
    const item: FilterItem = { id: `${field}-${out.length + 1}`, field, value }
    if (operator !== '') item.operator = operator
    out.push(item)
  }
  return out
}
