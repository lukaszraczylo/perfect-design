import { comboboxVariants } from '../Combobox/variants'

/**
 * Class list of the ModelPicker input. The picker is a Combobox with grouped, described options, so it shares the Combobox
 * field surface, `size`, `variant`, `shape`, `status` and end padding: `<input :class="modelPickerVariants({ variant: 'filled' })" />`.
 */
export const modelPickerVariants = comboboxVariants
export type { ComboboxVariants as ModelPickerVariants } from '../Combobox/variants'
