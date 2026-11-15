import { cva, type VariantProps } from '../../../lib/cva'

export const INSTALL_TABS_VARIANTS = ['default', 'minimal', 'contained'] as const
export const INSTALL_TABS_SIZES = ['sm', 'md', 'lg'] as const

/** Root frame. `default` = bordered card with a muted header, `minimal` = no frame (underlined tabs), `contained` = tray with pill tabs and a raised code panel. */
export const installTabsVariants = cva('', {
  variants: {
    variant: {
      default: 'overflow-hidden rounded-lg border bg-card text-card-foreground',
      minimal: 'bg-transparent text-foreground',
      contained: 'rounded-lg bg-muted p-2 text-foreground',
    },
    size: { sm: '', md: '', lg: '' },
  },
  defaultVariants: { variant: 'default', size: 'md' },
})

export const installTabsHeaderVariants = cva('flex items-center justify-between gap-2', {
  variants: {
    variant: {
      default: 'border-b bg-muted/50 px-2',
      minimal: 'border-b',
      contained: 'px-1 pb-2',
    },
  },
  defaultVariants: { variant: 'default' },
})

export const installTabsListVariants = cva('flex gap-1 overflow-x-auto', {
  variants: { variant: { default: 'py-1.5', minimal: '', contained: '' } },
  defaultVariants: { variant: 'default' },
})

export const installTabsTabVariants = cva('min-h-6 whitespace-nowrap font-medium text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11', {
  variants: {
    variant: {
      default: 'rounded-md',
      minimal: 'rounded-sm border-b-2 border-transparent',
      contained: 'rounded-md',
    },
    size: {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-4 py-2 text-base',
    },
    active: { true: '', false: '' },
  },
  compoundVariants: [
    // Forced-colors mode drops backgrounds and rings, so the active tab is also underlined.
    { variant: 'default', active: true, class: 'bg-background text-foreground forced-colors:underline forced-colors:underline-offset-4' },
    { variant: 'minimal', active: true, class: 'border-primary text-foreground forced-colors:underline forced-colors:underline-offset-4' },
    { variant: 'contained', active: true, class: 'bg-background text-foreground ring-1 ring-border forced-colors:underline forced-colors:underline-offset-4' },
  ],
  defaultVariants: { variant: 'default', size: 'md', active: false },
})

export const installTabsCopyVariants = cva('inline-flex min-h-6 shrink-0 items-center rounded-md font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground pointer-coarse:min-h-11', {
  variants: {
    size: {
      sm: 'gap-1 px-2 py-1 text-xs',
      md: 'gap-1.5 px-2.5 py-1.5 text-xs',
      lg: 'gap-2 px-3 py-2 text-sm',
    },
  },
  defaultVariants: { size: 'md' },
})

export const installTabsPanelVariants = cva('overflow-x-auto font-mono', {
  variants: {
    variant: {
      default: 'p-4',
      minimal: 'py-4',
      contained: 'rounded-md border bg-background p-4',
    },
    size: { sm: 'text-xs', md: 'text-sm', lg: 'text-base' },
  },
  defaultVariants: { variant: 'default', size: 'md' },
})

export type InstallTabsVariants = VariantProps<typeof installTabsVariants>
export type InstallTabsVariant = (typeof INSTALL_TABS_VARIANTS)[number]
export type InstallTabsSize = (typeof INSTALL_TABS_SIZES)[number]
