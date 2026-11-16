import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue'
import type { FieldStatus } from '../Field/field-variants'
import type { InputGroupLayout } from './variants'

export interface InputGroupContext {
  layout: () => InputGroupLayout
  /** Normalised group status (`default` for a joined group). */
  status?: () => FieldStatus
  /** Id of the group's hidden success / warning text. */
  statusId?: () => string
}

export const INPUT_GROUP_KEY: InjectionKey<InputGroupContext> = Symbol('perfect-design:input-group')
export const provideInputGroup = (ctx: InputGroupContext) => provide(INPUT_GROUP_KEY, ctx)
export const useInputGroup = () => inject(INPUT_GROUP_KEY, null)

/** What an inner control takes from its group: `aria-invalid` for `error`, and the status text id for `success` / `warning`. */
export function useInputGroupStatus(): { invalid: ComputedRef<boolean>; describedBy: ComputedRef<string | undefined> } {
  const group = useInputGroup()
  return {
    invalid: computed(() => group?.status?.() === 'error'),
    describedBy: computed(() => {
      const status = group?.status?.()
      return status === 'success' || status === 'warning' ? group?.statusId?.() : undefined
    }),
  }
}
