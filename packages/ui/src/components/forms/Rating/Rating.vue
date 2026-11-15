<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, useId, watch, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { useFieldControl } from '../Field/useFieldContext'
import {
  normalizeRatingPrecision,
  normalizeRatingSize,
  normalizeRatingTone,
  ratingFillVariants,
  ratingVariants,
  resolveRatingGlyph,
  type RatingIcon,
  type RatingPrecision,
  type RatingSize,
  type RatingTone,
} from './variants'

export interface RatingProps {
  /** Current rating, `0` (or `null`) meaning no rating. Out-of-range / NaN values are clamped to `0..max`. */
  modelValue?: number | null
  /** Number of icons. Floored; invalid values fall back to 5; capped at 100. */
  max?: number
  /** Allow half values (0.5 steps). Shorthand for `precision="0.5"`; `precision` wins when both are set. */
  allowHalf?: boolean
  /** Smallest selectable step: `1` (whole icons, default), `0.5` or `0.25`. Other values fall back to `allowHalf`. Keys step by it. */
  precision?: RatingPrecision
  /** Glyph: `'star'` (default), `'heart'`, `'circle'`, or any icon definition (`{ icon: [w, h, , , path] }`). Decorative. */
  icon?: RatingIcon
  /** Colour of the filled part: `warning` (default), `primary`, `success`, `danger`, `neutral` or `info`. An outline stays visible. */
  tone?: RatingTone
  /** Clicking the star that already holds the value resets the rating to 0. */
  clearable?: boolean
  readonly?: boolean
  disabled?: boolean
  /** Marks the rating invalid (aria-invalid, destructive ring). */
  invalid?: boolean
  required?: boolean
  size?: RatingSize
  /** Form field name; renders a hidden input with the numeric value. */
  name?: string
  class?: HTMLAttributes['class']
}

const MAX_STARS = 100

const props = withDefaults(defineProps<RatingProps>(), { max: 5, size: 'md', precision: undefined, icon: 'star', tone: 'warning' })
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const control = useFieldControl({ invalid: () => props.invalid, disabled: () => props.disabled, required: () => props.required })

const uid = useId()
const rootEl = ref<HTMLElement | null>(null)
// A `<label for>` cannot name a role=slider div, so a surrounding Field label is wired up with aria-labelledby.
const fieldLabelId = ref<string>()
onMounted(() => {
  const id = control.id.value
  const root = rootEl.value?.getRootNode() as Document | ShadowRoot | undefined
  if (!id || !root?.querySelectorAll) return
  const label = Array.from(root.querySelectorAll<HTMLLabelElement>('label[for]')).find((l) => l.htmlFor === id)
  if (!label) return
  if (!label.id) label.id = `rating-label-${uid}`
  fieldLabelId.value = label.id
})

// The fallback name "Rating" does not say what is rated, so a real name is required (Field label, aria-label or aria-labelledby).
const attrs = useAttrs()
onMounted(async () => {
  await nextTick()
  const named = !!fieldLabelId.value || !!String(attrs['aria-label'] ?? '').trim() || !!String(attrs['aria-labelledby'] ?? '').trim()
  if (!named) {
    violation('Rating', 'requires-accessible-name', 'needs an accessible name that says what is rated (it would be announced as just "Rating"). Wrap it in `Field` with a `label`, or set `aria-label` / `aria-labelledby`.')
  }
})

const count = computed(() => {
  const m = Math.floor(Number(props.max))
  return Number.isFinite(m) && m >= 1 ? Math.min(m, MAX_STARS) : 5
})
const step = computed<number>(() => normalizeRatingPrecision(props.precision) ?? (props.allowHalf ? 0.5 : 1))
const glyph = computed(() => resolveRatingGlyph(props.icon))
const tone = computed(() => normalizeRatingTone(props.tone))
const fillClasses = computed(() => ratingFillVariants({ tone: tone.value }))

function normalize(v: unknown): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  const snapped = Math.round(n / step.value) * step.value
  return Math.min(Math.max(snapped, 0), count.value)
}

const value = ref(normalize(props.modelValue))
watch(
  () => [props.modelValue, props.max, step.value],
  () => (value.value = normalize(props.modelValue)),
)

const hover = ref<number | null>(null)
const locked = computed(() => control.disabled.value || props.readonly)
const shown = computed(() => hover.value ?? value.value)
const fills = computed(() => Array.from({ length: count.value }, (_, i) => Math.min(Math.max(shown.value - i, 0), 1) * 100))

