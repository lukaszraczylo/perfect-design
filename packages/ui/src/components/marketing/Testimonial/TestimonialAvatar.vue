<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { mediaBlurSoftClass, useMediaBlur } from '../../../lib/media-blur'
import type { BaseProps } from '../../../lib/types'
import { initialsOf } from '../shared/motion'

/** Internal part of Testimonial: image avatar with an initials fallback when missing or broken. */
export interface TestimonialAvatarProps extends BaseProps {
  src?: string
  alt?: string
  name?: string
}

const props = withDefaults(defineProps<TestimonialAvatarProps>(), { alt: '' })

const blurred = useMediaBlur(() => undefined)
const broken = ref(false)
watch(
  () => props.src,
  () => (broken.value = false),
)
const initials = computed(() => initialsOf(props.name))
const showImage = computed(() => !!props.src && !broken.value)
</script>

<template>
  <img
    v-if="showImage"
    data-slot="testimonial-avatar"
    :data-blurred="blurred ? '' : undefined"
    :src="src"
    :alt="alt"
    :class="cn('shrink-0 rounded-full object-cover', mediaBlurSoftClass(blurred), props.class)"
    @error="broken = true"
  />
  <span
    v-else-if="initials"
    data-slot="testimonial-avatar"
    aria-hidden="true"
    :data-blurred="blurred ? '' : undefined"
    :class="cn('flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary', mediaBlurSoftClass(blurred), props.class)"
  >
    {{ initials }}
  </span>
</template>
