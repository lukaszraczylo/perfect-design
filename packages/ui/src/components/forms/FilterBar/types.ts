/** Field types a filter can be built for. */
export const FILTER_FIELD_TYPES = ['text', 'number', 'select', 'multi-select', 'date', 'boolean'] as const
export type FilterFieldType = (typeof FILTER_FIELD_TYPES)[number]

/** Operator ids the bar knows. A field may restrict itself to a subset with `operators`. */
export const FILTER_OPERATORS = {
  eq: 'is',
  neq: 'is not',
  contains: 'contains',
  not_contains: 'does not contain',
  starts: 'starts with',
  ends: 'ends with',
  gt: 'is greater than',
  gte: 'is at least',
  lt: 'is less than',
  lte: 'is at most',
  before: 'is before',
  after: 'is after',
  in: 'is any of',
  nin: 'is none of',
} as const
export type FilterOperatorId = keyof typeof FILTER_OPERATORS

/** Operators offered per field type, first one is the default. */
export const DEFAULT_OPERATORS: Record<FilterFieldType, FilterOperatorId[]> = {
  text: ['contains', 'eq', 'neq', 'not_contains', 'starts', 'ends'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
  select: ['eq', 'neq'],
  'multi-select': ['in', 'nin'],
  date: ['eq', 'before', 'after'],
  boolean: ['eq'],
}

export interface FilterOption {
  value: string
  label: string
  disabled?: boolean
}

export interface FilterField {
  /** Stable identifier, used in `FilterItem.field` and in the URL query. Unique within `fields`. */
  id: string
  /** Visible name of the field. */
  label: string
  /** Value editor and operator set. Defaults to `text`. */
  type?: FilterFieldType
  /** Choices for `select` and `multi-select`. */
  options?: FilterOption[]
  /** Restrict the operators offered (ids from `FILTER_OPERATORS`). Unknown ids are ignored. */
  operators?: FilterOperatorId[]
  /** Placeholder of the `text` editor. */
  placeholder?: string
  /** Lower bound for `number` (number) and `date` (ISO `YYYY-MM-DD`). */
  min?: number | string
  /** Upper bound for `number` (number) and `date` (ISO `YYYY-MM-DD`). */
  max?: number | string
  /** Increment of the `number` editor. */
  step?: number
}

export type FilterValue = string | number | boolean | string[]

/** One applied filter. */
export interface FilterItem {
  /** Unique id of this filter (used for keys and removal). */
  id: string
  /** `FilterField.id` the filter applies to. */
  field: string
  /** Operator id. Omitted means the default operator of the field type. */
  operator?: string
  value: FilterValue
  /** Text shown on the chip instead of the generated "Field operator value" sentence. */
  label?: string
}

export interface FilterBarLabels {
  /** Accessible name of the whole bar. */
  group: string
  add: string
  clear: string
  field: string
  operator: string
  value: string
  apply: string
  cancel: string
  /** Name of the remove button. `{filter}` is the chip text. */
  remove: string
  yes: string
  no: string
  choose: string
  /** Error shown when the draft value is empty or out of range. */
  valueRequired: string
  /** Live region texts. `{filter}` is the chip text. */
  added: string
  removed: string
  cleared: string
  /** Overrides for operator wording, keyed by operator id. */
  operators?: Partial<Record<string, string>>
}

export const DEFAULT_LABELS: Omit<FilterBarLabels, 'operators'> = {
  group: 'Filters',
  add: 'Add filter',
  clear: 'Clear all',
  field: 'Field',
  operator: 'Condition',
  value: 'Value',
  apply: 'Apply filter',
  cancel: 'Cancel',
  remove: 'Remove filter: {filter}',
  yes: 'Yes',
  no: 'No',
  choose: 'Choose a value',
  valueRequired: 'Enter a value within the allowed range.',
  added: 'Added filter: {filter}.',
  removed: 'Removed filter: {filter}.',
  cleared: 'All filters cleared.',
}
