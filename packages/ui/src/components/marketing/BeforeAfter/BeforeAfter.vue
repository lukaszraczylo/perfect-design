<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { cn } from '../../../lib/cn'
import { mediaBlurClass, useMediaBlurToggle } from '../../../lib/media-blur'
import { requireText, violation } from '../../../lib/contract'
import { faChevronDown, faChevronLeft, faChevronRight, faChevronUp } from '../../../lib/icons'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import MediaBlurToggle from '../_media/MediaBlurToggle.vue'
import { clampNumber } from '../shared/motion'
import { oneOf } from '../shared/pick'
import {
  BEFORE_AFTER_APPEARANCES,
  BEFORE_AFTER_ORIENTATIONS,
  BEFORE_AFTER_SHAPES,
  BEFORE_AFTER_SIZES,
  BEFORE_AFTER_TONES,
  BEFORE_AFTER_VARIANTS,
  beforeAfterCaptionVariants,
  beforeAfterHandleVariants,
  beforeAfterKnobVariants,
  beforeAfterLabelVariants,
  beforeAfterLineVariants,
  beforeAfterVariants,
  type BeforeAfterAppearance,
  type BeforeAfterOrientation,
  type BeforeAfterShape,
  type BeforeAfterSize,
  type BeforeAfterTone,
  type BeforeAfterVariant,
} from './variants'

export interface BeforeAfterProps extends BaseProps {
  /** Image URL shown on the left of the divider (top when `orientation="vertical"`). */
  before?: string
  /** Image URL shown on the right of the divider (bottom when `orientation="vertical"`). */
  after?: string
  /** Alt text of `before`. Required with `before`; an empty string marks the image decorative. */
  beforeAlt?: string
  /** Alt text of `after`. Required with `after`; an empty string marks the image decorative. */
  afterAlt?: string
  beforeLabel?: string
  afterLabel?: string
  /** `horizontal` (default): divider moves left/right. `vertical`: before on top, after below, divider moves up/down. Unknown values fall back to `horizontal`. */
  orientation?: BeforeAfterOrientation
  /** Show the corner labels. They are decorative either way; the slider text always names both sides. `false` is the same as `variant="none"`. */
  showLabels?: boolean
  /** Where the labels go: `overlay` (corner chips, default), `bar` (one caption strip along the bottom edge) or `none`. Unknown values fall back to `overlay`. */
  variant?: BeforeAfterVariant
  /** Handle and label size: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: BeforeAfterSize
  /** Frame corners: `rounded` (default) or `square`. Unknown values fall back to `rounded`. */
  shape?: BeforeAfterShape
  /** Colour of the divider and grip: `default` (background), `primary` or `neutral` (foreground). Unknown values fall back to `default`. */
  tone?: BeforeAfterTone
  /** Handle style: `knob` (line with a round grip and arrows, default), `bar` (line with a short rounded grip) or `line` (line only). Unknown values fall back to `knob`. */
  appearance?: BeforeAfterAppearance
  /** Divider position, 0-100 (% of the size showing "before"). Use with v-model. Out-of-range values are clamped. */
  modelValue?: number
  /** Starting position when uncontrolled. */
  start?: number
  /** Keyboard step in percent (Shift/PageUp/PageDown use 5x). */
  step?: number
  /** CSS aspect ratio as "w / h". Invalid values fall back to "16 / 9". */
  aspect?: string
  /** Accessible name of the slider. */
  label?: string
  /** Privacy blur on both images; labels and the slider stay sharp. v-model:blurred. Wins over `ConfigProvider blurMedia`, true or false. */
  blurred?: boolean
  /** Starting blur when `blurred` is not bound. */
  defaultBlurred?: boolean
  /** Offer a button that reveals the blurred images and blurs them again. */
  revealable?: boolean
  /** Name of the reveal button. */
  revealLabel?: string
  /** Name of the button that blurs the images again. */
  hideLabel?: string
}

