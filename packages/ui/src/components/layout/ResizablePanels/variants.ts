import { cva, type VariantProps } from '../../../lib/cva'

export type ResizableOrientation = 'horizontal' | 'vertical'

/** Root container. `horizontal` lays panels out in a row (vertical separators), `vertical` stacks them. */
export const resizablePanelsVariants = cva('group/resizable flex h-full w-full min-h-0 min-w-0 data-[dragging]:select-none', {
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})

export const resizablePanelVariants = cva(
  'relative min-h-0 min-w-0 overflow-hidden group-data-[dragging]/resizable:pointer-events-none',
)

/**
 * Separator. `line` is a hairline with a 24px wide hit area (WCAG 2.5.8), `bar` a thicker muted track.
 * Forced-colors mode replaces background tokens: the `line` fills with `CanvasText` and the `bar` draws a border, so both stay visible. `outline-hidden` draws an outline in forced-colors mode all the time, so the idle handle drops it (`not-focus-visible:outline-0`) and a focused handle keeps it.
 * `z-10` keeps the 24px hit area above the next panel, which is positioned and later in the DOM and would otherwise cover half of it.
 * `size` sets the visible thickness only; the hit area stays 24px at every size. `line`: `sm` and `md` are 1px (the default
 * hairline), `lg` is 2px. `bar`: `sm` 4px, `md` 8px (default), `lg` 12px.
 */
export const resizableHandleVariants = cva(
  'relative z-10 flex shrink-0 touch-none items-center justify-center outline-hidden transition-colors motion-reduce:transition-none focus-visible:bg-ring data-[dragging]:bg-ring data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
  {
    variants: {
      orientation: {
        horizontal: 'cursor-col-resize after:absolute after:inset-y-0 after:-inset-x-3',
        vertical: 'cursor-row-resize after:absolute after:inset-x-0 after:-inset-y-3',
      },
      variant: {
        line: 'bg-border hover:bg-ring/60 forced-colors:bg-[CanvasText] forced-colors:hover:bg-[CanvasText] forced-colors:focus-visible:bg-[CanvasText] forced-colors:data-[dragging]:bg-[CanvasText] forced-colors:not-focus-visible:outline-0',
        bar: 'bg-muted hover:bg-accent forced-colors:border forced-colors:border-[CanvasText] forced-colors:not-focus-visible:outline-0',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    compoundVariants: [
      { orientation: 'horizontal', variant: 'line', size: ['sm', 'md'], class: 'w-px' },
      { orientation: 'vertical', variant: 'line', size: ['sm', 'md'], class: 'h-px' },
      { orientation: 'horizontal', variant: 'line', size: 'lg', class: 'w-0.5' },
      { orientation: 'vertical', variant: 'line', size: 'lg', class: 'h-0.5' },
      { orientation: 'horizontal', variant: 'bar', size: 'sm', class: 'w-1' },
      { orientation: 'vertical', variant: 'bar', size: 'sm', class: 'h-1' },
      { orientation: 'horizontal', variant: 'bar', size: 'md', class: 'w-2' },
      { orientation: 'vertical', variant: 'bar', size: 'md', class: 'h-2' },
      { orientation: 'horizontal', variant: 'bar', size: 'lg', class: 'w-3' },
      { orientation: 'vertical', variant: 'bar', size: 'lg', class: 'h-3' },
    ],
    defaultVariants: { orientation: 'horizontal', variant: 'line', size: 'md' },
  },
)

export type ResizableHandleVariant = NonNullable<VariantProps<typeof resizableHandleVariants>['variant']>
export type ResizableHandleSize = NonNullable<VariantProps<typeof resizableHandleVariants>['size']>
export const resizableHandleSizes: readonly ResizableHandleSize[] = ['sm', 'md', 'lg']
