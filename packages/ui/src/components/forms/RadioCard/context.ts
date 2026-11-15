import type { ComputedRef, InjectionKey } from 'vue'
import type { ValueClaim } from '../CheckboxCard/contract-helpers'
import type { CardLayout, CardSize, CardTone, CardVariant } from '../CheckboxCard/variants'

export interface RadioCardGroupContext {
  value: ComputedRef<string | undefined>
  name: string
  disabled: ComputedRef<boolean>
  invalid: ComputedRef<boolean>
  required: ComputedRef<boolean>
  variant: ComputedRef<CardVariant | undefined>
  size: ComputedRef<CardSize | undefined>
  tone: ComputedRef<CardTone | undefined>
  layout: ComputedRef<CardLayout | undefined>
  /** Contract bookkeeping: lets cards detect a duplicate `value`. */
  claim: (value: string) => ValueClaim
  select: (value: string) => void
}

export const RADIO_CARD_GROUP_KEY: InjectionKey<RadioCardGroupContext> = Symbol('perfect-design:radio-card-group')