function set(next: number) {
  if (locked.value) return
  const n = normalize(next)
  if (n === value.value) return
  value.value = n
  emit('update:modelValue', n)
}

const isRtl = () => !!rootEl.value && getComputedStyle(rootEl.value).direction === 'rtl'

/**
 * Value under the pointer: the pointer position inside the icon, in reading direction, snapped up to the next step
 * (so the first half of an icon is `.5` with half steps, the first quarter `.25` with quarter steps).
 */
function fromPointer(e: MouseEvent, index: number): number {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  if (step.value >= 1 || rect.width <= 0) return index + 1
  const offset = isRtl() ? rect.width - (e.clientX - rect.left) : e.clientX - rect.left
  const slot = Math.floor(offset / rect.width / step.value) + 1
  return index + Math.min(slot * step.value, 1)
}

function onMove(e: MouseEvent, index: number) {
  if (locked.value) return
  hover.value = fromPointer(e, index)
}

function onClick(e: MouseEvent, index: number) {
  if (locked.value) return
  const v = fromPointer(e, index)
  set(props.clearable && v === value.value ? 0 : v)
}

function onKeydown(e: KeyboardEvent) {
  if (locked.value) return
  const rtl = isRtl()
  switch (e.key) {
    case rtl ? 'ArrowLeft' : 'ArrowRight':
    case 'ArrowUp':
      e.preventDefault()
      return set(value.value + step.value)
    case rtl ? 'ArrowRight' : 'ArrowLeft':
    case 'ArrowDown':
      e.preventDefault()
      return set(value.value - step.value)
    case 'PageUp':
      e.preventDefault()
      return set(value.value + 1)
    case 'PageDown':
      e.preventDefault()
      return set(value.value - 1)
    case 'Home':
      e.preventDefault()
      return set(0)
    case 'End':
      e.preventDefault()
      return set(count.value)
  }
}

const classes = computed(() => cn(ratingVariants({ size: normalizeRatingSize(props.size) }), props.class))
</script>

<template>
  <div
    ref="rootEl"
    data-slot="rating"
    role="slider"
    :id="control.id.value"
    :tabindex="control.disabled.value ? -1 : 0"
    aria-orientation="horizontal"
    aria-valuemin="0"
    :aria-valuemax="count"
    :aria-valuenow="value"
    :aria-valuetext="`${value} out of ${count}`"
    :aria-readonly="readonly ? 'true' : undefined"
    :aria-disabled="control.disabled.value ? 'true' : undefined"
    :aria-label="fieldLabelId ? undefined : 'Rating'"
    :aria-labelledby="fieldLabelId"
    :aria-invalid="control.invalid.value ? 'true' : undefined"
    :aria-describedby="control.describedBy.value"
    :data-tone="tone !== 'warning' ? tone : undefined"
    :data-readonly="readonly ? '' : undefined"
    :data-disabled="control.disabled.value ? '' : undefined"
    :class="classes"
    @keydown="onKeydown"
    @mouseleave="hover = null"
  >
    <span
      v-for="(fill, i) in fills"
      :key="i"
      data-slot="rating-star"
      :data-fill="fill"
      :class="cn('inline-flex items-center justify-center p-1 pointer-coarse:min-h-11 pointer-coarse:min-w-11', !locked && 'cursor-pointer')"
      @mousemove="onMove($event, i)"
      @click="onClick($event, i)"
    >
      <span class="relative inline-flex">
        <svg :viewBox="glyph.viewBox" aria-hidden="true" class="shrink-0 fill-none stroke-muted-foreground" :stroke-width="glyph.stroke" stroke-linejoin="round">
          <path v-for="(d, k) in glyph.paths" :key="k" :d="d" />
        </svg>
        <span v-if="fill > 0" class="pointer-events-none absolute inset-y-0 start-0 overflow-hidden" :style="{ width: `${fill}%` }">
          <svg :viewBox="glyph.viewBox" aria-hidden="true" :class="fillClasses" :stroke-width="glyph.stroke" stroke-linejoin="round">
            <path v-for="(d, k) in glyph.paths" :key="k" :d="d" />
          </svg>
        </span>
      </span>
    </span>
    <input v-if="name" type="hidden" :name="name" :value="value" />
  </div>
</template>
