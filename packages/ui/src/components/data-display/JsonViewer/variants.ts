import { cva, type VariantProps } from '../../../lib/cva'

export const JSON_VIEWER_VARIANTS = ['default', 'plain', 'flush'] as const
export const JSON_VIEWER_SIZES = ['sm', 'md', 'lg'] as const

/** Outer surface of the viewer: `default` bordered card, `plain` no chrome, `flush` full-bleed with top and bottom rules. */
export const jsonViewerVariants = cva('font-mono leading-snug text-foreground', {
  variants: {
    variant: {
      default: 'rounded-md border bg-card p-2',
      plain: '',
      flush: 'rounded-none border-x-0 border-y bg-card px-2 py-2',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
})

/** Token colour per JSON value type. Exported so custom row renderers stay consistent. */
export const jsonViewerValueVariants = cva('min-w-0 break-words', {
  variants: {
    type: {
      string: 'text-success',
      number: 'text-info',
      bigint: 'text-info',
      boolean: 'text-primary',
      null: 'italic text-muted-foreground',
      undefined: 'italic text-muted-foreground',
      symbol: 'text-foreground',
      function: 'italic text-foreground',
      date: 'text-warning-foreground dark:text-warning',
      error: 'text-destructive',
      circular: 'italic text-destructive',
      unreadable: 'italic text-destructive',
      object: 'text-muted-foreground',
      array: 'text-muted-foreground',
      map: 'text-muted-foreground',
      set: 'text-muted-foreground',
    },
  },
  defaultVariants: { type: 'object' },
})

export type JsonViewerVariants = VariantProps<typeof jsonViewerVariants>
export type JsonViewerVariant = NonNullable<JsonViewerVariants['variant']>
export type JsonViewerSize = NonNullable<JsonViewerVariants['size']>
