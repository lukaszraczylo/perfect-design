<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue'
import { faUser } from '../../../lib/icons'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { mediaBlurClass, useMediaBlur } from '../../../lib/media-blur'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Icon from '../Icon/Icon.vue'
import AvatarMedia from './AvatarMedia.vue'
import { avatarGroupKey, getInitials } from './context'
import {
  avatarStatusVariants,
  avatarVariants,
  type AvatarRing,
  type AvatarShape,
  type AvatarSize,
  type AvatarStatus,
  type AvatarStatusPosition,
} from './variants'

export interface AvatarProps extends BaseProps {
  /** Image URL. A failed load falls back to initials. */
  src?: string
  /** Alternative text for the image. Defaults to `name`. */
  alt?: string
  /** Full name; initials are derived from it and it labels the avatar. */
  name?: string
  /** Text shown instead of derived initials (e.g. `+3`). */
  fallback?: string
  /** Inherits from a surrounding AvatarGroup, otherwise `md`. */
  size?: AvatarSize
  /** `circle`, `rounded` (rounded-xl) or `square` (rounded-md). Inherits from a surrounding AvatarGroup, otherwise `circle`. */
  shape?: AvatarShape
  /** Decorative offset ring in a semantic colour. `true` is `primary`; unknown values draw no ring. */
  ring?: AvatarRing | boolean
  /** Small presence dot (bottom-right unless `statusPosition` says otherwise). */
  status?: AvatarStatus
  /** Corner of the status dot. Unknown values fall back to `bottom-right`. */
  statusPosition?: AvatarStatusPosition
  /** Text appended to the avatar's accessible name for the status dot ("Ada, online"); defaults to the status name. The dot itself is decorative. */
  statusLabel?: string
  /** Privacy blur on the image, and on the initials too (they identify the person). Wins over `ConfigProvider blurMedia` and an AvatarGroup, true or false. There is no reveal control: it is too small. */
  blurred?: boolean
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<AvatarProps>(), { blurred: undefined })
const group = inject(avatarGroupKey, null)

const SIZES: readonly AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
const SHAPES: readonly AvatarShape[] = ['circle', 'rounded', 'square']
const RINGS: readonly AvatarRing[] = ['none', 'border', 'primary', 'success', 'warning', 'danger', 'info']
const POSITIONS: readonly AvatarStatusPosition[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left']
const STATUSES: readonly AvatarStatus[] = ['neutral', 'primary', 'success', 'warning', 'danger', 'info']

const size = computed<AvatarSize>(() => {
  const wanted = props.size ?? group?.size()
  return wanted && SIZES.includes(wanted) ? wanted : 'md'
})
const shape = computed<AvatarShape>(() => {
  const wanted = props.shape ?? group?.shape()
  return wanted && SHAPES.includes(wanted) ? wanted : 'circle'
})
const status = computed(() => (props.status && STATUSES.includes(props.status) ? props.status : undefined))

const ring = computed<AvatarRing>(() => {
  // `<Avatar ring />` arrives as '' or true depending on prop type order.
  if (props.ring === true || (props.ring as unknown) === '') return 'primary'
  return typeof props.ring === 'string' && RINGS.includes(props.ring) ? props.ring : 'none'
})
const position = computed<AvatarStatusPosition>(() =>
  props.statusPosition && POSITIONS.includes(props.statusPosition) ? props.statusPosition : 'bottom-right',
)

const blurred = useMediaBlur(() => props.blurred ?? group?.blurred?.())
const blurClass = computed(() => mediaBlurClass(blurred.value))

const failed = ref(false)
watch(
  () => props.src,
  () => (failed.value = false),
)
const showImage = computed(() => !!props.src && !failed.value)

const label = computed(() => props.alt || props.name || undefined)
// Every avatar says who it is. `alt=""` is the explicit way to mark it decorative (the person is named next to it).
onMounted(async () => {
  await nextTick()
  if (!props.name?.trim() && props.alt === undefined) {
    violation('Avatar', 'requires-name', 'requires a `name` or an `alt`. Use `alt=""` only when the person is named in text right next to the avatar.')
  }
})
/** A role="img" hides its children from assistive tech, so the status text is folded into the avatar's own name. */
const statusText = computed(() => (status.value ? props.statusLabel || status.value : undefined))
const accessibleName = computed(() => [label.value, statusText.value].filter(Boolean).join(', ') || undefined)
const isImage = computed(() => !!accessibleName.value && (!showImage.value || !!status.value))
const initials = computed(() => props.fallback || getInitials(props.name))

const classes = computed(() => cn(avatarVariants({ size: size.value, shape: shape.value, ring: ring.value }), props.class))
const statusClasses = computed(() => avatarStatusVariants({ size: size.value, status: status.value, position: position.value }))
</script>

<template>
  <Primitive
    data-slot="avatar"
    :as="as"
    :role="isImage ? 'img' : undefined"
    :aria-label="isImage ? accessibleName : undefined"
    :data-status="status"
    :data-blurred="blurred ? '' : undefined"
    :class="classes"
  >
    <AvatarMedia :clip="blurred">
      <img
        v-if="showImage"
        data-slot="avatar-image"
        :src="src"
        :alt="label ?? ''"
        :class="cn('size-full rounded-[inherit] object-cover', blurClass)"
        @error="failed = true"
      />
      <span v-else data-slot="avatar-fallback" :aria-hidden="isImage ? 'true' : undefined" :class="cn('flex size-full items-center justify-center overflow-hidden rounded-[inherit]', blurClass)">
        <slot>
          <template v-if="initials">{{ initials }}</template>
          <Icon v-else :icon="faUser" size="sm" />
        </slot>
      </span>
    </AvatarMedia>
    <span
      v-if="status"
      data-slot="avatar-status"
      aria-hidden="true"
      :class="statusClasses"
    />
  </Primitive>
</template>
