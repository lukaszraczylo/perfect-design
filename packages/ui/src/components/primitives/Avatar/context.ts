import type { InjectionKey } from 'vue'
import type { AvatarShape, AvatarSize } from './variants'

/** Provided by AvatarGroup so slotted Avatars inherit size/shape unless they set their own. */
export interface AvatarGroupContext {
  size: () => AvatarSize | undefined
  shape: () => AvatarShape | undefined
  blurred?: () => boolean | undefined
}

export const avatarGroupKey: InjectionKey<AvatarGroupContext> = Symbol('avatar-group')

/** Up to two initials: first letters of the first and last word (Unicode-safe). Empty input -> ''. */
export function getInitials(name: string | undefined | null): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const first = Array.from(words[0]!)[0]!
  const last = words.length > 1 ? Array.from(words[words.length - 1]!)[0]! : ''
  return (first + last).toLocaleUpperCase()
}
