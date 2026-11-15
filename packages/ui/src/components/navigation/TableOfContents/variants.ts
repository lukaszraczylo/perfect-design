import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/**
 * TableOfContents looks.
 *
 * - `variant`: `line` (default, a thin rule with a marker on the current entry), `rail` (a thicker rule, the marker sits on
 *   it) and `boxed` (a bordered card; the current entry is filled instead of marked).
 * - `size`: `sm` | `md` (default) | `lg` text size.
 * - Variant classes conflict with the base on purpose: pass the result through `cn()` (the component does).
 */
export const tocVariants = cva('text-sm', {
  variants: {
    variant: { line: '', rail: '', boxed: 'rounded-lg border bg-card p-4 text-card-foreground' },
    size: { sm: 'text-xs', md: '', lg: 'text-base' },
  },
  defaultVariants: { variant: 'line', size: 'md' },
})

export const tocTitleVariants = cva('mb-3 text-xs font-semibold text-muted-foreground', {
  variants: { size: { sm: '', md: '', lg: 'text-sm' } },
  defaultVariants: { size: 'md' },
})

export const tocListVariants = cva('flex flex-col border-s', {
  variants: { variant: { line: '', rail: 'border-s-2', boxed: 'border-s-0' } },
  defaultVariants: { variant: 'line' },
})

export const tocLinkVariants = cva(
  [
    '-ms-px block min-h-6 rounded-e-sm border-s-2 border-transparent py-1 pe-2 text-muted-foreground motion-safe:transition-colors hover:text-foreground aria-[current=location]:border-primary aria-[current=location]:font-medium aria-[current=location]:text-foreground forced-colors:aria-[current=location]:underline',
    focusRing,
  ],
  {
    variants: {
      variant: {
        line: '',
        rail: '-ms-0.5',
        boxed: 'ms-0 rounded-md border-s-0 aria-[current=location]:bg-accent aria-[current=location]:text-accent-foreground',
      },
    },
    defaultVariants: { variant: 'line' },
  },
)

export type TableOfContentsVariants = VariantProps<typeof tocVariants>
export type TableOfContentsVariant = NonNullable<TableOfContentsVariants['variant']>
export type TableOfContentsSize = NonNullable<TableOfContentsVariants['size']>
export const TOC_VARIANTS: readonly TableOfContentsVariant[] = ['line', 'rail', 'boxed']
export const TOC_SIZES: readonly TableOfContentsSize[] = ['sm', 'md', 'lg']
