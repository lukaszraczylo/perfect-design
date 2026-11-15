/** Narrow an untrusted prop value to one of `allowed`, falling back when it is not one (lib/cva does not fall back by itself). */
export function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly unknown[]).includes(value) ? (value as T) : fallback
}
