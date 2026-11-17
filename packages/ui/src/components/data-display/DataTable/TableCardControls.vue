<script setup lang="ts">
import { computed, nextTick, ref, useId, watchPostEffect } from 'vue'
import { faArrowDown, faArrowUp, faChevronDown } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import Combobox from '../../forms/Combobox/Combobox.vue'
import { nativeSelectVariants } from '../../forms/NativeSelect/variants'
import { tableCheckboxClasses } from './selectStyles'
import type { SortState } from './types'

export interface TableCardControlsOption {
  key: string
  label: string
}

export interface TableCardControlsProps extends BaseProps {
  /** Sortable columns, in header order: `{ key, label }`. With none, the sort control is not rendered. */
  options?: TableCardControlsOption[]
  /** Select all on the page (checkbox). Without it the "Select all" checkbox is not rendered. */
  selectable?: boolean
  /** Every row of the page is selected. */
  allSelected?: boolean
  /** Some, not all, rows of the page are selected (indeterminate box). */
  someSelected?: boolean
  /** Disables the "Select all" checkbox (no rows to select). */
  selectDisabled?: boolean
  /** `'select'` (default) is a native select; `'combobox'` is a filterable Combobox. Unknown values use the select. */
  sortControl?: 'select' | 'combobox'
  /** Visible label of the sort select. */
  sortByLabel?: string
  /** Name of the direction button (its visible text is the current direction). */
  sortDirectionLabel?: string
  /** Select option that clears the sort. */
  sortDefaultLabel?: string
  sortAscendingLabel?: string
  sortDescendingLabel?: string
  /** Visible label of the "Select all" checkbox. */
  selectAllLabel?: string
  /** Render a polite live region that announces the sort. DataTable has its own, so it turns this off. */
  announce?: boolean
}

const props = withDefaults(defineProps<TableCardControlsProps>(), {
  options: () => [],
  selectable: false,
  allSelected: false,
  someSelected: false,
  selectDisabled: false,
  sortControl: 'select',
  sortByLabel: 'Sort by',
  sortDirectionLabel: 'Sort direction',
  sortDefaultLabel: 'Default order',
  sortAscendingLabel: 'Ascending',
  sortDescendingLabel: 'Descending',
  selectAllLabel: 'Select all',
  announce: true,
})
const emit = defineEmits<{ 'select-all': [event: Event] }>()
/** Same shape and meaning as `DataTable`'s `v-model:sort`: header buttons and this control write the same value. */
const sort = defineModel<SortState | null>('sort', { default: null })

const options = computed(() => (Array.isArray(props.options) ? props.options.filter((o) => o && typeof o.key === 'string' && o.key !== '') : []))
const current = computed(() => options.value.find((o) => o.key === sort.value?.key))
// A sort on a column that is not offered (not sortable here) is shown as the default order.
const activeKey = computed(() => current.value?.key ?? '')
const direction = computed<'asc' | 'desc'>(() => (sort.value?.direction === 'desc' ? 'desc' : 'asc'))
const directionText = computed(() => (direction.value === 'asc' ? props.sortAscendingLabel : props.sortDescendingLabel))
const announcement = computed(() => (current.value ? `${props.sortByLabel} ${current.value.label}, ${directionText.value}` : ''))

const selectEl = ref<HTMLSelectElement | null>(null)
async function onSelect(event: Event) {
  const el = event.target as HTMLSelectElement
  // Keep the direction the user already picked; a first choice starts ascending, like the header button.
  sort.value = el.value === '' ? null : { key: el.value, direction: direction.value }
  await nextTick()
  // Controlled and ignored by the parent: show what the data really is sorted by.
  el.value = activeKey.value
}
const useCombobox = computed(() => props.sortControl === 'combobox')
const comboId = `table-card-controls-sort-${useId()}`
function onPick(value: string | null) {
  sort.value = value ? { key: value, direction: direction.value } : null
}
function flip() {
  if (!current.value) return
  sort.value = { key: current.value.key, direction: direction.value === 'asc' ? 'desc' : 'asc' }
}

const checkbox = ref<HTMLInputElement | null>(null)
watchPostEffect(() => {
  if (checkbox.value) checkbox.value.indeterminate = props.someSelected
})
async function onToggleAll(event: Event) {
  const el = event.target as HTMLInputElement
  emit('select-all', event)
  await nextTick()
  el.checked = props.allSelected
}

const rootClasses = computed(() => cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:hidden', props.class))
const selectClasses = cn(nativeSelectVariants({ size: 'md' }), 'min-w-0 w-full')
const labelClasses = 'inline-flex min-h-6 cursor-pointer items-center gap-2 text-foreground pointer-coarse:min-h-11'
</script>

<template>
  <div v-if="options.length > 0 || selectable" data-slot="table-card-controls" :class="rootClasses">
    <label v-if="selectable" data-slot="table-card-controls-select-all" :class="labelClasses">
      <input
        ref="checkbox"
        type="checkbox"
        data-slot="table-card-controls-select-all-input"
        :class="tableCheckboxClasses"
        :checked="allSelected"
        :disabled="selectDisabled"
        @change="onToggleAll"
      />
      <span>{{ selectAllLabel }}</span>
    </label>
    <div v-if="options.length > 0" data-slot="table-card-controls-sort" class="flex min-w-0 flex-1 items-center gap-2">
      <div v-if="useCombobox" class="flex min-w-0 flex-1 items-center gap-2">
        <label :for="comboId" class="shrink-0 text-foreground">{{ sortByLabel }}</label>
        <Combobox
          :id="comboId"
          data-slot="table-card-controls-sort-combobox"
          class="min-w-0 flex-1"
          clearable
          size="md"
          empty-text="No matching columns"
          :placeholder="sortDefaultLabel"
          :options="options.map((o) => ({ value: o.key, label: o.label }))"
          :model-value="activeKey"
          @update:model-value="onPick"
        />
      </div>
      <label v-else class="flex min-w-0 flex-1 items-center gap-2 text-foreground">
        <span class="shrink-0">{{ sortByLabel }}</span>
        <span class="relative block min-w-0 flex-1">
          <select ref="selectEl" data-slot="table-card-controls-sort-select" :class="selectClasses" :value="activeKey" @change="onSelect">
            <option value="">{{ sortDefaultLabel }}</option>
            <option v-for="o in options" :key="o.key" :value="o.key">{{ o.label }}</option>
          </select>
          <Icon :icon="faChevronDown" size="sm" class="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </span>
      </label>
      <Button
        variant="outline"
        data-slot="table-card-controls-direction"
        :icon-start="direction === 'asc' ? faArrowUp : faArrowDown"
        :disabled="!current"
        :aria-label="`${sortDirectionLabel}: ${directionText}`"
        :data-direction="current ? direction : 'none'"
        @click="flip"
      >
        {{ directionText }}
      </Button>
    </div>
    <p v-if="announce" data-slot="table-card-controls-status" role="status" class="sr-only">{{ announcement }}</p>
  </div>
</template>
