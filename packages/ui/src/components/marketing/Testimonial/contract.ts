import { isBlank, type Problem } from '../shared/itemsContract'

/** A testimonial is a quote with an attribution: both must be present (a slot counts for its prop). */
export function testimonialProblem(t: { quote?: string; author?: string }, slots: { quote?: boolean; author?: boolean } = {}): Problem | undefined {
  if (isBlank(t.quote) && !slots.quote) return { rule: 'requires-quote', text: 'requires a non-empty `quote` (or the default slot). A testimonial without its quote is empty.' }
  if (isBlank(t.author) && !slots.author) return { rule: 'requires-author', text: 'requires a non-empty `author` (or the `author` slot). A quote without its author is unattributed.' }
  return undefined
}
