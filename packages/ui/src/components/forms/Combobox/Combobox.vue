<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, useId, type HTMLAttributes } from 'vue'
import {
  ComboboxAnchor,
  ComboboxCancel,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
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
import { normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { comboboxVariants } from './variants'
import { checkOptionValues } from '../CheckboxCard/contract-helpers'

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ComboboxProps {
  /** Selected option value. Omit for uncontrolled use. `''`/null means nothing selected. */
  modelValue?: string | null
  /** Initial value when uncontrolled. */
  defaultValue?: string
  options?: ComboboxOption[]
  placeholder?: string
  /** Text shown when no option matches the typed filter (or `options` is empty). Use the `empty` slot for rich content. */
  emptyText?: string
  /** Show a clear button while a value is selected. */
  clearable?: boolean
  disabled?: boolean
  required?: boolean
  /** Marks the input invalid (aria-invalid) and applies destructive styling. */
  invalid?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Surface treatment of the input: `outline` (default), `filled`, `underline` or `ghost`. */
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
const props = withDefaults(defineProps<ComboboxProps>(), {
  modelValue: undefined,
  defaultValue: undefined,
  options: () => [],
  open: undefined,
  size: 'md',
  variant: 'outline',
  shape: 'rounded',
  status: 'default',
})
const labels = useConfigLabels('combobox', { clearSelection: 'Clear selection', toggleOptions: 'Toggle options', empty: 'No results' })
const emptyMessage = computed(() => props.emptyText ?? labels.value.empty)
const emit = defineEmits<{ 'update:modelValue': [value: string]; 'update:open': [value: boolean] }>()

const status = computed(() => normalizeStatus(props.status))
const control = useFieldControl({ invalid: () => props.invalid || status.value === 'error', disabled: () => props.disabled, required: () => props.required })

const input = ref<{ $el: HTMLElement } | null>(null)
useRequireAccessibleName('Combobox', () => input.value?.$el, 'Wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`. A placeholder is not a name.')
onMounted(() => checkOptionValues('Combobox', 'option', (Array.isArray(props.options) ? props.options : []).map((o) => o?.value)))

function labelOf(value: unknown): string {
  return props.options.find((o) => o.value === value)?.label ?? ''
}

const attrs = useAttrs()
const statusId = `combobox-status-${useId()}`
const hasStatusText = computed(() => status.value === 'success' || status.value === 'warning')
// Field description, author `aria-describedby` and the hidden success / warning text.
const describedBy = computed(() => [attrs['aria-describedby'], control.describedBy.value, hasStatusText.value ? statusId : undefined].filter(Boolean).join(' ') || undefined)
const inputClasses = computed(() =>
  comboboxVariants({
    size: normalizeFieldSize(props.size),
    variant: normalizeVariant(props.variant),
    shape: normalizeShape(props.shape),
    status: status.value,
    pad: props.clearable ? (status.value === 'default' ? 'clearable' : 'clearable-status') : status.value === 'default' ? 'plain' : 'status',
  }),
)
// The status icon sits left of the toggle (and clear) button; touch pointers have larger buttons.
const statusIconClass = computed(() => (props.clearable ? 'end-16 pointer-coarse:end-24' : 'end-10 pointer-coarse:end-12'))

function onUpdate(v: unknown) {
  emit('update:modelValue', v == null ? '' : String(v))
}
</script>

<template>
  <ComboboxRoot
    data-slot="combobox"
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
    <ComboboxAnchor data-slot="combobox-anchor" class="relative">
      <ComboboxInput
        ref="input"
        data-slot="combobox-input"
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
          data-slot="combobox-clear"
          :aria-label="labels.clearSelection"
          class="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-hidden hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 pointer-coarse:size-9"
        >
          <Icon :icon="faXmark" size="sm" />
        </ComboboxCancel>
        <ComboboxTrigger
          data-slot="combobox-trigger"
          :aria-label="labels.toggleOptions"
          class="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 pointer-coarse:size-9"
        >
          <Icon :icon="faChevronDown" size="sm" />
        </ComboboxTrigger>
      </div>
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent
        data-slot="combobox-content"
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
        <ComboboxViewport class="max-h-72 overflow-y-auto p-1">
          <ComboboxEmpty data-slot="combobox-empty" role="status" aria-live="polite" class="px-2 py-1.5 text-sm text-muted-foreground">
            <slot name="empty">{{ emptyMessage }}</slot>
          </ComboboxEmpty>
          <ComboboxItem
            v-for="o in options"
            :key="o.value"
            data-slot="combobox-item"
            :value="o.value"
            :text-value="o.label"
            :disabled="o.disabled"
            class="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 ps-2 pe-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground forced-colors:data-[highlighted]:outline pointer-coarse:min-h-11"
          >
            <slot name="option" :option="o">{{ o.label }}</slot>
            <ComboboxItemIndicator class="absolute end-2 flex size-3.5 items-center justify-center">
              <Icon :icon="faCheck" size="sm" />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
