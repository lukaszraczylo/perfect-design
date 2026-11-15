import { twMerge } from 'tailwind-merge'

export type ClassValue = string | number | bigint | boolean | null | undefined | ClassValue[] | { [key: string]: unknown }

function toValue(input: ClassValue): string {
  if (!input) return ''
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'bigint') return String(input)
  if (typeof input === 'boolean') return ''
  if (Array.isArray(input)) return input.map(toValue).filter(Boolean).join(' ')
  return Object.keys(input)
    .filter((k) => input[k])
    .join(' ')
}

/** Join class values (strings, arrays, `{ cls: condition }` objects) then resolve Tailwind conflicts; later wins. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(toValue(inputs))
}
