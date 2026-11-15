import type { ComputedRef, InjectionKey } from 'vue'
import type { ChoiceLabelPosition, ChoiceTone } from '../Checkbox/tones'
import type { RadioGroupSize } from './variants'

/** Defaults a `RadioGroup` hands to its items; an item prop of the same name wins. `undefined` means "use the library default". */
export interface RadioGroupContext {
  size: ComputedRef<RadioGroupSize | undefined>
  tone: ComputedRef<ChoiceTone | undefined>
  labelPosition: ComputedRef<ChoiceLabelPosition | undefined>
}

export const RADIO_GROUP_KEY: InjectionKey<RadioGroupContext> = Symbol('perfect-design:radio-group')
