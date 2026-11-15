import { isBlank, type Problem } from '../shared/itemsContract'
import type { LightboxImage } from './Lightbox.vue'

/**
 * An image needs an `alt` string (an empty string marks it decorative). With `captionCounts` a non-empty `caption`
 * also satisfies it: the Lightbox falls back to the caption as the image alt.
 */
export function imageAltProblem(img: Partial<LightboxImage>, captionCounts = true): Problem | undefined {
  if (typeof img.alt === 'string' || (captionCounts && !isBlank(img.caption))) return undefined
  return {
    rule: 'requires-alt',
    text: `requires an \`alt\` string${captionCounts ? ' (or a `caption`)' : ''}. Describe the image, or pass an empty string to mark it decorative.`,
  }
}