const props = withDefaults(defineProps<BeforeAfterProps>(), {
  orientation: 'horizontal',
  variant: 'overlay',
  size: 'md',
  shape: 'rounded',
  tone: 'default',
  appearance: 'knob',
  showLabels: true,
  beforeLabel: 'Before',
  afterLabel: 'After',
  start: 50,
  step: 2,
  aspect: '16 / 9',
  label: 'Image comparison slider',
  blurred: undefined,
  defaultBlurred: undefined,
  revealable: false,
  revealLabel: 'Show image',
  hideLabel: 'Hide image',
})
const emit = defineEmits<{ 'update:modelValue': [value: number]; 'update:blurred': [value: boolean] }>()
const blur = useMediaBlurToggle(() => props.blurred, () => props.defaultBlurred, (v) => emit('update:blurred', v))
const imageBlur = computed(() => mediaBlurClass(blur.blurred.value, props.revealable))

onMounted(async () => {
  await nextTick()
  requireText('BeforeAfter', 'label', props.label, 'It names the slider; the default is "Image comparison slider".')
  for (const [side, src, alt] of [['before', props.before, props.beforeAlt], ['after', props.after, props.afterAlt]] as const) {
    if (src && typeof alt !== 'string') {
      violation('BeforeAfter', `requires-${side}Alt`, `requires a \`${side}Alt\` string when \`${side}\` is set. Describe the ${side} image, or pass an empty string to mark it decorative.`)
    }
  }
})

const root = ref<HTMLElement | null>(null)
const inner = ref(clampNumber(props.start, 0, 100, 50))
const dragging = ref(false)
let capturedId: number | null = null

const pos = computed(() => clampNumber(props.modelValue ?? inner.value, 0, 100, 50))
const stepSize = computed(() => (Number.isFinite(props.step) && props.step > 0 ? props.step : 2))
const ratio = computed(() => (/^\s*\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*$/.test(props.aspect) ? props.aspect : '16 / 9'))
const orientation = computed<BeforeAfterOrientation>(() => (BEFORE_AFTER_ORIENTATIONS.includes(props.orientation) ? props.orientation : 'horizontal'))
const vertical = computed(() => orientation.value === 'vertical')
const size = computed(() => oneOf(props.size, BEFORE_AFTER_SIZES, 'md'))
const shape = computed(() => oneOf(props.shape, BEFORE_AFTER_SHAPES, 'rounded'))
const tone = computed(() => oneOf(props.tone, BEFORE_AFTER_TONES, 'default'))
const appearance = computed(() => oneOf(props.appearance, BEFORE_AFTER_APPEARANCES, 'knob'))
/** `showLabels=false` wins over every placement. */
const labels = computed<BeforeAfterVariant>(() => (props.showLabels ? oneOf(props.variant, BEFORE_AFTER_VARIANTS, 'overlay') : 'none'))
const rounded = computed(() => Math.round(pos.value))

function set(v: number) {
  const next = clampNumber(v, 0, 100, pos.value)
  if (next === pos.value) return
  inner.value = next
  emit('update:modelValue', next)
}

function fromPointer(e: PointerEvent) {
  const rect = root.value?.getBoundingClientRect()
  const size = vertical.value ? rect?.height : rect?.width
  if (!rect || !(size! > 0)) return
  const offset = vertical.value ? e.clientY - rect.top : e.clientX - rect.left
  set((offset / size!) * 100)
}
function onPointerDown(e: PointerEvent) {
  if (e.button !== undefined && e.button !== 0) return
  dragging.value = true
  capturedId = e.pointerId
  root.value?.setPointerCapture?.(e.pointerId)
  fromPointer(e)
}
function onPointerMove(e: PointerEvent) {
  if (dragging.value) fromPointer(e)
}
function endDrag() {
  dragging.value = false
  if (capturedId !== null) root.value?.releasePointerCapture?.(capturedId)
  capturedId = null
}
/** Direction (+1 = more "before") per key. Horizontal: Right/Up/PageUp. Vertical: the divider follows the arrow, so Down/Right/PageDown. */
const KEYS = {
  horizontal: { ArrowRight: 1, ArrowUp: 1, PageUp: 1, ArrowLeft: -1, ArrowDown: -1, PageDown: -1 },
  vertical: { ArrowDown: 1, ArrowRight: 1, PageDown: 1, ArrowUp: -1, ArrowLeft: -1, PageUp: -1 },
} as const
function onKeydown(e: KeyboardEvent) {
  const arrowStep = e.shiftKey ? stepSize.value * 5 : stepSize.value
  if (e.key === 'Home' || e.key === 'End') {
    e.preventDefault()
    return set(e.key === 'Home' ? 0 : 100)
  }
  const dir = (KEYS[orientation.value] as Record<string, number>)[e.key]
  if (typeof dir !== 'number') return
  e.preventDefault()
  set(pos.value + dir * (e.key.startsWith('Page') ? stepSize.value * 5 : arrowStep))
}
onBeforeUnmount(endDrag)

