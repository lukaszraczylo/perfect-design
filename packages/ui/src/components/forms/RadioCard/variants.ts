import { checkboxCardVariants } from '../CheckboxCard/variants'

/** Same surface as `checkboxCardVariants`; exported separately so RadioCard-styled elements can evolve independently. */
export const radioCardVariants = checkboxCardVariants
export type { CheckboxCardVariants as RadioCardVariants } from '../CheckboxCard/variants'
