import { cva, type VariantProps } from '../../../lib/cva'

export const tableAlignVariants = cva('', {
  variants: {
    align: { left: 'text-start', center: 'text-center', right: 'text-end' },
  },
  defaultVariants: { align: 'left' },
})

export const TABLE_DENSITIES = ['default', 'compact', 'comfortable'] as const
export const TABLE_SIZES = ['sm', 'md', 'lg'] as const
export const TABLE_VARIANTS = ['default', 'borderless', 'filled'] as const
export const TABLE_LAYOUTS = ['table', 'cards'] as const
export type TableDensity = (typeof TABLE_DENSITIES)[number]
export type TableSize = (typeof TABLE_SIZES)[number]
export type TableVariant = (typeof TABLE_VARIANTS)[number]
export type TableLayout = (typeof TABLE_LAYOUTS)[number]

/**
 * Table root. `md` keeps the original `text-sm`; `sm` and `lg` replace it (pass the result through `cn` when you use it on
 * a plain element, so the later text size wins). `cards` turns the table into stacked cards below the `sm` breakpoint.
 */
export const tableVariants = cva('group/table w-full caption-bottom border-collapse text-sm', {
  variants: {
    size: { sm: 'text-xs', md: '', lg: 'text-base' },
    layout: { table: '', cards: 'max-sm:block' },
  },
  defaultVariants: { size: 'md', layout: 'table' },
})

/** Below `sm` a `cards` table hides its header row visually (it stays in the accessibility tree and shows on keyboard focus). */
export const tableHeaderCardsClasses = 'max-sm:block max-sm:sr-only max-sm:focus-within:not-sr-only'
/** Below `sm` each body row is a bordered card; the last-row rule moves to `sm` and up so the final card keeps its frame. */
export const tableBodyCardsClasses = 'max-sm:block sm:[&_tr:last-child]:border-0'
export const tableFooterCardsClasses = 'max-sm:block'
export const tableCaptionCardsClasses = 'max-sm:block'

export const tableHeadVariants = cva(
  [
    'h-10 px-3 align-middle text-sm font-medium whitespace-nowrap text-muted-foreground',
    'group-data-[density=compact]/table:h-8 group-data-[density=compact]/table:px-2',
    'group-data-[sticky]/table:sticky group-data-[sticky]/table:top-0 group-data-[sticky]/table:z-10 group-data-[sticky]/table:bg-background',
  ],
  {
    variants: {
      align: { left: 'text-start', center: 'text-center', right: 'text-end' },
      density: { default: '', compact: '', comfortable: 'h-12 px-4' },
      size: { sm: 'text-xs', md: '', lg: 'text-base' },
      /** `filled` gives the header row a muted band (also when pinned with `stickyHeader`). */
      variant: { default: '', borderless: '', filled: 'bg-muted group-data-[sticky]/table:bg-muted' },
      layout: { table: '', cards: 'max-sm:block max-sm:h-auto max-sm:px-0 max-sm:whitespace-normal' },
    },
    defaultVariants: { align: 'left', density: 'default', size: 'md', variant: 'default', layout: 'table' },
  },
)

export const tableCellVariants = cva(
  ['p-3 align-middle', 'group-data-[density=compact]/table:p-2'],
  {
    variants: {
      align: { left: 'text-start', center: 'text-center', right: 'text-end' },
      numeric: { true: 'tabular-nums', false: '' },
      /** Vertical alignment inside the row: `middle` (default), `top` for multi-line neighbours, `bottom`. */
      valign: { middle: '', top: 'align-top', bottom: 'align-bottom' },
      density: { default: '', compact: '', comfortable: 'p-4' },
      size: { sm: 'text-xs', md: '', lg: 'text-base' },
      /** Below `sm`, `cards` lays the cell out as a label and value pair (the label comes from the `label` prop). */
      layout: {
        table: '',
        cards:
          'max-sm:flex max-sm:items-start max-sm:justify-between max-sm:gap-4 max-sm:px-0 max-sm:py-1.5 max-sm:group-data-[density=compact]/table:px-0 max-sm:group-data-[density=compact]/table:py-1',
      },
    },
    defaultVariants: { align: 'left', numeric: false, valign: 'middle', density: 'default', size: 'md', layout: 'table' },
  },
)

const rowBase = 'border-b border-border transition-colors'
const rowHover = 'hover:bg-muted/50'
const rowSelected = 'data-[state=selected]:bg-muted data-[state=selected]:text-foreground'

export const tableRowClasses = `${rowBase} ${rowHover} ${rowSelected}`
/** Row classes when the table is not `hoverable`: no hover tint, selection styling unchanged. */
export const tableRowStaticClasses = `${rowBase} ${rowSelected}`
/** Zebra stripe for body rows only (`in-[tbody]` is a zero-specificity ancestor check, so hover/selected still win). */
export const tableRowStripedClasses = 'in-[tbody]:even:bg-muted/30'
/** Keeps the hover tint visible on striped (even) rows, where the stripe would otherwise win on source order. */
export const tableRowStripedHoverClasses = 'in-[tbody]:even:hover:bg-muted/50'

/** `borderless`: body rows lose their divider (transparent, so forced-colors mode still draws it); the header rule stays. */
export const tableRowBorderlessClasses = 'in-[tbody]:border-transparent'
/** `cards`, below `sm`: a body row is a bordered, rounded block with a gap to the next one. */
export const tableRowCardsClasses = 'max-sm:block max-sm:in-[tbody]:mb-3 max-sm:in-[tbody]:rounded-lg max-sm:in-[tbody]:border max-sm:in-[tbody]:border-border max-sm:in-[tbody]:p-3 max-sm:in-[tbody]:last:mb-0'

/** Selected-row emphasis. `muted` is the default; `accent` uses the primary tint. */
export const tableRowSelectedTones = {
  muted: '',
  accent: 'data-[state=selected]:bg-primary/10 aria-selected:bg-primary/10',
} as const

/** Classes the `Table` root adds for `bordered` (outer frame lives on the container; column rules on the table). */
export const tableBorderedContainerClasses = 'rounded-md border border-border'
export const tableBorderedClasses = '[&_:is(th,td)]:border-border [&_:is(th,td):not(:first-child)]:border-s'

export type TableAlign = NonNullable<VariantProps<typeof tableAlignVariants>['align']>
export type TableSelectedTone = keyof typeof tableRowSelectedTones
export type TableHeadVariants = VariantProps<typeof tableHeadVariants>
export type TableCellVariants = VariantProps<typeof tableCellVariants>
