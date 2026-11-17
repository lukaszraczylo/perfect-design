export const SPINNER_VARIANTS = ['ring', 'dots', 'bars', 'pulse', 'orbit'] as const
export type SpinnerVariant = (typeof SPINNER_VARIANTS)[number]
