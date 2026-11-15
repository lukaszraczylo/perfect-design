import type { IconDefinition } from '../../lib/icons-tools'
import { faCircleCheck, faCircleInfo, faCircleXmark, faTriangleExclamation } from '../../lib/icons'

/** Semantic tones shared by the feedback components. `neutral` carries no status colour. */
export type FeedbackTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export const FEEDBACK_TONES: readonly FeedbackTone[] = ['neutral', 'info', 'success', 'warning', 'danger']

/** Default status icon per tone. */
export const toneIcons: Record<FeedbackTone, IconDefinition> = {
  neutral: faCircleInfo,
  info: faCircleInfo,
  success: faCircleCheck,
  warning: faTriangleExclamation,
  danger: faCircleXmark,
}

/** Narrow an unknown value to a known tone, falling back when it is not one. */
export function toTone(value: unknown, fallback: FeedbackTone = 'neutral'): FeedbackTone {
  return FEEDBACK_TONES.includes(value as FeedbackTone) ? (value as FeedbackTone) : fallback
}
