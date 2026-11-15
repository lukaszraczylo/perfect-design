<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch, type HTMLAttributes } from 'vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { useFieldControl } from '../Field/useFieldContext'
import {
  normalizeSliderOrientation,
  normalizeSliderSize,
  normalizeSliderTone,
  sliderBubbleVariants,
  sliderMarkVariants,
  sliderMarksVariants,
  sliderRangeVariants,
  sliderThumbVariants,
  sliderTrackVariants,
  sliderVariants,
  type SliderSize,
  type SliderTone,
} from './variants'

/** One tick mark: a value on the scale with an optional visible label. */
export interface SliderMark {
  value: number
  label?: string
}

export interface SliderProps {
  /** Values, one per thumb. Always an array (`[40]` for a single thumb, `[20, 80]` for a range). */
  modelValue?: number[] | null
  /** Initial values when uncontrolled. */
  defaultValue?: number[]
  min?: number
  max?: number
  step?: number
  orientation?: 'horizontal' | 'vertical'
  /** Track thickness (and thumb size for `lg`). The thumb is at least 24px in every size. */
  size?: SliderSize
  /** Colour of the filled range and the thumb border. `invalid` always wins and uses the destructive colour. */
  tone?: SliderTone
  /**
   * Tick marks under (or beside, when vertical) the track. `true` marks every step (at most 50 intervals, else only the ends);
   * an array of numbers marks those values; an array of `{ value, label }` also prints the label. Marks are decorative.
   */
  marks?: boolean | number[] | SliderMark[]
  /** Show the current value in a bubble above (or beside, when vertical) every thumb. */
  showValue?: boolean
  /** Formats the value shown by `showValue` and used as `aria-valuetext`, e.g. `(v) => v + '%'`. */
  formatValue?: (value: number) => string
  disabled?: boolean
  /** Marks the slider invalid (aria-invalid on thumbs, destructive styling). */
  invalid?: boolean
  required?: boolean
  /** Flip the direction (max at the start edge). */
  inverted?: boolean
  /**
   * Reading direction. In `rtl` the minimum is at the right edge, thumbs, fill, marks and the value bubble mirror,
   * and ArrowLeft moves the thumb towards the maximum. Unset follows the nearest ancestor's `dir` (or the document's) after mount.
   * Set it explicitly in server-rendered pages, where the first paint cannot know the ancestor direction. Unknown values are ignored.
   */
  dir?: 'ltr' | 'rtl'
  /** Minimum distance between thumbs, in steps. */
  minStepsBetweenThumbs?: number
  /** Form field name; renders a hidden input in a native form. */
  name?: string
  /** Accessible name applied to every thumb. With several thumbs the index is appended (`Price 1 of 2`). */
  ariaLabel?: string
  /** One accessible label per thumb (wins over `ariaLabel`), e.g. `['Minimum price', 'Maximum price']`. */
  thumbLabels?: string[]
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<SliderProps>(), {
  min: 0,
  max: 100,
  step: 1,
  orientation: 'horizontal',
  size: 'md',
  tone: 'primary',
  marks: false,
  showValue: false,
  formatValue: undefined,
  minStepsBetweenThumbs: 0,
})
const emit = defineEmits<{
  'update:modelValue': [value: number[]]
  /** Fires when a drag or key press finishes, with the final values. */
  valueCommit: [value: number[]]
}>()

const control = useFieldControl({ invalid: () => props.invalid, disabled: () => props.disabled, required: () => props.required })

const uid = useId()
const rootRef = ref<{ $el: HTMLElement } | null>(null)

