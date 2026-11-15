import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'

const alertRoot = cva('relative flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm', {
  variants: {
    /** Tone. */
    variant: {
      default: 'bg-card text-card-foreground',
      info: 'border-info/40 bg-info/10 text-foreground',
      success: 'border-success/40 bg-success/10 text-foreground',
      warning: 'border-warning/50 bg-warning/15 text-foreground',
      destructive: 'border-destructive/40 bg-destructive/10 text-foreground',
    },
    /** Surface treatment. `soft` is the original tinted look and adds no classes. */
    appearance: {
      soft: '',
      solid: '[&_[data-slot=alert-description]]:text-current',
      outline: '',
      minimal: 'border-transparent bg-transparent text-foreground',
    },
    size: {
      sm: 'gap-2 px-3 py-2 text-xs [&_[data-slot=alert-description]]:text-xs',
      md: '',
      lg: 'gap-4 px-5 py-4 text-base',
    },
  },
  compoundVariants: [
    { appearance: 'solid', variant: 'default', class: 'border-transparent bg-foreground text-background' },
    { appearance: 'solid', variant: 'info', class: 'border-info bg-info text-info-foreground' },
    { appearance: 'solid', variant: 'success', class: 'border-success bg-success text-success-foreground' },
    { appearance: 'solid', variant: 'warning', class: 'border-warning bg-warning text-warning-foreground' },
    { appearance: 'solid', variant: 'destructive', class: 'border-destructive bg-destructive text-destructive-foreground' },
    { appearance: 'outline', variant: 'default', class: 'border-border bg-transparent text-foreground' },
    { appearance: 'outline', variant: 'info', class: 'border-info bg-transparent' },
    { appearance: 'outline', variant: 'success', class: 'border-success bg-transparent' },
    { appearance: 'outline', variant: 'warning', class: 'border-warning bg-transparent' },
    { appearance: 'outline', variant: 'destructive', class: 'border-destructive bg-transparent' },
    { appearance: 'minimal', class: 'px-0' },
  ],
  defaultVariants: { variant: 'default', appearance: 'soft', size: 'md' },
})

/** Alert root classes. Conflicting classes are resolved (later wins), so it is safe to use standalone: `<div :class="alertVariants({ appearance: 'solid', variant: 'info' })">`. */
export const alertVariants = (props?: Parameters<typeof alertRoot>[0]): string => cn(alertRoot(props))

const alertIcon = cva('mt-0.5 shrink-0 [&_svg]:size-4', {
  variants: {
    variant: {
      default: 'text-muted-foreground',
      info: 'text-info',
      success: 'text-success',
      warning: 'text-warning-foreground dark:text-warning',
      destructive: 'text-destructive',
    },
    appearance: {
      soft: '',
      solid: 'text-current dark:text-current',
      outline: '',
      minimal: '',
    },
    size: {
      sm: '[&_svg]:size-3.5',
      md: '',
      lg: '[&_svg]:size-5',
    },
  },
  defaultVariants: { variant: 'default', appearance: 'soft', size: 'md' },
})

/** Icon colour per variant (applied to the icon wrapper). */
export const alertIconVariants = (props?: Parameters<typeof alertIcon>[0]): string => cn(alertIcon(props))

/** Row layout of the body. `default` stacks title, description and actions; `inline` puts them in one wrapping row. */
export const ALERT_LAYOUTS = ['default', 'inline'] as const

const alertBody = cva('grid min-w-0 flex-1 gap-1', {
  variants: {
    layout: {
      default: '',
      inline: 'flex flex-wrap items-center gap-x-3 gap-y-1',
    },
  },
  defaultVariants: { layout: 'default' },
})
/** Body wrapper classes (the element that holds the title, description and actions). */
export const alertBodyVariants = (props?: Parameters<typeof alertBody>[0]): string => cn(alertBody(props))

const alertActions = cva('flex flex-wrap items-center gap-2', {
  variants: {
    layout: {
      default: 'pt-1',
      inline: 'ms-auto',
    },
  },
  defaultVariants: { layout: 'default' },
})
/** Wrapper of the `actions` slot. */
export const alertActionsVariants = (props?: Parameters<typeof alertActions>[0]): string => cn(alertActions(props))

export type AlertVariants = VariantProps<typeof alertVariants>
export type AlertVariant = NonNullable<AlertVariants['variant']>
export type AlertAppearance = NonNullable<AlertVariants['appearance']>
export type AlertSize = NonNullable<AlertVariants['size']>
export type AlertLayout = (typeof ALERT_LAYOUTS)[number]
