<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import { checkItems, isBlank } from '../shared/itemsContract'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import {
  SOCIAL_LINKS_ALIGNS,
  SOCIAL_LINKS_ORIENTATIONS,
  SOCIAL_LINKS_SIZES,
  SOCIAL_LINKS_VARIANTS,
  socialLinksLinkVariants,
  socialLinksVariants,
  type SocialLinksAlign,
  type SocialLinksOrientation,
  type SocialLinksSize,
  type SocialLinksVariant,
} from './variants'

export interface SocialLink {
  /** Accessible name, e.g. "GitHub". Required: the link is icon-only. */
  label: string
  /** Required: an entry without `label` or `href` is a contract violation (it would otherwise be skipped silently). */
  href: string
  icon: IconDefinition
}

export interface SocialLinksProps extends BaseProps {
  links?: SocialLink[]
  /** Look: `ghost` (default: muted icon, accent background on hover), `plain` (no background), `outline` (bordered) or `filled` (solid primary). Unknown values fall back to `ghost`. */
  variant?: SocialLinksVariant
  /** Hit area and icon size. Unknown values fall back to `md`. */
  size?: SocialLinksSize
  /** Where the icons sit along the main axis: `start`, `center` or `end`. Unknown values fall back to `start`. */
  align?: SocialLinksAlign
  /** `horizontal` row (wraps) or `vertical` column. Unknown values fall back to `horizontal`. */
  orientation?: SocialLinksOrientation
  /** Open links in a new tab with rel="noopener noreferrer". */
  newTab?: boolean
}

const props = withDefaults(defineProps<SocialLinksProps>(), { links: () => [], variant: 'ghost', size: 'md', align: 'start', orientation: 'horizontal', newTab: true })

const pick = <T extends string>(list: readonly T[], value: unknown, fallback: T): T => (list.includes(value as T) ? (value as T) : fallback)
const variant = computed(() => pick(SOCIAL_LINKS_VARIANTS, props.variant, 'ghost'))
const size = computed(() => pick(SOCIAL_LINKS_SIZES, props.size, 'md'))
const align = computed(() => pick(SOCIAL_LINKS_ALIGNS, props.align, 'start'))
const orientation = computed(() => pick(SOCIAL_LINKS_ORIENTATIONS, props.orientation, 'horizontal'))
onMounted(async () => {
  await nextTick()
  checkItems('SocialLinks', 'links', props.links, (l) => {
    if (isBlank(l.label)) return { rule: 'requires-label', text: 'requires a non-empty `label` (the link is icon-only, so it is the accessible name). Without it the link is dropped.' }
    if (isBlank(l.href)) return { rule: 'requires-href', text: 'requires a non-empty `href`. Without it the link is dropped.' }
    return undefined
  })
})
const valid = computed(() => (Array.isArray(props.links) ? props.links : []).filter((l) => l && l.href && l.label))
const classes = computed(() => cn(socialLinksVariants({ orientation: orientation.value, align: align.value }), props.class))
const linkClass = computed(() => cn(socialLinksLinkVariants({ variant: variant.value, size: size.value }), focusRing))
</script>

<template>
  <ul data-slot="social-links" role="list" :data-variant="variant" :data-size="size" :data-orientation="orientation" :class="classes">
    <li v-for="(l, i) in valid" :key="i" data-slot="social-links-item">
      <a
        data-slot="social-links-link"
        :href="l.href"
        :aria-label="l.label"
        :target="newTab ? '_blank' : undefined"
        :rel="newTab ? 'noopener noreferrer' : undefined"
        :class="linkClass"
      >
        <Icon :icon="l.icon" :size="size" />
      </a>
    </li>
  </ul>
</template>
