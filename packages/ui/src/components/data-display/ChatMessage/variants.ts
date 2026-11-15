import { cva, type VariantProps } from '../../../lib/cva'

export const CHAT_MESSAGE_ROLES = ['user', 'assistant', 'system', 'tool'] as const
export const CHAT_MESSAGE_VARIANTS = ['bubble', 'plain', 'card'] as const
export const CHAT_MESSAGE_ALIGNS = ['start', 'end'] as const
export const CHAT_MESSAGE_STATUSES = ['sending', 'sent', 'error', 'streaming'] as const

export type ChatMessageRole = (typeof CHAT_MESSAGE_ROLES)[number]
export type ChatMessageVariant = (typeof CHAT_MESSAGE_VARIANTS)[number]
export type ChatMessageAlign = (typeof CHAT_MESSAGE_ALIGNS)[number]
export type ChatMessageStatus = (typeof CHAT_MESSAGE_STATUSES)[number]

/** Root row: avatar column and message column. `end` flips the row (logical, so it also flips in right-to-left). */
export const chatMessageVariants = cva('group/msg flex w-full min-w-0 items-start gap-2', {
  variants: {
    align: { start: '', end: 'flex-row-reverse' },
  },
  defaultVariants: { align: 'start' },
})

/** Message column. Bubbles and cards keep a readable measure; plain text may run wider. */
export const chatMessageMainVariants = cva('flex min-w-0 max-w-full flex-col gap-1', {
  variants: {
    align: { start: 'items-start', end: 'items-end' },
    variant: { bubble: 'sm:max-w-xl', card: 'sm:max-w-xl', plain: 'sm:max-w-3xl' },
  },
  defaultVariants: { align: 'start', variant: 'bubble' },
})

/**
 * The content surface. Colour pairs are the ones `contrast.test.ts` covers: foreground on card, muted and secondary,
 * muted-foreground on background and muted. A transparent border is drawn in forced-colors mode, where backgrounds vanish.
 */
export const chatMessageBodyVariants = cva('min-w-0 max-w-full break-words text-base', {
  variants: {
    variant: {
      bubble: 'rounded-lg border border-transparent px-3 py-2',
      plain: 'py-1',
      card: 'rounded-lg border bg-card px-4 py-3 text-card-foreground',
    },
    role: {
      user: '',
      assistant: '',
      system: 'text-muted-foreground',
      tool: 'font-mono text-sm',
    },
  },
  compoundVariants: [
    { variant: 'bubble', role: 'user', class: 'bg-secondary text-secondary-foreground' },
    { variant: 'bubble', role: 'assistant', class: 'bg-muted text-foreground' },
    { variant: 'bubble', role: 'system', class: 'border-dashed border-border bg-background' },
    { variant: 'bubble', role: 'tool', class: 'border-border bg-card text-card-foreground' },
    { variant: 'plain', role: 'user', class: 'text-foreground' },
    { variant: 'plain', role: 'assistant', class: 'text-foreground' },
    { variant: 'plain', role: 'tool', class: 'text-foreground' },
    { variant: 'card', role: 'system', class: 'bg-muted text-muted-foreground' },
  ],
  defaultVariants: { variant: 'bubble', role: 'assistant' },
})

/** Copy and retry buttons: hidden until hover or focus, always shown on touch and in forced-colors mode. They stay in the tab order and the accessibility tree. */
export const chatMessageActionsClasses =
  'flex items-center gap-1 opacity-0 transition-opacity group-hover/msg:opacity-100 group-focus-within/msg:opacity-100 pointer-coarse:opacity-100 forced-colors:opacity-100 motion-reduce:transition-none'

export type ChatMessageVariants = VariantProps<typeof chatMessageVariants>
