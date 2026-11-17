import { cva, type VariantProps } from '../../../lib/cva'

export const siteHeaderVariantNames = ['default', 'centered', 'minimal', 'transparent', 'floating', 'with-announcement', 'stacked'] as const
export type SiteHeaderVariant = (typeof siteHeaderVariantNames)[number]

export const siteHeaderSizeNames = ['sm', 'md', 'lg'] as const
export type SiteHeaderSize = (typeof siteHeaderSizeNames)[number]

export const siteHeaderToneNames = ['default', 'muted', 'inverted'] as const
export type SiteHeaderTone = (typeof siteHeaderToneNames)[number]

export const siteHeaderAppearanceNames = ['bordered', 'flat', 'elevated'] as const
export type SiteHeaderAppearance = (typeof siteHeaderAppearanceNames)[number]

/** Variants that are a full-width bar (as opposed to the detached `floating` panel and the overlay `transparent`). */
const BARS = ['default', 'centered', 'with-announcement', 'minimal', 'stacked'] as const

/**
 * Surface per tone: `default` is the page surface, `muted` the muted surface, `inverted` the ink surface with page-coloured text
 * (background on foreground is the tested foreground/background pair).
 */
const SURFACE = {
  default: 'bg-background text-foreground',
  muted: 'bg-muted text-foreground',
  inverted: 'bg-foreground text-background',
} as const

/**
 * Border per appearance and tone. `bordered` is the original hairline, `flat` has none (a floating panel keeps a transparent
 * border so its box does not change size, and forced-colors mode still draws it), `elevated` is a 2px border in the stronger
 * `input` colour. Nothing casts a shadow. Written out in full so Tailwind finds each class.
 */
const BAR_BORDER = {
  bordered: { default: 'border-b border-border', muted: 'border-b border-border', inverted: 'border-b border-background/20' },
  flat: { default: '', muted: '', inverted: '' },
  elevated: { default: 'border-b-2 border-input', muted: 'border-b-2 border-input', inverted: 'border-b-2 border-background/40' },
} as const
const PANEL_BORDER = {
  bordered: { default: 'border border-border', muted: 'border border-border', inverted: 'border border-background/20' },
  flat: { default: 'border border-transparent', muted: 'border border-transparent', inverted: 'border border-transparent' },
  elevated: { default: 'border-2 border-input', muted: 'border-2 border-input', inverted: 'border-2 border-background/40' },
} as const

const tones = siteHeaderToneNames
const appearances = siteHeaderAppearanceNames

type Compound = { variant: SiteHeaderVariant | SiteHeaderVariant[]; solid?: boolean; tone: SiteHeaderTone; appearance?: SiteHeaderAppearance; class: string }

const SURFACE_COMPOUNDS: Compound[] = tones.flatMap((tone) => [
  { variant: [...BARS, 'floating'], tone, class: SURFACE[tone] },
  { variant: 'transparent', solid: true, tone, class: SURFACE[tone] },
])
const BORDER_COMPOUNDS: Compound[] = tones.flatMap((tone) =>
  appearances.flatMap((appearance) => [
    { variant: [...BARS], tone, appearance, class: BAR_BORDER[appearance][tone] },
    { variant: 'floating', tone, appearance, class: PANEL_BORDER[appearance][tone] },
    { variant: 'transparent', solid: true, tone, appearance, class: BAR_BORDER[appearance][tone] },
  ]),
)

/**
 * Root element look per variant. `solid` = scrolled or menu open, `sticky` = stay in view.
 * All surfaces are opaque (no backdrop blur, no translucent fills, no shadows); the bar is separated by a border (`appearance`).
 * `tone` sets the surface; the transparent variant takes it only once it is solid.
 */
export const siteHeaderVariants = cva('z-(--z-sticky)', {
  variants: {
    variant: {
      default: 'top-0 w-full',
      centered: 'top-0 w-full',
      'with-announcement': 'top-0 w-full',
      minimal: 'top-0 w-full',
      stacked: 'top-0 w-full',
      transparent: 'inset-x-0 top-0 w-full transition-colors duration-200 motion-reduce:transition-none',
      floating: 'mx-auto mt-4 w-11/12 max-w-5xl rounded-lg',
    },
    sticky: {
      true: '',
      false: 'relative',
    },
    solid: {
      true: '',
      false: '',
    },
    tone: { default: '', muted: '', inverted: '' },
    appearance: { bordered: '', flat: '', elevated: '' },
  },
  compoundVariants: [
    { variant: 'transparent', sticky: true, class: 'fixed' },
    { variant: 'transparent', sticky: false, class: 'absolute' },
    { variant: 'floating', sticky: true, class: 'sticky top-4' },
    { variant: [...BARS], sticky: true, class: 'sticky' },
    { variant: 'transparent', solid: false, class: 'border-b border-transparent bg-transparent' },
    ...SURFACE_COMPOUNDS,
    ...BORDER_COMPOUNDS,
  ],
  defaultVariants: { variant: 'default', sticky: true, solid: false, tone: 'default', appearance: 'bordered' },
})

