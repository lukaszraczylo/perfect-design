import { cn, type ClassValue } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/** Look of the bar. `plain` has no chrome, `outline` a border, `filled` a muted fill, `floating` a bordered popover surface with the shared `shadow-md`. */
export type ToolbarVariant = 'plain' | 'outline' | 'filled' | 'floating'
/** Height of the items: `sm` 32px, `md` 36px (default), `lg` 44px. Every size grows to 44px on coarse pointers. */
export type ToolbarSize = 'sm' | 'md' | 'lg'
/** Padding of the bar and inline padding of the items. */
export type ToolbarDensity = 'compact' | 'default' | 'spacious'
export type ToolbarOrientation = 'horizontal' | 'vertical'
/** What happens when the items do not fit: `wrap` onto more lines, or `scroll` inside the bar. */
export type ToolbarOverflow = 'wrap' | 'scroll'
/** Space between items. */
export type ToolbarGap = 'none' | 'sm' | 'md'
/** Fill of a `ToolbarButton`. `primary` is the one main action of the bar. */
export type ToolbarTone = 'neutral' | 'primary'

export const TOOLBAR_VARIANTS: readonly ToolbarVariant[] = ['plain', 'outline', 'filled', 'floating']
export const TOOLBAR_SIZES: readonly ToolbarSize[] = ['sm', 'md', 'lg']
export const TOOLBAR_DENSITIES: readonly ToolbarDensity[] = ['compact', 'default', 'spacious']
export const TOOLBAR_ORIENTATIONS: readonly ToolbarOrientation[] = ['horizontal', 'vertical']
export const TOOLBAR_OVERFLOWS: readonly ToolbarOverflow[] = ['wrap', 'scroll']
export const TOOLBAR_GAPS: readonly ToolbarGap[] = ['none', 'sm', 'md']
export const TOOLBAR_TONES: readonly ToolbarTone[] = ['neutral', 'primary']

/** Narrow an untrusted prop value to one of `allowed` (`lib/cva` does not fall back by itself). */
export function pickToolbar<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly unknown[]).includes(value) ? (value as T) : fallback
}

/**
 * The bar. It shrinks to its content (`w-fit`) and never grows past its container (`max-w-full`), so `overflow` decides
 * what happens at narrow widths: `wrap` flows onto more lines, `scroll` keeps one line and scrolls inside the bar (the
 * focused item is scrolled into view by the browser; the bar itself takes no tab stop, so roving focus stays intact).
 * Padding is large enough to hold the 3px focus ring of an item next to the edge.
 */
export const toolbarVariants = cva('flex w-fit max-w-full min-w-0', {
  variants: {
    variant: {
      plain: 'rounded-md',
      outline: 'rounded-md border bg-background',
      filled: 'rounded-md bg-muted forced-colors:border',
      floating: 'rounded-lg border bg-popover text-popover-foreground shadow-md',
    },
    orientation: {
      horizontal: 'flex-row items-center',
      vertical: 'flex-col items-stretch',
    },
    density: {
      compact: 'p-0.5',
      default: 'p-1',
      spacious: 'p-2',
    },
    gap: {
      none: 'gap-0',
      sm: 'gap-1',
      md: 'gap-2',
    },
    overflow: {
      wrap: 'flex-wrap',
      scroll: 'flex-nowrap',
    },
  },
  compoundVariants: [
    { overflow: 'scroll', orientation: 'horizontal', class: 'overflow-x-auto' },
    { overflow: 'scroll', orientation: 'vertical', class: 'overflow-y-auto' },
  ],
  defaultVariants: { variant: 'plain', orientation: 'horizontal', density: 'default', gap: 'sm', overflow: 'wrap' },
})

/** Shared by buttons, toggle items and links so the three look like one family. */
const itemBase = [
  'relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm border border-transparent font-medium select-none',
  'transition-colors motion-reduce:transition-none',
  'hover:bg-accent hover:text-accent-foreground',
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  'focus-visible:z-10 pointer-coarse:min-h-11 pointer-coarse:min-w-11',
  focusRing,
]

