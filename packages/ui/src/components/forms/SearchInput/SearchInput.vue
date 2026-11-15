<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch, type HTMLAttributes } from 'vue'
import { useDebounceFn } from '../../../lib/use-helpers'
import { faMagnifyingGlass, faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { requireText, useRequireAccessibleName } from '../../../lib/contract'
import Icon from '../../primitives/Icon/Icon.vue'
import { useFieldControl } from '../Field/useFieldContext'
import { useNativeValidation } from '../Field/useNativeValidation'
import { fieldAddonButton } from '../Field/field-styles'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { searchInputVariants } from './variants'

export interface SearchInputProps {
  modelValue?: string | null
  /** Delay in ms before `search` fires after typing. `0` (default) fires immediately. Enter always fires immediately. */
  debounce?: number
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  /** Marks the field invalid (aria-invalid) and applies destructive styling. */
  invalid?: boolean
  /** Surface treatment of the input. */
  variant?: FieldVariant
  /** Height and text size. `xs` is 28px tall. */
  size?: FieldSize
  /** Corner shape. */
  shape?: FieldShape
  /** Status colour plus an icon left of the clear button (and screen reader text for `success` and `warning`). `error` also sets `aria-invalid`. */
  status?: FieldStatus
  /** Text of the visually hidden status message. Defaults to the English text. */
  statusLabel?: string
  /** Accessible name of the clear button. */
  clearLabel?: string
  /** Give the wrapper `role="search"` (landmark). Use once per page region, around a real search. */
  landmark?: boolean
  /** Accessible name of the search landmark (only used with `landmark`). Make it unique when a page has several. */
  landmarkLabel?: string
  /** Classes for the inner <input> (the `class` prop styles the wrapper). */
  inputClass?: HTMLAttributes['class']
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<SearchInputProps>(), { debounce: 0, variant: 'outline', size: 'md', shape: 'rounded', status: 'default', clearLabel: 'Clear search', landmarkLabel: 'Search' })
const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
  clear: []
}>()

const status = computed(() => normalizeStatus(props.status))
const attrs = useAttrs()
const statusId = `search-input-${useId()}-status`
const control = useFieldControl({ invalid: () => props.invalid || status.value === 'error', disabled: () => props.disabled, required: () => props.required })

const model = ref(props.modelValue ?? '')
watch(
  () => props.modelValue,
  (v) => {
    model.value = v ?? ''
  },
)

const inputEl = ref<HTMLInputElement | null>(null)
useNativeValidation(inputEl)
useRequireAccessibleName('SearchInput', () => inputEl.value, 'Wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`.')
onMounted(() => {
  requireText('SearchInput', 'clearLabel', props.clearLabel, 'It names the clear button; leave it unset for the default.')
  if (props.landmark) requireText('SearchInput', 'landmarkLabel', props.landmarkLabel, 'It names the `role="search"` landmark; leave it unset for the default.')
})
const debouncedSearch = useDebounceFn((value: string) => emit('search', value), () => Math.max(0, Number(props.debounce) || 0))
onBeforeUnmount(() => debouncedSearch.cancel())

const inactive = computed(() => control.disabled.value || props.readonly)
const showClear = computed(() => model.value !== '' && !inactive.value)

const variant = computed(() => normalizeVariant(props.variant))
const shape = computed(() => normalizeShape(props.shape))
const inputClasses = computed(() =>
  cn(
    searchInputVariants({ size: normalizeFieldSize(props.size), variant: variant.value, shape: shape.value, status: status.value }),
    // The status icon sits left of the clear button.
    status.value !== 'default' && 'pe-16 pointer-coarse:pe-20',
    props.inputClass,
  ),
)
/** The search icon follows the start padding: flush for underline, further in for pill. */
const iconClass = computed(() => cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground', variant.value === 'underline' ? 'start-0' : shape.value === 'pill' ? 'start-4' : 'start-3'))
/** The caller's attributes win, except that the status id is appended to `aria-describedby`. */
function inputAttrs() {
  const base = (attrs['aria-describedby'] as string | undefined) ?? control.describedBy.value
  const describedBy = [base, status.value === 'success' || status.value === 'warning' ? statusId : ''].filter(Boolean).join(' ') || undefined
  return { ...attrs, 'aria-describedby': describedBy }
}

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  model.value = v
  emit('update:modelValue', v)
  void debouncedSearch(v)
}

function submit() {
  debouncedSearch.cancel()
  emit('search', model.value)
}

function clear() {
  if (inactive.value || model.value === '') return
  debouncedSearch.cancel()
  model.value = ''
  emit('update:modelValue', '')
  emit('clear')
  emit('search', '')
  inputEl.value?.focus()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (inactive.value || model.value === '') return
    // Clearing consumes Esc so surrounding dialogs/popovers stay open.
    e.preventDefault()
    e.stopPropagation()
    clear()
  } else if (e.key === 'Enter' && !e.isComposing) {
    submit()
  }
}

defineExpose({ el: inputEl, clear, focus: () => inputEl.value?.focus() })
</script>

<template>
  <div
    data-slot="search-input"
    :role="landmark ? 'search' : undefined"
    :aria-label="landmark ? landmarkLabel : undefined"
    :class="cn('relative w-full', props.class)"
  >
    <Icon
      data-slot="search-input-icon"
      :icon="faMagnifyingGlass"
      :class="iconClass"
    />
    <input
      ref="inputEl"
      data-slot="search-input-field"
      type="search"
      enterkeyhint="search"
      autocapitalize="none"
      autocorrect="off"
      spellcheck="false"
      :id="control.id.value"
      :value="model"
      :disabled="control.disabled.value"
      :readonly="readonly"
      :required="control.required.value || undefined"
      :aria-invalid="control.ariaInvalid.value"
      :class="inputClasses"
      v-bind="inputAttrs()"
      @input="onInput"
      @keydown="onKeydown"
    />
    <FieldStatusIcon :status="status" :id="statusId" :label="statusLabel" class="end-9 pointer-coarse:end-12" />
    <button
      v-if="showClear"
      type="button"
      data-slot="search-input-clear"
      :aria-label="clearLabel"
      :class="fieldAddonButton"
      @click="clear"
    >
      <Icon :icon="faXmark" size="sm" />
    </button>
  </div>
</template>
