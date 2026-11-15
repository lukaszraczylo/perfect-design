import { DEFAULT_LABELS, DEFAULT_OPERATORS, FILTER_FIELD_TYPES, FILTER_OPERATORS, type FilterBarLabels, type FilterField, type FilterFieldType, type FilterItem, type FilterOperatorId, type FilterOption } from './types'

/** C0, DEL, C1, line/paragraph separators and bidirectional overrides: never shown or serialised. */
export const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g
/** Keys that must never become an object key or a field id. */
export const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
/** Longest chip text. Longer values are cut with an ellipsis. */
export const MAX_CHIP_TEXT = 120

export const isFieldType = (v: unknown): v is FilterFieldType => typeof v === 'string' && (FILTER_FIELD_TYPES as readonly string[]).includes(v)
export const isOperatorId = (v: unknown): v is FilterOperatorId => typeof v === 'string' && Object.prototype.hasOwnProperty.call(FILTER_OPERATORS, v)

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

export function cleanOptions(options: unknown): FilterOption[] {
  if (!Array.isArray(options)) return []
  const seen = new Set<string>()
  const out: FilterOption[] = []
  for (const o of options) {
    if (!isObject(o) || typeof o.value !== 'string' || o.value === '' || seen.has(o.value)) continue
    seen.add(o.value)
    out.push({ value: o.value, label: typeof o.label === 'string' && o.label ? o.label : o.value, disabled: o.disabled === true })
  }
  return out
}

/** Keep usable fields: a non-empty string id (not a forbidden key) and label, a known type, unique ids. */
export function cleanFields(fields: unknown): FilterField[] {
  if (!Array.isArray(fields)) return []
  const seen = new Set<string>()
  const out: FilterField[] = []
  for (const f of fields) {
    if (!isObject(f) || typeof f.id !== 'string' || f.id === '' || FORBIDDEN_KEYS.has(f.id) || seen.has(f.id)) continue
    seen.add(f.id)
    out.push({ ...(f as unknown as FilterField), type: isFieldType(f.type) ? f.type : 'text', label: typeof f.label === 'string' && f.label ? f.label : f.id, options: cleanOptions(f.options) })
  }
  return out
}

/** Keep filters with a string id and field, a usable value, unique ids. */
export function cleanItems(items: unknown): FilterItem[] {
  if (!Array.isArray(items)) return []
  const seen = new Set<string>()
  const out: FilterItem[] = []
  for (const i of items) {
    if (!isObject(i) || typeof i.id !== 'string' || i.id === '' || typeof i.field !== 'string' || i.field === '' || seen.has(i.id)) continue
    if (i.value === undefined || i.value === null) continue
    seen.add(i.id)
    out.push(i as unknown as FilterItem)
  }
  return out
}

/** Operators for a field: its own subset when valid, otherwise the defaults of its type. */
export function operatorsFor(field: FilterField | undefined): FilterOperatorId[] {
  const type = isFieldType(field?.type) ? field!.type! : 'text'
  const own = Array.isArray(field?.operators) ? field!.operators!.filter(isOperatorId) : []
  return own.length ? [...new Set(own)] : DEFAULT_OPERATORS[type]
}

export const mergeLabels = (labels?: Partial<FilterBarLabels>): FilterBarLabels => {
  const out: FilterBarLabels = { ...DEFAULT_LABELS }
  if (isObject(labels)) {
    for (const k of Object.keys(DEFAULT_LABELS) as (keyof typeof DEFAULT_LABELS)[]) {
      const v = labels[k]
      if (typeof v === 'string' && v.trim() !== '') out[k] = v
    }
    if (isObject(labels.operators)) out.operators = labels.operators
  }
  return out
}

export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (m, k: string) => (Object.prototype.hasOwnProperty.call(values, k) ? values[k] : m))

const clamp = (s: string): string => {
  const clean = s.replace(CONTROL_CHARS, ' ').trim()
  return clean.length > MAX_CHIP_TEXT ? `${clean.slice(0, MAX_CHIP_TEXT - 1)}…` : clean
}

export function operatorLabel(op: string, labels: FilterBarLabels): string {
  const own = labels.operators && Object.prototype.hasOwnProperty.call(labels.operators, op) ? labels.operators[op] : undefined
  if (typeof own === 'string' && own) return own
  return isOperatorId(op) ? FILTER_OPERATORS[op] : op
}

export function valueText(item: FilterItem, field: FilterField | undefined, labels: FilterBarLabels): string {
  const labelOf = (v: string) => field?.options?.find((o) => o.value === v)?.label ?? v
  const v = item.value
  if (typeof v === 'boolean') return v ? labels.yes : labels.no
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string' || typeof x === 'number').map((x) => labelOf(String(x))).join(', ')
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : ''
  return typeof v === 'string' ? labelOf(v) : ''
}

/** The text of a chip: `item.label`, or "Field operator value" built from the field definitions. Never throws. */
export function describeFilter(item: FilterItem, fields: FilterField[], labels: FilterBarLabels = mergeLabels()): string {
  if (typeof item.label === 'string' && item.label.trim()) return clamp(item.label)
  const field = fields.find((f) => f.id === item.field)
  const op = item.operator ?? operatorsFor(field)[0]
  return clamp(`${field?.label ?? item.field} ${operatorLabel(op, labels)} ${valueText(item, field, labels)}`)
}