const itemSizes = {
  sm: 'h-8 min-w-8 text-sm',
  md: 'h-9 min-w-9 text-sm',
  lg: 'h-11 min-w-11 text-base',
}

/** Item definition. Variants of the bar reach the items through context; only `filled` changes how a pressed item looks. */
export const toolbarButtonVariants = cva(itemBase, {
  variants: {
    variant: { plain: '', outline: '', filled: '', floating: '' },
    size: itemSizes,
    density: {
      compact: 'px-1.5',
      default: 'px-2.5',
      spacious: 'px-3.5',
    },
    orientation: {
      horizontal: '',
      vertical: 'justify-start',
    },
    overflow: {
      wrap: '',
      /** The bar clips its children, so the ring is drawn inside the item. */
      scroll: 'focus-visible:ring-inset',
    },
    tone: {
      neutral: '',
      primary: 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
    },
  },
  defaultVariants: { variant: 'plain', size: 'md', density: 'default', orientation: 'horizontal', overflow: 'wrap', tone: 'neutral' },
})

/**
 * A pressed item is never shown by colour alone: it also gets a foreground-coloured border (a thicker one plus an
 * underline in forced-colors mode, where fills are dropped).
 */
const pressed =
  'data-[state=on]:border-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:hover:bg-accent forced-colors:data-[state=on]:border-2 forced-colors:data-[state=on]:underline'
const pressedFilled =
  'data-[state=on]:border-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:hover:bg-background forced-colors:data-[state=on]:border-2 forced-colors:data-[state=on]:underline'

export interface ToolbarItemVariantProps {
  variant?: ToolbarVariant | null
  size?: ToolbarSize | null
  density?: ToolbarDensity | null
  orientation?: ToolbarOrientation | null
  overflow?: ToolbarOverflow | null
  tone?: ToolbarTone | null
  class?: ClassValue
}

/** Classes of a `ToolbarToggleItem`: the button look plus the pressed state. Unknown values fall back to the defaults. */
export function toolbarToggleItemVariants(props: ToolbarItemVariantProps = {}): string {
  const variant = pickToolbar(props.variant, TOOLBAR_VARIANTS, 'plain')
  return cn(
    toolbarButtonVariants({ ...props, variant, tone: 'neutral', class: undefined }),
    variant === 'filled' ? pressedFilled : pressed,
    props.class,
  )
}

/** A link in the bar: the button look, underlined so it is told apart from a button without colour. */
export function toolbarLinkVariants(props: ToolbarItemVariantProps = {}): string {
  return cn(toolbarButtonVariants({ ...props, tone: 'neutral', class: undefined }), 'underline underline-offset-4', props.class)
}

/** Group of toggle items inside the bar. Its gap follows the bar. */
export const toolbarToggleGroupVariants = cva('flex min-w-0', {
  variants: {
    orientation: {
      horizontal: 'flex-row items-center',
      vertical: 'flex-col items-stretch',
    },
    gap: {
      none: 'gap-0',
      sm: 'gap-1',
      md: 'gap-2',
    },
  },
  defaultVariants: { orientation: 'horizontal', gap: 'sm' },
})

/**
 * Divider between items. `orientation` is the orientation of the BAR: the line itself runs the other way (a vertical
 * line in a horizontal bar). It is a border, so it survives forced-colors mode.
 */
export const toolbarSeparatorVariants = cva('shrink-0 self-stretch border-border', {
  variants: {
    orientation: {
      horizontal: 'my-1 w-0 border-s',
      vertical: 'mx-1 h-0 border-t',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})

export type ToolbarVariants = VariantProps<typeof toolbarVariants>
export type ToolbarButtonVariants = VariantProps<typeof toolbarButtonVariants>
