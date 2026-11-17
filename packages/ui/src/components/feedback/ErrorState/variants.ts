import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'

export const ERROR_STATE_VARIANTS = ['default', 'card', 'inline', 'page'] as const
export const ERROR_STATE_SIZES = ['sm', 'md', 'lg'] as const
export const ERROR_STATE_LAYOUTS = ['center', 'start'] as const
export const ERROR_STATE_TONES = ['danger', 'warning', 'neutral'] as const

/** `size` and `layout` shape the stacked variants; `inline` is a fixed compact row and `page` fills the viewport. */
const BLOCK = ['default', 'card'] as const
const STACKED = ['default', 'card', 'page'] as const

const errorStateRoot = cva('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', {
  variants: {
    /** `default` is the original borderless centred block and adds no classes. */
    variant: {
      default: '',
      card: 'rounded-lg border bg-card text-card-foreground shadow-xs',
      inline: 'grid grid-cols-[auto_1fr_auto] justify-start justify-items-start gap-x-3 gap-y-0.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-left',
      page: 'min-h-dvh gap-4 px-6 py-16',
    },
    /** Padding, gap and type scale of the `default` and `card` variants. `md` is the original size and adds no classes. */
    size: { sm: '', md: '', lg: '' },
    /** `center` is the original centred block. `start` left-aligns the icon, text and actions (logical `start`, so it follows the writing direction). */
    layout: { center: '', start: '' },
    /** `danger` is the original colour. `warning` and `neutral` suit degraded service and permission or not-found pages. */
    tone: { danger: '', warning: '', neutral: '' },
  },
  compoundVariants: [
    { variant: [...BLOCK], size: 'sm', class: 'gap-2 px-4 py-6' },
    { variant: [...BLOCK], size: 'lg', class: 'gap-4 px-8 py-20' },
    { variant: [...STACKED], layout: 'start', class: 'items-start text-start' },
    { variant: 'inline', tone: 'warning', class: 'border-warning/50 bg-warning/10' },
    { variant: 'inline', tone: 'neutral', class: 'border-border bg-muted/40 text-foreground' },
  ],
  defaultVariants: { variant: 'default', size: 'md', layout: 'center', tone: 'danger' },
})

/** ErrorState root classes. Conflicting classes are resolved (later wins), so it is safe to use standalone. */
export const errorStateVariants = (props?: Parameters<typeof errorStateRoot>[0]): string => cn(errorStateRoot(props))

type Variant = (typeof ERROR_STATE_VARIANTS)[number]
const variantMap = (map: Record<Variant, string>) => map

const icon = cva('flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive [&_svg]:size-5', {
  variants: {
    variant: variantMap({ default: '', card: '', inline: 'row-span-2 size-9 [&_svg]:size-4', page: 'size-16 [&_svg]:size-7' }),
    size: { sm: '', md: '', lg: '' },
    tone: { danger: '', warning: 'bg-warning/20 text-warning-foreground dark:text-warning', neutral: 'bg-muted text-muted-foreground' },
  },
  compoundVariants: [
    { variant: [...BLOCK], size: 'sm', class: 'size-9 [&_svg]:size-4' },
    { variant: [...BLOCK], size: 'lg', class: 'size-16 [&_svg]:size-7' },
  ],
  defaultVariants: { variant: 'default', size: 'md', tone: 'danger' },
})
export const errorStateIconVariants = (props?: Parameters<typeof icon>[0]): string => cn(icon(props))

const title = cva('text-base font-semibold tracking-tight break-words', {
  variants: {
    variant: variantMap({ default: '', card: '', inline: 'col-start-2 text-sm', page: 'text-2xl' }),
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: [...BLOCK], size: 'sm', class: 'text-sm' },
    { variant: [...BLOCK], size: 'lg', class: 'text-xl' },
  ],
  defaultVariants: { variant: 'default', size: 'md' },
})
export const errorStateTitleVariants = (props?: Parameters<typeof title>[0]): string => cn(title(props))

const message = cva('max-w-md text-sm text-muted-foreground break-words', {
  variants: {
    variant: variantMap({ default: '', card: '', inline: 'col-start-2 text-xs max-w-none', page: 'text-base' }),
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: [...BLOCK], size: 'sm', class: 'text-xs' },
    { variant: [...BLOCK], size: 'lg', class: 'text-base' },
  ],
  defaultVariants: { variant: 'default', size: 'md' },
})
export const errorStateMessageVariants = (props?: Parameters<typeof message>[0]): string => cn(message(props))

const actions = cva('mt-1 flex flex-wrap items-center justify-center gap-2', {
  variants: {
    variant: variantMap({ default: '', card: '', inline: 'col-start-3 row-span-2 row-start-1 mt-0 justify-end', page: 'mt-2' }),
    layout: { center: '', start: '' },
  },
  compoundVariants: [{ variant: [...STACKED], layout: 'start', class: 'justify-start' }],
  defaultVariants: { variant: 'default', layout: 'center' },
})
export const errorStateActionsVariants = (props?: Parameters<typeof actions>[0]): string => cn(actions(props))

const details = cva('w-full max-w-xl text-left', {
  variants: {
    variant: variantMap({ default: '', card: '', inline: 'col-span-full mt-1 max-w-none', page: '' }),
    layout: { center: '', start: '' },
  },
  // In the centred layout the disclosure follows the block: its summary sits on the centre line, its content stays left-aligned.
  compoundVariants: [{ variant: [...STACKED], layout: 'center', class: 'text-center [&>summary]:mx-auto' }],
  defaultVariants: { variant: 'default', layout: 'center' },
})
export const errorStateDetailsVariants = (props?: Parameters<typeof details>[0]): string => cn(details(props))

/** Large status code (404, 500...) shown instead of the icon. */
const code = cva('font-bold tracking-tight text-muted-foreground tabular-nums', {
  variants: {
    variant: variantMap({ default: 'text-5xl', card: 'text-5xl', inline: 'row-span-2 text-xl', page: 'text-7xl' }),
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: [...BLOCK], size: 'sm', class: 'text-3xl' },
    { variant: [...BLOCK], size: 'lg', class: 'text-6xl' },
  ],
  defaultVariants: { variant: 'default', size: 'md' },
})
export const errorStateCodeVariants = (props?: Parameters<typeof code>[0]): string => cn(code(props))

export type ErrorStateVariants = VariantProps<typeof errorStateVariants>
export type ErrorStateVariant = NonNullable<ErrorStateVariants['variant']>
export type ErrorStateSize = NonNullable<ErrorStateVariants['size']>
export type ErrorStateLayout = NonNullable<ErrorStateVariants['layout']>
export type ErrorStateTone = NonNullable<ErrorStateVariants['tone']>
