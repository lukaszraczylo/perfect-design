<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { mediaBlurClass, useMediaBlur } from '../../../lib/media-blur'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Lightbox from '../Lightbox/Lightbox.vue'
import { imageAltProblem } from '../Lightbox/contract'
import MediaBlurToggle from '../_media/MediaBlurToggle.vue'
import { checkItems, ItemsChecked } from '../shared/itemsContract'
import { pickColumns } from '../shared/motion'
import {
  IMAGE_GRID_ASPECTS,
  IMAGE_GRID_GAPS,
  IMAGE_GRID_SHAPES,
  IMAGE_GRID_VARIANTS,
  imageGridHeroMobileAspect,
  imageGridItemVariants,
  imageGridTileVariants,
  imageGridVariants,
  type ImageGridAspect,
  type ImageGridGap,
  type ImageGridShape,
  type ImageGridVariant,
} from './variants'

export interface GridImage {
  src: string
  /** Required (or a `caption` when `lightbox` is on); an empty string marks the image decorative. */
  alt?: string
  caption?: string
  /** Smaller image used in the grid; defaults to `src`. */
  thumb?: string
}

export interface ImageGridProps extends BaseProps {
  images?: GridImage[]
  /** Layout: `grid` (uniform tiles), `masonry` (CSS columns, natural heights) or `featured` (first tile 2x2). Unknown values fall back to `grid`. */
  variant?: ImageGridVariant
  /** Columns from `sm` upward (2, 3 or 4). Invalid values fall back to 3. */
  columns?: 2 | 3 | 4
  /** Space between tiles: `none`, `sm`, `md` or `lg`. Invalid values fall back to `md`. */
  gap?: ImageGridGap
  /** Tile corners: `rounded` (default, `rounded-lg`) or `square` (no radius). Unknown values fall back to `rounded`. */
  shape?: ImageGridShape
  /** Tile aspect ratio: `square`, `video` (16:9), `portrait` (3:4), `landscape` (4:3) or `auto` (natural height). Wins over `ratio`; invalid values are ignored. */
  aspect?: ImageGridAspect
  /** Legacy alias of `aspect` limited to `square` / `video` / `auto`. Default `square` (`auto` for masonry). */
  ratio?: 'square' | 'video' | 'auto'
  /** Open a Lightbox on click. When false thumbnails are plain images. */
  lightbox?: boolean
  /** Prefix of each thumbnail button's accessible name. */
  viewLabel?: string
  /** Privacy blur on every image, also inside the Lightbox. Wins over `ConfigProvider blurMedia`, true or false. Changing it clears the per-image reveals. */
  blurred?: boolean
  /** Offer a reveal button per image (and inside the Lightbox). Revealing one image leaves the others blurred. */
  revealable?: boolean
  /** Name of the reveal button. */
  revealLabel?: string
  /** Name of the button that blurs a revealed image again. */
  hideLabel?: string
}

const props = withDefaults(defineProps<ImageGridProps>(), {
  images: () => [],
  variant: 'grid',
  columns: 3,
  gap: 'md',
  shape: 'rounded',
  aspect: undefined,
  ratio: undefined,
  lightbox: true,
  viewLabel: 'View image',
  blurred: undefined,
  revealable: false,
  revealLabel: 'Show image',
  hideLabel: 'Hide image',
})
const emit = defineEmits<{ open: [index: number]; reveal: [index: number, revealed: boolean] }>()

const variant = computed<ImageGridVariant>(() => (IMAGE_GRID_VARIANTS.includes(props.variant) ? props.variant : 'grid'))
const cols = computed(() => pickColumns(props.columns, [2, 3, 4] as const, 3))
const gap = computed<ImageGridGap>(() => (IMAGE_GRID_GAPS.includes(props.gap) ? props.gap : 'md'))
const shape = computed<ImageGridShape>(() => (IMAGE_GRID_SHAPES.includes(props.shape) ? props.shape : 'rounded'))
const aspect = computed<ImageGridAspect>(() => {
  const given = [props.aspect, props.ratio].find((v): v is ImageGridAspect => IMAGE_GRID_ASPECTS.includes(v as ImageGridAspect))
  return given ?? (variant.value === 'masonry' ? 'auto' : 'square')
})
const classes = computed(() => cn(imageGridVariants({ variant: variant.value, columns: cols.value, gap: gap.value }), props.class))
const itemClass = computed(() => imageGridItemVariants({ variant: variant.value, gap: gap.value }))
/** In `featured` the first tile fills a 2x2 area instead of keeping its own aspect ratio. */
const isHero = (i: number) => variant.value === 'featured' && i === 0
const fixed = (i: number) => aspect.value !== 'auto' || isHero(i)

