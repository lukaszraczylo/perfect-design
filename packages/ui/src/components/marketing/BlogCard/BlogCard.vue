<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useSlots, watch } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Badge from '../../primitives/Badge/Badge.vue'
import {
  BLOG_APPEARANCES,
  BLOG_SHAPES,
  BLOG_SIZES,
  BLOG_VARIANTS,
  blogCardBodyVariants,
  blogCardExcerptVariants,
  blogCardImageVariants,
  blogCardMetaVariants,
  blogCardTitleVariants,
  blogCardVariants,
  type BlogCardAppearance,
  type BlogCardShape,
  type BlogCardSize,
  type BlogCardVariant,
} from './variants'
import { oneOf } from '../shared/pick'
import { formatIsoDate, isIsoDate } from './date'
import { parentChecksItems, report } from '../shared/itemsContract'
import { blogPostProblem } from './contract'

export interface BlogPost {
  title: string
  excerpt?: string
  /** When set, the title becomes a link stretched over the whole card. */
  href?: string
  /** Cover image URL. A missing or broken image leaves a neutral placeholder. */
  image?: string
  /** Alt text of the cover. Required with `image`; an empty string marks the cover decorative. */
  imageAlt?: string
  category?: string
  author?: string
  /** ISO 8601 (`2024-03-01`). Valid values render a `<time datetime>`; anything else renders as plain text. */
  date?: string
  /** A number means minutes (`5` -> "5 min read"); a string is shown as given. */
  readTime?: string | number
}

export interface BlogCardProps extends BaseProps, BlogPost {
  /** Layout. Unknown values fall back to `vertical`. */
  variant?: BlogCardVariant
  /** Padding and title scale: `sm`, `md` (the original) or `lg`. Unknown values fall back to `md`. */
  size?: BlogCardSize
  /** Corners: `rounded` (the original) or `square`. Unknown values fall back to `rounded`. */
  shape?: BlogCardShape
  /** Surface: `card` (bordered, the original), `plain` (no fill, no visible border) or `filled` (muted fill). Unknown values fall back to `card`. */
  appearance?: BlogCardAppearance
  /** Heading level of the title (1-6). Invalid values fall back to 3. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** BCP 47 locale used to format a valid `date`. */
  locale?: string
}

const props = withDefaults(defineProps<BlogCardProps>(), { variant: 'vertical', size: 'md', shape: 'rounded', appearance: 'card', level: 3, imageAlt: undefined, locale: 'en-US' })
const slots = useSlots()
const quiet = parentChecksItems()
onMounted(async () => {
  await nextTick()
  if (!quiet) report('BlogCard', blogPostProblem(props, !!slots.image))
})

const variant = computed<BlogCardVariant>(() => (BLOG_VARIANTS.includes(props.variant) ? props.variant : 'vertical'))
const size = computed<BlogCardSize>(() => oneOf(props.size, BLOG_SIZES, 'md'))
const shape = computed<BlogCardShape>(() => oneOf(props.shape, BLOG_SHAPES, 'rounded'))
const appearance = computed<BlogCardAppearance>(() => oneOf(props.appearance, BLOG_APPEARANCES, 'card'))
const tag = computed(() => (Number.isInteger(props.level) && props.level >= 1 && props.level <= 6 ? `h${props.level}` : 'h3'))

const broken = ref(false)
watch(
  () => props.image,
  () => (broken.value = false),
)
const showImage = computed(() => !!props.image && !broken.value)

const isoDate = computed(() => (isIsoDate(props.date) ? props.date.trim() : ''))
const dateText = computed(() => (isoDate.value ? formatIsoDate(isoDate.value, props.locale) : (props.date ?? '').trim()))
const readTimeText = computed(() => {
  const r = props.readTime
  if (typeof r === 'number') return Number.isFinite(r) && r > 0 ? `${r} min read` : ''
  return r ?? ''
})
const hasMeta = computed(() => !!(props.author || dateText.value || readTimeText.value))

const classes = computed(() => cn(blogCardVariants({ variant: variant.value, shape: shape.value, appearance: appearance.value }), props.class))
const imageClass = computed(() => blogCardImageVariants({ variant: variant.value }))
const bodyClass = computed(() => blogCardBodyVariants({ variant: variant.value, size: size.value }))
const titleClass = computed(() => blogCardTitleVariants({ variant: variant.value, size: size.value }))
const excerptClass = computed(() => blogCardExcerptVariants({ size: size.value, appearance: appearance.value }))
const metaClass = computed(() => blogCardMetaVariants({ size: size.value, appearance: appearance.value }))
// The category badge is a secondary badge; on the filled surface (also secondary) it would vanish, so it takes the page surface.
const badgeClass = computed(() => cn('self-start', appearance.value === 'filled' && 'bg-background text-foreground'))
const authorClass = computed(() => cn('font-medium [overflow-wrap:anywhere]', appearance.value === 'filled' ? 'text-secondary-foreground' : 'text-foreground'))
</script>

<template>
  <article data-slot="blog-card" :data-variant="variant" :data-size="size" :data-shape="shape" :data-appearance="appearance" :class="classes">
    <div v-if="image || $slots.image" data-slot="blog-card-image" :class="imageClass">
      <slot name="image">
        <img
          v-if="showImage"
          :src="image"
          :alt="imageAlt ?? ''"
          loading="lazy"
          decoding="async"
          class="absolute inset-0 size-full object-cover"
          @error="broken = true"
        />
      </slot>
    </div>
    <div data-slot="blog-card-body" :class="bodyClass">
      <Badge v-if="category" data-slot="blog-card-category" variant="secondary" :class="badgeClass">{{ category }}</Badge>
      <component :is="tag" v-if="title" data-slot="blog-card-title" :class="titleClass">
        <a
          v-if="href"
          data-slot="blog-card-link"
          :href="href"
          class="outline-none after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:underline"
        >{{ title }}</a>
        <template v-else>{{ title }}</template>
      </component>
      <p v-if="excerpt || $slots.default" data-slot="blog-card-excerpt" :class="excerptClass">
        <slot>{{ excerpt }}</slot>
      </p>
      <div v-if="hasMeta" data-slot="blog-card-meta" :class="metaClass">
        <span v-if="author" data-slot="blog-card-author" :class="authorClass">{{ author }}</span>
        <span v-if="author && dateText" data-slot="blog-card-sep" aria-hidden="true" class="size-1 rounded-full bg-muted-foreground"></span>
        <time v-if="isoDate" data-slot="blog-card-date" :datetime="isoDate">{{ dateText }}</time>
        <span v-else-if="dateText" data-slot="blog-card-date">{{ dateText }}</span>
        <span v-if="(author || dateText) && readTimeText" data-slot="blog-card-sep" aria-hidden="true" class="size-1 rounded-full bg-muted-foreground"></span>
        <span v-if="readTimeText" data-slot="blog-card-read-time">{{ readTimeText }}</span>
      </div>
    </div>
  </article>
</template>
