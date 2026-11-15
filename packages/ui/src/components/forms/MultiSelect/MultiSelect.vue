<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { floatingSurface } from '../../../lib/styles'
import { faCheck, faChevronDown, faMagnifyingGlass, faXmark } from '../../../lib/icons'
import Icon from '../../primitives/Icon/Icon.vue'
import { checkOptionValues } from '../CheckboxCard/contract-helpers'
import { useControllable } from '../CheckboxCard/use-controllable'
import { useFieldControl } from '../Field/useFieldContext'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { multiSelectTriggerVariants } from './variants'

export interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface MultiSelectProps {
  /** Selected values (v-model). Omit for uncontrolled use. */
  modelValue?: string[]
  /** Initial selection when uncontrolled. */
  defaultValue?: string[]
  /** Open state (v-model:open). Omit for uncontrolled use. */
  open?: boolean
  options?: MultiSelectOption[]
  placeholder?: string
  /** Show the search box. When false, typing jumps to the first option starting with the typed text. */
  searchable?: boolean
  searchPlaceholder?: string
  /** Text shown when no option matches (or there are no options). */
  emptyText?: string
  /** Maximum number of selected values. Non-positive / non-numeric values mean unlimited. Hides "Select all". */
  max?: number
  /** Chips shown in the trigger before collapsing the rest into "+N more". */
  maxVisible?: number
  /** Show the select-all / clear actions. */
  actions?: boolean
  /** Show a clear button in the trigger when something is selected. */
  clearable?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Surface treatment of the trigger: `outline` (default), `filled`, `underline` or `ghost`. */
  variant?: FieldVariant
  /** Corner shape: `rounded` (default), `pill` or `square`. */
  shape?: FieldShape
  /** Validation status shown with an icon as well as colour. `error` also sets `aria-invalid`. */
  status?: FieldStatus
  disabled?: boolean
  required?: boolean
  /** Marks the control invalid (aria-invalid + destructive border). */
  invalid?: boolean
  /** Form field name; one hidden input per selected value is rendered. */
  name?: string
  /** Trigger id; falls back to the surrounding Field id, then a generated one. */
  id?: string
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<MultiSelectProps>(), {
  modelValue: undefined,
  defaultValue: () => [],
  open: undefined,
  options: () => [],
  placeholder: 'Select...',
  searchable: true,
  searchPlaceholder: 'Search...',
  emptyText: 'No results found',
  max: undefined,
  maxVisible: 3,
  actions: true,
  clearable: false,
  size: 'md',
  variant: 'outline',
  shape: 'rounded',
  status: 'default',
  name: undefined,
  id: undefined,
})
const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'update:open': [open: boolean]
}>()

const uid = useId()
const status = computed(() => normalizeStatus(props.status))
const control = useFieldControl({ invalid: () => props.invalid || status.value === 'error', disabled: () => props.disabled, required: () => props.required })
const triggerId = computed(() => props.id ?? control.id.value ?? `multi-select-${uid}`)
const listId = `${uid}-list`
const valueId = `${uid}-value`
const statusId = `${uid}-status`
const nameId = `${uid}-name`
const optionId = (i: number) => `${uid}-opt-${i}`

// WCAG 2.5.3: the trigger shows chips / placeholder text, so an author-supplied name (aria-label or
// aria-labelledby) must be combined with that visible text instead of replacing it.
const attrs = useAttrs()
const authorLabel = computed(() => (typeof attrs['aria-label'] === 'string' ? attrs['aria-label'].trim() : ''))
const authorLabelledby = computed(() => (typeof attrs['aria-labelledby'] === 'string' ? attrs['aria-labelledby'].trim() : ''))
const triggerLabelledby = computed(() => {
  if (authorLabelledby.value) return `${authorLabelledby.value} ${valueId}`
  if (authorLabel.value) return `${nameId} ${valueId}`
  return undefined
})

// Field description, author `aria-describedby` and the hidden success / warning text.
const describedBy = computed(
  () => [attrs['aria-describedby'], control.describedBy.value, status.value === 'success' || status.value === 'warning' ? statusId : undefined].filter(Boolean).join(' ') || undefined,
)
const triggerClasses = computed(() =>
  cn(
    multiSelectTriggerVariants({ size: normalizeFieldSize(props.size), variant: normalizeVariant(props.variant), shape: normalizeShape(props.shape), status: status.value }),
    props.clearable && selected.value.length > 0 && 'pe-14',
  ),
)

const root = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()

