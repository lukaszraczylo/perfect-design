<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, useId, watch, type HTMLAttributes } from 'vue'
import { PinInputInput, PinInputRoot } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { requireText, useRequireAccessibleName } from '../../../lib/contract'
import { useFieldControl } from '../Field/useFieldContext'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { pinInputCellVariants } from './variants'

export interface PinInputProps {
  /** The code as ONE string, e.g. `'123'` while typing a 6-digit code. */
  modelValue?: string | null
  /** Number of cells. */
  length?: number
  /** `number` restricts input to digits and shows a numeric keypad. */
  type?: 'text' | 'number'
  /** Hide characters (password-style). */
  mask?: boolean
  /** One-time-code mode: autocomplete="one-time-code" and cells must be filled in order. */
  otp?: boolean
  disabled?: boolean
  required?: boolean
  /** Marks every cell invalid (aria-invalid, destructive styling). */
  invalid?: boolean
  /** Placeholder shown in each empty cell (e.g. `○`). */
  placeholder?: string
  /** Form field name; a hidden input carries the joined code. */
  name?: string
  /** Accessible name prefix of each cell: `Digit 1 of 6`. Defaults to `Digit` (number) or `Character` (text). */
  cellLabel?: string
  /** Cell size: `xs`, `sm`, `md` (default, 40px) or `lg`. */
  size?: FieldSize
  /** Surface of every cell: `outline` (default), `filled`, `underline` or `ghost`. */
  variant?: FieldVariant
  /** Corner shape of every cell: `rounded` (default), `pill` (circular cells) or `square`. */
  shape?: FieldShape
  /** Validation status of the whole code, shown with one icon after the last cell as well as colour. `error` also sets `aria-invalid` on every cell. */
  status?: FieldStatus
  /** Extra classes for every cell (the `class` prop styles the root). */
  cellClass?: HTMLAttributes['class']
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<PinInputProps>(), { length: 6, type: 'text', size: 'md', variant: 'outline', shape: 'rounded', status: 'default' })
const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** Fires with the full joined code once every cell is filled. */
  complete: [value: string]
}>()

const fieldStatus = computed(() => normalizeStatus(props.status))
const control = useFieldControl({ invalid: () => props.invalid || fieldStatus.value === 'error', disabled: () => props.disabled, required: () => props.required })

const uid = useId()
const rootRef = ref<{ $el: HTMLElement } | null>(null)
// The Field `<label for>` points at a hidden input, so it does not name the group: use aria-labelledby.
const fieldLabelId = ref<string>()
onMounted(() => {
  const id = control.id.value
  const root = rootRef.value?.$el?.getRootNode() as Document | ShadowRoot | undefined
  if (!id || !root?.querySelectorAll) return
  const label = Array.from(root.querySelectorAll<HTMLLabelElement>('label[for]')).find((l) => l.htmlFor === id)
  if (!label) return
  if (!label.id) label.id = `pin-input-label-${uid}`
  fieldLabelId.value = label.id
})

// Registered after the hook above: the Field label id must be set before the name is checked.
useRequireAccessibleName('PinInput', () => rootRef.value?.$el, 'Wrap it in `Field` with a `label`, or set `aria-label` / `aria-labelledby` on it. The cells are named, the group is not.')
onMounted(() => {
  if (props.cellLabel !== undefined) requireText('PinInput', 'cellLabel', props.cellLabel, 'It prefixes the name of every cell; leave it unset for the default.')
})

type Cell = string | number | undefined

const count = computed(() => Math.max(1, Math.floor(props.length) || 1))

/** String -> per-cell array. Digits only in number mode; extra characters are dropped. */
function toCells(value: string | null | undefined): Cell[] {
  const chars = Array.from(value ?? '')
  if (props.type === 'number') return chars.filter((c) => /^\d$/.test(c)).slice(0, count.value).map(Number)
  return chars.slice(0, count.value)
}

const join = (cells: Cell[]) => cells.map((c) => c ?? '').join('')

// Cells are kept as an array internally so a gap (an empty cell in the middle) keeps its position;
// the public v-model is the joined string.
const cells = ref<Cell[]>(toCells(props.modelValue))
watch(
  () => props.modelValue,
  (v) => {
    if ((v ?? '') !== join(cells.value)) cells.value = toCells(v)
  },
)

const filled = (c: Cell) => c !== undefined && c !== ''

function onUpdate(v: unknown) {
  const next = (Array.isArray(v) ? (v as Cell[]) : []).slice(0, count.value)
  cells.value = next
  const joined = join(next)
  emit('update:modelValue', joined)
  if (Array.from({ length: count.value }, (_, i) => next[i]).every(filled)) emit('complete', joined)
}

const label = computed(() => props.cellLabel ?? (props.type === 'number' ? 'Digit' : 'Character'))

const cellClasses = computed(() =>
  cn(
    // Cells shrink on narrow screens (min-w-0) instead of overflowing; 44px on coarse pointers.
    pinInputCellVariants({ size: normalizeFieldSize(props.size), variant: normalizeVariant(props.variant), shape: normalizeShape(props.shape), status: fieldStatus.value }),
    props.cellClass,
  ),
)

const attrs = useAttrs()
const statusId = `pin-input-status-${uid}`
// Field description, author `aria-describedby` and the hidden success / warning text.
const describedBy = computed(
  () => [attrs['aria-describedby'], control.describedBy.value, fieldStatus.value === 'success' || fieldStatus.value === 'warning' ? statusId : undefined].filter(Boolean).join(' ') || undefined,
)
</script>

<template>
  <PinInputRoot
    ref="rootRef"
    data-slot="pin-input"
    role="group"
    :model-value="cells as never"
    :type="type"
    :mask="mask"
    :otp="otp"
    :placeholder="placeholder"
    :disabled="control.disabled.value"
    :required="control.required.value || undefined"
    :name="name"
    :id="control.id.value"
    :data-invalid="control.invalid.value ? '' : undefined"
    :aria-labelledby="fieldLabelId"
    :class="cn('inline-flex max-w-full items-center gap-2', props.class)"
    v-bind="$attrs"
    :aria-describedby="describedBy"
    @update:model-value="onUpdate"
  >
    <PinInputInput
      v-for="(_, i) in count"
      :key="i"
      :index="i"
      data-slot="pin-input-cell"
      :aria-label="`${label} ${i + 1} of ${count}`"
      :autocomplete="otp && i === 0 ? 'one-time-code' : 'off'"
      :aria-invalid="control.invalid.value ? 'true' : undefined"
      :class="cellClasses"
    />
    <FieldStatusIcon :status="fieldStatus" :id="statusId" class="relative end-auto top-auto shrink-0 translate-y-0" />
  </PinInputRoot>
</template>
