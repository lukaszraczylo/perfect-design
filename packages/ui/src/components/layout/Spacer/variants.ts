import type { Gap } from '../Stack/gap'

/** Spacer sizes: the shared spacing scale (0-6, 8, 10, 12) plus the section-level steps 14, 16, 20 and 24. */
export type SpacerSize = Gap | 14 | 16 | 20 | 24

/** Every class is spelled out so Tailwind's source scanner generates it. */
/** Fixed height (vertical axis). */
export const spacerHeightClasses: Record<string, string> = {
  '0': 'h-0',
  '1': 'h-1',
  '2': 'h-2',
  '3': 'h-3',
  '4': 'h-4',
  '5': 'h-5',
  '6': 'h-6',
  '8': 'h-8',
  '10': 'h-10',
  '12': 'h-12',
  '14': 'h-14',
  '16': 'h-16',
  '20': 'h-20',
  '24': 'h-24',
}

/** Fixed width (horizontal axis). */
export const spacerWidthClasses: Record<string, string> = {
  '0': 'w-0',
  '1': 'w-1',
  '2': 'w-2',
  '3': 'w-3',
  '4': 'w-4',
  '5': 'w-5',
  '6': 'w-6',
  '8': 'w-8',
  '10': 'w-10',
  '12': 'w-12',
  '14': 'w-14',
  '16': 'w-16',
  '20': 'w-20',
  '24': 'w-24',
}

/** Height from the `md` breakpoint up. */
export const spacerMdHeightClasses: Record<string, string> = {
  '0': 'md:h-0',
  '1': 'md:h-1',
  '2': 'md:h-2',
  '3': 'md:h-3',
  '4': 'md:h-4',
  '5': 'md:h-5',
  '6': 'md:h-6',
  '8': 'md:h-8',
  '10': 'md:h-10',
  '12': 'md:h-12',
  '14': 'md:h-14',
  '16': 'md:h-16',
  '20': 'md:h-20',
  '24': 'md:h-24',
}

/** Height from the `lg` breakpoint up. */
export const spacerLgHeightClasses: Record<string, string> = {
  '0': 'lg:h-0',
  '1': 'lg:h-1',
  '2': 'lg:h-2',
  '3': 'lg:h-3',
  '4': 'lg:h-4',
  '5': 'lg:h-5',
  '6': 'lg:h-6',
  '8': 'lg:h-8',
  '10': 'lg:h-10',
  '12': 'lg:h-12',
  '14': 'lg:h-14',
  '16': 'lg:h-16',
  '20': 'lg:h-20',
  '24': 'lg:h-24',
}

/** Width from the `md` breakpoint up. */
export const spacerMdWidthClasses: Record<string, string> = {
  '0': 'md:w-0',
  '1': 'md:w-1',
  '2': 'md:w-2',
  '3': 'md:w-3',
  '4': 'md:w-4',
  '5': 'md:w-5',
  '6': 'md:w-6',
  '8': 'md:w-8',
  '10': 'md:w-10',
  '12': 'md:w-12',
  '14': 'md:w-14',
  '16': 'md:w-16',
  '20': 'md:w-20',
  '24': 'md:w-24',
}

/** Width from the `lg` breakpoint up. */
export const spacerLgWidthClasses: Record<string, string> = {
  '0': 'lg:w-0',
  '1': 'lg:w-1',
  '2': 'lg:w-2',
  '3': 'lg:w-3',
  '4': 'lg:w-4',
  '5': 'lg:w-5',
  '6': 'lg:w-6',
  '8': 'lg:w-8',
  '10': 'lg:w-10',
  '12': 'lg:w-12',
  '14': 'lg:w-14',
  '16': 'lg:w-16',
  '20': 'lg:w-20',
  '24': 'lg:w-24',
}
