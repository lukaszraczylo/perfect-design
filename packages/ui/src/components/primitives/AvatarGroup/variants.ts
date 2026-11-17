import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Avatar group layout.
 *
 * - `layout`: `stacked` (default) overlaps the avatars and separates them with a background-coloured ring;
 *   forced-colors mode drops the box-shadow ring (and the avatar surfaces), so each avatar gets a `CanvasText` outline there instead;
 *   `spaced` lays them out side by side with a gap and wraps to the next line, so nothing overlaps.
 * - `density`: stacked = how much they overlap (`compact` more, `loose` less); spaced = the gap
 *   (`compact` 4px, `default` 8px, `loose` 12px). The overlap steps follow `size`.
 */
type Overlap = [compact: string, normal: string, loose: string]
/** Each overlapped avatar also gets end padding equal to its overlap on the fallback (not images), so initials centre in the part that stays visible. */
const OVERLAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', Overlap> = {
  xs: ['-space-x-2 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-2', '-space-x-1.5 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-1.5', '-space-x-1 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-1'],
  sm: ['-space-x-3 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-3', '-space-x-2 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-2', '-space-x-1 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-1'],
  md: ['-space-x-3.5 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-3.5', '-space-x-2.5 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-2.5', '-space-x-1.5 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-1.5'],
  lg: ['-space-x-4 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-4', '-space-x-3 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-3', '-space-x-2 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-2'],
  xl: ['-space-x-6 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-6', '-space-x-4 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-4', '-space-x-2 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-2'],
  '2xl': ['-space-x-8 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-8', '-space-x-6 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-6', '-space-x-3 [&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-3'],
}

export const avatarGroupVariants = cva('flex items-center', {
  variants: {
    layout: {
      stacked: '[&>*]:ring-2 [&>*]:ring-background forced-colors:[&>*]:outline-2 forced-colors:[&>*]:outline-solid forced-colors:[&>*]:outline-[CanvasText]',
      spaced: 'flex-wrap',
    },
    size: {
      xs: '',
      sm: '',
      md: '',
      lg: '',
      xl: '',
      '2xl': '',
    },
    density: {
      compact: '',
      default: '',
      loose: '',
    },
  },
  compoundVariants: [
    ...(Object.entries(OVERLAP) as [keyof typeof OVERLAP, Overlap][]).flatMap(([size, [compact, normal, loose]]) => [
      { layout: 'stacked' as const, size, density: 'compact' as const, class: compact },
      { layout: 'stacked' as const, size, density: 'default' as const, class: normal },
      { layout: 'stacked' as const, size, density: 'loose' as const, class: loose },
    ]),
    { layout: 'spaced', density: 'compact', class: 'gap-1' },
    { layout: 'spaced', density: 'default', class: 'gap-2' },
    { layout: 'spaced', density: 'loose', class: 'gap-3' },
  ],
  defaultVariants: { layout: 'stacked', size: 'md', density: 'default' },
})

export type AvatarGroupVariants = VariantProps<typeof avatarGroupVariants>
export type AvatarGroupLayout = NonNullable<AvatarGroupVariants['layout']>
export type AvatarGroupDensity = NonNullable<AvatarGroupVariants['density']>
