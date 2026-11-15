<script setup lang="ts">
import { computed, nextTick, onMounted, useSlots } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { parentChecksItems, report } from '../shared/itemsContract'
import { initialsOf } from '../shared/motion'
import { testimonialProblem } from './contract'
import TestimonialAvatar from './TestimonialAvatar.vue'
import {
  normalizeRating,
  resolveTestimonialVariant,
  resolveTestimonialShape,
  resolveTestimonialSize,
  resolveTestimonialTone,
  testimonialAuthorVariants,
  testimonialAvatarVariants,
  testimonialQuoteVariants,
  testimonialRoleVariants,
  testimonialStarFillVariants,
  testimonialStarVariants,
  testimonialVariants,
  type TestimonialShape,
  type TestimonialSize,
  type TestimonialTone,
  type TestimonialVariant,
} from './variants'

export interface TestimonialProps extends BaseProps {
  quote?: string
  author?: string
  role?: string
  /** Image URL. A missing or broken image falls back to initials. */
  avatar?: string
  /** Alt text for the avatar. Defaults to empty (the author name is already adjacent text). */
  avatarAlt?: string
  /** Layout: `card` (default), `quote` (large pull quote), `inline` (compact), `with-rating`, `avatar-left`, `featured`. Unknown values fall back to `card`. */
  variant?: TestimonialVariant
  /** Star rating 0-5 (halves allowed). Clamped to the range; non-numbers render no stars. Stars show in any variant. */
  rating?: number
  /** Quote text and padding scale: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: TestimonialSize
  /** Surface: `default` (the variant's own), `muted`, `primary` or `inverted`. `quote` and `inline` gain a padded box when a tone is set. Unknown values fall back to `default`. */
  tone?: TestimonialTone
  /** Corners of the card and the avatar: `rounded` (default) or `square`. Unknown values fall back to `rounded`. */
  shape?: TestimonialShape
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<TestimonialProps>(), { as: 'figure', avatarAlt: '', variant: 'card', size: 'md', tone: 'default', shape: 'rounded' })
const slots = useSlots()
const quiet = parentChecksItems()
onMounted(async () => {
  await nextTick()
  if (!quiet) report('Testimonial', testimonialProblem(props, { quote: !!slots.default, author: !!slots.author }))
})

const STAR = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
const SPANS = ['row-span-1', 'row-span-2', 'row-span-3'] as const

const variant = computed(() => resolveTestimonialVariant(props.variant))
const size = computed(() => resolveTestimonialSize(props.size))
const tone = computed(() => resolveTestimonialTone(props.tone))
const shape = computed(() => resolveTestimonialShape(props.shape))
const ratingValue = computed(() => normalizeRating(props.rating))
const stars = computed(() => {
  const v = ratingValue.value ?? 0
  return [0, 1, 2, 3, 4].map((i) => (v - i >= 1 ? 'full' : v - i >= 0.5 ? 'half' : 'empty'))
})
const hasAvatar = computed(() => !!props.avatar || !!initialsOf(props.author) || !!slots.avatar)
// avatar-left needs an avatar to sit beside; without one it degrades to the card layout.
const avatarLeft = computed(() => variant.value === 'avatar-left' && hasAvatar.value)
const layout = computed(() => (variant.value === 'avatar-left' && !avatarLeft.value ? 'card' : variant.value))
const hasQuote = computed(() => !!props.quote || !!slots.default)
const hasCaption = computed(() => !!props.author || !!props.role || !!slots.author || (!avatarLeft.value && hasAvatar.value))
const span = computed(() => SPANS[Math.max(1, [ratingValue.value !== null, hasQuote.value, hasCaption.value].filter(Boolean).length) - 1])

const classes = computed(() => cn(testimonialVariants({ variant: layout.value, size: size.value, tone: tone.value, shape: shape.value }), props.class))
const quoteClass = computed(() => testimonialQuoteVariants({ variant: layout.value, size: size.value }))
const authorClass = computed(() => testimonialAuthorVariants({ variant: layout.value }))
const starClass = computed(() => testimonialStarVariants({ tone: tone.value }))
const starFillClass = computed(() => testimonialStarFillVariants({ tone: tone.value }))
const roleClass = computed(() => testimonialRoleVariants({ tone: tone.value }))
const avatarClass = computed(() => cn(testimonialAvatarVariants({ variant: layout.value, tone: tone.value, shape: shape.value }), avatarLeft.value && span.value))
</script>

<template>
  <Primitive data-slot="testimonial" :data-variant="variant" :data-size="size" :data-tone="tone" :data-shape="shape" :as="as" :class="classes">
    <slot v-if="avatarLeft" name="avatar">
      <TestimonialAvatar :src="avatar" :alt="avatarAlt" :name="author" :class="avatarClass" />
    </slot>
    <span
      v-if="ratingValue !== null"
      data-slot="testimonial-rating"
      role="img"
      :aria-label="`${ratingValue} out of 5`"
      :data-rating="ratingValue"
      class="inline-flex gap-0.5"
    >
      <span
        v-for="(fill, i) in stars"
        :key="i"
        data-slot="testimonial-star"
        :data-fill="fill"
        aria-hidden="true"
        :class="starClass"
      >
        <svg viewBox="0 0 24 24" class="size-4 fill-current" focusable="false"><path :d="STAR" /></svg>
        <span v-if="fill !== 'empty'" :class="cn(starFillClass, fill === 'half' ? 'w-1/2' : 'w-full')">
          <svg viewBox="0 0 24 24" class="size-4 max-w-none fill-current" focusable="false"><path :d="STAR" /></svg>
        </span>
      </span>
    </span>
    <blockquote v-if="hasQuote" data-slot="testimonial-quote" :class="quoteClass">
      <slot>“{{ quote }}”</slot>
    </blockquote>
    <figcaption v-if="hasCaption" data-slot="testimonial-author" :class="authorClass">
      <slot v-if="!avatarLeft" name="avatar">
        <TestimonialAvatar :src="avatar" :alt="avatarAlt" :name="author" :class="avatarClass" />
      </slot>
      <slot name="author">
        <div class="min-w-0">
          <p v-if="author" data-slot="testimonial-name" class="truncate text-sm font-semibold">{{ author }}</p>
          <p v-if="role" data-slot="testimonial-role" :class="roleClass">{{ role }}</p>
        </div>
      </slot>
    </figcaption>
  </Primitive>
</template>
