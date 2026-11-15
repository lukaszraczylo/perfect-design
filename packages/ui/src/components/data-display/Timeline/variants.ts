import type { ComputedRef, InjectionKey } from 'vue'
import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'

/** Marker (dot/icon bubble) colours per status tone, plus compact size and alternating-layout placement. */
const marker = cva('absolute start-0 top-0 flex size-6 items-center justify-center rounded-full border text-xs [&_svg]:size-3', {
  variants: {
    status: {
      neutral: 'border-border bg-muted text-muted-foreground',
      primary: 'border-primary/40 bg-primary/15 text-primary',
      success: 'border-success/40 bg-success/15 text-success',
      warning: 'border-warning/50 bg-warning/20 text-warning-foreground dark:text-warning',
      danger: 'border-destructive/40 bg-destructive/15 text-destructive',
      info: 'border-info/40 bg-info/15 text-info',
    },
    size: {
      default: '',
      compact: 'size-4 [&_svg]:size-2.5',
      large: 'size-8 [&_svg]:size-4',
    },
    layout: {
      vertical: '',
      horizontal: '',
      alternating: '',
    },
    /**
     * `default` is the tinted marker. `outline` is a ring in the tone with a plain centre (the glyph stays foreground), and
     * `solid` fills the marker with the tone. The tone is never the only cue: non-neutral statuses are also spoken.
     */
    variant: {
      default: '',
      outline: '',
      solid: '',
    },
  },
  compoundVariants: [
    { variant: 'outline', class: 'border-2 bg-background text-foreground' },
    { variant: 'outline', status: 'neutral', class: 'border-muted-foreground' },
    { variant: 'outline', status: 'primary', class: 'border-primary' },
    { variant: 'outline', status: 'success', class: 'border-success' },
    // `warning` alone is 2.1:1 on the light page; like the text and stroke pairs in contrast.test.ts, light uses warning-foreground.
    { variant: 'outline', status: 'warning', class: 'border-warning-foreground dark:border-warning' },
    { variant: 'outline', status: 'danger', class: 'border-destructive' },
    { variant: 'outline', status: 'info', class: 'border-info' },
    { variant: 'solid', status: 'neutral', class: 'border-foreground bg-foreground text-background' },
    { variant: 'solid', status: 'primary', class: 'border-primary bg-primary text-primary-foreground' },
    { variant: 'solid', status: 'success', class: 'border-success bg-success text-success-foreground' },
    { variant: 'solid', status: 'warning', class: 'border-warning bg-warning text-warning-foreground' },
    { variant: 'solid', status: 'danger', class: 'border-destructive bg-destructive text-destructive-foreground' },
    { variant: 'solid', status: 'info', class: 'border-info bg-info text-info-foreground' },
    // Alternating (md+): the marker sits on the centre line; odd rows are left of it, even rows right of it.
    {
      layout: 'alternating',
      size: 'default',
      class: 'md:group-odd/item:start-auto md:group-odd/item:-end-3 md:group-even/item:-start-3',
    },
    {
      layout: 'alternating',
      size: 'compact',
      class: 'md:group-odd/item:start-auto md:group-odd/item:-end-2 md:group-even/item:-start-2',
    },
    {
      layout: 'alternating',
      size: 'large',
      class: 'md:group-odd/item:start-auto md:group-odd/item:-end-4 md:group-even/item:-start-4',
    },
  ],
  defaultVariants: { status: 'neutral', size: 'default', layout: 'vertical', variant: 'default' },
})
export const timelineMarkerVariants = (props?: Parameters<typeof marker>[0]): string => cn(marker(props))

const tail = 'bg-border group-last/item:hidden'
const connector = cva('absolute', {
  variants: {
    size: { default: '', compact: '', large: '' },
    layout: { vertical: '', horizontal: '', alternating: '' },
  },
  compoundVariants: [
    { layout: ['vertical', 'alternating'], size: 'default', class: `bottom-0 start-3 top-6 w-px -translate-x-1/2 ${tail}` },
    { layout: ['vertical', 'alternating'], size: 'compact', class: `bottom-0 start-2 top-4 w-px -translate-x-1/2 ${tail}` },
    { layout: ['vertical', 'alternating'], size: 'large', class: `bottom-0 start-4 top-8 w-px -translate-x-1/2 ${tail}` },
    { layout: 'horizontal', size: 'default', class: `start-8 end-0 top-3 h-px -translate-y-1/2 ${tail}` },
    { layout: 'horizontal', size: 'compact', class: `start-6 end-0 top-2 h-px -translate-y-1/2 ${tail}` },
    { layout: 'horizontal', size: 'large', class: `start-10 end-0 top-4 h-px -translate-y-1/2 ${tail}` },
    { layout: 'alternating', class: 'md:group-odd/item:start-auto md:group-odd/item:end-0 md:group-odd/item:translate-x-1/2 md:group-even/item:start-0' },
  ],
  defaultVariants: { size: 'default', layout: 'vertical' },
})
export const timelineConnectorVariants = (props?: Parameters<typeof connector>[0]): string => cn(connector(props))

