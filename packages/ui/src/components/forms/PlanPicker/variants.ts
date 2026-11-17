import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'

export const PLAN_PICKER_VARIANTS = ['cards', 'list'] as const
export const PLAN_PICKER_SIZES = ['sm', 'md', 'lg'] as const
export const PLAN_PICKER_BILLINGS = ['monthly', 'yearly'] as const
export type PlanPickerVariant = (typeof PLAN_PICKER_VARIANTS)[number]
export type PlanPickerSize = (typeof PLAN_PICKER_SIZES)[number]
export type PlanPickerBilling = (typeof PLAN_PICKER_BILLINGS)[number]

const pick = <T extends string>(list: readonly T[], value: unknown, fallback: T): T => ((list as readonly unknown[]).includes(value) ? (value as T) : fallback)
export const normalizePlanPickerVariant = (value: unknown) => pick(PLAN_PICKER_VARIANTS, value, 'cards')
export const normalizePlanPickerSize = (value: unknown) => pick(PLAN_PICKER_SIZES, value, 'md')
export const normalizePlanPickerBilling = (value: unknown, fallback: PlanPickerBilling = 'monthly') => pick(PLAN_PICKER_BILLINGS, value, fallback)

const groupBase = cva('grid min-w-0', {
  variants: {
    variant: { cards: '', list: 'divide-y divide-border rounded-lg border border-input aria-invalid:border-destructive' },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: 'cards', size: 'sm', class: 'gap-1.5' },
    { variant: 'cards', size: 'md', class: 'gap-2' },
    { variant: 'cards', size: 'lg', class: 'gap-3' },
  ],
  defaultVariants: { variant: 'cards', size: 'md' },
})

/** The radio group that holds the plans: stacked cards, or one bordered list with dividers. */
export function planPickerVariants(props: NonNullable<Parameters<typeof groupBase>[0]> = {}): string {
  return cn(groupBase(props))
}

const itemBase = cva(
  [
    'group/plan relative z-0 grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 text-start transition-[color,box-shadow,background-color,border-color] motion-reduce:transition-none',
    'focus-visible:z-10 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
    'forced-colors:data-[state=checked]:border-[Highlight] forced-colors:data-[invalid]:border-dashed',
    focusRing,
  ],
  {
    variants: {
      variant: {
        cards: 'rounded-lg border border-input shadow-xs not-data-[disabled]:hover:bg-accent/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 data-[invalid]:border-destructive',
        list: 'border border-transparent first:rounded-t-lg last:rounded-b-lg not-data-[disabled]:hover:bg-accent/50 data-[state=checked]:bg-primary/5 data-[state=checked]:border-primary data-[invalid]:border-destructive',
      },
      size: { sm: 'gap-x-2.5 p-3 text-sm', md: 'p-4 text-sm', lg: 'gap-x-4 p-5 text-base' },
    },
    defaultVariants: { variant: 'cards', size: 'md' },
  },
)

/** One selectable plan row. State comes from `data-state`, `data-disabled` and `data-invalid`. */
export function planPickerItemVariants(props: NonNullable<Parameters<typeof itemBase>[0]> = {}): string {
  return cn(itemBase(props))
}

export type PlanPickerVariants = VariantProps<typeof groupBase>
