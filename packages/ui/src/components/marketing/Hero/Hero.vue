<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, useAttrs, useId, useSlots } from 'vue'
import { violation } from '../../../lib/contract'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { faArrowRight } from '../../../lib/icons'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import MediaFrame from '../MediaFrame/MediaFrame.vue'
import { mediaFrameVariantNames, type MediaFrameVariant } from '../MediaFrame/variants'
import { headingTag, oneOf } from '../shared/pick'
import { insetFocus } from '../shared/styles'
import {
  heroBackgrounds,
  heroLeftVariants,
  heroSizeNames,
  heroSplitVariants,
  heroSubtitleVariants,
  heroTitleVariants,
  heroVariantNames,
  heroVariants,
  type HeroBackground,
  type HeroSize,
  type HeroVariant,
} from './variants'

export interface HeroStat {
  value: string | number
  label: string
}

export interface HeroProps extends BaseProps {
  /** Layout. Unknown values fall back to `left` (the default). */
  variant?: HeroVariant
  /** Padding and type scale. */
  size?: HeroSize
  eyebrow?: string
  title?: string
  subtitle?: string
  /** Background treatment: `none`, `grid`, `dots` or `image`. `image` needs `image`; `full-bleed` implies it. Unknown and removed values (`gradient`, `glow`, `spotlight`) render none. */
  background?: HeroBackground
  /** @deprecated Alias of `background`, kept for backward compatibility. `background` wins when both are set. */
  decoration?: HeroBackground
  /** Cover image URL for `background="image"` / `variant="full-bleed"`. Decorative (empty alt); the text sits on a solid panel so contrast never depends on the picture. */
  image?: string
  /** Split family only: put the media before the text on large screens (`split-reverse` always does). */
  reverse?: boolean
  /** Chrome wrapped around the media slot. Defaults: `browser` for stacked-media, `window` for terminal/code, otherwise `none`. */
  mediaFrame?: MediaFrameVariant | 'none'
  /** Chrome bar text of the media frame (URL or filename). */
  mediaTitle?: string
  /** Code/terminal text shown in the media frame when the `media` slot is empty. */
  code?: string
  /** Accessible name of the scrollable code block. Defaults to the media title, then `Code sample`. */
  codeLabel?: string
  /** `announcement` variant: short notice above the title. Use only for real news that links somewhere. */
  announcement?: string
  /** `announcement` variant: makes the pill a link. */
  announcementHref?: string
  /** `with-stats` variant: stat row below the content. */
  stats?: HeroStat[]
  /** `with-logos` variant: small caption above the logo strip. */
  logosLabel?: string
  /** Heading level for the title (1-6). Invalid values fall back to 1. Use 2 when the page already has an h1. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<HeroProps>(), {
  variant: 'left',
  size: 'md',
  background: undefined,
  decoration: undefined,
  reverse: false,
  mediaFrame: undefined,
  stats: () => [],
  level: 1,
  as: 'section',
})
const slots = useSlots()
const attrs = useAttrs()
const self = getCurrentInstance()

// A hero without a heading has no name for screen readers and breaks the page outline. Any heading inside counts
// (a `title` prop or slot, or your own markup in the default slot), as does an `aria-label` / `aria-labelledby` on the hero.
onMounted(async () => {
  await nextTick()
  const el = self?.proxy?.$el as Element | undefined
  if (props.title?.trim() || slots.title || attrs['aria-label'] || attrs['aria-labelledby'] || !el?.querySelector) return
  if ([...el.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')].some((h) => h.textContent?.trim() || h.getAttribute('aria-label'))) return
  violation('Hero', 'requires-title', 'requires a heading: set `title` (or the `title` slot), put a heading in the default slot, or set `aria-label` / `aria-labelledby` on the hero.')
})

const kind = computed(() => oneOf(props.variant, heroVariantNames, 'left'))
const size = computed(() => oneOf(props.size, heroSizeNames, 'md'))
const tag = computed(() => headingTag(props.level, 'h1'))

const isSplit = computed(() => heroSplitVariants.includes(kind.value))
const isLeft = computed(() => heroLeftVariants.includes(kind.value))
const isCode = computed(() => kind.value === 'terminal' || kind.value === 'code')
const reversed = computed(() => kind.value === 'split-reverse' || (props.reverse && isSplit.value))

const bg = computed(() =>
  kind.value === 'full-bleed' ? 'image' : oneOf(props.background ?? props.decoration, Object.keys(heroBackgrounds) as HeroBackground[], 'none'),
)
const uid = useId()
const patternId = `${uid}-pattern`
const imageMode = computed(() => bg.value === 'image')
const showImage = computed(() => imageMode.value && !!props.image)
/** Text sits on the primary surface only when image mode has no image; with an image it sits on a solid panel. */
const inverted = computed(() => imageMode.value && !props.image)
const pattern = computed(() => (bg.value === 'grid' || bg.value === 'dots' ? bg.value : undefined))
const patternClass = computed(() => heroBackgrounds[bg.value])

const frame = computed(() => {
  const fallback = kind.value === 'stacked-media' ? 'browser' : isCode.value ? 'window' : 'none'
  return oneOf(props.mediaFrame, [...mediaFrameVariantNames, 'none'] as const, fallback)
})
const codeName = computed(() => props.codeLabel || (props.mediaTitle ? `${props.mediaTitle} code` : 'Code sample'))
const codeClass = cn('overflow-x-auto whitespace-pre text-start', insetFocus)
const frameContentClass = computed(() => {
  if (!isCode.value || frame.value === 'none') return undefined
  return kind.value === 'terminal' ? 'bg-foreground p-4 font-mono text-sm text-background' : 'bg-card p-4 font-mono text-sm'
})
const hasMedia = computed(() => !!slots.media || !!props.code)

const validStats = computed(() =>
  (Array.isArray(props.stats) ? props.stats : []).filter((s) => s && typeof s === 'object' && s.value !== undefined && s.value !== null && !!s.label),
)
const showAnnouncement = computed(() => kind.value === 'announcement' && (!!props.announcement || !!slots.announcement))
const showForm = computed(() => kind.value === 'with-form' && !!slots.form)
const showStats = computed(() => kind.value === 'with-stats' && (!!slots.stats || validStats.value.length > 0))
const showLogos = computed(() => kind.value === 'with-logos' && !!slots.logos)
const showBento = computed(() => kind.value === 'bento' && !!slots.bento)

const rootClass = computed(() =>
  cn(
    heroVariants({ variant: kind.value, size: size.value }),
    imageMode.value && (showImage.value ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'),
    props.class,
  ),
)
const innerClass = computed(() =>
  cn(
    'mx-auto w-full max-w-7xl',
    isSplit.value ? 'grid items-center gap-12 lg:grid-cols-2' : cn('flex flex-col', kind.value === 'minimal' ? 'gap-6' : 'gap-8', isLeft.value ? 'items-start' : 'items-center'),
  ),
)
const contentClass = computed(() =>
  cn(
    'flex min-w-0 flex-col gap-5',
    showImage.value && 'rounded-lg border bg-background p-6 text-foreground sm:p-10',
    isSplit.value ? 'items-start' : isLeft.value ? 'max-w-3xl items-start' : cn('mx-auto items-center', kind.value === 'minimal' ? 'max-w-2xl' : 'max-w-3xl'),
    reversed.value && 'lg:order-2',
  ),
)
const eyebrowClass = computed(() => cn('text-sm font-medium', inverted.value ? 'text-current' : 'text-primary'))
const titleClass = computed(() => cn(heroTitleVariants({ size: size.value, compact: kind.value === 'minimal' })))
const subtitleClass = computed(() => cn(heroSubtitleVariants({ size: size.value, inverted: inverted.value })))
const mediaClass = computed(() =>
  cn(
    'w-full',
    !isSplit.value && (isLeft.value ? 'max-w-5xl' : kind.value === 'stacked-media' ? 'mx-auto max-w-6xl' : 'mx-auto max-w-5xl'),
    reversed.value && 'lg:order-1',
  ),
)
</script>

<template>
  <Primitive data-slot="hero" :as="as" :data-variant="kind" :data-size="size" :class="rootClass">
    <slot name="decoration">
      <svg
        v-if="pattern"
        data-slot="hero-decoration"
        :data-pattern="pattern"
        aria-hidden="true"
        focusable="false"
        :class="cn('pointer-events-none absolute inset-0 -z-10 size-full forced-colors:hidden', patternClass)"
      >
        <defs>
          <pattern v-if="pattern === 'grid'" :id="patternId" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="currentColor" stroke-width="1" />
          </pattern>
          <pattern v-else :id="patternId" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" :fill="`url(#${patternId})`" />
      </svg>
    </slot>
    <div v-if="showImage" data-slot="hero-background-image" aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
      <img :src="image" alt="" decoding="async" class="size-full object-cover" />
      <div data-slot="hero-overlay" class="absolute inset-0 bg-scrim" />
    </div>
    <div data-slot="hero-inner" :class="innerClass">
      <div data-slot="hero-content" :class="contentClass">
        <component
          :is="announcementHref ? 'a' : 'div'"
          v-if="showAnnouncement"
          data-slot="hero-announcement"
          :href="announcementHref || undefined"
          :class="
            cn(
              'inline-flex min-h-6 items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium',
              inverted ? 'border-current' : 'bg-background',
              announcementHref && (inverted ? 'underline-offset-4 hover:underline' : 'transition-colors hover:bg-accent hover:text-accent-foreground'),
              announcementHref && insetFocus,
            )
          "
        >
          <slot name="announcement">{{ announcement }}</slot>
          <Icon v-if="announcementHref" :icon="faArrowRight" size="sm" />
        </component>
        <p v-if="eyebrow || $slots.eyebrow" data-slot="hero-eyebrow" :class="eyebrowClass">
          <slot name="eyebrow">{{ eyebrow }}</slot>
        </p>
        <component :is="tag" v-if="title || $slots.title" data-slot="hero-title" :class="titleClass">
          <slot name="title">{{ title }}</slot>
        </component>
        <p v-if="subtitle || $slots.subtitle" data-slot="hero-subtitle" :class="subtitleClass">
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
        <div v-if="showForm" data-slot="hero-form" class="mt-2 w-full max-w-md">
          <slot name="form" />
        </div>
        <div v-if="$slots.actions" data-slot="hero-actions" :class="cn('mt-2 flex flex-wrap gap-3', !isLeft && 'justify-center')">
          <slot name="actions" />
        </div>
        <slot />
      </div>
      <div v-if="hasMedia" data-slot="hero-media" :class="mediaClass">
        <MediaFrame v-if="frame !== 'none'" :variant="frame" :title="mediaTitle" :content-class="frameContentClass">
          <slot name="media">
            <pre data-slot="hero-code" tabindex="0" role="region" :aria-label="codeName" :class="codeClass"><code>{{ code }}</code></pre>
          </slot>
        </MediaFrame>
        <slot v-else name="media">
          <pre data-slot="hero-code" tabindex="0" role="region" :aria-label="codeName" :class="codeClass"><code>{{ code }}</code></pre>
        </slot>
      </div>
      <div v-if="showStats" data-slot="hero-stats" class="w-full">
        <slot name="stats">
          <dl class="flex flex-wrap items-start justify-center gap-x-12 gap-y-6">
            <div v-for="(s, i) in validStats" :key="i" data-slot="hero-stat" class="flex flex-col-reverse items-center gap-1">
              <dt data-slot="hero-stat-label" :class="cn('text-sm', inverted ? 'text-current' : 'text-muted-foreground')">{{ s.label }}</dt>
              <dd data-slot="hero-stat-value" class="text-3xl font-semibold tracking-tight tabular-nums">{{ s.value }}</dd>
            </div>
          </dl>
        </slot>
      </div>
      <div v-if="showLogos" data-slot="hero-logos" class="flex w-full flex-col items-center gap-4">
        <p v-if="logosLabel" data-slot="hero-logos-label" :class="cn('text-sm', inverted ? 'text-current' : 'text-muted-foreground')">
          {{ logosLabel }}
        </p>
        <div class="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 [&_img]:h-8 [&_img]:w-auto">
          <slot name="logos" />
        </div>
      </div>
      <div v-if="showBento" data-slot="hero-bento" class="mx-auto grid w-full max-w-6xl gap-4 text-start sm:grid-cols-2 lg:grid-cols-3">
        <slot name="bento" />
      </div>
    </div>
  </Primitive>
</template>
