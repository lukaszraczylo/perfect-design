/**
 * Tiny, dependency-free variant helper with the same call shape as class-variance-authority:
 *   const v = cva('base', { variants: { size: { sm: '...', md: '...' } }, defaultVariants: { size: 'md' }, compoundVariants: [...] })
 *   v({ size: 'sm', class: 'extra' })
 */
export type ClassInput = string | number | null | undefined | false | ClassInput[]

type VariantValue = string | number | boolean | null | undefined
type VariantDefs = Record<string, Record<string, ClassInput>>

type Selected<V extends VariantDefs> = {
  [K in keyof V]?: (keyof V[K] extends 'true' | 'false' ? boolean | 'true' | 'false' : keyof V[K]) | null | undefined
}

export interface CvaConfig<V extends VariantDefs> {
  variants?: V
  defaultVariants?: Selected<V>
  compoundVariants?: ({ [K in keyof Selected<V>]?: Selected<V>[K] | NonNullable<Selected<V>[K]>[] } & { class?: ClassInput; className?: ClassInput })[]
}

export type VariantProps<F extends (...args: never[]) => unknown> = Omit<NonNullable<Parameters<F>[0]>, 'class' | 'className'>

function flat(input: ClassInput): string {
  if (Array.isArray(input)) return input.map(flat).filter(Boolean).join(' ')
  return input || input === 0 ? String(input) : ''
}

export function cva<V extends VariantDefs>(base?: ClassInput, config: CvaConfig<V> = {}) {
  const { variants, defaultVariants, compoundVariants } = config
  return (props: (Selected<V> & { class?: ClassInput; className?: ClassInput }) | undefined = {}): string => {
    const out: ClassInput[] = [base]
    if (variants) {
      for (const key of Object.keys(variants)) {
        const given = (props as Record<string, VariantValue>)[key]
        const fallback = (defaultVariants as Record<string, VariantValue> | undefined)?.[key]
        const value = given === undefined || given === null ? fallback : given
        if (value === undefined || value === null) continue
        out.push(variants[key][String(value)])
      }
    }
    for (const cv of compoundVariants ?? []) {
      const { class: c, className, ...conditions } = cv as Record<string, unknown>
      const ok = Object.entries(conditions).every(([k, expected]) => {
        const given = (props as Record<string, VariantValue>)[k]
        const actual = given === undefined || given === null ? (defaultVariants as Record<string, VariantValue> | undefined)?.[k] : given
        return Array.isArray(expected) ? expected.map(String).includes(String(actual)) : String(actual) === String(expected)
      })
      if (ok) out.push(c as ClassInput, className as ClassInput)
    }
    out.push(props.class, props.className)
    return flat(out)
  }
}