// Reka positions thumbs from the left unless it is given a direction (it also writes `dir` on its root, so an
// unset direction would pin every slider to ltr on a right-to-left page). The ancestor lookup runs after mount: the
// first client render must equal the server render.
const explicitDir = computed(() => (props.dir === 'rtl' || props.dir === 'ltr' ? props.dir : undefined))
const detectedDir = ref<'ltr' | 'rtl'>()
const dir = computed<'ltr' | 'rtl'>(() => explicitDir.value ?? detectedDir.value ?? 'ltr')
let dirObserver: MutationObserver | undefined
function readAncestorDir() {
  const parent = rootRef.value?.$el?.parentElement
  if (!parent) return
  detectedDir.value = getComputedStyle(parent).direction === 'rtl' ? 'rtl' : 'ltr'
}
onMounted(() => {
  readAncestorDir()
  const parent = rootRef.value?.$el?.parentElement
  if (!parent || typeof MutationObserver === 'undefined') return
  // A page can switch language at runtime: watch the nearest ancestor that carries `dir` and the document element.
  dirObserver = new MutationObserver(readAncestorDir)
  const holder = parent.closest('[dir]')
  for (const el of new Set([holder, parent.ownerDocument.documentElement])) if (el) dirObserver.observe(el, { attributes: true, attributeFilter: ['dir', 'style', 'class'] })
})
onBeforeUnmount(() => dirObserver?.disconnect())
// `<label for>` cannot name a role=slider span, so a surrounding Field label is wired up with aria-labelledby.
const fieldLabelId = ref<string>()
onMounted(() => {
  const id = control.id.value
  const root = rootRef.value?.$el?.getRootNode() as Document | ShadowRoot | undefined
  if (!id || !root?.querySelectorAll) return
  const label = Array.from(root.querySelectorAll<HTMLLabelElement>('label[for]')).find((l) => l.htmlFor === id)
  if (!label) return
  if (!label.id) label.id = `slider-label-${uid}`
  fieldLabelId.value = label.id
})

// The value is always an array of numbers; anything else is ignored here and reported once mounted.
const isNumbers = (v: unknown): v is number[] => Array.isArray(v) && v.every((n) => typeof n === 'number')
const model = ref<number[]>([...(isNumbers(props.modelValue) ? props.modelValue : isNumbers(props.defaultValue) ? props.defaultValue : [props.min])])
watch(
  () => props.modelValue,
  (v) => {
    if (isNumbers(v)) model.value = [...v]
  },
)

function onUpdate(v: number[] | undefined) {
  const next = [...(v ?? [])]
  model.value = next
  emit('update:modelValue', next)
}

function labelFor(i: number): string | undefined {
  const explicit = props.thumbLabels?.[i]
  if (explicit) return explicit
  if (!props.ariaLabel) return undefined
  return model.value.length > 1 ? `${props.ariaLabel} ${i + 1} of ${model.value.length}` : props.ariaLabel
}

/** Field label name for thumbs without their own label; several thumbs append reka's own "Minimum"/"Maximum". */
const namedByField = (i: number) => !!fieldLabelId.value && !labelFor(i)

// Registered after the Field-label lookup above, so `fieldLabelId` is already set when this runs.
onMounted(() => {
  for (const [prop, v] of [['modelValue', props.modelValue], ['defaultValue', props.defaultValue]] as const) {
    if (v != null && !isNumbers(v)) {
      violation('Slider', 'requires-number-array', `requires \`${prop}\` to be an array of numbers (\`[40]\` for one thumb, \`[20, 80]\` for a range). Use \`ref([40])\`, not \`ref(40)\`.`)
      return
    }
  }
  if (model.value.some((_, i) => !labelFor(i) && !fieldLabelId.value)) {
    violation('Slider', 'requires-accessible-name', 'needs an accessible name on every thumb. Set `aria-label` (or `thumb-labels` for a range), or wrap it in `Field` with a `label`.')
  }
})
function thumbId(i: number): string | undefined {
  if (i === 0) return control.id.value
  return namedByField(i) ? `${uid}-thumb-${i}` : undefined
}
function labelledBy(i: number): string | undefined {
  if (!namedByField(i)) return undefined
  return model.value.length > 1 ? `${fieldLabelId.value} ${thumbId(i) ?? `${uid}-thumb-${i}`}` : fieldLabelId.value
}

const orientation = computed(() => normalizeSliderOrientation(props.orientation))
const vertical = computed(() => orientation.value === 'vertical')
const size = computed(() => normalizeSliderSize(props.size))
// An invalid slider is always destructive: the colour cue comes with aria-invalid, and never from the tone alone.
const tone = computed(() => (control.invalid.value ? 'danger' : normalizeSliderTone(props.tone)))

