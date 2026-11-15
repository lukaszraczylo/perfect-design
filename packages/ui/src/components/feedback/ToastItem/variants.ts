import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'

export const TOAST_LAYOUTS = ['default', 'compact', 'inline'] as const
export const TOAST_APPEARANCES = ['default', 'soft', 'solid'] as const

export type ToastLayout = (typeof TOAST_LAYOUTS)[number]
export type ToastAppearance = (typeof TOAST_APPEARANCES)[number]

const toastRoot = cva(
  'pointer-events-auto relative flex w-full items-start gap-3 rounded-lg border bg-popover p-4 pe-10 text-sm pointer-coarse:pe-12 text-popover-foreground shadow-lg motion-safe:animate-ds-pop-in',
  {
    variants: {
      variant: {
        default: '',
        success: 'border-success/50',
        warning: 'border-warning/60',
        danger: 'border-destructive/50',
        info: 'border-info/50',
      },
      /** `compact` is a dense card (smaller type and padding). `inline` keeps the default size and puts the action at the end of the row. `default` adds no classes. */
      layout: {
        default: '',
        compact: 'gap-2 p-3 pe-9 text-xs pointer-coarse:pe-12',
        inline: 'items-center',
      },
      /** `default` is the original popover surface and adds no classes. */
      appearance: {
        default: '',
        soft: '',
        solid: '',
      },
    },
    compoundVariants: [
      { appearance: 'soft', variant: 'default', class: 'bg-muted text-foreground' },
      { appearance: 'soft', variant: 'success', class: 'bg-success/10 text-foreground' },
      { appearance: 'soft', variant: 'warning', class: 'bg-warning/15 text-foreground' },
      { appearance: 'soft', variant: 'danger', class: 'bg-destructive/10 text-foreground' },
      { appearance: 'soft', variant: 'info', class: 'bg-info/10 text-foreground' },
      { appearance: 'solid', variant: 'default', class: 'border-transparent bg-foreground text-background' },
      { appearance: 'solid', variant: 'success', class: 'border-success bg-success text-success-foreground' },
      { appearance: 'solid', variant: 'warning', class: 'border-warning bg-warning text-warning-foreground' },
      { appearance: 'solid', variant: 'danger', class: 'border-destructive bg-destructive text-destructive-foreground' },
      { appearance: 'solid', variant: 'info', class: 'border-info bg-info text-info-foreground' },
    ],
    defaultVariants: { variant: 'default', layout: 'default', appearance: 'default' },
  },
)

/** Toast card classes. Conflicting classes are resolved (later wins), so it is safe to use standalone. */
export const toastVariants = (props?: Parameters<typeof toastRoot>[0]): string => cn(toastRoot(props))

export const toastIconVariants = cva('mt-0.5 shrink-0 [&_svg]:size-4', {
  variants: {
    variant: {
      default: 'text-muted-foreground',
      success: 'text-success',
      warning: 'text-warning-foreground dark:text-warning',
      danger: 'text-destructive',
      info: 'text-info',
    },
    appearance: { default: '', soft: '', solid: 'text-current dark:text-current' },
  },
  defaultVariants: { variant: 'default', appearance: 'default' },
})

/** Colour of the countdown bar fill per toast variant. */
export const toastProgressVariants = cva('h-full w-full origin-left', {
  variants: {
    variant: {
      default: 'bg-foreground/40',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-destructive',
      info: 'bg-info',
    },
    appearance: { default: '', soft: '', solid: 'bg-current' },
  },
  defaultVariants: { variant: 'default', appearance: 'default' },
})

export type ToastVariants = VariantProps<typeof toastVariants>
