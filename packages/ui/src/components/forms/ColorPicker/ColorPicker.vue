<script setup lang="ts">
import { computed, onMounted, ref, useId, watch, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import { fieldSurface, touchTarget } from '../../../lib/styles'
import { useFieldControl } from '../Field/useFieldContext'
import { COLOR_PICKER_SWATCHES, normalizeColorPickerHex } from './color'
import {
  colorPickerFieldVariants,
  colorPickerSwatchListVariants,
  colorPickerSwatchVariants,
  colorPickerVariants,
  normalizeColorPickerLayout,
  normalizeColorPickerShape,
  normalizeColorPickerSize,
  type ColorPickerLayout,
  type ColorPickerShape,
  type ColorPickerSize,
} from './variants'

export interface ColorPickerProps {
  /** Hex colour (`#rgb`, `#rrggbb`, `#rrggbbaa`), or `null` for none. Invalid strings render as none. */
  modelValue?: string | null
  /** Palette of hex colours. Invalid entries are dropped and duplicates collapsed. */
  swatches?: string[]
  /** Show the hex text input next to the preview. */
  showInput?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  /** Marks the field invalid (aria-invalid on the hex input). Typing an unparsable hex also marks it invalid. */
  invalid?: boolean
  /** Swatch and input size. */
  size?: ColorPickerSize
  /** Swatch outline: `rounded` (default), `square` or `circle`. Applies to the swatches and the preview chip. */
  shape?: ColorPickerShape
  /** `stacked` (default) puts the hex field under the swatches, `inline` puts both on one row, `compact` is a denser row with a narrow field. */
  layout?: ColorPickerLayout
  /** Form field name for the hex input. */
  name?: string
  placeholder?: string
  /** Accessible label of the swatch group. */
  swatchesLabel?: string
  /** Accessible label of the hex input. */
  inputLabel?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<ColorPickerProps>(), {
  swatches: () => [...COLOR_PICKER_SWATCHES],
  showInput: true,
  size: 'md',
  shape: 'rounded',
  layout: 'stacked',
  placeholder: '#000000',
  swatchesLabel: 'Colour swatches',
  inputLabel: 'Hex colour',
})
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

const errorId = `color-picker-error-${useId()}`
const inputEl = ref<HTMLInputElement | null>(null)
// A surrounding Field label names the input; an own aria-label would replace it (WCAG 2.5.3).
const hasFieldLabel = ref(false)
onMounted(() => {
  hasFieldLabel.value = (inputEl.value?.labels?.length ?? 0) > 0
})
const swatchesEl = ref<HTMLElement | null>(null)
useRequireAccessibleName('ColorPicker', () => inputEl.value, 'The hex input has no name: leave `inputLabel` unset for the default or give it a non-empty string, or wrap the picker in `Field` with a `label`.')
useRequireAccessibleName('ColorPicker', () => swatchesEl.value, 'The swatch group has no name: leave `swatchesLabel` unset for the default or give it a non-empty string.')
const control = useFieldControl({ invalid: () => props.invalid, disabled: () => props.disabled, required: () => props.required })

const value = ref<string | null>(normalizeColorPickerHex(props.modelValue))
const draft = ref(value.value ?? '')
const draftInvalid = ref(false)
watch(
  () => props.modelValue,
  (v) => {
    value.value = normalizeColorPickerHex(v)
    draft.value = value.value ?? ''
    draftInvalid.value = false
  },
)

const palette = computed(() => {
  const list = Array.isArray(props.swatches) ? props.swatches : []
  return [...new Set(list.map(normalizeColorPickerHex).filter((c): c is string => c !== null))]
})

const locked = computed(() => control.disabled.value || props.readonly)

function commit(next: string | null) {
  if (locked.value || next === value.value) return
  value.value = next
  emit('update:modelValue', next)
}

function pick(color: string) {
  commit(color)
  draft.value = value.value ?? ''
  draftInvalid.value = false
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  if (locked.value) {
    el.value = draft.value
    return
  }
  draft.value = el.value
  if (el.value.trim() === '') {
    draftInvalid.value = false
    return commit(null)
  }
  const hex = normalizeColorPickerHex(el.value)
  draftInvalid.value = hex === null
  if (hex !== null) commit(hex)
}

function onBlur() {
  draft.value = value.value ?? ''
  draftInvalid.value = false
}

const checkedIndex = computed(() => palette.value.indexOf(value.value ?? ''))
function tabbable(i: number): boolean {
  return checkedIndex.value === -1 ? i === 0 : i === checkedIndex.value
}

function onSwatchKeydown(e: KeyboardEvent, i: number) {
  const n = palette.value.length
  const rtl = getComputedStyle(e.currentTarget as HTMLElement).direction === 'rtl'
  const next = rtl ? 'ArrowLeft' : 'ArrowRight'
  const prev = rtl ? 'ArrowRight' : 'ArrowLeft'
  let to = -1
  if (e.key === next || e.key === 'ArrowDown') to = (i + 1) % n
  else if (e.key === prev || e.key === 'ArrowUp') to = (i - 1 + n) % n
  else if (e.key === 'Home') to = 0
  else if (e.key === 'End') to = n - 1
  else return
  e.preventDefault()
  const buttons = (e.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role=radio]')
  buttons?.[to]?.focus()
  pick(palette.value[to])
}

const isInvalid = computed(() => control.invalid.value || draftInvalid.value)
const describedBy = computed(() => [control.describedBy.value, draftInvalid.value ? errorId : ''].filter(Boolean).join(' ') || undefined)
const size = computed(() => normalizeColorPickerSize(props.size))
const shape = computed(() => normalizeColorPickerShape(props.shape))
const layout = computed(() => normalizeColorPickerLayout(props.layout))
const classes = computed(() => cn(colorPickerVariants({ size: size.value, layout: layout.value }), props.class))
const swatchClasses = computed(() => colorPickerSwatchVariants({ size: size.value, shape: shape.value }))
const swatchListClasses = computed(() => colorPickerSwatchListVariants({ layout: layout.value }))
const fieldClasses = computed(() => colorPickerFieldVariants({ layout: layout.value }))
</script>

<template>
  <div data-slot="color-picker" :class="classes">
    <div
      v-if="palette.length"
      ref="swatchesEl"
      data-slot="color-picker-swatches"
      role="radiogroup"
      :aria-label="swatchesLabel"
      :aria-disabled="control.disabled.value ? 'true' : undefined"
      :aria-readonly="readonly ? 'true' : undefined"
      :class="swatchListClasses"
    >
      <button
        v-for="(color, i) in palette"
        :key="color"
        data-slot="color-picker-swatch"
        type="button"
        role="radio"
        :aria-checked="color === value"
        :aria-label="color"
        :tabindex="tabbable(i) ? 0 : -1"
        :disabled="control.disabled.value"
        :class="swatchClasses"
        :style="{ backgroundColor: color }"
        @click="pick(color)"
        @keydown="onSwatchKeydown($event, i)"
      />
    </div>
    <div v-if="showInput" data-slot="color-picker-field" :class="fieldClasses">
      <div class="flex items-center gap-2">
        <span
          data-slot="color-picker-preview"
          aria-hidden="true"
          :data-empty="value ? undefined : ''"
          :class="cn(swatchClasses, 'pointer-coarse:min-h-0 pointer-coarse:min-w-0 data-empty:bg-muted')"
          :style="value ? { backgroundColor: value } : undefined"
        />
        <input
          ref="inputEl"
          data-slot="color-picker-input"
          type="text"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          inputmode="text"
          :id="control.id.value"
          :name="name"
          :value="draft"
          :placeholder="placeholder"
          :disabled="control.disabled.value"
          :readonly="readonly"
          :required="control.required.value || undefined"
          :aria-label="hasFieldLabel ? undefined : inputLabel"
          :aria-invalid="isInvalid ? 'true' : undefined"
          :aria-describedby="describedBy"
          :class="cn(fieldSurface, touchTarget, 'h-9 py-1 font-mono text-md tabular-nums md:text-base', size === 'sm' && 'h-8 md:text-sm', size === 'lg' && 'h-11')"
          @input="onInput"
          @blur="onBlur"
        />
      </div>
      <p :id="errorId" data-slot="color-picker-error" role="status" class="text-xs text-destructive">
        <span v-if="draftInvalid" class="block pt-1">Not a valid hex colour. Use #rgb, #rrggbb or #rrggbbaa.</span>
      </p>
    </div>
  </div>
</template>
