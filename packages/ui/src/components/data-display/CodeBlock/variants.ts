import { cva, type VariantProps } from '../../../lib/cva'

export const CODE_BLOCK_VARIANTS = ['default', 'window', 'terminal', 'plain', 'flush'] as const
export const CODE_BLOCK_SIZES = ['sm', 'md', 'lg'] as const
export type CodeBlockSize = (typeof CODE_BLOCK_SIZES)[number]
export type CodeBlockVariant = (typeof CODE_BLOCK_VARIANTS)[number]

/**
 * Outer surface. `terminal` inverts foreground/background so it reads as a console in both colour modes.
 * `plain` has no frame (sits inside another surface); `flush` is full-bleed with only top and bottom rules.
 * `size` sets the text size; wrap the result in `cn()` outside the component so `text-xs` / `text-base` replace the variant `text-sm`.
 */
export const codeBlockVariants = cva('flex flex-col overflow-hidden rounded-lg border', {
  variants: {
    variant: {
      default: 'bg-muted/40 text-sm text-foreground',
      window: 'bg-muted/40 text-sm text-foreground',
      terminal: 'border-foreground/20 bg-foreground text-sm text-background',
      plain: 'rounded-none border-transparent bg-transparent text-sm text-foreground',
      flush: 'rounded-none border-x-0 bg-muted/40 text-sm text-foreground',
    },
    size: {
      sm: 'text-xs',
      md: '',
      lg: 'text-base',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
})

export const codeBlockHeaderVariants = cva('flex shrink-0 items-center justify-between gap-2 border-b py-1 ps-3 pe-1.5 text-xs', {
  variants: {
    variant: {
      default: 'bg-muted/60 text-muted-foreground',
      window: 'bg-muted/60 text-muted-foreground',
      terminal: 'border-background/15 bg-background/10 text-background/70',
      plain: 'bg-transparent text-muted-foreground',
      flush: 'bg-muted/60 text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
})

export const codeBlockTabVariants = cva('rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60', {
  variants: {
    variant: { default: '', window: '', terminal: '', plain: '', flush: '' },
    active: { true: '', false: '' },
  },
  compoundVariants: [
    { variant: ['default', 'window', 'plain', 'flush'], active: true, class: 'bg-background text-foreground shadow-xs' },
    { variant: ['default', 'window', 'plain', 'flush'], active: false, class: 'text-muted-foreground hover:text-foreground' },
    { variant: 'terminal', active: true, class: 'bg-background/20 text-background' },
    { variant: 'terminal', active: false, class: 'text-background/60 hover:text-background' },
  ],
  defaultVariants: { variant: 'default', active: false },
})

/** Per-line diff / highlight styling. */
export const codeBlockLineVariants = cva('block min-h-lh', {
  variants: {
    diff: { none: '', add: 'bg-success/15', remove: 'bg-destructive/15', hunk: 'bg-muted/70 text-muted-foreground' },
    highlighted: { true: 'bg-primary/10', false: '' },
  },
  defaultVariants: { diff: 'none', highlighted: false },
})

export const codeBlockMarkerVariants = cva('me-2 inline-block w-[1ch] select-none text-center font-bold', {
  variants: {
    diff: { none: '', add: 'text-success', remove: 'text-destructive', hunk: 'text-muted-foreground' },
  },
  defaultVariants: { diff: 'none' },
})

export type CodeBlockDiffKind = 'none' | 'add' | 'remove' | 'hunk'
export type CodeBlockVariants = VariantProps<typeof codeBlockVariants>
