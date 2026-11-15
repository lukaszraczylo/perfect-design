/**
 * Shared vocabulary of the choice controls (Checkbox, Switch, RadioGroup, SegmentedControl, CheckboxCard, RadioCard, Slider, Rating).
 * Each component keeps its own complete class literals (Tailwind needs them written out); this file only owns the value sets
 * and the fallback rules so an unknown value always lands on the default.
 */
export const CHOICE_TONES = ['primary', 'success', 'danger', 'neutral', 'info'] as const
/** Colour of the checked or selected state. `primary` is the default; `neutral` uses foreground on background. */
export type ChoiceTone = (typeof CHOICE_TONES)[number]
export const normalizeChoiceTone = (value: unknown): ChoiceTone => ((CHOICE_TONES as readonly unknown[]).includes(value) ? (value as ChoiceTone) : 'primary')

export const CHOICE_LABEL_POSITIONS = ['end', 'start'] as const
/** Where the label sits relative to the control, in reading order (logical, so it flips in right-to-left layouts). */
export type ChoiceLabelPosition = (typeof CHOICE_LABEL_POSITIONS)[number]
export const normalizeLabelPosition = (value: unknown): ChoiceLabelPosition => (value === 'start' ? 'start' : 'end')
