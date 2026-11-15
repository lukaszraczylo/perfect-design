<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, watch, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import { faPlus } from '../../../lib/icons'
import Button from '../../primitives/Button/Button.vue'
import Popover from '../../overlays/Popover/Popover.vue'
import PopoverClose from '../../overlays/Popover/PopoverClose.vue'
import PopoverContent from '../../overlays/Popover/PopoverContent.vue'
import PopoverTrigger from '../../overlays/Popover/PopoverTrigger.vue'
import Checkbox from '../Checkbox/Checkbox.vue'
import { checkOptionValues } from '../CheckboxCard/contract-helpers'
import { useControllable } from '../CheckboxCard/use-controllable'
import DateInput from '../DateInput/DateInput.vue'
import Field from '../Field/Field.vue'
import Input from '../Input/Input.vue'
import NativeSelect from '../NativeSelect/NativeSelect.vue'
import NumberInput from '../NumberInput/NumberInput.vue'
import { useAnnouncer } from '../TimeInput/announce'
import FilterChip from './FilterChip.vue'
import { cleanFields, cleanItems, describeFilter, fill, mergeLabels, operatorLabel, operatorsFor } from './format'
import type { FilterBarLabels, FilterField, FilterItem, FilterValue } from './types'
import { filterBarListVariants, filterBarVariants, normalizeFilterSize, normalizeFilterVariant, type FilterBarSize, type FilterBarVariant } from './variants'

export interface FilterBarProps {
  /** Applied filters (v-model). Omit for uncontrolled use. */
  modelValue?: FilterItem[]
  /** Initial filters when uncontrolled. */
  defaultValue?: FilterItem[]
  /** What can be filtered: `{ id, label, type?, options?, operators?, ... }`. Required for the "Add filter" popover. */
  fields?: FilterField[]
  /** Open state of the "Add filter" popover (v-model:open). */
  open?: boolean
  /** `default` (bordered chips), `compact` (tight gaps and padding) or `inline` (flat chips with a bottom rule, link-style buttons). Unknown values fall back to `default`. */
  variant?: FilterBarVariant
  /** Text and button size: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: FilterBarSize
  /** Show "Clear all" while at least one filter is applied. */
  clearable?: boolean
  /** Most filters that can be applied. At the limit "Add filter" is disabled. Non-positive or non-numeric means unlimited. */
  max?: number
  /** Disables adding, removing and clearing. */
  disabled?: boolean
  /** Text overrides: button names, popover labels, live region sentences and operator wording. Missing keys keep the English default. */
  labels?: Partial<FilterBarLabels>
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<FilterBarProps>(), {
  modelValue: undefined,
  defaultValue: () => [],
  fields: () => [],
  open: undefined,
  variant: 'default',
  size: 'md',
  clearable: true,
  max: undefined,
  labels: undefined,
})
const emit = defineEmits<{
  'update:modelValue': [filters: FilterItem[]]
  'update:open': [open: boolean]
  /** A filter was added through the popover. */
  add: [filter: FilterItem]
  /** A filter was removed with its chip button. */
  remove: [filter: FilterItem]
  /** "Clear all" removed these filters. */
  clear: [filters: FilterItem[]]
}>()

defineSlots<{
  /** Content of a chip. */
  chip?(props: { filter: FilterItem; label: string }): unknown
}>()

const uid = useId()
const L = computed(() => mergeLabels(props.labels))
const variant = computed(() => normalizeFilterVariant(props.variant))
const size = computed(() => normalizeFilterSize(props.size))
const fieldList = computed(() => cleanFields(props.fields))

const model = useControllable<FilterItem[]>(
  () => (props.modelValue === undefined ? undefined : cleanItems(props.modelValue)),
  cleanItems(props.defaultValue),
  (v) => emit('update:modelValue', v),
)
const items = model.value
const openState = useControllable<boolean>(
  () => (props.open === undefined ? undefined : !!props.open),
  false,
  (v) => emit('update:open', v),
)
const isOpen = computed({ get: () => openState.value.value, set: (v: boolean) => openState.set(v) })

