/**
 * Shared spacing-scale class maps for layout components. Every class is written out literally so
 * Tailwind's source scanner can see it (never build class names by string concatenation).
 */
export type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12

export const gapClasses: Record<string, string> = {
  '0': 'gap-0',
  '1': 'gap-1',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '5': 'gap-5',
  '6': 'gap-6',
  '8': 'gap-8',
  '10': 'gap-10',
  '12': 'gap-12',
}

export const gapXClasses: Record<string, string> = {
  '0': 'gap-x-0',
  '1': 'gap-x-1',
  '2': 'gap-x-2',
  '3': 'gap-x-3',
  '4': 'gap-x-4',
  '5': 'gap-x-5',
  '6': 'gap-x-6',
  '8': 'gap-x-8',
  '10': 'gap-x-10',
  '12': 'gap-x-12',
}

export const gapYClasses: Record<string, string> = {
  '0': 'gap-y-0',
  '1': 'gap-y-1',
  '2': 'gap-y-2',
  '3': 'gap-y-3',
  '4': 'gap-y-4',
  '5': 'gap-y-5',
  '6': 'gap-y-6',
  '8': 'gap-y-8',
  '10': 'gap-y-10',
  '12': 'gap-y-12',
}

export const smGapClasses: Record<string, string> = {
  '0': 'sm:gap-0',
  '1': 'sm:gap-1',
  '2': 'sm:gap-2',
  '3': 'sm:gap-3',
  '4': 'sm:gap-4',
  '5': 'sm:gap-5',
  '6': 'sm:gap-6',
  '8': 'sm:gap-8',
  '10': 'sm:gap-10',
  '12': 'sm:gap-12',
}

export const mdGapClasses: Record<string, string> = {
  '0': 'md:gap-0',
  '1': 'md:gap-1',
  '2': 'md:gap-2',
  '3': 'md:gap-3',
  '4': 'md:gap-4',
  '5': 'md:gap-5',
  '6': 'md:gap-6',
  '8': 'md:gap-8',
  '10': 'md:gap-10',
  '12': 'md:gap-12',
}

export const lgGapClasses: Record<string, string> = {
  '0': 'lg:gap-0',
  '1': 'lg:gap-1',
  '2': 'lg:gap-2',
  '3': 'lg:gap-3',
  '4': 'lg:gap-4',
  '5': 'lg:gap-5',
  '6': 'lg:gap-6',
  '8': 'lg:gap-8',
  '10': 'lg:gap-10',
  '12': 'lg:gap-12',
}

/** Look up `key` (number or numeric string) in an own-property class map; `undefined` when absent or invalid. */
export function lookup(map: Record<string, string>, key: unknown): string | undefined {
  if (key === undefined || key === null) return undefined
  const k = String(key)
  return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : undefined
}
