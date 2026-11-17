import { cva, type VariantProps } from '../../../lib/cva'

export const CODE_VIEWER_VARIANTS = ['bordered', 'plain', 'flush'] as const
export type CodeViewerVariant = (typeof CODE_VIEWER_VARIANTS)[number]
export const CODE_VIEWER_SIZES = ['sm', 'md', 'lg'] as const
export type CodeViewerSize = (typeof CODE_VIEWER_SIZES)[number]

/**
 * Outer frame. `bordered` is a card-like panel; `plain` has no frame so the viewer can sit inside another surface;
 * `flush` is a full-bleed panel with only top and bottom rules. `size` sets the text size (outside the component wrap the
 * result in `cn()` so `text-xs` / `text-base` replace the base `text-sm`).
 */
export const codeViewerVariants = cva('flex min-w-0 max-w-full flex-col overflow-hidden text-sm text-foreground', {
  variants: {
    variant: {
      bordered: 'rounded-md border bg-card text-card-foreground',
      plain: '',
      flush: 'rounded-none border-x-0 border-y bg-card text-card-foreground',
    },
    size: {
      sm: 'text-xs',
      md: '',
      lg: 'text-base',
    },
  },
  defaultVariants: { variant: 'bordered', size: 'md' },
})

/** Token colours: semantic, contrast-tested tokens only. Weight and italics carry meaning where colour is shared. */
export const codeViewerTokenVariants = cva('', {
  variants: {
    type: {
      keyword: 'text-primary',
      string: 'text-success',
      number: 'text-info',
      comment: 'text-muted-foreground italic',
      type: 'text-info',
      function: 'text-foreground font-medium',
      key: 'text-primary',
      constant: 'text-foreground font-medium',
      punctuation: 'text-muted-foreground',
      operator: 'text-muted-foreground',
      anchor: 'text-info',
      tag: 'text-info',
      plain: '',
    },
  },
  defaultVariants: { type: 'plain' },
})

export type CodeViewerVariants = VariantProps<typeof codeViewerVariants>
