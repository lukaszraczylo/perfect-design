<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { faChevronLeft, faChevronRight, faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { mediaBlurSoftClass, useMediaBlurToggle } from '../../../lib/media-blur'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import MediaBlurToggle from '../_media/MediaBlurToggle.vue'
import { checkItems, parentChecksItems } from '../shared/itemsContract'
import { clampNumber } from '../shared/motion'
import { imageAltProblem } from './contract'

export interface LightboxImage {
  src: string
  /** Required (or a `caption`); an empty string marks the image decorative. */
  alt?: string
  caption?: string
}

export interface LightboxProps extends BaseProps {
  /** v-model:open. Required: the viewer never opens itself, so omitting it leaves it closed forever (`false` is fine). */
  open?: boolean
  /** v-model:index, the visible image. Out-of-range values are clamped. */
  index?: number
  images?: LightboxImage[]
  /** Wrap around at the ends. When false the prev/next buttons disable at the ends. */
  loop?: boolean
  /** Close when the dark backdrop is clicked. */
  closeOnBackdrop?: boolean
  /** Accessible name of the dialog. */
  label?: string
  closeLabel?: string
  prevLabel?: string
  nextLabel?: string
  /** Privacy blur on the open image. v-model:blurred. Wins over `ConfigProvider blurMedia`, true or false. */
  blurred?: boolean
  /** Starting blur when `blurred` is not bound. */
  defaultBlurred?: boolean
  /** Offer a reveal button in the header that unblurs the image and blurs it again. */
  revealable?: boolean
  /** Name of the reveal button. */
  revealLabel?: string
  /** Name of the button that blurs the image again. */
  hideLabel?: string
}

const props = withDefaults(defineProps<LightboxProps>(), {
  open: undefined,
  index: undefined,
  images: () => [],
  loop: true,
  closeOnBackdrop: true,
  label: 'Image viewer',
  closeLabel: 'Close',
  prevLabel: 'Previous image',
  nextLabel: 'Next image',
  blurred: undefined,
  defaultBlurred: undefined,
  revealable: false,
  revealLabel: 'Show image',
  hideLabel: 'Hide image',
})
const emit = defineEmits<{ 'update:open': [open: boolean]; 'update:index': [index: number]; 'update:blurred': [blurred: boolean]; close: [] }>()
const blur = useMediaBlurToggle(() => props.blurred, () => props.defaultBlurred, (v) => emit('update:blurred', v))

const quiet = parentChecksItems()
onMounted(async () => {
  await nextTick()
  if (quiet) return
  if (props.open === undefined) {
    violation('Lightbox', 'requires-open', 'requires the `open` prop (bind `v-model:open`). The viewer never opens itself, so without it nothing can show it; pass `false` while closed.')
  }
  checkItems('Lightbox', 'images', props.images, (img) => imageAltProblem(img))
})

const innerOpen = ref(false)
const innerIndex = ref(0)
const broken = ref(false)
const root = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)

const count = computed(() => props.images.length)
const isOpen = computed(() => props.open ?? innerOpen.value)
const visible = computed(() => isOpen.value && count.value > 0)
const current = computed(() => clampNumber(Math.trunc(props.index ?? innerIndex.value), 0, Math.max(0, count.value - 1), 0))
const image = computed(() => props.images[current.value])
const canPrev = computed(() => count.value > 1 && (props.loop || current.value > 0))
const canNext = computed(() => count.value > 1 && (props.loop || current.value < count.value - 1))