const limit = computed(() => (typeof props.max === 'number' && Number.isFinite(props.max) && props.max > 0 ? Math.floor(props.max) : undefined))
const atLimit = computed(() => limit.value !== undefined && items.value.length >= limit.value)
const canAdd = computed(() => !props.disabled && fieldList.value.length > 0 && !atLimit.value)

const text = (f: FilterItem) => describeFilter(f, fieldList.value, L.value)

// ---- contract: usable fields and filters (checked after mount, never during render)
onMounted(async () => {
  await nextTick()
  const raw = Array.isArray(props.fields) ? props.fields : []
  if (raw.length === 0) {
    violation('FilterBar', 'requires-fields', 'requires at least one entry in `fields` ({ id, label, type? }). Without it the "Add filter" popover has nothing to offer.')
    return
  }
  checkOptionValues('FilterBar', 'field `id`', raw.map((f) => f?.id))
  for (const f of raw) {
    requireText('FilterBar', `fields[].label (field "${f?.id}")`, f?.label, 'The label is shown in the Field select and on the chip.')
    if ((f?.type === 'select' || f?.type === 'multi-select') && cleanFields([f])[0]?.options?.length === 0) {
      violation('FilterBar', 'requires-options', `requires \`options\` ({ value, label }[]) on the ${f.type} field "${f.id}". Add at least one option or change its type.`)
    }
  }
  if (props.modelValue !== undefined || props.defaultValue.length) {
    const given = Array.isArray(props.modelValue) ? props.modelValue : props.defaultValue
    checkOptionValues('FilterBar', 'filter `id`', given.map((f) => f?.id))
  }
})

// ---- live region
const { message: liveText, announce } = useAnnouncer()

// ---- focus management after a chip disappears
const root = ref<HTMLElement | null>(null)
const addButton = ref<{ $el?: unknown } | null>(null)
function focusAfterRemoval(index: number) {
  void nextTick(() => {
    const buttons = root.value?.querySelectorAll<HTMLElement>('[data-slot="filter-chip-remove"]')
    const target = buttons && buttons.length ? buttons[Math.min(index, buttons.length - 1)] : (addButton.value?.$el as HTMLElement | undefined)
    target?.focus?.()
  })
}

function removeFilter(item: FilterItem) {
  if (props.disabled) return
  const index = items.value.findIndex((f) => f.id === item.id)
  if (index < 0) return
  const label = text(item)
  model.set(items.value.filter((f) => f.id !== item.id))
  emit('remove', item)
  announce(fill(L.value.removed, { filter: label }))
  focusAfterRemoval(index)
}

function clearAll() {
  if (props.disabled || items.value.length === 0) return
  const removed = items.value
  model.set([])
  emit('clear', removed)
  announce(L.value.cleared)
  focusAfterRemoval(0)
}

// ---- the "Add filter" draft
const draftField = ref('')
const draftOperator = ref('')
const draftValue = ref<string | number | null | string[]>('')
const draftError = ref(false)
const form = ref<HTMLElement | null>(null)

const currentField = computed(() => fieldList.value.find((f) => f.id === draftField.value))
const currentType = computed(() => currentField.value?.type ?? 'text')
const currentOperators = computed(() => operatorsFor(currentField.value))
const fieldOptions = computed(() => fieldList.value.map((f) => ({ value: f.id, label: f.label })))
const operatorOptions = computed(() => currentOperators.value.map((op) => ({ value: op, label: operatorLabel(op, L.value) })))
const valueOptions = computed(() => (currentField.value?.options ?? []).map((o) => ({ value: o.value, label: o.label, disabled: o.disabled })))
const booleanOptions = computed(() => [
  { value: 'true', label: L.value.yes },
  { value: 'false', label: L.value.no },
])
const showOperator = computed(() => currentType.value !== 'boolean' && currentOperators.value.length > 1)
const numberBound = (v: number | string | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const dateBound = (v: number | string | undefined) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined)

function emptyValue(type: string): string | number | null | string[] {
  if (type === 'number') return null
  if (type === 'multi-select') return []
  if (type === 'boolean') return 'true'
  return ''
}

