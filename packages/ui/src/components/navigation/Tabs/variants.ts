import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/**
 * Tabs styling.
 *
 * - `variant`: `line` (underline, default), `pill` (muted track with a raised active tab), `segmented` (bordered track, solid
 *   active segment) and `enclosed` (boxed tabs, the active one merges with the panel).
 * - `size`: `sm` | `md` (default) | `lg`. `md` adds nothing, so the default output is the variant alone.
 * - `fullWidth`: horizontal lists stretch across the container and the triggers share the width.
 * - Size and variant padding are separate classes that conflict on purpose: run the result through `cn()` (the components
 *   do) so tailwind-merge keeps the later size classes when you reuse these on plain elements.
 */
export const tabsListVariants = cva(
  'inline-flex max-w-full items-center overflow-x-auto text-muted-foreground data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-[orientation=vertical]:overflow-visible',
  {
    variants: {
      variant: {
        line: 'gap-1 border-b data-[orientation=vertical]:border-e data-[orientation=vertical]:border-b-0',
        pill: 'gap-1 rounded-lg bg-muted p-1 text-foreground',
        segmented: 'gap-0.5 rounded-md border border-input bg-background p-0.5 text-foreground',
        enclosed: 'gap-1 border-b data-[orientation=vertical]:border-e data-[orientation=vertical]:border-b-0',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
      fullWidth: {
        true: 'data-[orientation=horizontal]:flex data-[orientation=horizontal]:w-full',
        false: '',
      },
    },
    defaultVariants: { variant: 'line', size: 'md', fullWidth: false },
  },
)

export const tabsTriggerVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm font-medium motion-safe:transition-colors select-none',
    'disabled:pointer-events-none disabled:opacity-50 pointer-coarse:min-h-11',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
    'hover:text-foreground data-[state=active]:text-foreground forced-colors:data-[state=active]:underline',
    focusRing,
  ],
  {
    variants: {
      variant: {
        line: 'relative border-b-2 border-transparent px-3 py-2 focus-visible:ring-inset data-[state=active]:border-primary data-[orientation=vertical]:justify-start data-[orientation=vertical]:border-b-0 data-[orientation=vertical]:border-e-2 data-[orientation=vertical]:border-e-transparent data-[orientation=vertical]:data-[state=active]:border-e-primary',
        pill: 'rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        segmented:
          'rounded-sm px-3 py-1.5 focus-visible:ring-inset data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:hover:text-primary-foreground data-[orientation=vertical]:justify-start',
        enclosed:
          'rounded-t-md border border-b-0 border-border bg-muted px-3 py-2 text-foreground focus-visible:ring-inset data-[state=active]:bg-background data-[state=active]:text-foreground data-[orientation=vertical]:justify-start data-[orientation=vertical]:rounded-t-none data-[orientation=vertical]:rounded-s-md data-[orientation=vertical]:border-b data-[orientation=vertical]:border-e-0',
      },
      size: {
        sm: 'text-xs',
        md: '',
        lg: 'text-base',
      },
      fullWidth: {
        true: 'grow',
        false: '',
      },
    },
    compoundVariants: [
      { variant: ['line', 'enclosed'], size: 'sm', class: 'px-2 py-1' },
      { variant: ['line', 'enclosed'], size: 'lg', class: 'px-4 py-2.5' },
      { variant: ['pill', 'segmented'], size: 'sm', class: 'px-2 py-1' },
      { variant: ['pill', 'segmented'], size: 'lg', class: 'px-4 py-2' },
    ],
    defaultVariants: { variant: 'line', size: 'md', fullWidth: false },
  },
)

export type TabsListVariants = VariantProps<typeof tabsListVariants>
export type TabsVariant = NonNullable<TabsListVariants['variant']>
export type TabsSize = NonNullable<TabsListVariants['size']>
export const TABS_VARIANTS: readonly TabsVariant[] = ['line', 'pill', 'segmented', 'enclosed']
export const TABS_SIZES: readonly TabsSize[] = ['sm', 'md', 'lg']
