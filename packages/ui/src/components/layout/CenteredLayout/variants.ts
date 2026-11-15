export type CenteredLayoutWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'
export type CenteredLayoutLayout = 'default' | 'card' | 'split'
export type CenteredLayoutIllustrationPosition = 'start' | 'end'

export const centeredWidthClasses: Record<CenteredLayoutWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
}

/** Root classes per layout. Classes are literal so Tailwind generates them. */
export const centeredRootClasses: Record<CenteredLayoutLayout, string> = {
  default: 'flex min-h-dvh flex-col items-center justify-center bg-background p-4 text-foreground sm:p-6',
  card: 'flex min-h-dvh flex-col items-center justify-center bg-muted p-4 text-foreground sm:p-6',
  split: 'grid min-h-dvh grid-cols-1 gap-6 bg-background p-4 text-foreground sm:p-6',
}

/** Extra classes for the inner column per layout. */
export const centeredColumnClasses: Record<CenteredLayoutLayout, string> = {
  default: '',
  card: 'rounded-lg border border-border bg-card p-6 text-card-foreground sm:p-8',
  split: 'place-self-center',
}

/** Split layout with an illustration: two equal columns from `lg`. */
export const centeredSplitColumns = 'lg:grid-cols-2'

export const centeredIllustrationClasses =
  'relative hidden overflow-hidden rounded-lg bg-muted text-muted-foreground lg:flex lg:items-center lg:justify-center'

export const centeredIllustrationPositionClasses: Record<CenteredLayoutIllustrationPosition, string> = {
  start: 'lg:order-first',
  end: '',
}

export const centeredLayouts: readonly string[] = ['default', 'card', 'split']