const MAX_AUTO_MARKS = 50
const round = (n: number) => Math.round(n * 1e9) / 1e9
const markList = computed<SliderMark[]>(() => {
  const { min, max, step, marks } = props
  if (!marks || !(max > min)) return []
  let raw: (number | SliderMark)[]
  if (marks === true) {
    const intervals = Math.round((max - min) / step)
    raw = Number.isFinite(intervals) && intervals >= 1 && intervals <= MAX_AUTO_MARKS ? Array.from({ length: intervals + 1 }, (_, i) => round(min + i * step)) : [min, max]
  } else raw = Array.isArray(marks) ? marks : []
  const seen = new Set<number>()
  const out: SliderMark[] = []
  for (const m of raw) {
    const value = typeof m === 'number' ? m : m?.value
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || seen.has(value)) continue
    seen.add(value)
    out.push({ value, label: typeof m === 'object' && typeof m.label === 'string' && m.label.trim() !== '' ? m.label : undefined })
  }
  return out
})
// Marks sit where reka puts the thumb. Horizontally reka measures from the left edge in ltr and from the right edge in rtl,
// and `inverted` flips that; vertically it measures from the bottom (the top when inverted).
const fromLeft = computed(() => (dir.value === 'ltr') !== !!props.inverted)
const markStyle = (value: number) => {
  const p = ((value - props.min) / (props.max - props.min)) * 100
  if (vertical.value) return { bottom: `${round(props.inverted ? 100 - p : p)}%` }
  return { left: `${round(fromLeft.value ? p : 100 - p)}%` }
}

const display = (value: number) => (props.formatValue ? String(props.formatValue(value)) : String(value))
/** A thumb sitting exactly on a labelled mark is announced by that label ("Medium"); otherwise the number is announced. */
function valueText(value: number): string | undefined {
  const label = markList.value.find((m) => m.value === value)?.label
  if (label) return label
  return props.formatValue ? display(value) : undefined
}

const rootClasses = computed(() => cn(sliderVariants({ orientation: orientation.value, bubble: props.showValue, marks: markList.value.length > 0 }), props.class))
const trackClasses = computed(() => sliderTrackVariants({ orientation: orientation.value, size: size.value }))
const rangeClasses = computed(() => sliderRangeVariants({ orientation: orientation.value, tone: tone.value }))
const thumbClasses = computed(() => sliderThumbVariants({ size: size.value, tone: tone.value }))
const marksClasses = computed(() => sliderMarksVariants({ orientation: orientation.value }))
const markClasses = computed(() => sliderMarkVariants({ orientation: orientation.value }))
const bubbleClasses = computed(() => sliderBubbleVariants({ orientation: orientation.value }))
</script>

<template>
  <SliderRoot
    ref="rootRef"
    data-slot="slider"
    :model-value="model"
    :min="min"
    :max="max"
    :step="step"
    :orientation="orientation"
    :data-size="size !== 'md' ? size : undefined"
    :data-tone="tone !== 'primary' ? tone : undefined"
    :disabled="control.disabled.value"
    :inverted="inverted"
    :dir="explicitDir ?? detectedDir"
    :min-steps-between-thumbs="minStepsBetweenThumbs"
    :name="name"
    :required="control.required.value || undefined"
    :data-invalid="control.invalid.value ? '' : undefined"
    :class="rootClasses"
    @update:model-value="onUpdate"
    @value-commit="emit('valueCommit', $event)"
  >
    <SliderTrack data-slot="slider-track" :class="trackClasses">
      <SliderRange data-slot="slider-range" :class="rangeClasses" />
    </SliderTrack>
    <SliderThumb
      v-for="(_, i) in model"
      :key="i"
      data-slot="slider-thumb"
      :id="thumbId(i)"
      :aria-label="labelFor(i)"
      :aria-labelledby="labelledBy(i)"
      :aria-invalid="control.invalid.value ? 'true' : undefined"
      :aria-describedby="control.describedBy.value"
      :aria-valuetext="valueText(model[i])"
      :class="thumbClasses"
    >
      <span v-if="showValue" data-slot="slider-value" aria-hidden="true" :class="bubbleClasses">{{ display(model[i]) }}</span>
    </SliderThumb>
    <div v-if="markList.length" data-slot="slider-marks" aria-hidden="true" :class="marksClasses">
      <span v-for="m in markList" :key="m.value" data-slot="slider-mark" :class="markClasses" :style="markStyle(m.value)">
        <span :class="vertical ? 'block h-px w-1.5 bg-muted-foreground' : 'block h-1.5 w-px bg-muted-foreground'" />
        <span v-if="m.label" data-slot="slider-mark-label" class="text-xs leading-4 whitespace-nowrap tabular-nums">{{ m.label }}</span>
      </span>
    </div>
  </SliderRoot>
</template>