function setOpen(v: boolean) {
  innerOpen.value = v
  emit('update:open', v)
  if (!v) emit('close')
}
function go(i: number) {
  if (count.value === 0) return
  const next = ((i % count.value) + count.value) % count.value
  innerIndex.value = next
  emit('update:index', next)
}
const prev = () => canPrev.value && go(current.value - 1)
const next = () => canNext.value && go(current.value + 1)
watch(current, () => (broken.value = false))

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
function onKeydown(e: KeyboardEvent) {
  if (!visible.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    setOpen(false)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    // In RTL the "next" image is on the left, so the arrows swap.
    const rtl = !!root.value && getComputedStyle(root.value).direction === 'rtl'
    if ((e.key === 'ArrowRight') !== rtl) next()
    else prev()
  } else if ((e.key === 'Home' || e.key === 'End') && count.value > 1) {
    e.preventDefault()
    go(e.key === 'Home' ? 0 : count.value - 1)
  } else if (e.key === 'Tab') trap(e)
}
/** Clicks on the dark area (not on a control, image or caption) close the viewer. */
function onRootClick(e: MouseEvent) {
  if (!props.closeOnBackdrop) return
  const target = e.target as HTMLElement | null
  if (target && !target.closest('button, img, figcaption, [data-slot="lightbox-counter"], [data-slot="lightbox-fallback"]')) setOpen(false)
}
function trap(e: KeyboardEvent) {
  const nodes = Array.from(root.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
  if (nodes.length === 0) {
    e.preventDefault()
    root.value?.focus()
    return
  }
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  const active = document.activeElement
  const inside = !!active && root.value?.contains(active)
  if (e.shiftKey && (!inside || active === first)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && (!inside || active === last)) {
    e.preventDefault()
    first.focus()
  }
}

let restoreFocus: HTMLElement | null = null
let prevOverflow: string | null = null
let active = false
async function activate() {
  if (active) return
  active = true
  restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  prevOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  closeBtn.value?.focus()
}
function deactivate() {
  if (!active) return
  active = false
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = prevOverflow ?? ''
  prevOverflow = null
  if (restoreFocus && document.contains(restoreFocus)) restoreFocus.focus()
  restoreFocus = null
}
watch(visible, (v) => (v ? activate() : deactivate()), { flush: 'post' })
onMounted(() => {
  if (visible.value) activate()
})
onBeforeUnmount(deactivate)

// h-dvh: the overlay follows the dynamic viewport on mobile browsers (no hidden bottom controls behind the URL bar).
const overlayClasses = computed(() => cn('fixed inset-0 z-(--z-modal) flex h-dvh flex-col items-center gap-3 overflow-hidden bg-scrim p-4 outline-none', props.class))
const btn = cn(
  'flex size-10 shrink-0 items-center justify-center rounded-full border bg-background text-foreground transition-colors hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-50 pointer-coarse:size-12',
  focusRing,
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="root"
      data-slot="lightbox"
      :data-blurred="blur.blurred.value ? '' : undefined"
      role="dialog"
      aria-modal="true"
      :aria-label="label"
      tabindex="-1"
      :class="overlayClasses"
      @click="onRootClick"
    >
      <div data-slot="lightbox-header" class="flex w-full shrink-0 items-center justify-end gap-2">
        <MediaBlurToggle
          v-if="revealable && (blur.blurred.value || blur.hideable.value)"
          placement="inline"
          :blurred="blur.blurred.value"
          :reveal-label="revealLabel"
          :hide-label="hideLabel"
          @toggle="blur.toggle"
        />
        <button ref="closeBtn" type="button" data-slot="lightbox-close" :aria-label="closeLabel" :class="btn" @click="setOpen(false)">
          <Icon :icon="faXmark" size="lg" />
        </button>
      </div>
      <figure data-slot="lightbox-figure" class="flex min-h-0 w-full max-w-full flex-1 flex-col items-center justify-center gap-3">
        <img
          v-if="image && image.src && !broken"
          data-slot="lightbox-image"
          :src="image.src"
          :alt="image.alt ?? image.caption ?? ''"
          :class="cn('max-h-full min-h-0 max-w-full rounded-md object-contain', mediaBlurSoftClass(blur.blurred.value, revealable))"
          @error="broken = true"
        />
        <p v-else data-slot="lightbox-fallback" role="img" :aria-label="image?.alt || 'Image unavailable'" class="rounded-md border bg-background px-6 py-10 text-sm text-muted-foreground">
          {{ image?.alt || 'Image unavailable' }}
        </p>
        <figcaption v-if="image?.caption" data-slot="lightbox-caption" class="max-w-2xl shrink-0 rounded-md border bg-background px-3 py-1.5 text-center text-sm">
          {{ image.caption }}
        </figcaption>
      </figure>
      <div v-if="count > 1" data-slot="lightbox-controls" class="flex shrink-0 items-center gap-3">
        <button
          type="button"
          data-slot="lightbox-prev"
          :aria-label="prevLabel"
          :aria-disabled="canPrev ? undefined : 'true'"
          :class="btn"
          @click="prev"
        >
          <Icon :icon="faChevronLeft" size="lg" class="rtl:-scale-x-100" />
        </button>
        <p data-slot="lightbox-counter" aria-live="polite" class="rounded-md border bg-background px-3 py-1 text-xs font-medium tabular-nums">
          {{ current + 1 }} / {{ count }}
        </p>
        <button
          type="button"
          data-slot="lightbox-next"
          :aria-label="nextLabel"
          :aria-disabled="canNext ? undefined : 'true'"
          :class="btn"
          @click="next"
        >
          <Icon :icon="faChevronRight" size="lg" class="rtl:-scale-x-100" />
        </button>
      </div>
    </div>
  </Teleport>
</template>
