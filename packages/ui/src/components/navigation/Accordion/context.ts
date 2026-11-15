import type { ComputedRef, InjectionKey } from 'vue'
import type { AccordionIconPosition, AccordionSize, AccordionVariant } from './variants'

export interface AccordionOptions {
  variant: AccordionVariant
  size: AccordionSize
  iconPosition: AccordionIconPosition
}
/** Provided by `Accordion` (already validated), read by the item, trigger and content so the look is set once on the root. */
export const ACCORDION_OPTIONS_KEY: InjectionKey<ComputedRef<AccordionOptions>> = Symbol('pd-accordion-options')