function resetDraft(fieldId = fieldList.value[0]?.id ?? '') {
  draftField.value = fieldId
  const def = fieldList.value.find((f) => f.id === fieldId)
  draftOperator.value = operatorsFor(def)[0]
  draftValue.value = emptyValue(def?.type ?? 'text')
  draftError.value = false
}
function onFieldChange(id: string) {
  resetDraft(id)
}

watch(isOpen, (open) => {
  if (open) resetDraft()
})

function toggleOption(value: string, on: boolean | 'indeterminate') {
  const list = Array.isArray(draftValue.value) ? draftValue.value : []
  draftValue.value = on === true ? [...list.filter((v) => v !== value), value] : list.filter((v) => v !== value)
  draftError.value = false
}

/** The typed value of the draft, or `undefined` when it is empty or outside the field's bounds. */
function readDraft(): FilterValue | undefined {
  const field = currentField.value
  const v = draftValue.value
  switch (currentType.value) {
    case 'number': {
      if (typeof v !== 'number' || !Number.isFinite(v)) return undefined
      const min = numberBound(field?.min)
      const max = numberBound(field?.max)
      return (min !== undefined && v < min) || (max !== undefined && v > max) ? undefined : v
    }
    case 'select': {
      return typeof v === 'string' && valueOptions.value.some((o) => o.value === v && !o.disabled) ? v : undefined
    }
    case 'multi-select': {
      const list = Array.isArray(v) ? v.filter((x) => valueOptions.value.some((o) => o.value === x)) : []
      return list.length ? list : undefined
    }
    case 'date': {
      if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined
      const min = dateBound(field?.min)
      const max = dateBound(field?.max)
      return (min !== undefined && v < min) || (max !== undefined && v > max) ? undefined : v
    }
    case 'boolean':
      return v === 'true' ? true : v === 'false' ? false : undefined
    default:
      return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
  }
}

let counter = 0
function nextId(): string {
  let id: string
  do id = `filter-${uid}-${++counter}`
  while (items.value.some((f) => f.id === id))
  return id
}

function submit() {
  if (!canAdd.value || !currentField.value) return
  const value = readDraft()
  if (value === undefined) {
    draftError.value = true
    void nextTick(() => form.value?.querySelector<HTMLElement>('[data-slot="filter-bar-value"] :is(input, select)')?.focus())
    return
  }
  const item: FilterItem = { id: nextId(), field: currentField.value.id, operator: draftOperator.value, value }
  model.set([...items.value, item])
  emit('add', item)
  announce(fill(L.value.added, { filter: text(item) }))
  isOpen.value = false
}

const BUTTON_SIZE = { sm: 'xs', md: 'sm', lg: 'md' } as const
const BUTTON_VARIANT = { default: 'outline', compact: 'ghost', inline: 'link' } as const
const buttonClass = 'pointer-coarse:min-h-11'
const errorId = `${uid}-error`
</script>

