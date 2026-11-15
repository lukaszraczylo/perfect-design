import { cva, type VariantProps } from '../../../lib/cva'

/** `gap` is the space between members: `sm` 16px, `md` 24px (the original), `lg` 40px. */
export const teamGridVariants = cva('grid', {
  variants: {
    gap: { sm: 'gap-4', md: 'gap-6', lg: 'gap-10' },
    columns: {
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-2 lg:grid-cols-3',
      4: 'sm:grid-cols-2 lg:grid-cols-4',
    },
  },
  defaultVariants: { gap: 'md', columns: 3 },
})

/**
 * One member. `variant` is the layout, `size` the spacing, `align` where the text of the stacked layouts sits. The `centered`
 * layout is always centred and `horizontal` is always start-aligned (the avatar sits beside the text), so `align` only moves `card` and `minimal`.
 */
export const teamMemberVariants = cva('flex min-w-0', {
  variants: {
    variant: {
      card: 'flex-col rounded-lg border bg-card text-card-foreground',
      minimal: 'flex-col',
      centered: 'flex-col items-center text-center',
      horizontal: 'flex-row items-start',
    },
    size: { sm: '', md: '', lg: '' },
    align: { start: '', center: '' },
  },
  compoundVariants: [
    { variant: ['card', 'minimal', 'centered'], size: 'sm', class: 'gap-3' },
    { variant: ['card', 'minimal', 'centered'], size: 'md', class: 'gap-4' },
    { variant: ['card', 'minimal', 'centered'], size: 'lg', class: 'gap-5' },
    { variant: 'horizontal', size: 'sm', class: 'gap-3 sm:gap-4' },
    { variant: 'horizontal', size: 'md', class: 'gap-4 sm:gap-5' },
    { variant: 'horizontal', size: 'lg', class: 'gap-5 sm:gap-6' },
    { variant: 'card', size: 'sm', class: 'p-4' },
    { variant: 'card', size: 'md', class: 'p-6' },
    { variant: 'card', size: 'lg', class: 'p-8' },
    { variant: ['card', 'minimal'], align: 'center', class: 'items-center text-center' },
  ],
  defaultVariants: { variant: 'card', size: 'md', align: 'start' },
})

/** Avatar box and initials size per layout and `size` (merged over the Avatar defaults). */
export const teamMemberAvatarVariants = cva('shrink-0', {
  variants: {
    variant: { card: '', minimal: '', centered: '', horizontal: '' },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: 'card', size: 'sm', class: 'size-16 text-lg' },
    { variant: 'card', size: 'md', class: 'size-20 text-xl' },
    { variant: 'card', size: 'lg', class: 'size-28 text-3xl' },
    { variant: ['minimal', 'centered'], size: 'sm', class: 'size-20 text-xl' },
    { variant: ['minimal', 'centered'], size: 'md', class: 'size-24 text-2xl' },
    { variant: ['minimal', 'centered'], size: 'lg', class: 'size-32 text-4xl' },
    { variant: 'horizontal', size: 'sm', class: 'size-12 text-base' },
    { variant: 'horizontal', size: 'md', class: 'size-16 text-lg' },
    { variant: 'horizontal', size: 'lg', class: 'size-20 text-xl' },
  ],
  defaultVariants: { variant: 'card', size: 'md' },
})

export const teamMemberLinksVariants = cva('mt-1 flex flex-wrap items-center gap-x-3 gap-y-1', {
  variants: {
    variant: {
      card: '',
      minimal: '',
      centered: 'justify-center',
      horizontal: '',
    },
    align: { start: '', center: '' },
  },
  compoundVariants: [{ variant: ['card', 'minimal'], align: 'center', class: 'justify-center' }],
  defaultVariants: { variant: 'card', align: 'start' },
})

/** Member name: 16px, 18px (the original) or 20px. */
export const teamMemberNameVariants = cva('font-semibold tracking-tight [overflow-wrap:anywhere]', {
  variants: { size: { sm: 'text-base', md: 'text-lg', lg: 'text-xl' } },
  defaultVariants: { size: 'md' },
})

/** Role line (primary text, 14px; 16px at `lg`). */
export const teamMemberRoleVariants = cva('font-medium text-primary [overflow-wrap:anywhere]', {
  variants: { size: { sm: 'text-sm', md: 'text-sm', lg: 'text-base' } },
  defaultVariants: { size: 'md' },
})

/** Biography (muted, 14px; 16px at `lg`). */
export const teamMemberBioVariants = cva('mt-1 text-pretty text-muted-foreground [overflow-wrap:anywhere]', {
  variants: { size: { sm: 'text-sm', md: 'text-sm', lg: 'text-base' } },
  defaultVariants: { size: 'md' },
})

export type TeamGridVariants = VariantProps<typeof teamGridVariants>
export type TeamGridColumns = NonNullable<TeamGridVariants['columns']>
export type TeamGridGap = NonNullable<TeamGridVariants['gap']>
export type TeamMemberVariants = VariantProps<typeof teamMemberVariants>
export type TeamGridVariant = NonNullable<TeamMemberVariants['variant']>
export type TeamMemberSize = NonNullable<TeamMemberVariants['size']>
export type TeamMemberAlign = NonNullable<TeamMemberVariants['align']>
/** Avatar shape, forwarded to `Avatar`. */
export type TeamMemberShape = 'circle' | 'rounded' | 'square'

export const TEAM_VARIANTS: readonly TeamGridVariant[] = ['card', 'minimal', 'centered', 'horizontal']
export const TEAM_SIZES: readonly TeamMemberSize[] = ['sm', 'md', 'lg']
export const TEAM_ALIGNS: readonly TeamMemberAlign[] = ['start', 'center']
export const TEAM_SHAPES: readonly TeamMemberShape[] = ['circle', 'rounded', 'square']
export const TEAM_GAPS: readonly TeamGridGap[] = ['sm', 'md', 'lg']