const classes = computed(() => cn(beforeAfterVariants({ orientation: orientation.value, shape: shape.value, dragging: dragging.value }), props.class))
const handleClass = computed(() => beforeAfterHandleVariants({ orientation: orientation.value, size: size.value }))
const lineClass = computed(() => beforeAfterLineVariants({ orientation: orientation.value, tone: tone.value, appearance: appearance.value }))
const knobClass = computed(() => beforeAfterKnobVariants({ orientation: orientation.value, size: size.value, tone: tone.value, appearance: appearance.value }))
const captionClass = computed(() => beforeAfterCaptionVariants({ size: size.value }))
const labelClass = (side: 'before' | 'after') => beforeAfterLabelVariants({ side: `${orientation.value}-${side}`, size: size.value, shape: shape.value })
const afterClip = computed(() => (vertical.value ? `inset(${pos.value}% 0 0 0)` : `inset(0 0 0 ${pos.value}%)`))
const handlePos = computed(() => (vertical.value ? { top: `${pos.value}%` } : { left: `${pos.value}%` }))
</script>

<template>
  <div
    ref="root"
    data-slot="before-after"
    :data-blurred="blur.blurred.value ? '' : undefined"
    :data-orientation="orientation"
    :data-variant="labels"
    :data-size="size"
    :data-shape="shape"
    :data-tone="tone"
    :data-appearance="appearance"
    :data-dragging="dragging ? '' : undefined"
    :class="classes"
    :style="{ aspectRatio: ratio }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="endDrag"
    @pointercancel="endDrag"
  >
    <img v-if="before" data-slot="before-after-before" :src="before" :alt="beforeAlt ?? beforeLabel" draggable="false" :class="cn('absolute inset-0 size-full object-cover', imageBlur)" />
    <div v-else data-slot="before-after-before" class="absolute inset-0 bg-muted" />
    <div data-slot="before-after-after-layer" class="absolute inset-0" :style="{ clipPath: afterClip }">
      <img v-if="after" data-slot="before-after-after" :src="after" :alt="afterAlt ?? afterLabel" draggable="false" :class="cn('size-full object-cover', imageBlur)" />
      <div v-else data-slot="before-after-after" class="size-full bg-accent" />
    </div>
    <template v-if="labels === 'overlay'">
      <span data-slot="before-after-before-label" aria-hidden="true" :class="labelClass('before')">{{ beforeLabel }}</span>
      <span data-slot="before-after-after-label" aria-hidden="true" :class="labelClass('after')">{{ afterLabel }}</span>
    </template>
    <!-- The caption strip keeps the image sides physical (before left, after right) in right-to-left pages too. -->
    <div v-else-if="labels === 'bar'" data-slot="before-after-captions" aria-hidden="true" dir="ltr" :class="captionClass">
      <span data-slot="before-after-before-label" dir="auto" class="min-w-0 truncate">{{ beforeLabel }}</span>
      <span data-slot="before-after-after-label" dir="auto" class="min-w-0 truncate">{{ afterLabel }}</span>
    </div>
    <div
      data-slot="before-after-handle"
      role="slider"
      tabindex="0"
      :aria-orientation="orientation"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="rounded"
      :aria-valuetext="`${rounded}% ${beforeLabel}, ${100 - rounded}% ${afterLabel}`"
      :aria-label="label"
      :class="handleClass"
      :style="handlePos"
      @keydown="onKeydown"
    >
      <span :class="lineClass" />
      <span v-if="appearance !== 'line'" data-slot="before-after-knob" :class="knobClass" aria-hidden="true">
        <template v-if="appearance === 'knob'">
          <Icon :icon="vertical ? faChevronUp : faChevronLeft" size="xs" />
          <Icon :icon="vertical ? faChevronDown : faChevronRight" size="xs" />
        </template>
      </span>
    </div>
    <MediaBlurToggle v-if="revealable && (blur.blurred.value || blur.hideable.value)" :blurred="blur.blurred.value" :reveal-label="revealLabel" :hide-label="hideLabel" @toggle="blur.toggle" />
  </div>
</template>