const item = cva('group/item relative', {
  variants: {
    size: { default: '', compact: '', large: '' },
    layout: { vertical: '', horizontal: '', alternating: '' },
  },
  compoundVariants: [
    { layout: ['vertical', 'alternating'], size: 'default', class: 'pb-6 ps-9 last:pb-0' },
    { layout: ['vertical', 'alternating'], size: 'compact', class: 'pb-3 ps-7 last:pb-0' },
    { layout: ['vertical', 'alternating'], size: 'large', class: 'pb-8 ps-11 last:pb-0' },
    { layout: 'horizontal', size: 'default', class: 'min-w-40 flex-1 pe-6 pt-9 last:pe-0' },
    { layout: 'horizontal', size: 'compact', class: 'min-w-32 flex-1 pe-4 pt-7 last:pe-0' },
    { layout: 'horizontal', size: 'large', class: 'min-w-48 flex-1 pe-8 pt-11 last:pe-0' },
    // Alternating (md+): each row takes half the width; odd rows hug the left, even rows the right of the centre line.
    {
      layout: 'alternating',
      size: 'default',
      class: 'md:w-1/2 md:group-odd/item:self-start md:group-odd/item:ps-0 md:group-odd/item:pe-9 md:group-odd/item:text-end md:group-even/item:self-end md:group-even/item:ps-9',
    },
    {
      layout: 'alternating',
      size: 'compact',
      class: 'md:w-1/2 md:group-odd/item:self-start md:group-odd/item:ps-0 md:group-odd/item:pe-7 md:group-odd/item:text-end md:group-even/item:self-end md:group-even/item:ps-7',
    },
    {
      layout: 'alternating',
      size: 'large',
      class: 'md:w-1/2 md:group-odd/item:self-start md:group-odd/item:ps-0 md:group-odd/item:pe-11 md:group-odd/item:text-end md:group-even/item:self-end md:group-even/item:ps-11',
    },
  ],
  defaultVariants: { size: 'default', layout: 'vertical' },
})
export const timelineItemVariants = (props?: Parameters<typeof item>[0]): string => cn(item(props))

const root = cva('flex', {
  variants: {
    layout: {
      vertical: 'flex-col',
      horizontal: 'flex-row items-start overflow-x-auto',
      alternating: 'flex-col',
    },
  },
  defaultVariants: { layout: 'vertical' },
})
export const timelineVariants = (props?: Parameters<typeof root>[0]): string => cn(root(props))

export type TimelineMarkerVariants = VariantProps<typeof marker>
export type TimelineStatus = NonNullable<TimelineMarkerVariants['status']>
export type TimelineSize = NonNullable<TimelineMarkerVariants['size']>
export type TimelineLayout = NonNullable<TimelineMarkerVariants['layout']>
export type TimelineVariant = NonNullable<TimelineMarkerVariants['variant']>

export const TIMELINE_STATUSES: readonly TimelineStatus[] = ['neutral', 'primary', 'success', 'warning', 'danger', 'info']
export const TIMELINE_LAYOUTS: readonly TimelineLayout[] = ['vertical', 'horizontal', 'alternating']
export const TIMELINE_SIZES: readonly TimelineSize[] = ['default', 'compact', 'large']
export const TIMELINE_VARIANTS: readonly TimelineVariant[] = ['default', 'outline', 'solid']

/** Timeline provides layout, size and marker variant so every TimelineItem adapts without repeating props. */
export const TIMELINE_KEY: InjectionKey<{ layout: ComputedRef<TimelineLayout>; size: ComputedRef<TimelineSize>; variant?: ComputedRef<TimelineVariant> }> = Symbol('perfect-design:timeline')
