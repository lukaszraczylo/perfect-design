import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'

const emptyStateRoot = cva('flex flex-col items-center justify-center text-center', {
  variants: {
    /** `default` is the original borderless centred block and adds no classes. */
    variant: {
      default: '',
      card: 'rounded-lg border bg-card text-card-foreground shadow-xs',
      'bordered-dashed': 'rounded-lg border-2 border-dashed border-border',
      compact: '',
      inline: 'grid grid-cols-[auto_1fr_auto] justify-start justify-items-start text-left',
    },
    size: {
      sm: 'gap-2 px-4 py-6',
      md: 'gap-3 px-6 py-12',
      lg: 'gap-4 px-8 py-20',
    },
    /** `center` is the original centred block and adds no classes. `start` aligns the icon, text and action to the start edge. */
    layout: { center: '', start: '' },
  },
  compoundVariants: [
    { variant: 'compact', class: 'gap-1.5 px-3 py-4' },
    { variant: 'inline', class: 'gap-x-3 gap-y-0.5 px-4 py-3' },
    { variant: ['default', 'card', 'bordered-dashed', 'compact'], layout: 'start', class: 'items-start text-start' },
  ],
  defaultVariants: { variant: 'default', size: 'md', layout: 'center' },
})

/** EmptyState root classes. Conflicting classes are resolved (later wins), so it is safe to use standalone. */
export const emptyStateVariants = (props?: Parameters<typeof emptyStateRoot>[0]): string => cn(emptyStateRoot(props))

const emptyStateIcon = cva('flex items-center justify-center rounded-full bg-muted text-muted-foreground', {
  variants: {
    size: {
      sm: 'size-9 [&_svg]:size-4',
      md: 'size-12 [&_svg]:size-5',
      lg: 'size-16 [&_svg]:size-7',
    },
    variant: {
      default: '',
      card: '',
      'bordered-dashed': '',
      compact: '',
      inline: '',
    },
    /** `neutral` is the original grey bubble. The other tones tint it. They never replace the title, which says what is empty. */
    tone: {
      neutral: '',
      info: 'bg-info/15 text-info',
      success: 'bg-success/15 text-success',
      warning: 'bg-warning/20 text-warning-foreground dark:text-warning',
      danger: 'bg-destructive/10 text-destructive',
    },
  },
  compoundVariants: [
    { variant: 'compact', class: 'size-8 [&_svg]:size-3.5' },
    { variant: 'inline', class: 'row-span-2 size-9 [&_svg]:size-4' },
  ],
  defaultVariants: { size: 'md', variant: 'default', tone: 'neutral' },
})
export const emptyStateIconVariants = (props?: Parameters<typeof emptyStateIcon>[0]): string => cn(emptyStateIcon(props))

const emptyStateTitle = cva('font-semibold tracking-tight text-foreground', {
  variants: {
    size: { sm: 'text-sm', md: 'text-base', lg: 'text-xl' },
    variant: { default: '', card: '', 'bordered-dashed': '', compact: '', inline: '' },
  },
  compoundVariants: [
    { variant: 'compact', class: 'text-sm' },
    { variant: 'inline', class: 'col-start-2 text-sm' },
  ],
  defaultVariants: { size: 'md', variant: 'default' },
})
export const emptyStateTitleVariants = (props?: Parameters<typeof emptyStateTitle>[0]): string => cn(emptyStateTitle(props))

const emptyStateDescription = cva('max-w-md text-sm text-muted-foreground break-words', {
  variants: {
    variant: {
      default: '',
      card: '',
      'bordered-dashed': '',
      compact: 'text-xs',
      inline: 'col-start-2 max-w-none text-xs',
    },
  },
  defaultVariants: { variant: 'default' },
})
export const emptyStateDescriptionVariants = (props?: Parameters<typeof emptyStateDescription>[0]): string => cn(emptyStateDescription(props))

const emptyStateAction = cva('mt-1 flex flex-wrap items-center justify-center gap-2', {
  variants: {
    variant: {
      default: '',
      card: '',
      'bordered-dashed': '',
      compact: 'mt-0.5',
      inline: 'col-start-3 row-span-2 row-start-1 mt-0 justify-end',
    },
    layout: { center: '', start: '' },
  },
  compoundVariants: [{ variant: ['default', 'card', 'bordered-dashed', 'compact'], layout: 'start', class: 'justify-start' }],
  defaultVariants: { variant: 'default', layout: 'center' },
})
export const emptyStateActionVariants = (props?: Parameters<typeof emptyStateAction>[0]): string => cn(emptyStateAction(props))

/** Wrapper of the `illustration` slot. */
const emptyStateIllustration = cva('flex items-center justify-center [&_img]:h-auto [&_img]:max-w-full [&_svg]:h-auto [&_svg]:max-w-full', {
  variants: {
    variant: {
      default: 'mb-1 w-full max-w-xs',
      card: 'mb-1 w-full max-w-xs',
      'bordered-dashed': 'mb-1 w-full max-w-xs',
      compact: 'mb-0.5 w-full max-w-24',
      inline: 'row-span-2 w-14',
    },
  },
  defaultVariants: { variant: 'default' },
})
export const emptyStateIllustrationVariants = (props?: Parameters<typeof emptyStateIllustration>[0]): string => cn(emptyStateIllustration(props))

export type EmptyStateVariants = VariantProps<typeof emptyStateVariants>
export type EmptyStateSize = NonNullable<EmptyStateVariants['size']>
export type EmptyStateVariant = NonNullable<EmptyStateVariants['variant']>
export type EmptyStateLayout = NonNullable<EmptyStateVariants['layout']>

export const EMPTY_STATE_VARIANTS = ['default', 'card', 'bordered-dashed', 'compact', 'inline'] as const
export const EMPTY_STATE_SIZES = ['sm', 'md', 'lg'] as const
export const EMPTY_STATE_LAYOUTS = ['center', 'start'] as const
export const EMPTY_STATE_TONES = ['neutral', 'info', 'success', 'warning', 'danger'] as const
export type EmptyStateTone = (typeof EMPTY_STATE_TONES)[number]
