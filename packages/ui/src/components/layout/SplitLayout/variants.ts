export type SplitRatio = 'equal' | '1/3' | '2/3' | '1:1' | '1:2' | '2:1' | '1:3' | '3:1' | 'fixed-start' | 'fixed-end'
export type SplitStackBelow = 'md' | 'lg'
export type SplitSticky = 'start' | 'end'

/** `grid-template-columns` per ratio (start:end). `equal` / `1:1` use the plain `grid-cols-2` class instead. */
export const splitRatioTemplates: Record<SplitRatio, string | undefined> = {
  equal: undefined,
  '1:1': undefined,
  '1/3': '1fr 2fr',
  '1:2': '1fr 2fr',
  '2/3': '2fr 1fr',
  '2:1': '2fr 1fr',
  '1:3': '1fr 3fr',
  '3:1': '3fr 1fr',
  'fixed-start': 'var(--split-fixed) 1fr',
  'fixed-end': '1fr var(--split-fixed)',
}

/**
 * Column classes per `stackBelow` breakpoint. Classes are literal so Tailwind generates them; ratios other than 1:1 read the
 * template from the `--split-cols` variable the component sets inline (no arbitrary values).
 */
export const splitRatioClasses: Record<SplitStackBelow, Record<SplitRatio, string>> = {
  md: Object.fromEntries(
    (Object.keys(splitRatioTemplates) as SplitRatio[]).map((r) => [r, splitRatioTemplates[r] ? 'md:grid-cols-(--split-cols)' : 'md:grid-cols-2']),
  ) as Record<SplitRatio, string>,
  lg: Object.fromEntries(
    (Object.keys(splitRatioTemplates) as SplitRatio[]).map((r) => [r, splitRatioTemplates[r] ? 'lg:grid-cols-(--split-cols)' : 'lg:grid-cols-2']),
  ) as Record<SplitRatio, string>,
}

export const splitDividerClasses: Record<SplitStackBelow, string> = {
  md: 'border-t border-border md:border-t-0 md:border-s',
  lg: 'border-t border-border lg:border-t-0 lg:border-s',
}

/** Divider when the end pane is shown first on mobile: the border sits under it instead of above. */
export const splitReverseDividerClasses: Record<SplitStackBelow, string> = {
  md: 'border-b border-border md:border-b-0 md:border-s',
  lg: 'border-b border-border lg:border-b-0 lg:border-s',
}

/** Show the end pane first while the panes are stacked. DOM order (reading / tab order) is unchanged. */
export const splitReverseClasses: Record<SplitStackBelow, string> = {
  md: 'max-md:order-first',
  lg: 'max-lg:order-first',
}

/** A pane stays in view while the page scrolls (once side by side); the offset comes from `--split-sticky-top`. */
export const splitStickyClasses: Record<SplitStackBelow, string> = {
  md: 'md:sticky md:top-(--split-sticky-top) md:self-start',
  lg: 'lg:sticky lg:top-(--split-sticky-top) lg:self-start',
}
