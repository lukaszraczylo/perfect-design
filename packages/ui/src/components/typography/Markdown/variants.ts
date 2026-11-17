import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

export const MARKDOWN_SIZES = ['sm', 'md', 'lg'] as const
export const MARKDOWN_TONES = ['default', 'muted'] as const
export type MarkdownSize = (typeof MARKDOWN_SIZES)[number]
export type MarkdownTone = (typeof MARKDOWN_TONES)[number]

/**
 * Root. Body size maps onto the theme scale (`text-base` 14px, `text-md` 16px, `text-lg` 18px). Block mode keeps
 * a readable measure (`max-w-prose`, 65ch); override it with `class`. Long words and URLs wrap.
 */
export const markdownVariants = cva('min-w-0 break-words', {
  variants: {
    size: { sm: 'text-base', md: 'text-md', lg: 'text-lg' },
    tone: { default: 'text-foreground', muted: 'text-muted-foreground' },
    inline: { true: '', false: 'max-w-prose' },
  },
  defaultVariants: { size: 'md', tone: 'default', inline: false },
})
export type MarkdownVariants = VariantProps<typeof markdownVariants>

const HEADING_COMMON = 'min-w-0 scroll-mt-20 text-balance'
/** Heading typography by size, then level. Each level steps down in size; weight drops from bold to semibold after h1. */
const HEADINGS: Record<MarkdownSize, Record<number, string>> = {
  sm: {
    1: 'text-3xl font-bold tracking-tight text-foreground',
    2: 'text-2xl font-semibold tracking-tight text-foreground',
    3: 'text-xl font-semibold text-foreground',
    4: 'text-lg font-semibold text-foreground',
    5: 'text-md font-semibold text-foreground',
    6: 'text-base font-semibold text-muted-foreground',
  },
  md: {
    1: 'text-4xl font-bold tracking-tight text-foreground',
    2: 'text-3xl font-semibold tracking-tight text-foreground',
    3: 'text-2xl font-semibold tracking-tight text-foreground',
    4: 'text-xl font-semibold text-foreground',
    5: 'text-lg font-semibold text-foreground',
    6: 'text-md font-semibold text-muted-foreground',
  },
  lg: {
    1: 'text-5xl font-bold tracking-tight text-foreground',
    2: 'text-4xl font-semibold tracking-tight text-foreground',
    3: 'text-3xl font-semibold tracking-tight text-foreground',
    4: 'text-2xl font-semibold text-foreground',
    5: 'text-xl font-semibold text-foreground',
    6: 'text-lg font-semibold text-muted-foreground',
  },
}
const HEADING_SPACE: Record<number, string> = {
  1: 'mt-10 first:mt-0',
  2: 'mt-10 first:mt-0',
  3: 'mt-8 first:mt-0',
  4: 'mt-6 first:mt-0',
  5: 'mt-6 first:mt-0',
  6: 'mt-6 first:mt-0',
}

export function headingClass(size: MarkdownSize, level: number): string {
  return `${HEADING_COMMON} ${(HEADINGS[size] ?? HEADINGS.md)[level] ?? HEADINGS.md[6]}`
}
/** Outer spacing, applied to the heading, or to the wrapper when an anchor sits beside it. */
export function headingSpace(level: number): string {
  return HEADING_SPACE[level] ?? HEADING_SPACE[6]
}

/** Element classes. Complete static strings so the Tailwind scanner sees them. */
export const md = {
  paragraph: 'mt-4 text-pretty first:mt-0',
  blockquote: 'mt-4 border-s-2 border-border ps-4 text-muted-foreground first:mt-0',
  hr: 'my-8 border-border',
  strong: 'font-semibold',
  del: 'line-through',
  inlineCode: 'rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.875em] text-foreground',
  link: `rounded-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80 ${focusRing}`,
  image: 'h-auto max-w-full rounded-md',
  figure: 'mt-4 first:mt-0',
  figcaption: 'mt-2 text-sm text-muted-foreground',
  anchor: `inline-flex min-h-6 min-w-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground no-underline hover:text-foreground ${focusRing}`,
  headingRow: 'flex items-baseline gap-1',
  ul: 'ps-6 list-disc',
  ulNested: 'ps-6 list-[circle]',
  ulDeep: 'ps-6 list-[square]',
  ol: 'ps-6 list-decimal',
  olNested: 'ps-6 list-[lower-alpha]',
  olDeep: 'ps-6 list-[lower-roman]',
  tasks: 'ps-0 list-none',
  listTop: 'mt-4 first:mt-0',
  listInner: 'mt-1.5',
  item: 'mt-1.5 first:mt-0 marker:text-muted-foreground',
  itemLoose: 'mt-4 first:mt-0 marker:text-muted-foreground',
  task: 'flex list-none items-start gap-2',
  taskMixed: '-ms-6 flex list-none items-start gap-2',
  checkbox: 'mt-[0.35em] size-4 shrink-0 accent-primary',
  taskBody: 'min-w-0 flex-1',
  tableScroll: `mt-4 max-w-full overflow-x-auto rounded-md border first:mt-0 focus-visible:ring-inset ${focusRing}`,
  table: 'w-full border-collapse [&_tbody_tr:last-child_td]:border-b-0',
  thead: 'bg-muted/50 text-foreground',
  th: 'border-b px-3 py-2 align-bottom font-semibold',
  td: 'border-b px-3 py-2 align-top',
  codeWrap: 'mt-4 max-w-full min-w-0 first:mt-0',
  plainCode: 'flex max-w-full min-w-0 flex-col overflow-hidden rounded-md border bg-card text-sm text-foreground',
  plainCodeHeader: 'flex min-h-8 shrink-0 items-center justify-between gap-2 border-b bg-muted py-1 ps-3 pe-1.5 text-xs text-muted-foreground',
  plainCodePre: `m-0 min-w-0 overflow-auto p-3 font-mono leading-6 whitespace-pre focus-visible:ring-inset ${focusRing}`,
  plain: 'whitespace-pre-wrap',
} as const

export const ALIGN_CLASS = { left: 'text-start', center: 'text-center', right: 'text-end' } as const