// The grid checks the images for its internal Lightbox too (ItemsChecked keeps that one quiet), so a mistake reports once.
onMounted(async () => {
  await nextTick()
  checkItems('ImageGrid', 'images', props.images, (img) => imageAltProblem(img, props.lightbox))
})

const isOpen = ref(false)
const index = ref(0)
const failed = reactive(new Set<number>())

const gridBlurred = useMediaBlur(() => props.blurred)
const revealed = reactive(new Set<number>())
watch(gridBlurred, () => revealed.clear())
const itemBlurred = (i: number) => gridBlurred.value && !revealed.has(i)
const hasToggle = (i: number) => props.revealable && gridBlurred.value && (itemBlurred(i) || revealed.has(i))
function setRevealed(i: number, on: boolean) {
  if (on === revealed.has(i)) return
  if (on) revealed.add(i)
  else revealed.delete(i)
  emit('reveal', i, on)
}

function open(i: number) {
  index.value = i
  isOpen.value = true
  emit('open', i)
}
const name = (img: GridImage, i: number) => `${props.viewLabel}: ${img.alt || img.caption || i + 1}`
const tileClass = (i: number) => cn(imageGridTileVariants({ aspect: aspect.value, shape: shape.value }), isHero(i) && ['aspect-auto h-full min-h-0', imageGridHeroMobileAspect[aspect.value]])
const imgClass = (i: number) => cn(fixed(i) ? 'absolute inset-0 size-full object-cover' : 'block h-auto w-full', mediaBlurClass(itemBlurred(i), props.revealable))
</script>

<template>
  <ul data-slot="image-grid" role="list" :data-blurred="gridBlurred ? '' : undefined" :data-variant="variant" :data-columns="cols" :data-shape="shape" :class="classes">
    <li
      v-for="(img, i) in images"
      :key="i"
      data-slot="image-grid-item"
      :data-featured="isHero(i) ? '' : undefined"
      :data-blurred="itemBlurred(i) ? '' : undefined"
      :class="cn(itemClass, isHero(i) && 'col-span-2 row-span-2', revealable && 'relative')"
    >
      <component
        :is="lightbox ? 'button' : 'div'"
        :type="lightbox ? 'button' : undefined"
        :aria-label="lightbox ? name(img, i) : undefined"
        :aria-haspopup="lightbox ? 'dialog' : undefined"
        :class="cn(tileClass(i), lightbox && ['cursor-zoom-in', focusRing])"
        @click="lightbox && open(i)"
      >
        <img
          v-if="!failed.has(i) && (img.thumb || img.src)"
          :src="img.thumb || img.src"
          :alt="lightbox ? '' : (img.alt ?? '')"
          loading="lazy"
          :class="imgClass(i)"
          @error="failed.add(i)"
        />
        <span
          v-else
          data-slot="image-grid-fallback"
          :class="cn('flex size-full items-center justify-center p-2 text-center text-xs text-muted-foreground', !fixed(i) && 'min-h-24')"
        >
          {{ img.alt || 'Image unavailable' }}
        </span>
      </component>
      <MediaBlurToggle v-if="hasToggle(i)" :blurred="itemBlurred(i)" :reveal-label="revealLabel" :hide-label="hideLabel" @toggle="setRevealed(i, itemBlurred(i))" />
    </li>
    <ItemsChecked v-if="lightbox"><Lightbox v-model:open="isOpen" v-model:index="index" :images="images" :blurred="itemBlurred(index)" :revealable="revealable && gridBlurred" :reveal-label="revealLabel" :hide-label="hideLabel" @update:blurred="(v: boolean) => setRevealed(index, !v)" /></ItemsChecked>
  </ul>
</template>
