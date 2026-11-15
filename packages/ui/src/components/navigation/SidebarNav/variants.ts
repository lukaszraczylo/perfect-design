import { cva, type VariantProps } from '../../../lib/cva'

/**
 * SidebarNav surface.
 *
 * - `variant`: `default` (60-wide list with icons), `compact` (denser spacing, narrower) and `rail` (a narrow strip of
 *   tiles with the icon above a short label). `collapsed` always wins and shows icons only.
 * - Width and spacing classes conflict with the base on purpose: pass the result through `cn()` (the component does).
 */
export const sidebarNavVariants = cva(
  'flex h-full max-w-full flex-col gap-4 overflow-y-auto border-e border-sidebar-border bg-sidebar p-2 text-sidebar-foreground motion-safe:transition-[width] motion-safe:duration-200',
  {
    variants: {
      variant: { default: '', compact: 'gap-3 p-1.5', rail: 'items-stretch gap-3' },
      collapsed: { true: 'w-14', false: 'w-60' },
    },
    compoundVariants: [
      { variant: 'compact', collapsed: false, class: 'w-52' },
      { variant: 'rail', collapsed: false, class: 'w-20' },
    ],
    defaultVariants: { variant: 'default', collapsed: false },
  },
)

/** Group heading above a list of items. */
export const sidebarNavGroupLabelVariants = cva('px-3 pb-1 text-xs font-semibold text-sidebar-foreground', {
  variants: { variant: { default: '', compact: 'px-2', rail: 'px-1 text-center' } },
  defaultVariants: { variant: 'default' },
})

/** Extra classes for a link (or parent button) in the `rail` variant: icon above label, centred. */
export const SIDEBAR_RAIL_TILE = 'h-auto min-h-14 flex-col justify-center gap-1 px-1 py-2 text-center text-xs'

export type SidebarNavVariants = VariantProps<typeof sidebarNavVariants>
export type SidebarNavVariant = NonNullable<SidebarNavVariants['variant']>
export type SidebarNavSize = 'sm' | 'md' | 'lg'
export const SIDEBAR_NAV_VARIANTS: readonly SidebarNavVariant[] = ['default', 'compact', 'rail']
export const SIDEBAR_NAV_SIZES: readonly SidebarNavSize[] = ['sm', 'md', 'lg']
