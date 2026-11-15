import { isBlank, type Problem } from '../shared/itemsContract'
import type { BlogPost } from './BlogCard.vue'

/** What a post must carry: a title, and an `imageAlt` string when it has a cover image ('' marks it decorative). */
export function blogPostProblem(post: Partial<BlogPost>, hasImageSlot = false): Problem | undefined {
  if (isBlank(post.title)) return { rule: 'requires-title', text: 'requires a non-empty `title`. The title is the card heading and the link text.' }
  if (post.image && !hasImageSlot && typeof post.imageAlt !== 'string') {
    return { rule: 'requires-imageAlt', text: 'requires an `imageAlt` string when it has an `image`. Describe the cover, or pass an empty string to mark it decorative.' }
  }
  return undefined
}
