<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { checkItems, isBlank } from '../shared/itemsContract'
import { pickColumns } from '../shared/motion'
import Marquee from '../Marquee/Marquee.vue'
import LogoCloudLogo from './LogoCloudLogo.vue'
import {
  logoCloudListVariants,
  logoCloudLogoVariants,
  logoCloudTitleVariants,
  logoCloudVariants,
  LOGO_CLOUD_TONES,
  resolveLogoCloudGap,
  resolveLogoCloudLayout,
  resolveLogoCloudShape,
  resolveLogoCloudSize,
  type LogoCloudColumns,
  type LogoCloudGap,
  type LogoCloudLayout,
  type LogoCloudShape,
  type LogoCloudSize,
  type LogoCloudTone,
} from './variants'

export interface LogoItem {
  /** Company name. Required even with `src`: it is the image alt text and the text fallback when there is no (working) image. */
  name: string
  src?: string
  href?: string
}

export interface LogoCloudProps extends BaseProps {
  logos?: LogoItem[]
  /** Small caption, e.g. "Trusted by teams at". Above the logos, or beside them in `with-title`. */
  title?: string
  /**
   * `grid` (default), `inline` (centred wrapping row), `marquee` (continuous scroll, logos not linked), `with-title` (small caption left, grid right from `lg`),
   * `split` (headline-size title on a third, wrapping logos on the rest, from `lg`), `centered` (headline-size centred title above a centred wrapping row) or
   * `card` (title and grid inside a bordered panel). Unknown values fall back to `grid`.
   */
  layout?: LogoCloudLayout
  /** `grayscale` dims images until hover/focus; `color` shows them as they are; `muted` keeps them dimmed with no hover reveal. When unset, the `grayscale` prop decides. */
  tone?: LogoCloudTone
  /** Logo tile: `plain` (default, no border), `rounded`, `square` or `pill` (bordered tile on the card surface). Unknown values fall back to `plain`. */
  shape?: LogoCloudShape
  /** Space between logos: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  gap?: LogoCloudGap
  /** Show logos in grayscale until hovered or focused. Used only when `tone` is not set. */
  grayscale?: boolean
  /** Logo height: `sm` (2rem), `md` (3rem), `lg` (4rem). Unknown values fall back to `md`. */
  size?: LogoCloudSize
  /** Columns from `md` up (3-6) in `grid` and `with-title`. Invalid values fall back to 5. */
  columns?: LogoCloudColumns
  /** `marquee`: seconds for one loop (Marquee default when unset). */
  duration?: number
  /** `marquee`: scroll direction. */
  direction?: 'left' | 'right'
}

const props = withDefaults(defineProps<LogoCloudProps>(), { logos: () => [], layout: 'grid', shape: 'plain', gap: 'md', grayscale: true, columns: 5 })

onMounted(async () => {
  await nextTick()
  checkItems('LogoCloud', 'logos', props.logos, (logo) => (isBlank(logo.name) ? { rule: 'requires-name', text: 'requires a non-empty `name`, even with a `src`. It is the image alt text and the fallback when the image fails.' } : undefined))
})

const layout = computed(() => resolveLogoCloudLayout(props.layout))
const size = computed(() => resolveLogoCloudSize(props.size))
const shape = computed(() => resolveLogoCloudShape(props.shape))
const gap = computed(() => resolveLogoCloudGap(props.gap))
const tone = computed<LogoCloudTone>(() => (LOGO_CLOUD_TONES.includes(props.tone as LogoCloudTone) ? (props.tone as LogoCloudTone) : props.grayscale ? 'grayscale' : 'color'))
/** The marquee strip keeps its own gap scale; the two larger gaps share the widest strip gap. */
const marqueeGap = computed(() => (gap.value === 'sm' ? 'md' : 'lg'))
const cols = computed(() => pickColumns(props.columns, [3, 4, 5, 6] as const, 5))
const classes = computed(() => cn(logoCloudVariants({ layout: layout.value }), props.class))
const titleClass = computed(() => logoCloudTitleVariants({ layout: layout.value }))
const listClass = computed(() => logoCloudListVariants({ layout: layout.value, gap: gap.value, columns: cols.value }))
const logoClass = computed(() => logoCloudLogoVariants({ size: size.value, shape: shape.value, tone: tone.value }))
</script>

<template>
  <div data-slot="logo-cloud" :data-layout="layout" :data-columns="cols" :data-tone="tone" :data-size="size" :data-shape="shape" :data-gap="gap" :class="classes">
    <p v-if="title" data-slot="logo-cloud-title" :class="titleClass">{{ title }}</p>
    <Marquee v-if="layout === 'marquee'" :gap="marqueeGap" :label="title" :duration="duration" :direction="direction">
      <LogoCloudLogo v-for="(logo, i) in logos" :key="i" :name="logo.name" :src="logo.src" :link="false" :class="cn(logoClass, 'shrink-0 whitespace-nowrap')" />
    </Marquee>
    <ul v-else data-slot="logo-cloud-list" role="list" :class="listClass">
      <li v-for="(logo, i) in logos" :key="i" data-slot="logo-cloud-item" class="flex justify-center">
        <LogoCloudLogo :name="logo.name" :src="logo.src" :href="logo.href" :class="logoClass" />
      </li>
    </ul>
  </div>
</template>
