import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Stepper geometry. `variant` picks the marker: `numbered` (default, a circle with the step number, a check or a cross),
 * `dots` (a smaller circle, check or cross, never a number) or `bar` (a progress segment per step). `size` scales the
 * marker, the title text and the connector offsets. Size classes conflict with the base on purpose: pass the result
 * through `cn()` (the component does) so tailwind-merge keeps the later class.
 */
export const stepperIndicatorVariants = cva(
  'inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium tabular-nums motion-safe:transition-colors',
  {
    variants: {
      variant: { numbered: '', dots: '' },
      size: { sm: '', md: '', lg: '' },
    },
    compoundVariants: [
      { variant: 'numbered', size: 'sm', class: 'size-6 text-xs' },
      { variant: 'numbered', size: 'lg', class: 'size-10 text-base' },
      { variant: 'dots', size: 'sm', class: 'size-4' },
      { variant: 'dots', size: 'md', class: 'size-5' },
      { variant: 'dots', size: 'lg', class: 'size-6' },
    ],
    defaultVariants: { variant: 'numbered', size: 'md' },
  },
)

/** The `bar` marker: a progress segment, as wide as its step (horizontal) or as tall as its step (vertical). */
export const stepperBarVariants = cva('inline-block shrink-0 rounded-full motion-safe:transition-colors', {
  variants: {
    orientation: { horizontal: 'w-full', vertical: 'self-stretch' },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { orientation: 'horizontal', size: 'sm', class: 'h-1' },
    { orientation: 'horizontal', size: 'md', class: 'h-1.5' },
    { orientation: 'horizontal', size: 'lg', class: 'h-2' },
    { orientation: 'vertical', size: 'sm', class: 'w-1' },
    { orientation: 'vertical', size: 'md', class: 'w-1.5' },
    { orientation: 'vertical', size: 'lg', class: 'w-2' },
  ],
  defaultVariants: { orientation: 'horizontal', size: 'md' },
})

/** Line between two steps. Offsets centre it on the marker; `bar` has no connector. */
export const stepperConnectorVariants = cva('shrink-0 bg-border', {
  variants: {
    orientation: {
      horizontal: 'mx-1 mt-4 h-0.5 min-w-3 flex-1 sm:mx-3 sm:min-w-6',
      vertical: 'my-1 ms-3.75 min-h-6 w-0.5',
    },
    variant: { numbered: '', dots: '', bar: 'hidden' },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { orientation: 'horizontal', variant: 'numbered', size: 'sm', class: 'mt-3' },
    { orientation: 'horizontal', variant: 'numbered', size: 'lg', class: 'mt-5' },
    { orientation: 'vertical', variant: 'numbered', size: 'sm', class: 'ms-2.75' },
    { orientation: 'vertical', variant: 'numbered', size: 'lg', class: 'ms-4.75' },
    { orientation: 'horizontal', variant: 'dots', size: 'sm', class: 'mt-2' },
    { orientation: 'horizontal', variant: 'dots', size: 'md', class: 'mt-2.5' },
    { orientation: 'horizontal', variant: 'dots', size: 'lg', class: 'mt-3' },
    { orientation: 'vertical', variant: 'dots', size: 'sm', class: 'ms-1.75' },
    { orientation: 'vertical', variant: 'dots', size: 'md', class: 'ms-2.25' },
    { orientation: 'vertical', variant: 'dots', size: 'lg', class: 'ms-2.75' },
  ],
  defaultVariants: { orientation: 'horizontal', variant: 'numbered', size: 'md' },
})

/** Title and description column next to the marker. */
export const stepperTextVariants = cva('flex min-w-0 flex-col pt-1', {
  variants: {
    variant: { numbered: '', dots: 'pt-0', bar: 'pt-0' },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: 'numbered', size: 'sm', class: 'pt-0.5' },
    { variant: 'numbered', size: 'lg', class: 'pt-2' },
  ],
  defaultVariants: { variant: 'numbered', size: 'md' },
})

export const stepperTitleVariants = cva('text-sm leading-5 font-medium', {
  variants: { size: { sm: 'text-xs leading-4', md: '', lg: 'text-base leading-6' } },
  defaultVariants: { size: 'md' },
})

export type StepperIndicatorVariants = VariantProps<typeof stepperIndicatorVariants>
/** `numbered` circles, `dots` smaller circles without numbers, `bar` progress segments. */
export type StepperVariant = 'numbered' | 'dots' | 'bar'
export type StepperSize = NonNullable<StepperIndicatorVariants['size']>
export const STEPPER_VARIANTS: readonly StepperVariant[] = ['numbered', 'dots', 'bar']
export const STEPPER_SIZES: readonly StepperSize[] = ['sm', 'md', 'lg']