// The trigger's own text (chips or placeholder) is not a name, so `useRequireAccessibleName` does not apply: look for
// an author name or a `<label>` (Field, `for`, or wrapping) with text.
onMounted(async () => {
  await nextTick()
  const labelled = [...(trigger.value?.labels ?? [])].some((l) => l.textContent?.trim())
  if (!authorLabel.value && !authorLabelledby.value && !labelled) {
    violation('MultiSelect', 'requires-accessible-name', 'needs an accessible name for its trigger. Wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`. The chips or placeholder are not a name.')
  }
  checkOptionValues('MultiSelect', 'option', (Array.isArray(props.options) ? props.options : []).map((o) => o?.value))
})
const searchInput = ref<HTMLInputElement>()
const listbox = ref<HTMLElement>()
const query = ref('')
const activeValue = ref<string | undefined>()

const clean = (v: unknown): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : [])
const model = useControllable<string[]>(
  () => (props.modelValue === undefined ? undefined : clean(props.modelValue)),
  clean(props.defaultValue),
  (v) => emit('update:modelValue', v),
)
const openState = useControllable<boolean>(
  () => (props.open === undefined ? undefined : !!props.open),
  false,
  (v) => emit('update:open', v),
)
const isOpen = computed(() => openState.value.value && !control.disabled.value)
const selected = model.value

const options = computed(() => (Array.isArray(props.options) ? props.options.filter((o) => o && typeof o.value === 'string') : []))
const labelOf = (value: string) => options.value.find((o) => o.value === value)?.label ?? value
const limit = computed(() => (typeof props.max === 'number' && Number.isFinite(props.max) && props.max > 0 ? Math.floor(props.max) : undefined))
const limitReached = computed(() => limit.value !== undefined && selected.value.length >= limit.value)
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? options.value.filter((o) => String(o.label).toLowerCase().includes(q)) : options.value
})
const isSelected = (v: string) => selected.value.includes(v)
const isLocked = (o: MultiSelectOption) => !!o.disabled || (!isSelected(o.value) && limitReached.value)
const statusText = computed(() => {
  if (filtered.value.length === 0) return props.emptyText
  return query.value.trim() ? `${filtered.value.length} ${filtered.value.length === 1 ? 'option' : 'options'} available` : ''
})
const navigable = computed(() => filtered.value.filter((o) => !o.disabled))

const visibleCount = computed(() => {
  const n = Number(props.maxVisible)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 3
})
const chips = computed(() => selected.value.slice(0, visibleCount.value))
const hiddenCount = computed(() => Math.max(0, selected.value.length - visibleCount.value))
const activeIndex = computed(() => options.value.findIndex((o) => o.value === activeValue.value))
const activeDescendant = computed(() => (isOpen.value && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined))

function setOpen(next: boolean) {
  if (next === openState.value.value) return
  if (next && control.disabled.value) return
  openState.set(next)
}

function openWith(seed = '') {
  if (control.disabled.value) return
  query.value = seed
  setOpen(true)
}

function close(refocus = false) {
  setOpen(false)
  query.value = ''
  typeahead = ''
  if (refocus) void nextTick(() => trigger.value?.focus())
}

function toggle(o: MultiSelectOption) {
  if (control.disabled.value || isLocked(o)) return
  model.set(isSelected(o.value) ? selected.value.filter((v) => v !== o.value) : [...selected.value, o.value])
}

function selectAll() {
  if (control.disabled.value || limit.value !== undefined) return
  const add = filtered.value.filter((o) => !o.disabled && !isSelected(o.value)).map((o) => o.value)
  if (add.length) model.set([...selected.value, ...add])
}

function clearAll() {
  if (control.disabled.value) return
  const locked = new Set(options.value.filter((o) => o.disabled).map((o) => o.value))
  const next = selected.value.filter((v) => locked.has(v))
  if (next.length !== selected.value.length) model.set(next)
}

function move(delta: number) {
  const list = navigable.value
  if (!list.length) return
  const at = list.findIndex((o) => o.value === activeValue.value)
  const i = at === -1 ? (delta > 0 ? 0 : list.length - 1) : (at + delta + list.length) % list.length
  activeValue.value = list[i].value
}

let typeahead = ''
let typeaheadTimer: ReturnType<typeof setTimeout> | undefined
function typeAhead(char: string) {
  clearTimeout(typeaheadTimer)
  typeahead += char.toLowerCase()
  typeaheadTimer = setTimeout(() => (typeahead = ''), 600)
  jumpToTypeahead()
}
function jumpToTypeahead() {
  const hit = navigable.value.find((o) => String(o.label).toLowerCase().startsWith(typeahead))
  if (hit) activeValue.value = hit.value
}

const printable = (e: KeyboardEvent) => e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey

function onTriggerKeydown(e: KeyboardEvent) {
  if (control.disabled.value) return
  if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
    e.preventDefault()
    openWith()
  } else if (e.key === 'Escape' && isOpen.value) {
    e.preventDefault()
    close(true)
  } else if (printable(e)) {
    e.preventDefault()
    openWith(props.searchable ? e.key : '')
    if (!props.searchable) typeAhead(e.key)
  }
}

function onPanelKeydown(e: KeyboardEvent) {
  // Ctrl/Cmd+A selects every enabled option, unless it should select the typed search text
  if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey) && !(props.searchable && query.value !== '')) {
    e.preventDefault()
    return selectAll()
  }
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      return move(1)
    case 'ArrowUp':
      e.preventDefault()
      return move(-1)
    case 'Home':
      if (!props.searchable) {
        e.preventDefault()
        activeValue.value = navigable.value[0]?.value
      }
      return
    case 'End':
      if (!props.searchable) {
        e.preventDefault()
        activeValue.value = navigable.value[navigable.value.length - 1]?.value
      }
      return
    case 'Enter':
    case ' ': {
      // while a search query is being typed, Space is a normal character
      if (e.key === ' ' && props.searchable && query.value !== '') return
      e.preventDefault()
      const o = options.value.find((x) => x.value === activeValue.value)
      if (o) toggle(o)
      return
    }
    case 'Escape':
      e.preventDefault()
      e.stopPropagation()
      return close(true)
    case 'Tab':
      return close()
    default:
      if (!props.searchable && printable(e)) typeAhead(e.key)
  }
}

function onFocusout(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (isOpen.value && next && root.value && !root.value.contains(next)) close()
}

function onDocumentPointerdown(e: Event) {
  if (root.value && !root.value.contains(e.target as Node)) close()
}

watch(isOpen, (open) => {
  if (typeof document === 'undefined') return
  if (open) {
    activeValue.value = selected.value.find((v) => navigable.value.some((o) => o.value === v)) ?? navigable.value[0]?.value
    if (typeahead) jumpToTypeahead() // opened by typing on the trigger
    document.addEventListener('pointerdown', onDocumentPointerdown)
    void nextTick(() => (searchInput.value ?? listbox.value)?.focus())
  } else document.removeEventListener('pointerdown', onDocumentPointerdown)
})

watch(query, () => {
  if (!navigable.value.some((o) => o.value === activeValue.value)) activeValue.value = navigable.value[0]?.value
})

watch(activeValue, () => {
  void nextTick(() => {
    if (activeIndex.value < 0) return
    const el = listbox.value?.querySelector(`#${CSS.escape(optionId(activeIndex.value))}`)
    el?.scrollIntoView?.({ block: 'nearest' })
  })
})

onBeforeUnmount(() => {
  clearTimeout(typeaheadTimer)
  if (typeof document !== 'undefined') document.removeEventListener('pointerdown', onDocumentPointerdown)
})
</script>

