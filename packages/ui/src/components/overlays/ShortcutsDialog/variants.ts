import { cva, type VariantProps } from '../../../lib/cva'

export const shortcutsDialogSizes = ['sm', 'md', 'lg', 'xl'] as const
export const shortcutsDialogLayouts = ['list', 'columns'] as const
export const shortcutsDialogDensities = ['comfortable', 'compact'] as const
export const shortcutsDialogHeadingLevels = [3, 4, 5, 6] as const

export type ShortcutsDialogSize = (typeof shortcutsDialogSizes)[number]
export type ShortcutsDialogLayout = (typeof shortcutsDialogLayouts)[number]
export type ShortcutsDialogDensity = (typeof shortcutsDialogDensities)[number]
export type ShortcutsDialogHeadingLevel = (typeof shortcutsDialogHeadingLevels)[number]

/**
 * Container of the shortcut groups.
 *
 * - `layout`: `list` stacks the groups in one column (default); `columns` places them in two columns from the `sm`
 *   breakpoint up and stays one column below it. Pair `columns` with `size="lg"` or `xl`.
 */
export const shortcutsDialogVariants = cva('grid min-w-0 gap-6', {
  variants: {
    layout: {
      list: 'grid-cols-[minmax(0,1fr)]',
      columns: 'grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(2,minmax(0,1fr))] sm:gap-x-8',
    },
  },
  defaultVariants: { layout: 'list' },
})

/**
 * One shortcut row (description on the start side, keys on the end side).
 *
 * - `density`: `comfortable` is the default; `compact` tightens the row padding and the text, for long lists.
 */
export const shortcutsDialogItemVariants = cva('flex min-w-0 items-center justify-between gap-4 border-b border-border last:border-b-0', {
  variants: {
    density: {
      comfortable: 'py-2 text-sm',
      compact: 'py-1 text-xs',
    },
  },
  defaultVariants: { density: 'comfortable' },
})

export type ShortcutsDialogVariants = VariantProps<typeof shortcutsDialogVariants>
export type ShortcutsDialogItemVariants = VariantProps<typeof shortcutsDialogItemVariants>

const pick = <T extends string | number>(list: readonly T[], value: unknown, fallback: T): T => ((list as readonly unknown[]).includes(value) ? (value as T) : fallback)

export const normalizeShortcutsDialogSize = (value: unknown) => pick(shortcutsDialogSizes, value, 'md')
export const normalizeShortcutsDialogLayout = (value: unknown) => pick(shortcutsDialogLayouts, value, 'list')
export const normalizeShortcutsDialogDensity = (value: unknown) => pick(shortcutsDialogDensities, value, 'comfortable')
export const normalizeShortcutsDialogHeadingLevel = (value: unknown) => pick(shortcutsDialogHeadingLevels, value, 3)
