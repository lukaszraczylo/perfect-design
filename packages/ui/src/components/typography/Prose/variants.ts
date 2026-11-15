import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Descendant styling via Tailwind arbitrary variants. Every class is a complete static string so the
 * Tailwind scanner can see it. Spacing uses `my-*` on blocks, first/last children are reset.
 */
const elements = [
  // Headings
  '[&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:font-display [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-balance',
  '[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:pb-2 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-balance',
  '[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:tracking-tight',
  '[&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:font-display [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:tracking-tight',
  '[&_h5]:mt-6 [&_h5]:mb-2 [&_h5]:font-display [&_h5]:text-lg [&_h5]:font-semibold',
  '[&_h6]:mt-6 [&_h6]:mb-2 [&_h6]:font-display [&_h6]:text-md [&_h6]:font-semibold [&_h6]:text-muted-foreground',
  // Body
  '[&_p]:my-4 [&_p]:text-pretty',
  '[&_strong]:font-semibold',
  '[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary/80',
  // Lists
  '[&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6',
  '[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-6',
  '[&_li]:my-1.5 [&_li]:marker:text-muted-foreground',
  '[&_li>ul]:my-1.5 [&_li>ol]:my-1.5',
  // Code
  '[&_:not(pre)>code]:rounded-sm [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-sm [&_:not(pre)>code]:font-medium',
  '[&_pre]:my-6 [&_pre]:outline-hidden [&_pre:focus-visible]:ring-3 [&_pre:focus-visible]:ring-ring/40 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm',
  // Quotes, rules
  '[&_blockquote]:my-6 [&_blockquote]:border-s-2 [&_blockquote]:ps-4 [&_blockquote]:italic',
  '[&_hr]:my-8 [&_hr]:border-border',
  // Tables
  '[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm',
  '[&_th]:border-b [&_th]:px-3 [&_th]:py-2 [&_th]:text-start [&_th]:font-semibold',
  '[&_td]:border-b [&_td]:px-3 [&_td]:py-2 [&_td]:align-top',
  // Media
  '[&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg',
  '[&_figure]:my-6 [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figcaption]:text-muted-foreground',
  // Trim outer margins
  '[&>:first-child]:mt-0 [&>:last-child]:mb-0',
]

/** Descendant colours for the `inverted` tone (foreground-coloured surface, background-coloured text). */
const invertedElements = [
  '[&_h2]:border-background/20 [&_h6]:text-background/70',
  '[&_a]:text-background [&_a:hover]:text-background/80',
  '[&_li]:marker:text-background/60',
  '[&_:not(pre)>code]:bg-background/15',
  '[&_pre]:border-background/20 [&_pre]:bg-background/10',
  '[&_blockquote]:border-background/30 [&_hr]:border-background/20',
  '[&_th]:border-background/20 [&_td]:border-background/20',
  '[&_figcaption]:text-background/70',
]

/** `compact` density: tighter vertical rhythm (dense help panels, changelogs). Later classes win over the defaults through `cn()`. */
const compactElements = [
  '[&_h1]:mt-6 [&_h1]:mb-2 [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:mt-5 [&_h3]:mb-2',
  '[&_h4]:mt-4 [&_h4]:mb-1.5 [&_h5]:mt-4 [&_h5]:mb-1.5 [&_h6]:mt-4 [&_h6]:mb-1.5',
  '[&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_li>ul]:my-0.5 [&_li>ol]:my-0.5',
  '[&_pre]:my-4 [&_blockquote]:my-4 [&_hr]:my-5 [&_table]:my-4 [&_img]:my-4 [&_figure]:my-4',
]

/** `relaxed` density: looser rhythm and line height for long-form reading. */
const relaxedElements = [
  'leading-relaxed',
  '[&_h1]:mt-14 [&_h1]:mb-6 [&_h2]:mt-14 [&_h2]:mb-4 [&_h3]:mt-10 [&_h3]:mb-4',
  '[&_h4]:mt-8 [&_h4]:mb-3 [&_h5]:mt-8 [&_h5]:mb-3 [&_h6]:mt-8 [&_h6]:mb-3',
  '[&_p]:my-6 [&_ul]:my-6 [&_ol]:my-6 [&_li]:my-2.5 [&_li>ul]:my-2.5 [&_li>ol]:my-2.5',
  '[&_pre]:my-8 [&_blockquote]:my-8 [&_hr]:my-12 [&_table]:my-8 [&_img]:my-8 [&_figure]:my-8',
]

export const proseVariants = cva(['text-foreground', ...elements], {
  variants: {
    size: {
      xs: 'text-sm',
      sm: 'text-base',
      base: 'text-md',
      md: 'text-md',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    /**
     * Vertical rhythm. `default` adds nothing. Declared after `size` so `relaxed`'s `leading-relaxed` is not dropped by
     * tailwind-merge (a later `text-*` size removes an earlier `leading-*`). Wrap the result in `cn()` outside the component.
     */
    density: {
      compact: compactElements,
      default: '',
      relaxed: relaxedElements,
    },
    tone: {
      default: '',
      /** Swaps foreground and background tokens: a high-contrast block that works in light and dark. */
      inverted: ['rounded-lg bg-foreground p-6 text-background', ...invertedElements],
      /** Forces the dark palette for this block regardless of the page theme. */
      dark: 'dark rounded-lg border bg-background p-6 text-foreground',
    },
    measure: {
      true: 'max-w-prose',
      false: '',
    },
  },
  defaultVariants: { size: 'base', density: 'default', measure: false, tone: 'default' },
})

export type ProseVariants = VariantProps<typeof proseVariants>
export type ProseSize = NonNullable<ProseVariants['size']>
export type ProseTone = NonNullable<ProseVariants['tone']>
export type ProseDensity = NonNullable<ProseVariants['density']>