<template>
  <div
    ref="root"
    data-slot="multi-select"
    :data-state="isOpen ? 'open' : 'closed'"
    :data-disabled="control.disabled.value ? '' : undefined"
    :class="cn('relative w-full', props.class)"
    @focusout="onFocusout"
  >
    <span v-if="authorLabel && !authorLabelledby" :id="nameId" class="sr-only">{{ authorLabel }}</span>
    <div class="relative">
      <button
        ref="trigger"
        data-slot="multi-select-trigger"
        type="button"
        :id="triggerId"
        :disabled="control.disabled.value"
        aria-haspopup="listbox"
        :aria-expanded="isOpen"
        :aria-controls="isOpen ? listId : undefined"
        :aria-invalid="control.invalid.value ? 'true' : undefined"
        :aria-required="control.required.value || undefined"
        v-bind="$attrs"
        :aria-describedby="describedBy"
        :aria-label="undefined"
        :aria-labelledby="triggerLabelledby"
        :class="triggerClasses"
        @click="isOpen ? close() : openWith()"
        @keydown="onTriggerKeydown"
      >
        <span :id="valueId" data-slot="multi-select-value" class="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <span v-if="selected.length === 0" data-slot="multi-select-placeholder" class="truncate text-muted-foreground">{{ placeholder }}</span>
          <template v-else>
            <span
              v-for="v in chips"
              :key="v"
              data-slot="multi-select-chip"
              class="inline-flex max-w-40 items-center rounded-sm bg-secondary forced-colors:border px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              <slot name="chip" :value="v" :label="labelOf(v)"><span class="truncate">{{ labelOf(v) }}</span></slot>
            </span>
            <span
              v-if="hiddenCount > 0"
              data-slot="multi-select-overflow"
              class="inline-flex items-center rounded-sm bg-muted forced-colors:border px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
            >+{{ hiddenCount }} more</span>
          </template>
        </span>
        <FieldStatusIcon :status="status" :id="statusId" class="relative end-auto top-auto shrink-0 translate-y-0" />
        <Icon :icon="faChevronDown" size="sm" class="text-muted-foreground transition-transform motion-reduce:transition-none" :class="isOpen && 'rotate-180'" />
      </button>
      <button
        v-if="clearable && selected.length > 0 && !control.disabled.value"
        data-slot="multi-select-clear"
        type="button"
        aria-label="Clear selection"
        class="absolute end-8 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground outline-hidden hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 pointer-coarse:size-8"
        @click="clearAll"
      >
        <Icon :icon="faXmark" size="xs" />
      </button>
    </div>

    <div
      v-if="isOpen"
      data-slot="multi-select-content"
      :class="cn(floatingSurface, 'absolute start-0 top-full mt-1 w-full min-w-48 overflow-hidden p-1')"
      @keydown="onPanelKeydown"
    >
      <div v-if="searchable" data-slot="multi-select-search" class="relative mb-1">
        <Icon :icon="faMagnifyingGlass" size="sm" class="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          ref="searchInput"
          v-model="query"
          data-slot="multi-select-search-input"
          type="text"
          autocomplete="off"
          :placeholder="searchPlaceholder"
          :aria-label="searchPlaceholder"
          :aria-controls="listId"
          :aria-activedescendant="activeDescendant"
          class="h-8 w-full rounded-sm border border-input bg-transparent pe-2 ps-8 text-md outline-hidden placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm pointer-coarse:h-11"
        />
      </div>
      <div v-if="actions" data-slot="multi-select-actions" class="mb-1 flex flex-wrap items-center justify-between gap-x-2 px-1 text-xs">
        <button
          v-if="limit === undefined"
          data-slot="multi-select-select-all"
          type="button"
          tabindex="-1"
          class="inline-flex min-h-6 min-w-6 items-center justify-center rounded-sm px-1 font-medium text-primary hover:underline pointer-coarse:min-h-11"
          @mousedown.prevent
          @click="selectAll"
        >Select all</button>
        <span v-else data-slot="multi-select-limit" class="px-1 tabular-nums text-muted-foreground" aria-live="polite">{{ selected.length }} / {{ limit }} selected</span>
        <button
          data-slot="multi-select-clear-all"
          type="button"
          tabindex="-1"
          class="inline-flex min-h-6 min-w-6 items-center justify-center rounded-sm px-1 font-medium text-muted-foreground hover:text-foreground hover:underline pointer-coarse:min-h-11"
          @mousedown.prevent
          @click="clearAll"
        >Clear</button>
      </div>
      <div data-slot="multi-select-status" role="status" class="sr-only">{{ statusText }}</div>
      <ul
        ref="listbox"
        :id="listId"
        data-slot="multi-select-list"
        role="listbox"
        aria-multiselectable="true"
        aria-label="Options"
        :aria-activedescendant="searchable ? undefined : activeDescendant"
        :tabindex="searchable ? -1 : 0"
        :hidden="filtered.length === 0"
        class="max-h-60 overflow-y-auto outline-hidden"
      >
        <li
          v-for="o in filtered"
          :id="optionId(options.indexOf(o))"
          :key="o.value"
          data-slot="multi-select-option"
          role="option"
          :aria-selected="isSelected(o.value)"
          :aria-disabled="isLocked(o) || undefined"
          :data-active="o.value === activeValue ? '' : undefined"
          :data-state="isSelected(o.value) ? 'checked' : 'unchecked'"
          class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm select-none data-[active]:bg-accent data-[active]:text-accent-foreground aria-disabled:cursor-not-allowed aria-disabled:opacity-50 forced-colors:data-[active]:outline pointer-coarse:min-h-11"
          @mousedown.prevent
          @pointermove="!o.disabled && (activeValue = o.value)"
          @click="toggle(o)"
        >
          <span
            aria-hidden="true"
            :class="
              cn(
                'inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background text-transparent',
                isSelected(o.value) && 'border-primary bg-primary text-primary-foreground',
              )
            "
          ><Icon v-if="isSelected(o.value)" :icon="faCheck" class="size-3" /></span>
          <slot name="option" :option="o" :selected="isSelected(o.value)"><span class="truncate">{{ o.label }}</span></slot>
        </li>
      </ul>
      <div v-if="filtered.length === 0" data-slot="multi-select-empty" class="px-2 py-3 text-center text-sm text-muted-foreground">
        <slot name="empty">{{ emptyText }}</slot>
      </div>
    </div>

    <template v-if="name">
      <input v-for="v in selected" :key="v" data-slot="multi-select-input" type="hidden" :name="name" :value="v" />
    </template>
  </div>
</template>
