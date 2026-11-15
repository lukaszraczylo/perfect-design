import { isBlank, type Problem } from '../shared/itemsContract'
import type { TeamMember } from './TeamMemberCard.vue'

/** A member needs a name; every link needs a `label` (the accessible name of an icon-only link) and an `href`. */
export function teamMemberProblem(member: Partial<TeamMember>): Problem | undefined {
  if (isBlank(member.name)) return { rule: 'requires-name', text: 'requires a non-empty `name`. It is the heading, the avatar label and the source of the fallback initials.' }
  const links = Array.isArray(member.links) ? member.links : []
  for (let i = 0; i < links.length; i++) {
    const link = links[i]
    if (!link || isBlank(link.label)) {
      return { rule: 'requires-link-label', text: `requires a non-empty \`label\` on links[${i}]. An icon-only link has no other accessible name.` }
    }
    if (isBlank(link.href)) return { rule: 'requires-link-href', text: `requires a non-empty \`href\` on links[${i}]. A link without one is dropped.` }
  }
  return undefined
}
