<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, useId, watch, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import { useConfigLabels } from '../../layout/ConfigProvider/config'
import { formatLabel } from '../Field/format-label'
import { useFieldControl } from '../Field/useFieldContext'
import { useInputGroupStatus } from '../InputGroup/context'
import { useRejectableModel } from '../Field/useControlledValue'
import { useNativeValidation } from '../Field/useNativeValidation'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { FIELD_STATUS_PAD, normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { textareaVariants } from './variants'

export interface TextareaProps {
  modelValue?: string | null
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  /** Marks the field invalid (aria-invalid) and applies destructive styling. */
  invalid?: boolean
  /** Surface treatment. */
  variant?: FieldVariant
  /** Minimum height, text size and padding. `md` is the default look. */
  size?: FieldSize
  /** Corner shape. `pill` is `rounded-xl` here: a full pill would clip several lines. */
  shape?: FieldShape
  /** Status colour plus an icon at the top end (and screen reader text for `success` and `warning`). `error` also sets `aria-invalid`. */
  status?: FieldStatus
  /** Text of the visually hidden status message. Defaults to the English text. */
  statusLabel?: string
  /** Visible rows when not autosizing. */
  rows?: number
  /** Grow with content instead of scrolling. */
  autosize?: boolean
  /** Max rows when `autosize` is on; further content scrolls. Unlimited when omitted. */
  maxRows?: number
  /** Native maxlength; also drives the counter. */
  maxlength?: number
  /** Show a `n / maxlength` counter (requires `maxlength`). */
  showCount?: boolean
  /** Announced (once, politely) when the character limit is reached. */
  limitLabel?: string
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<TextareaProps>(), { rows: 3, variant: 'outline', size: 'md', shape: 'rounded', status: 'default' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const status = computed(() => normalizeStatus(props.status))
const control = useFieldControl({ invalid: () => props.invalid || status.value === 'error', disabled: () => props.disabled, required: () => props.required })

const model = ref(props.modelValue ?? '')
watch(
  () => props.modelValue,
  (v) => {
    model.value = v ?? ''
  },
)
const settle = useRejectableModel(() => props.modelValue, model, '')

const attrs = useAttrs()
const uid = useId()
const countId = `textarea-${uid}-count`
const group = useInputGroupStatus()
const ariaInvalid = computed(() => (group.invalid.value ? ('true' as const) : control.ariaInvalid.value))
const el = ref<HTMLTextAreaElement | null>(null)
useNativeValidation(el)
useRequireAccessibleName('Textarea', () => el.value, 'Wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`.')

function resize() {
  const t = el.value
  if (!props.autosize || !t) return
  t.style.height = 'auto'
  let h = t.scrollHeight
  if (props.maxRows) {
    const line = parseFloat(getComputedStyle(t).lineHeight) || 20
    const pad = parseFloat(getComputedStyle(t).paddingTop) + parseFloat(getComputedStyle(t).paddingBottom) || 0
    h = Math.min(h, line * props.maxRows + pad)
  }
  t.style.height = `${h}px`
}
onMounted(resize)
watch(model, () => nextTick(resize))
watch(() => props.autosize, () => nextTick(resize))

function onInput(e: Event) {
  const v = (e.target as HTMLTextAreaElement).value
  model.value = v
  emit('update:modelValue', v)
  settle()
}

const labels = useConfigLabels('textarea', { count: '{count} / {max}', limit: 'Character limit reached' })
const limitText = computed(() => props.limitLabel ?? labels.value.limit)
// maxlength counts UTF-16 code units, so the counter must too.
const count = computed(() => model.value.length)
const counting = computed(() => props.showCount && !!props.maxlength)
const atLimit = computed(() => counting.value && count.value >= props.maxlength!)
const statusId = `textarea-${uid}-status`
const classes = computed(() =>
  cn(
    textareaVariants({ size: normalizeFieldSize(props.size), variant: normalizeVariant(props.variant), shape: normalizeShape(props.shape), status: status.value }),
    status.value !== 'default' && FIELD_STATUS_PAD,
    props.autosize ? 'resize-none overflow-y-auto' : 'resize-y',
    props.class,
  ),
)
/** Field hint/error, the counter (read once on focus, never live) and any `aria-describedby` passed by the consumer. */
function describedBy(): string | undefined {
  const statusText = status.value === 'success' || status.value === 'warning' ? statusId : undefined
  const ids = [control.describedBy.value, counting.value ? countId : undefined, statusText, attrs['aria-describedby'] as string | undefined, group.describedBy.value].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
}

defineExpose({ el, resize })
</script>

<template>
  <div data-slot="textarea-wrapper" class="relative w-full">
    <textarea
      ref="el"
      data-slot="textarea"
      v-bind="$attrs"
      :id="($attrs.id as string | undefined) ?? control.id.value"
      :value="model"
      :rows="rows"
      :maxlength="maxlength"
      :disabled="control.disabled.value"
      :readonly="readonly"
      :required="control.required.value || undefined"
      :aria-invalid="ariaInvalid"
      :aria-describedby="describedBy()"
      :class="classes"
      @input="onInput"
    />
    <FieldStatusIcon :status="status" :id="statusId" :label="statusLabel" class="top-2.5 translate-y-0" />
    <span
      v-if="counting"
      :id="countId"
      data-slot="textarea-count"
      :class="cn('mt-1 block text-end text-xs text-muted-foreground tabular-nums', atLimit && 'font-medium text-destructive')"
    >
      {{ formatLabel(labels.count, { count, max: maxlength! }) }}
    </span>
    <span v-if="counting" data-slot="textarea-limit-status" role="status" class="sr-only">{{ atLimit ? limitText : '' }}</span>
  </div>
</template>