export type SiteHeaderVariants = VariantProps<typeof siteHeaderVariants>

/**
 * Bar height is a minimum, not fixed, so the header grows with larger text or a wrapping nav instead of clipping.
 * `size` sets the minimum: 3rem, 4rem (default) or 5rem; `minimal` and `floating` are one step slimmer.
 * `stacked` wraps: brand and actions on the first row, the navigation on a second row.
 */
export const siteHeaderBarVariants = cva('mx-auto w-full items-center gap-4', {
  variants: {
    variant: {
      default: 'flex max-w-7xl justify-between px-4 sm:px-6 lg:px-8',
      'with-announcement': 'flex max-w-7xl justify-between px-4 sm:px-6 lg:px-8',
      transparent: 'flex max-w-7xl justify-between px-4 sm:px-6 lg:px-8',
      centered: 'grid max-w-7xl grid-cols-3 px-4 sm:px-6 lg:px-8',
      stacked: 'flex max-w-7xl flex-wrap justify-between px-4 sm:px-6 lg:px-8',
      minimal: 'flex max-w-5xl justify-between px-4 sm:px-6',
      floating: 'flex justify-between px-4 sm:px-6',
    },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: ['default', 'with-announcement', 'transparent', 'centered', 'stacked'], size: 'sm', class: 'min-h-12' },
    { variant: ['default', 'with-announcement', 'transparent', 'centered', 'stacked'], size: 'md', class: 'min-h-16' },
    { variant: ['default', 'with-announcement', 'transparent', 'centered', 'stacked'], size: 'lg', class: 'min-h-20' },
    { variant: ['minimal', 'floating'], size: 'sm', class: 'min-h-10' },
    { variant: ['minimal', 'floating'], size: 'md', class: 'min-h-14' },
    { variant: ['minimal', 'floating'], size: 'lg', class: 'min-h-16' },
  ],
  defaultVariants: { variant: 'default', size: 'md' },
})

/** Brand link text by size. */
export const siteHeaderBrandVariants = cva('inline-flex min-h-6 items-center rounded-md font-semibold tracking-tight pointer-coarse:min-h-11', {
  variants: { size: { sm: 'text-base', md: 'text-lg', lg: 'text-xl' } },
  defaultVariants: { size: 'md' },
})

/**
 * Nav links. Target size stays 24px (44px on coarse pointers) at every size; the current page is underlined as well as
 * recoloured. The inverted tone has no muted text colour to use: links are page-coloured and underline on hover.
 */
export const siteHeaderLinkVariants = cva('inline-flex min-h-6 items-center rounded-md px-3 py-2 font-medium transition-colors pointer-coarse:min-h-11', {
  variants: {
    size: { sm: 'text-sm', md: 'text-sm', lg: 'text-base' },
    tone: {
      default: 'text-muted-foreground hover:text-foreground',
      muted: 'text-muted-foreground hover:text-foreground',
      inverted: 'text-background hover:underline hover:underline-offset-4',
    },
    active: {
      true: 'underline decoration-2 underline-offset-4',
      false: '',
    },
  },
  compoundVariants: [
    { tone: ['default', 'muted'], active: true, class: 'text-foreground' },
  ],
  defaultVariants: { size: 'md', tone: 'default', active: false },
})

/** Menu button. Hover fill is `accent` on light surfaces and a page-coloured wash on the inverted surface. */
export const siteHeaderToggleVariants = cva('inline-flex items-center justify-center rounded-md pointer-coarse:size-11', {
  variants: {
    size: { sm: 'size-9', md: 'size-10', lg: 'size-11' },
    tone: {
      default: 'hover:bg-accent',
      muted: 'hover:bg-accent',
      inverted: 'hover:bg-background/20',
    },
  },
  defaultVariants: { size: 'md', tone: 'default' },
})

/**
 * Focus indicator for the inverted surface. The shared ring colour does not reach 3:1 against the ink surface, so the
 * inverted tone draws an outline in the page colour (visible in forced-colors mode too).
 */
export const siteHeaderInvertedFocus = 'outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-background'

/** Mobile menu panel: the same surface as the bar, with a rule above it. */
export const siteHeaderPanelVariants = cva('max-h-dvh overflow-y-auto border-t px-4 pb-4 pt-2', {
  variants: {
    tone: {
      default: 'bg-background text-foreground',
      muted: 'bg-muted text-foreground',
      inverted: 'border-background/20 bg-foreground text-background',
    },
  },
  defaultVariants: { tone: 'default' },
})

/** Muted text on the surface of each tone (group titles in the mobile menu). */
export const siteHeaderMutedTextVariants = cva('', {
  variants: { tone: { default: 'text-muted-foreground', muted: 'text-muted-foreground', inverted: 'text-background' } },
  defaultVariants: { tone: 'default' },
})

/** Rules inside the header (group separator, stacked nav row) in the border colour of each tone. */
export const siteHeaderRuleVariants = cva('', {
  variants: { tone: { default: '', muted: '', inverted: 'border-background/20' } },
  defaultVariants: { tone: 'default' },
})
