<script setup lang="ts">
import { computed, ref, useAttrs, useId, type HTMLAttributes } from 'vue'
import {
  ComboboxAnchor,
  ComboboxCancel,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'
import { faCheck, faChevronDown, faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import { floatingSurface } from '../../../lib/styles'
import Icon from '../../primitives/Icon/Icon.vue'
import { useConfigLabels } from '../../layout/ConfigProvider/config'
import { useFieldControl } from '../Field/useFieldContext'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { resolveGroups, searchText, usableOptions, useModelPickerContract, type ModelPickerGroup, type ModelPickerOption } from './options'
import { modelPickerVariants } from './variants'

export interface ModelPickerProps {
  /** Id of the selected option. Omit for uncontrolled use. `''`/null means nothing selected. */
  modelValue?: string | null
  /** Initial id when uncontrolled. */
  defaultValue?: string
  /**
   * Plain data. Either a flat list of `{ id, label, description?, badges?, disabled?, group? }` (options with the same `group`
   * are gathered under one heading), or entries of `{ label, options }` for explicit groups. The two forms can be mixed.
   */
  options?: Array<ModelPickerOption | ModelPickerGroup>
  placeholder?: string
  /** Text shown when nothing matches the typed search (or `options` is empty). Use the `empty` slot for rich content. */
  emptyText?: string
  /** Show a clear button while an option is selected. */
  clearable?: boolean
  disabled?: boolean
  required?: boolean
  /** Marks the input invalid (aria-invalid) and applies destructive styling. */
  invalid?: boolean
  size?: FieldSize
  /** Surface of the input: `outline` (default), `filled`, `underline` or `ghost`. */
  variant?: FieldVariant
  /** Corner shape: `rounded` (default), `pill` or `square`. */
  shape?: FieldShape
  /** Validation status shown with an icon as well as colour. `error` also sets `aria-invalid`. */
  status?: FieldStatus
  /** Form field name. */
  name?: string
  /** Controlled open state (`v-model:open`). */
  open?: boolean
  id?: string
  /** Merged onto the root element (width/layout). Other attributes go to the `<input>`. */
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<ModelPickerProps>(), {
  modelValue: undefined,
  defaultValue: undefined,
  options: () => [],
  open: undefined,
  size: 'md',
  variant: 'outline',
  shape: 'rounded',
  status: 'default',
})
const labels = useConfigLabels('modelPicker', { clearSelection: 'Clear selection', toggleOptions: 'Toggle options', empty: 'No matching options' })
const emptyMessage = computed(() => props.emptyText ?? labels.value.empty)
const emit = defineEmits<{ 'update:modelValue': [id: string]; 'update:open': [value: boolean] }>()

const status = computed(() => normalizeStatus(props.status))
const control = useFieldControl({ invalid: () => props.invalid || status.value === 'error', disabled: () => props.disabled, required: () => props.required })

const input = ref<{ $el: HTMLElement } | null>(null)
useRequireAccessibleName('ModelPicker', () => input.value?.$el, 'Wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`. A placeholder is not a name.')
useModelPickerContract(() => props.options)

const groups = computed(() => resolveGroups(props.options))
const flat = computed(() => usableOptions(props.options))
const labelOf = (id: unknown): string => flat.value.find((o) => o.id === id)?.label ?? ''
const badgesOf = (o: ModelPickerOption): string[] => (Array.isArray(o.badges) ? o.badges.filter((b) => typeof b === 'string' && b.trim() !== '') : [])

const attrs = useAttrs()
const statusId = `model-picker-status-${useId()}`
const hasStatusText = computed(() => status.value === 'success' || status.value === 'warning')
const describedBy = computed(() => [attrs['aria-describedby'], control.describedBy.value, hasStatusText.value ? statusId : undefined].filter(Boolean).join(' ') || undefined)
const inputClasses = computed(() =>
  modelPickerVariants({
    size: normalizeFieldSize(props.size),
    variant: normalizeVariant(props.variant),
    shape: normalizeShape(props.shape),
    status: status.value,
    pad: props.clearable ? (status.value === 'default' ? 'clearable' : 'clearable-status') : status.value === 'default' ? 'plain' : 'status',
  }),
)
const statusIconClass = computed(() => (props.clearable ? 'end-16 pointer-coarse:end-24' : 'end-10 pointer-coarse:end-12'))

function onUpdate(v: unknown) {
  emit('update:modelValue', v == null ? '' : String(v))
}
</script>

<template>
  <ComboboxRoot
    data-slot="model-picker"
    :class="cn('relative w-full', props.class)"
    :model-value="modelValue"
    :default-value="defaultValue"
    :open="open"
    :disabled="control.disabled.value"
    :name="name"
    open-on-focus
    open-on-click
    reset-model-value-on-clear
    @update:model-value="onUpdate"
    @update:open="(v: boolean) => emit('update:open', v)"
    v-slot="{ modelValue: current }"
  >
    <ComboboxAnchor data-slot="model-picker-anchor" class="relative">
      <ComboboxInput
        ref="input"
        data-slot="model-picker-input"
        :id="props.id ?? control.id.value"
        :placeholder="placeholder"
        :display-value="labelOf"
        :disabled="control.disabled.value"
        :required="control.required.value || undefined"
        :aria-invalid="control.invalid.value ? 'true' : undefined"
        v-bind="$attrs"
        :aria-describedby="describedBy"
        :class="inputClasses"
      />
      <FieldStatusIcon :status="status" :id="statusId" :class="statusIconClass" />
      <div class="absolute inset-y-0 end-2 flex items-center gap-1">
        <ComboboxCancel
          v-if="clearable && current && !control.disabled.value"
          data-slot="model-picker-clear"
          :aria-label="labels.clearSelection"
          class="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-hidden hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 pointer-coarse:size-9"
        >
          <Icon :icon="faXmark" size="sm" />
        </ComboboxCancel>
        <ComboboxTrigger
          data-slot="model-picker-trigger"
          :aria-label="labels.toggleOptions"
          class="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 pointer-coarse:size-9"
        >
          <Icon :icon="faChevronDown" size="sm" />
        </ComboboxTrigger>
      </div>
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent
        data-slot="model-picker-content"
        position="popper"
        :side-offset="4"
        :class="
          cn(
            floatingSurface,
            'max-h-(--reka-combobox-content-available-height) max-w-(--reka-combobox-content-available-width) w-(--reka-combobox-trigger-width) origin-(--reka-combobox-content-transform-origin) overflow-hidden',
            'data-[state=open]:animate-ds-pop-in data-[state=closed]:animate-ds-pop-out',
          )
        "
      >
        <ComboboxViewport class="max-h-80 overflow-y-auto p-1">
          <ComboboxEmpty data-slot="model-picker-empty" role="status" aria-live="polite" class="px-2 py-1.5 text-sm text-muted-foreground">
            <slot name="empty">{{ emptyMessage }}</slot>
          </ComboboxEmpty>
          <template v-for="(g, gi) in groups" :key="`g${gi}`">
            <component :is="g.label ? ComboboxGroup : 'div'" :data-slot="g.label ? 'model-picker-group' : undefined" :class="g.label ? 'py-1' : undefined">
              <ComboboxLabel v-if="g.label" data-slot="model-picker-group-label" class="px-2 py-1 text-xs font-medium text-muted-foreground">{{ g.label }}</ComboboxLabel>
              <ComboboxItem
                v-for="(o, oi) in g.options"
                :key="`${gi}-${oi}-${o.id}`"
                data-slot="model-picker-item"
                :value="o.id"
                :text-value="searchText(o)"
                :disabled="o.disabled"
                :aria-disabled="o.disabled ? 'true' : undefined"
                class="group/item relative flex w-full cursor-default flex-col items-start gap-0.5 rounded-sm py-1.5 ps-2 pe-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground forced-colors:data-[highlighted]:outline pointer-coarse:min-h-11"
              >
                <slot name="option" :option="o">
                  <span class="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span data-slot="model-picker-item-label" class="min-w-0 font-medium break-words">{{ o.label }}</span>
                    <span
                      v-for="(b, bi) in badgesOf(o)"
                      :key="bi"
                      data-slot="model-picker-badge"
                      class="inline-flex items-center rounded-sm border border-border px-1.5 text-xs leading-5 break-words"
                    >{{ b }}</span>
                  </span>
                  <span
                    v-if="o.description"
                    data-slot="model-picker-item-description"
                    class="w-full text-xs break-words text-muted-foreground group-data-[highlighted]/item:text-accent-foreground"
                  >{{ o.description }}</span>
                </slot>
                <ComboboxItemIndicator class="absolute end-2 top-2 flex size-3.5 items-center justify-center">
                  <Icon :icon="faCheck" size="sm" />
                </ComboboxItemIndicator>
              </ComboboxItem>
            </component>
          </template>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
