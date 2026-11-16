import type { ComputedRef, InjectionKey } from 'vue'
import type { ValueClaim } from './contract-helpers'
import type { CardLayout, CardSize, CardTone, CardVariant } from './variants'

export interface CheckboxCardGroupContext {
  values: ComputedRef<string[]>
  disabled: ComputedRef<boolean>
  invalid: ComputedRef<boolean>
  /** The group is required (from a surrounding `Field`): at least one card must be checked. */
  required: ComputedRef<boolean>
  variant: ComputedRef<CardVariant | undefined>
  size: ComputedRef<CardSize | undefined>
  tone: ComputedRef<CardTone | undefined>
  layout: ComputedRef<CardLayout | undefined>
  name: ComputedRef<string | undefined>
  /** Contract bookkeeping: lets cards detect a duplicate `value`. */
  claim: (value: string) => ValueClaim
  toggle: (value: string, checked: boolean) => void
}

export const CHECKBOX_CARD_GROUP_KEY: InjectionKey<CheckboxCardGroupContext> = Symbol('perfect-design:checkbox-card-group')
