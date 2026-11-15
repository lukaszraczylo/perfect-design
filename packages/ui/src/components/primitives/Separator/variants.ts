import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Plain divider. Orientation is read from reka's `data-orientation` attribute, so invalid values fall back
 * to horizontal. `dashed` / `dotted` are drawn with a border (no background fill).
 *
 * - `size` is the line thickness: `thin` (1px, default), `md` (2px) or `thick` (3px).
 * - `tone` is the colour: `default` (border token), `muted` (half strength), `strong` (the form-control border,
 *   which meets 3:1 on the page and card surfaces) or `primary`.
 * - Tone and size classes are emitted after the base classes so they win. Wrap the result in `cn()` when you use
 *   these helpers outside the component so tailwind-merge drops the overridden defaults.
 * - A filled (`solid`) line paints `forced-colors:bg-[CanvasText]` (a system colour keeps its value in forced-colors mode, an
 *   author background token does not), so the default hairline stays visible. Every non-default size and tone also adds a fallback
 *   border (borders are kept in forced-colors mode).
 */
export const separatorVariants = cva(
  'shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
  {
    variants: {
      variant: {
        solid: 'bg-border forced-colors:bg-[CanvasText]',
        dashed: 'border-dashed border-border data-[orientation=horizontal]:border-t data-[orientation=vertical]:border-l',
        dotted: 'border-dotted border-border data-[orientation=horizontal]:border-t data-[orientation=vertical]:border-l',
      },
      size: {
        thin: '',
        md: 'data-[orientation=horizontal]:h-0.5 data-[orientation=vertical]:w-0.5',
        thick: 'data-[orientation=horizontal]:h-0.75 data-[orientation=vertical]:w-0.75',
      },
      tone: {
        default: '',
        muted: '',
        strong: '',
        primary: '',
      },
    },
    compoundVariants: [
      { variant: 'solid', tone: 'muted', class: 'bg-border/50' },
      { variant: 'solid', tone: 'strong', class: 'bg-input' },
      { variant: 'solid', tone: 'primary', class: 'bg-primary' },
      { variant: ['dashed', 'dotted'], tone: 'muted', class: 'border-border/50' },
      { variant: ['dashed', 'dotted'], tone: 'strong', class: 'border-input' },
      { variant: ['dashed', 'dotted'], tone: 'primary', class: 'border-primary' },
      // Forced colours replace backgrounds but keep borders, so a filled line also draws a border there.
      { variant: 'solid', tone: ['muted', 'strong', 'primary'], class: 'forced-colors:data-[orientation=horizontal]:border-t forced-colors:data-[orientation=vertical]:border-l' },
      { variant: 'solid', size: 'md', class: 'forced-colors:data-[orientation=horizontal]:border-t-2 forced-colors:data-[orientation=vertical]:border-l-2' },
      { variant: 'solid', size: 'thick', class: 'forced-colors:data-[orientation=horizontal]:border-t-3 forced-colors:data-[orientation=vertical]:border-l-3' },
      { variant: ['dashed', 'dotted'], size: 'md', class: 'data-[orientation=horizontal]:border-t-2 data-[orientation=vertical]:border-l-2' },
      { variant: ['dashed', 'dotted'], size: 'thick', class: 'data-[orientation=horizontal]:border-t-3 data-[orientation=vertical]:border-l-3' },
    ],
    defaultVariants: { variant: 'solid', size: 'thin', tone: 'default' },
  },
)

/** Root of a separator that carries a label (flex row, or column when vertical). */
export const separatorLabelledVariants = cva(
  'flex shrink-0 items-center gap-3 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:flex-col',
)

/** One of the lines next to the label; grows to fill the free space. Same `size` and `tone` as the plain line. */
export const separatorLineVariants = cva('block flex-1', {
  variants: {
    variant: {
      solid: 'bg-border forced-colors:bg-[CanvasText]',
      dashed: 'border-dashed border-border',
      dotted: 'border-dotted border-border',
    },
    orientation: {
      horizontal: 'h-px min-w-4',
      vertical: 'w-px min-h-4',
    },
    size: {
      thin: '',
      md: '',
      thick: '',
    },
    tone: {
      default: '',
      muted: '',
      strong: '',
      primary: '',
    },
  },
  compoundVariants: [
    { variant: ['dashed', 'dotted'], orientation: 'horizontal', class: 'border-t' },
    { variant: ['dashed', 'dotted'], orientation: 'vertical', class: 'border-l' },
    { variant: 'solid', tone: 'muted', class: 'bg-border/50' },
    { variant: 'solid', tone: 'strong', class: 'bg-input' },
    { variant: 'solid', tone: 'primary', class: 'bg-primary' },
    { variant: ['dashed', 'dotted'], tone: 'muted', class: 'border-border/50' },
    { variant: ['dashed', 'dotted'], tone: 'strong', class: 'border-input' },
    { variant: ['dashed', 'dotted'], tone: 'primary', class: 'border-primary' },
    { variant: 'solid', orientation: 'horizontal', tone: ['muted', 'strong', 'primary'], class: 'forced-colors:border-t' },
    { variant: 'solid', orientation: 'vertical', tone: ['muted', 'strong', 'primary'], class: 'forced-colors:border-l' },
    { orientation: 'horizontal', size: 'md', class: 'h-0.5' },
    { orientation: 'horizontal', size: 'thick', class: 'h-0.75' },
    { orientation: 'vertical', size: 'md', class: 'w-0.5' },
    { orientation: 'vertical', size: 'thick', class: 'w-0.75' },
    { variant: 'solid', orientation: 'horizontal', size: 'md', class: 'forced-colors:border-t-2' },
    { variant: 'solid', orientation: 'horizontal', size: 'thick', class: 'forced-colors:border-t-3' },
    { variant: 'solid', orientation: 'vertical', size: 'md', class: 'forced-colors:border-l-2' },
    { variant: 'solid', orientation: 'vertical', size: 'thick', class: 'forced-colors:border-l-3' },
    { variant: ['dashed', 'dotted'], orientation: 'horizontal', size: 'md', class: 'border-t-2' },
    { variant: ['dashed', 'dotted'], orientation: 'horizontal', size: 'thick', class: 'border-t-3' },
    { variant: ['dashed', 'dotted'], orientation: 'vertical', size: 'md', class: 'border-l-2' },
    { variant: ['dashed', 'dotted'], orientation: 'vertical', size: 'thick', class: 'border-l-3' },
  ],
  defaultVariants: { variant: 'solid', orientation: 'horizontal', size: 'thin', tone: 'default' },
})

/** The text between the lines. The tone picks a text colour from the same family as the line. */
export const separatorLabelVariants = cva('shrink-0 text-xs font-medium text-muted-foreground', {
  variants: {
    tone: {
      default: '',
      muted: '',
      strong: 'text-foreground',
      primary: 'text-primary',
    },
  },
  defaultVariants: { tone: 'default' },
})

export type SeparatorVariants = VariantProps<typeof separatorVariants>
export type SeparatorVariant = NonNullable<SeparatorVariants['variant']>
export type SeparatorSize = NonNullable<SeparatorVariants['size']>
export type SeparatorTone = NonNullable<SeparatorVariants['tone']>
/** Where the label sits on the line: `start` (line after it), `center` (line both sides), `end` (line before it). */
export type SeparatorAlign = 'start' | 'center' | 'end'
