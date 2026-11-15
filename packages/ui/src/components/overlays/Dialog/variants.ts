import { cva, type VariantProps } from '../../../lib/cva'
import { overlayToneBorder } from '../overlayTone'

export const dialogVariantNames = ['default', 'centered-form', 'fullscreen', 'drawer-bottom-on-mobile'] as const
export const dialogSizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'] as const

export type DialogVariant = (typeof dialogVariantNames)[number]
export type DialogSize = (typeof dialogSizes)[number]

const notFullscreen: DialogVariant[] = ['default', 'centered-form', 'drawer-bottom-on-mobile']

/**
 * Dialog panel styling.
 *
 * - `variant`: `default` centred card; `centered-form` roomier, centred text (sign-in / single-purpose forms);
 *   `fullscreen` covers the whole viewport (editors, wizards); `drawer-bottom-on-mobile` is a bottom sheet below
 *   the `sm` breakpoint and a normal centred dialog from `sm` up.
 * - `size`: max-width preset applied from the `sm` breakpoint (ignored by `fullscreen`).
 * - `tone`: border colour for a danger, warning, success or info dialog (`neutral` adds nothing).
 * Wrap the result in `cn()` when you use `dialogContentVariants` outside the component.
 */
export const dialogContentVariants = cva(
  'fixed z-(--z-modal) grid grid-cols-[minmax(0,1fr)] overflow-y-auto overscroll-contain bg-popover text-popover-foreground shadow-lg',
  {
    variants: {
      variant: {
        default:
          'top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-6 data-[state=open]:animate-ds-pop-in data-[state=closed]:animate-ds-pop-out',
        'centered-form':
          'top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-lg border p-8 text-center data-[state=open]:animate-ds-pop-in data-[state=closed]:animate-ds-pop-out [&_[data-slot=dialog-header]]:text-center sm:[&_[data-slot=dialog-header]]:text-center [&_[data-slot=dialog-footer]]:justify-center sm:[&_[data-slot=dialog-footer]]:justify-center',
        fullscreen:
          'inset-0 h-dvh w-full max-w-none gap-4 rounded-none border-0 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] data-[state=open]:animate-ds-fade-in data-[state=closed]:animate-ds-fade-out',
        'drawer-bottom-on-mobile':
          'inset-x-0 bottom-0 max-h-[90dvh] w-full gap-4 rounded-t-xl border-t p-6 max-sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] max-sm:data-[state=open]:animate-ds-slide-in-bottom max-sm:data-[state=closed]:animate-ds-slide-out-bottom sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[calc(100dvh-2rem)] sm:max-w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border sm:data-[state=open]:animate-ds-pop-in sm:data-[state=closed]:animate-ds-pop-out',
      },
      tone: overlayToneBorder,
      size: {
        xs: '',
        sm: '',
        md: '',
        lg: '',
        xl: '',
        '2xl': '',
        full: '',
      },
    },
    compoundVariants: [
      { variant: notFullscreen, size: 'xs', class: 'sm:max-w-xs' },
      { variant: notFullscreen, size: 'sm', class: 'sm:max-w-sm' },
      { variant: notFullscreen, size: 'md', class: 'sm:max-w-lg' },
      { variant: notFullscreen, size: 'lg', class: 'sm:max-w-2xl' },
      { variant: notFullscreen, size: 'xl', class: 'sm:max-w-4xl' },
      { variant: notFullscreen, size: '2xl', class: 'sm:max-w-6xl' },
      { variant: notFullscreen, size: 'full', class: 'sm:max-w-[calc(100vw-2rem)]' },
    ],
    defaultVariants: { variant: 'default', size: 'md', tone: 'neutral' },
  },
)

export type DialogContentVariants = VariantProps<typeof dialogContentVariants>