<template>
  <div
    ref="root"
    data-slot="filter-bar"
    role="group"
    :aria-label="L.group"
    :data-variant="variant"
    :data-size="size"
    :data-disabled="disabled ? '' : undefined"
    :class="cn(filterBarVariants({ variant, size }), props.class)"
  >
    <ul v-if="items.length" data-slot="filter-bar-list" role="list" :class="filterBarListVariants({ variant })">
      <FilterChip
        v-for="item in items"
        :key="item.id"
        as="li"
        :label="text(item)"
        :variant="variant"
        :size="size"
        :disabled="disabled"
        :remove-label="fill(L.remove, { filter: text(item) })"
        :data-filter-id="item.id"
        @remove="removeFilter(item)"
      >
        <slot name="chip" :filter="item" :label="text(item)">{{ text(item) }}</slot>
      </FilterChip>
    </ul>

    <Popover v-model:open="isOpen">
      <PopoverTrigger as-child>
        <Button ref="addButton" data-slot="filter-bar-add" :variant="BUTTON_VARIANT[variant]" :size="BUTTON_SIZE[size]" :icon-start="faPlus" :disabled="!canAdd && !isOpen" :class="buttonClass">{{ L.add }}</Button>
      </PopoverTrigger>
      <PopoverContent data-slot="filter-bar-content" size="md" align="start">
        <form ref="form" data-slot="filter-bar-form" class="grid gap-3" novalidate @submit.prevent="submit">
          <Field :label="L.field" size="sm">
            <NativeSelect data-slot="filter-bar-field" :model-value="draftField" :options="fieldOptions" @update:model-value="onFieldChange" />
          </Field>
          <Field v-if="showOperator" :label="L.operator" size="sm">
            <NativeSelect v-model="draftOperator" data-slot="filter-bar-operator" :options="operatorOptions" />
          </Field>

          <fieldset v-if="currentType === 'multi-select'" data-slot="filter-bar-value" class="grid min-w-0 gap-1.5" :aria-describedby="draftError ? errorId : undefined">
            <legend class="mb-1.5 text-xs font-medium text-foreground">{{ L.value }}</legend>
            <div class="grid max-h-48 gap-1 overflow-y-auto">
              <Checkbox
                v-for="o in valueOptions"
                :key="o.value"
                :label="o.label"
                :disabled="o.disabled"
                :model-value="Array.isArray(draftValue) && draftValue.includes(o.value)"
                @update:model-value="(on: boolean | 'indeterminate') => toggleOption(o.value, on)"
              />
            </div>
            <p v-if="draftError" :id="errorId" role="alert" data-slot="filter-bar-error" class="text-xs text-destructive">{{ L.valueRequired }}</p>
          </fieldset>
          <Field v-else :label="L.value" size="sm" :error="draftError ? L.valueRequired : undefined">
            <div data-slot="filter-bar-value" class="min-w-0">
              <NumberInput
                v-if="currentType === 'number'"
                :model-value="typeof draftValue === 'number' ? draftValue : null"
                :min="numberBound(currentField?.min)"
                :max="numberBound(currentField?.max)"
                :step="numberBound(currentField?.step) ?? 1"
                @update:model-value="(v: number | null) => ((draftValue = v), (draftError = false))"
              />
              <DateInput
                v-else-if="currentType === 'date'"
                :model-value="typeof draftValue === 'string' ? draftValue : ''"
                :min="dateBound(currentField?.min)"
                :max="dateBound(currentField?.max)"
                @update:model-value="(v: string) => ((draftValue = v), (draftError = false))"
              />
              <NativeSelect
                v-else-if="currentType === 'select'"
                :model-value="typeof draftValue === 'string' ? draftValue : ''"
                :options="valueOptions"
                :placeholder="L.choose"
                @update:model-value="(v: string) => ((draftValue = v), (draftError = false))"
              />
              <NativeSelect
                v-else-if="currentType === 'boolean'"
                :model-value="typeof draftValue === 'string' ? draftValue : 'true'"
                :options="booleanOptions"
                @update:model-value="(v: string) => (draftValue = v)"
              />
              <Input
                v-else
                type="text"
                autocomplete="off"
                :model-value="typeof draftValue === 'string' ? draftValue : ''"
                :placeholder="currentField?.placeholder"
                @update:model-value="(v: string | number) => ((draftValue = String(v)), (draftError = false))"
              />
            </div>
          </Field>

          <div data-slot="filter-bar-actions" class="flex flex-wrap items-center justify-end gap-2">
            <PopoverClose as-child><Button data-slot="filter-bar-cancel" variant="ghost" size="sm" :class="buttonClass">{{ L.cancel }}</Button></PopoverClose>
            <Button data-slot="filter-bar-apply" type="submit" size="sm" :class="buttonClass">{{ L.apply }}</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>

    <Button
      v-if="clearable && items.length > 0"
      data-slot="filter-bar-clear"
      :variant="variant === 'inline' ? 'link' : 'ghost'"
      :size="BUTTON_SIZE[size]"
      :disabled="disabled"
      :class="buttonClass"
      @click="clearAll"
    >{{ L.clear }}</Button>

    <div data-slot="filter-bar-status" role="status" aria-live="polite" aria-atomic="true" class="sr-only">{{ liveText }}</div>
  </div>
</template>
