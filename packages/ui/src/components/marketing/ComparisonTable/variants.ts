import { cva, type VariantProps } from '../../../lib/cva'

export const COMPARISON_TABLE_VARIANTS = ['default', 'striped', 'bordered', 'minimal'] as const
export const COMPARISON_TABLE_SIZES = ['sm', 'md', 'lg'] as const

/** Scroll container (the framed surface). The inner <table> is full width and scrolls horizontally on small screens. */
export const comparisonTableVariants = cva('relative w-full overflow-x-auto bg-background text-foreground', {
  variants: {
    variant: {
      default: 'rounded-lg border',
      striped: 'rounded-lg border',
      bordered: 'rounded-lg border',
      minimal: '',
    },
  },
  defaultVariants: { variant: 'default' },
})

/** Every <th>/<td>. */
export const comparisonTableCellVariants = cva('align-middle', {
  variants: {
    size: { sm: 'px-3 py-2 text-sm', md: 'px-4 py-3 text-sm', lg: 'px-6 py-4 text-base' },
    variant: { default: '', striped: '', bordered: 'border', minimal: '' },
  },
  defaultVariants: { size: 'md', variant: 'default' },
})

export type ComparisonTableVariants = VariantProps<typeof comparisonTableVariants>
export type ComparisonTableVariant = (typeof COMPARISON_TABLE_VARIANTS)[number]
export type ComparisonTableSize = (typeof COMPARISON_TABLE_SIZES)[number]

/** Unknown values fall back to `default`. */
export function resolveComparisonTableVariant(value: unknown): ComparisonTableVariant {
  return (COMPARISON_TABLE_VARIANTS as readonly unknown[]).includes(value) ? (value as ComparisonTableVariant) : 'default'
}
/** Unknown values fall back to `md`. */
export function resolveComparisonTableSize(value: unknown): ComparisonTableSize {
  return (COMPARISON_TABLE_SIZES as readonly unknown[]).includes(value) ? (value as ComparisonTableSize) : 'md'
}

export type ComparisonKind = 'yes' | 'no' | 'text' | 'none'

/** How a cell value is rendered: true -> check, false -> cross, non-empty string / finite number -> text, anything else -> dash. */
export function comparisonKind(value: unknown): ComparisonKind {
  if (value === true) return 'yes'
  if (value === false) return 'no'
  if (typeof value === 'string' && value !== '') return 'text'
  if (typeof value === 'number' && Number.isFinite(value)) return 'text'
  return 'none'
}
