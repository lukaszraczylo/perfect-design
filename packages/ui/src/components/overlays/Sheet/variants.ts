import { cva, type VariantProps } from '../../../lib/cva'
import { overlayToneBorder } from '../overlayTone'

export const sheetSides = ['top', 'right', 'bottom', 'left'] as const
export const sheetSizes = ['sm', 'md', 'lg', 'xl', 'full'] as const
export const sheetVariantNames = ['default', 'flush'] as const

export type SheetSide = (typeof sheetSides)[number]
export type SheetSize = (typeof sheetSizes)[number]
export type SheetVariant = (typeof sheetVariantNames)[number]

/**
 * Sheet panel styling.
 *
 * - `side` picks the edge and the slide animation.
 * - `size` is a width preset for `left`/`right` and a max-height preset for `top`/`bottom`.
 * - `inset` turns the panel into a floating card: it keeps a margin to the viewport edges and gets rounded
 *   corners and a full border instead of a single edge border.
 * - `variant`: `default` padded panel; `flush` removes the padding and the gap so the content (a nav list, a table, a form with
 *   its own sections) runs edge to edge. Safe-area padding on the docked edge is kept.
 * - `tone`: border colour for a danger, warning, success or info sheet (`neutral` adds nothing).
 * Wrap the result in `cn()` when you use `sheetVariants` outside the component.
 */
export const sheetVariants = cva(
  'fixed z-(--z-modal) flex flex-col gap-4 overflow-y-auto overscroll-contain bg-popover p-6 text-popover-foreground shadow-lg',
  {
    variants: {
      side: {
        right: 'w-3/4 data-[state=open]:animate-ds-slide-in-right data-[state=closed]:animate-ds-slide-out-right',
        left: 'w-3/4 data-[state=open]:animate-ds-slide-in-left data-[state=closed]:animate-ds-slide-out-left',
        top: 'h-auto data-[state=open]:animate-ds-slide-in-top data-[state=closed]:animate-ds-slide-out-top',
        bottom: 'h-auto data-[state=open]:animate-ds-slide-in-bottom data-[state=closed]:animate-ds-slide-out-bottom',
      },
      variant: {
        default: '',
        flush: 'gap-0 p-0',
      },
      tone: overlayToneBorder,
      size: {
        sm: '',
        md: '',
        lg: '',
        xl: '',
        full: '',
      },
      inset: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      // Docked geometry (edge to edge).
      { side: 'right', inset: false, class: 'inset-y-0 right-0 h-full border-l pr-[max(1.5rem,env(safe-area-inset-right))]' },
      { side: 'left', inset: false, class: 'inset-y-0 left-0 h-full border-r pl-[max(1.5rem,env(safe-area-inset-left))]' },
      { side: 'top', inset: false, class: 'inset-x-0 top-0 border-b' },
      { side: 'bottom', inset: false, class: 'inset-x-0 bottom-0 border-t pb-[max(1.5rem,env(safe-area-inset-bottom))]' },
      // Floating geometry (margin + rounded).
      { side: 'right', inset: true, class: 'inset-y-2 right-2 h-auto max-h-[calc(100dvh-1rem)] rounded-xl border' },
      { side: 'left', inset: true, class: 'inset-y-2 left-2 h-auto max-h-[calc(100dvh-1rem)] rounded-xl border' },
      { side: 'top', inset: true, class: 'inset-x-2 top-2 max-w-[calc(100vw-1rem)] rounded-xl border' },
      { side: 'bottom', inset: true, class: 'inset-x-2 bottom-2 max-w-[calc(100vw-1rem)] rounded-xl border' },
      // Width presets (left/right).
      { side: ['left', 'right'], size: 'sm', class: 'sm:max-w-xs' },
      { side: ['left', 'right'], size: 'md', class: 'sm:max-w-sm' },
      { side: ['left', 'right'], size: 'lg', class: 'sm:max-w-lg' },
      { side: ['left', 'right'], size: 'xl', class: 'sm:max-w-2xl' },
      { side: ['left', 'right'], size: 'full', class: 'w-full sm:max-w-none' },
      // Height presets (top/bottom).
      { side: ['top', 'bottom'], size: 'sm', class: 'max-h-[30dvh]' },
      { side: ['top', 'bottom'], size: 'md', class: 'max-h-[50dvh]' },
      { side: ['top', 'bottom'], size: 'lg', class: 'max-h-[75dvh]' },
      { side: ['top', 'bottom'], size: 'xl', class: 'max-h-[90dvh]' },
      { side: ['top', 'bottom'], size: 'full', class: 'h-dvh max-h-none' },
    ],
    defaultVariants: { side: 'right', size: 'md', inset: false, variant: 'default', tone: 'neutral' },
  },
)

export type SheetVariants = VariantProps<typeof sheetVariants>
