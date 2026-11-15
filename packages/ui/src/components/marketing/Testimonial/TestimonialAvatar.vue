<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { initialsOf } from '../shared/motion'

/** Internal part of Testimonial: image avatar with an initials fallback when missing or broken. */
export interface TestimonialAvatarProps extends BaseProps {
  src?: string
  alt?: string
  name?: string
}

const props = withDefaults(defineProps<TestimonialAvatarProps>(), { alt: '' })

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
    :src="src"
    :alt="alt"
    :class="cn('shrink-0 rounded-full object-cover', props.class)"
    @error="broken = true"
  />
  <span
    v-else-if="initials"
    data-slot="testimonial-avatar"
    aria-hidden="true"
    :class="cn('flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary', props.class)"
  >
    {{ initials }}
  </span>
</template>
