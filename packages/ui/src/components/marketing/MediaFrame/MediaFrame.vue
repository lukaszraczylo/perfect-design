<script setup lang="ts">
import { computed, nextTick, onMounted, useSlots } from 'vue'
import { cn } from '../../../lib/cn'
import { mediaBlurChildrenClass, useMediaBlurToggle } from '../../../lib/media-blur'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import MediaBlurToggle from '../_media/MediaBlurToggle.vue'
import { oneOf } from '../shared/pick'
import {
  mediaFrameAppearanceNames,
  mediaFrameBarVariants,
  mediaFrameDotVariants,
  mediaFrameNotchVariants,
  mediaFrameShapeNames,
  mediaFrameSizeNames,
  mediaFrameTitleVariants,
  mediaFrameVariantNames,
  mediaFrameVariants,
  type MediaFrameAppearance,
  type MediaFrameShape,
  type MediaFrameSize,
  type MediaFrameVariant,
} from './variants'

export interface MediaFrameProps extends BaseProps {
  /** Chrome style. Unknown values fall back to `browser`. */
  variant?: MediaFrameVariant
  /** Chrome and phone size: `sm`, `md` (default) or `lg`. Sets the chrome bar padding, dots and text, the phone notch and the phone width (14rem, 18rem, 20rem). Unknown values fall back to `md`. */
  size?: MediaFrameSize
  /** Corners: `rounded` (default) or `square`. Unknown values fall back to `rounded`. */
  shape?: MediaFrameShape
  /** Outline: `bordered` (default) or `borderless` (no outline on browser, window and plain; the phone keeps its bezel and forced-colors mode still draws a border). Unknown values fall back to `bordered`. */
  appearance?: MediaFrameAppearance
  /** Text in the chrome bar: URL for `browser`, file/tab name for `window`. Ignored by `phone` and `plain`. */
  title?: string
  /** Convenience image; otherwise use the default slot. */
  src?: string
  /** Alt text for `src`. Required with `src`; an empty string marks the image decorative. */
  alt?: string
  /** Neutral drop shadow under the frame. Off by default: elevation is reserved for floating surfaces. */
  elevated?: boolean
  /** Privacy blur on the content area (the image or the slot); the chrome stays sharp. v-model:blurred. Wins over `ConfigProvider blurMedia`, true or false. */
  blurred?: boolean
  /** Starting blur when `blurred` is not bound. */
  defaultBlurred?: boolean
  /** Offer a button that reveals the blurred content and hides it again. */
  revealable?: boolean
  /** Name of the reveal button. */
  revealLabel?: string
  /** Name of the button that blurs the content again. */
  hideLabel?: string
  /** Extra classes for the content area (padding, background, font). */
  contentClass?: BaseProps['class']
}

const props = withDefaults(defineProps<MediaFrameProps>(), { variant: 'browser', size: 'md', shape: 'rounded', appearance: 'bordered', elevated: false, alt: undefined, blurred: undefined, defaultBlurred: undefined, revealable: false, revealLabel: 'Show image', hideLabel: 'Hide image' })
const emit = defineEmits<{ 'update:blurred': [value: boolean] }>()
const slots = useSlots()
const blur = useMediaBlurToggle(() => props.blurred, () => props.defaultBlurred, (v) => emit('update:blurred', v))
onMounted(async () => {
  await nextTick()
  if (props.src && !slots.default && typeof props.alt !== 'string') {
    violation('MediaFrame', 'requires-alt', 'requires an `alt` string when `src` is set. Describe the capture, or pass an empty string to mark it decorative.')
  }
})

const kind = computed(() => oneOf(props.variant, mediaFrameVariantNames, 'browser'))
const size = computed(() => oneOf(props.size, mediaFrameSizeNames, 'md'))
const shape = computed(() => oneOf(props.shape, mediaFrameShapeNames, 'rounded'))
const appearance = computed(() => oneOf(props.appearance, mediaFrameAppearanceNames, 'bordered'))
const classes = computed(() => cn(mediaFrameVariants({ variant: kind.value, shape: shape.value, appearance: appearance.value, size: size.value, elevated: props.elevated }), props.class))
const barClass = computed(() => mediaFrameBarVariants({ size: size.value }))
const dotClass = computed(() => mediaFrameDotVariants({ size: size.value }))
const titleClass = computed(() => mediaFrameTitleVariants({ variant: kind.value, size: size.value }))
const notchClass = computed(() => mediaFrameNotchVariants({ size: size.value }))
const hasBar = computed(() => kind.value === 'browser' || kind.value === 'window')
</script>

<template>
  <figure data-slot="media-frame" :data-blurred="blur.blurred.value ? '' : undefined" :data-variant="kind" :data-size="size" :data-shape="shape" :data-appearance="appearance" :class="classes">
    <div v-if="hasBar" data-slot="media-frame-bar" :class="barClass">
      <span data-slot="media-frame-dots" aria-hidden="true" class="flex shrink-0 gap-1.5">
        <span :class="dotClass" />
        <span :class="dotClass" />
        <span :class="dotClass" />
      </span>
      <span v-if="title" data-slot="media-frame-title" :class="titleClass">{{ title }}</span>
    </div>
    <span v-if="kind === 'phone'" data-slot="media-frame-notch" aria-hidden="true" :class="notchClass" />
    <div data-slot="media-frame-content" :class="cn('min-w-0 flex-1', kind === 'phone' && 'aspect-9/19', mediaBlurChildrenClass(blur.blurred.value, revealable), contentClass)">
      <slot>
        <img v-if="src" :src="src" :alt="alt ?? ''" class="block size-full object-cover" loading="lazy" decoding="async" />
      </slot>
    </div>
    <MediaBlurToggle v-if="revealable && (blur.blurred.value || blur.hideable.value)" :blurred="blur.blurred.value" :reveal-label="revealLabel" :hide-label="hideLabel" @toggle="blur.toggle" />
  </figure>
</template>
