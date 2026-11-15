/** Return `value` when it is one of `allowed`, else `fallback`. Used to make unknown `variant`/`size` props fall back safely. */
export function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

/** Tag name for a heading level (1-6); anything else falls back to `fallback`. */
export function headingTag(level: unknown, fallback: 'h1' | 'h2' = 'h2'): string {
  return typeof level === 'number' && Number.isInteger(level) && level >= 1 && level <= 6 ? `h${level}` : fallback
}
