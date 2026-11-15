import { cva, type VariantProps } from '../../../lib/cva'

/**
 * DocsSidebar layout.
 *
 * - `variant`: `default` (pill links), `compact` (tighter spacing) and `rail` (plain links on a vertical rule with a marker
 *   on the current page, like a table of contents).
 * - Spacing classes conflict with the base on purpose: pass the result through `cn()` (the component does).
 */
export const docsSidebarVariants = cva('flex flex-col gap-6 text-sm', {
  variants: { variant: { default: '', compact: 'gap-4', rail: '' } },
  defaultVariants: { variant: 'default' },
})

export const docsSidebarTitleVariants = cva('mb-2 px-2 text-sm font-semibold text-muted-foreground', {
  variants: { variant: { default: '', compact: 'mb-1', rail: '' } },
  defaultVariants: { variant: 'default' },
})

export const docsSidebarListVariants = cva('flex flex-col gap-0.5', {
  variants: { variant: { default: '', compact: 'gap-0', rail: 'gap-0 border-s' } },
  defaultVariants: { variant: 'default' },
})

/** Link classes for the `rail` variant: a square-cornered marker on the inline start that is filled for the current page. */
export const DOCS_SIDEBAR_RAIL_LINK = '-ms-px w-full rounded-s-none border-s-2 border-transparent aria-[current=page]:border-primary'

export type DocsSidebarVariants = VariantProps<typeof docsSidebarVariants>
export type DocsSidebarVariant = NonNullable<DocsSidebarVariants['variant']>
export type DocsSidebarSize = 'sm' | 'md' | 'lg'
export const DOCS_SIDEBAR_VARIANTS: readonly DocsSidebarVariant[] = ['default', 'compact', 'rail']
export const DOCS_SIDEBAR_SIZES: readonly DocsSidebarSize[] = ['sm', 'md', 'lg']
