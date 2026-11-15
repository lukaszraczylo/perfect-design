import { cva, type VariantProps } from '../../../lib/cva'

export const commandSizes = ['sm', 'md', 'lg'] as const
export const commandVariantNames = ['palette', 'inline'] as const

export type CommandSize = (typeof commandSizes)[number]
export type CommandVariant = (typeof commandVariantNames)[number]

/** Unknown / missing values fall back to `md`. */
export const normalizeCommandSize = (value: unknown): CommandSize => ((commandSizes as readonly unknown[]).includes(value) ? (value as CommandSize) : 'md')
/** Unknown / missing values fall back to `palette`. */
export const normalizeCommandVariant = (value: unknown): CommandVariant => ((commandVariantNames as readonly unknown[]).includes(value) ? (value as CommandVariant) : 'palette')

/**
 * Command surface.
 *
 * - `variant`: `palette` (default) is borderless and fills the surface it sits in (a `CommandDialog` or a popover);
 *   `inline` adds a border and a light shadow so the command list can sit in a page like a card.
 * Wrap the result in `cn()` when you use `commandVariants` outside the component.
 */
export const commandVariants = cva('flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground', {
  variants: {
    variant: {
      palette: '',
      inline: 'border shadow-xs',
    },
  },
  defaultVariants: { variant: 'palette' },
})

/** Search row. `size` sets the height and padding. */
export const commandInputWrapperVariants = cva('flex items-center border-b', {
  variants: {
    size: {
      sm: 'h-9 gap-1.5 px-2',
      md: 'h-11 gap-2 px-3',
      lg: 'h-14 gap-3 px-4',
    },
  },
  defaultVariants: { size: 'md' },
})

/** Text of the search field (16px at `lg`). */
export const commandInputVariants = cva(
  'h-full w-full rounded-sm bg-transparent outline-hidden placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 forced-colors:focus-visible:outline-2 forced-colors:focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: { size: { sm: 'text-sm', md: 'text-sm', lg: 'text-base' } },
    defaultVariants: { size: 'md' },
  },
)

/** Scrollable result list. `size` sets the maximum height and the padding. */
export const commandListVariants = cva('scroll-py-1 overflow-x-hidden overflow-y-auto', {
  variants: {
    size: {
      sm: 'max-h-56 p-0.5',
      md: 'max-h-80 p-1',
      lg: 'max-h-96 p-1.5',
    },
  },
  defaultVariants: { size: 'md' },
})

/** Row spacing and type on top of the shared menu row. `md` adds nothing. */
export const commandItemVariants = cva('', {
  variants: {
    size: {
      sm: 'gap-1.5 px-1.5 py-1 text-xs [&_svg:not([class*="size-"])]:size-3.5',
      md: '',
      lg: 'gap-3 px-3 py-2 text-base [&_svg:not([class*="size-"])]:size-5',
    },
  },
  defaultVariants: { size: 'md' },
})

export const commandHeadingVariants = cva('font-medium text-muted-foreground', {
  variants: {
    size: {
      sm: 'px-1.5 py-1 text-2xs',
      md: 'px-2 py-1.5 text-xs',
      lg: 'px-3 py-2 text-sm',
    },
  },
  defaultVariants: { size: 'md' },
})

export const commandEmptyVariants = cva('text-center text-muted-foreground', {
  variants: {
    size: {
      sm: 'py-6 text-xs',
      md: 'py-8 text-sm',
      lg: 'py-10 text-base',
    },
  },
  defaultVariants: { size: 'md' },
})

export const commandShortcutVariants = cva('', {
  variants: { size: { sm: 'text-2xs', md: '', lg: 'text-sm' } },
  defaultVariants: { size: 'md' },
})

/** Width of a `CommandDialog`, applied from the `sm` breakpoint. */
export const commandDialogWidth: Record<CommandSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-2xl',
}

export type CommandVariants = VariantProps<typeof commandVariants>
