import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'

const loadingStateRoot = cva('flex w-full', {
  variants: {
    variant: {
      spinner: 'flex-col items-center justify-center gap-3 text-sm text-muted-foreground',
      text: 'flex-col gap-2.5',
      card: 'flex-col gap-4 rounded-lg border bg-card p-4',
      table: 'flex-col gap-3',
      list: 'flex-col gap-3',
      'avatar-text': 'flex-col gap-4',
      'kpi-grid': 'flex-col',
      form: 'flex-col gap-4',
    },
    fullPage: {
      true: 'min-h-dvh items-center justify-center',
      false: '',
    },
    /** Scale of the `spinner` variant (spinner, label, padding). `md` is the original size and adds no classes. Skeletons ignore it. */
    size: { sm: '', md: '', lg: '' },
    /** `stacked` is the original column. `inline` puts the spinner and label in one start-aligned row (the `spinner` variant only). */
    layout: { stacked: '', inline: '' },
  },
  compoundVariants: [
    { variant: 'spinner', fullPage: false, class: 'py-12' },
    { variant: 'spinner', size: 'sm', class: 'text-xs' },
    { variant: 'spinner', size: 'lg', class: 'text-base' },
    { variant: 'spinner', fullPage: false, size: 'sm', class: 'py-6' },
    { variant: 'spinner', fullPage: false, size: 'lg', class: 'py-16' },
    { variant: 'spinner', layout: 'inline', class: 'flex-row justify-start gap-2' },
    { variant: 'spinner', layout: 'inline', fullPage: false, class: 'py-2' },
    { variant: ['text', 'card', 'table', 'list', 'avatar-text', 'form'], fullPage: true, class: 'mx-auto max-w-2xl' },
    { variant: 'kpi-grid', fullPage: true, class: 'mx-auto max-w-5xl' },
  ],
  defaultVariants: { variant: 'spinner', fullPage: false, size: 'md', layout: 'stacked' },
})

/** LoadingState root classes. Conflicting classes are resolved (later wins), so it is safe to use standalone. */
export const loadingStateVariants = (props?: Parameters<typeof loadingStateRoot>[0]): string => cn(loadingStateRoot(props))

export const LOADING_STATE_SIZES = ['sm', 'md', 'lg'] as const
export const LOADING_STATE_LAYOUTS = ['stacked', 'inline'] as const
/** Corner shape of the skeleton placeholders. `rounded` is the original. */
export const LOADING_STATE_SHAPES = ['rounded', 'square', 'pill'] as const

/** All supported placeholder shapes. */
export const LOADING_STATE_VARIANTS = ['spinner', 'text', 'card', 'table', 'list', 'avatar-text', 'kpi-grid', 'form'] as const

export type LoadingStateVariants = VariantProps<typeof loadingStateVariants>
export type LoadingStateVariant = NonNullable<LoadingStateVariants['variant']>
export type LoadingStateSize = (typeof LOADING_STATE_SIZES)[number]
export type LoadingStateLayout = (typeof LOADING_STATE_LAYOUTS)[number]
export type LoadingStateShape = (typeof LOADING_STATE_SHAPES)[number]
