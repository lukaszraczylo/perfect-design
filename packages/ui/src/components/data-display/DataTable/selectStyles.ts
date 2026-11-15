import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'

/** Native checkbox used by DataTable for the header, the row and the cards-layout "Select all" boxes (20px; the label or cell around it is the larger target). */
export const tableCheckboxClasses = cn("relative inline-grid size-5 shrink-0 cursor-pointer appearance-none place-content-center rounded border border-input bg-background align-middle checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary disabled:cursor-not-allowed disabled:opacity-50 after:hidden after:content-[''] after:h-2.5 after:w-1.5 after:rotate-45 after:border-b-2 after:border-e-2 after:border-primary-foreground checked:after:block indeterminate:after:block indeterminate:after:h-0 indeterminate:after:w-2.5 indeterminate:after:rotate-0 indeterminate:after:border-e-0", focusRing)
