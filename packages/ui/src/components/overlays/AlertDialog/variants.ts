import { cva, type VariantProps } from '../../../lib/cva'
import { overlayToneBorder } from '../overlayTone'

export const alertDialogSizes = ['xs', 'sm', 'md', 'lg'] as const
export const alertDialogVariantNames = ['default', 'centered'] as const

export type AlertDialogSize = (typeof alertDialogSizes)[number]
export type AlertDialogVariant = (typeof alertDialogVariantNames)[number]

/**
 * Alert dialog panel styling.
 *
 * - `size`: max-width preset applied from the `sm` breakpoint (`xs` is the narrowest, for a one-line confirmation).
 * - `variant`: `default` left-aligned text; `centered` centres the text and the footer buttons.
 * - `tone`: border colour for a danger, warning, success or info prompt (`neutral` adds nothing).
 * Wrap the result in `cn()` when you use `alertDialogContentVariants` outside the component.
 */
export const alertDialogContentVariants = cva(
  'fixed top-1/2 left-1/2 z-(--z-modal) grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 grid-cols-[minmax(0,1fr)] gap-4 overflow-y-auto overscroll-contain rounded-lg border bg-popover p-6 text-popover-foreground shadow-lg data-[state=open]:animate-ds-pop-in data-[state=closed]:animate-ds-pop-out',
  {
    variants: {
      size: {
        xs: 'sm:max-w-xs',
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl',
      },
      variant: {
        default: '',
        centered:
          'text-center [&_[data-slot=alert-dialog-header]]:text-center sm:[&_[data-slot=alert-dialog-header]]:text-center [&_[data-slot=alert-dialog-footer]]:justify-center sm:[&_[data-slot=alert-dialog-footer]]:justify-center',
      },
      tone: overlayToneBorder,
    },
    defaultVariants: { size: 'md', variant: 'default', tone: 'neutral' },
  },
)

export type AlertDialogContentVariants = VariantProps<typeof alertDialogContentVariants>
