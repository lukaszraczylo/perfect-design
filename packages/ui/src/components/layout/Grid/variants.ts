import { cva, type VariantProps } from '../../../lib/cva'

/** Fixed class maps: every Tailwind class is spelled out so the source scanner generates it. */
export type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export const colsClasses: Record<string, string> = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-2',
  '3': 'grid-cols-3',
  '4': 'grid-cols-4',
  '5': 'grid-cols-5',
  '6': 'grid-cols-6',
  '7': 'grid-cols-7',
  '8': 'grid-cols-8',
  '9': 'grid-cols-9',
  '10': 'grid-cols-10',
  '11': 'grid-cols-11',
  '12': 'grid-cols-12',
}

export const smColsClasses: Record<string, string> = {
  '1': 'sm:grid-cols-1',
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-3',
  '4': 'sm:grid-cols-4',
  '5': 'sm:grid-cols-5',
  '6': 'sm:grid-cols-6',
  '7': 'sm:grid-cols-7',
  '8': 'sm:grid-cols-8',
  '9': 'sm:grid-cols-9',
  '10': 'sm:grid-cols-10',
  '11': 'sm:grid-cols-11',
  '12': 'sm:grid-cols-12',
}

export const mdColsClasses: Record<string, string> = {
  '1': 'md:grid-cols-1',
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-3',
  '4': 'md:grid-cols-4',
  '5': 'md:grid-cols-5',
  '6': 'md:grid-cols-6',
  '7': 'md:grid-cols-7',
  '8': 'md:grid-cols-8',
  '9': 'md:grid-cols-9',
  '10': 'md:grid-cols-10',
  '11': 'md:grid-cols-11',
  '12': 'md:grid-cols-12',
}

export const lgColsClasses: Record<string, string> = {
  '1': 'lg:grid-cols-1',
  '2': 'lg:grid-cols-2',
  '3': 'lg:grid-cols-3',
  '4': 'lg:grid-cols-4',
  '5': 'lg:grid-cols-5',
  '6': 'lg:grid-cols-6',
  '7': 'lg:grid-cols-7',
  '8': 'lg:grid-cols-8',
  '9': 'lg:grid-cols-9',
  '10': 'lg:grid-cols-10',
  '11': 'lg:grid-cols-11',
  '12': 'lg:grid-cols-12',
}

export const xlColsClasses: Record<string, string> = {
  '1': 'xl:grid-cols-1',
  '2': 'xl:grid-cols-2',
  '3': 'xl:grid-cols-3',
  '4': 'xl:grid-cols-4',
  '5': 'xl:grid-cols-5',
  '6': 'xl:grid-cols-6',
  '7': 'xl:grid-cols-7',
  '8': 'xl:grid-cols-8',
  '9': 'xl:grid-cols-9',
  '10': 'xl:grid-cols-10',
  '11': 'xl:grid-cols-11',
  '12': 'xl:grid-cols-12',
}

/**
 * Auto-fit / auto-fill column templates. Both use the same class, `grid-cols-(--grid-template)`, and the component sets
 * `--grid-template` inline (`repeat(auto-fit, minmax(min(100%, <width>), 1fr))`); `min(100%, ...)` stops overflow on narrow containers.
 */
export const autoColsClasses = {
  fit: 'grid-cols-(--grid-template)',
  fill: 'grid-cols-(--grid-template)',
} as const

/** The `grid-template-columns` value for auto-fit / auto-fill with a minimum item width. */
export function autoGridTemplate(minWidth: string, fill: boolean): string {
  return `repeat(${fill ? 'auto-fill' : 'auto-fit'}, minmax(min(100%, ${minWidth}), 1fr))`
}

const CSS_LENGTH = /^(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|ch|vw|%)$/

/**
 * Normalise `minItemWidth`: a positive finite number means pixels, a string must be a plain CSS length
 * (px, rem, em, ch, vw, %). Anything else (empty, negative, `calc()` injection, NaN) yields `undefined`.
 */
export function resolveMinItemWidth(value: unknown): string | undefined {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? `${value}px` : undefined
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  return CSS_LENGTH.test(v) && parseFloat(v) > 0 ? v : undefined
}

/**
 * Grid look presets (the column and gap maps above stay separate because their values come from numeric props).
 *
 * - `variant`: how each direct child (cell) is drawn. `plain` (default) leaves cells alone; `bordered` gives every cell a
 *   hairline border and `p-4`; `card` adds `bg-card text-card-foreground`. Cells get `min-w-0` so long content cannot widen a track.
 *   These rules use child selectors, so they win over utilities on the items: change them with `class` on the grid
 *   (for example `[&>*]:p-6`), which tailwind-merge resolves.
 * - `layout`: emphasis. `uniform` (default) is equal cells. `lead`: the first item spans the whole row at every width, the
 *   rest flow below it. `feature`: from `md` up the first item spans 2 columns and 2 rows (give the grid at least 3 columns
 *   from `md`); below `md` it is an ordinary cell, so it reflows to the base `cols` at 320px. `auto-cols-fr` keeps any
 *   implicit column from overflowing when `cols` is 1.
 */
export const gridVariants = cva('grid', {
  variants: {
    variant: {
      plain: '',
      bordered: '[&>*]:min-w-0 [&>*]:rounded-lg [&>*]:border [&>*]:border-border [&>*]:p-4',
      card: '[&>*]:min-w-0 [&>*]:rounded-lg [&>*]:border [&>*]:border-border [&>*]:bg-card [&>*]:p-4 [&>*]:text-card-foreground',
    },
    layout: {
      uniform: '',
      lead: '[&>:first-child]:col-span-full',
      feature: 'md:auto-cols-fr md:[&>:first-child]:col-span-2 md:[&>:first-child]:row-span-2',
    },
  },
  defaultVariants: { variant: 'plain', layout: 'uniform' },
})

export type GridVariants = VariantProps<typeof gridVariants>
export type GridVariant = NonNullable<GridVariants['variant']>
export type GridLayout = NonNullable<GridVariants['layout']>
export const gridVariantNames: readonly GridVariant[] = ['plain', 'bordered', 'card']
export const gridLayouts: readonly GridLayout[] = ['uniform', 'lead', 'feature']
