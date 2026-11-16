<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, useId, watch, type ComponentPublicInstance, type HTMLAttributes } from 'vue'
import { faXmark } from '../../../lib/icons'
import { TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText, TagsInputRoot } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import Icon from '../../primitives/Icon/Icon.vue'
import { useFieldControl } from '../Field/useFieldContext'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { normalizeFieldSize, normalizeShape, normalizeStatus, normalizeVariant, type FieldShape, type FieldSize, type FieldStatus, type FieldVariant } from '../Field/field-variants'
import { TAGS_INPUT_ICON_TOP, TAGS_INPUT_TEXT, tagsInputVariants } from './variants'
import { useAnnouncer } from '../TimeInput/announce'

export type TagRejectReason = 'duplicate' | 'max'

export interface TagsInputProps {
  modelValue?: string[] | null
  /** Initial tags when uncontrolled. */
  defaultValue?: string[]
  placeholder?: string
  /** Maximum number of tags; further additions are rejected. 0 / omitted = unlimited. */
  max?: number
  disabled?: boolean
  required?: boolean
  /** Marks the field invalid (aria-invalid on the input, destructive styling). */
  invalid?: boolean
  /** Character (or RegExp) that commits the current text as a tag. Enter always commits. */
  delimiter?: string | RegExp
  /** Also add the pending text when the input loses focus. */
  addOnBlur?: boolean
  /** Split pasted text on the delimiter and add each part. */
  addOnPaste?: boolean
  /** Form field name; renders a hidden input in a native form. */
  name?: string
  /** Accessible name of the text input (use when there is no `Field` label). */
  ariaLabel?: string
  /** Prefix of each remove button's accessible name (`Remove react`). */
  removeLabel?: string
  /** Spoken after a tag is added (polite live region): `Added react`. */
  addedLabel?: string
  /** Spoken after a tag is removed: `Removed react`. */
  removedLabel?: string
  /** Spoken when text matches an existing tag: `Already added: react`. */
  duplicateLabel?: string
  /** Spoken when `max` blocks an addition: `Tag limit reached: react`. */
  maxLabel?: string
  /** Height of the field and text size of the typing input: `xs`, `sm`, `md` (default) or `lg`. Tags wrap and grow the field. */
  size?: FieldSize
  /** Surface treatment: `outline` (default), `filled`, `underline` or `ghost`. */
  variant?: FieldVariant
  /** Corner shape: `rounded` (default), `pill` (a `rounded-xl` box, so wrapped tags are not clipped) or `square`. */
  shape?: FieldShape
  /** Validation status shown with an icon as well as colour. `error` also sets `aria-invalid`. */
  status?: FieldStatus
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<TagsInputProps>(), {
  delimiter: ',',
  removeLabel: 'Remove',
  addedLabel: 'Added',
  removedLabel: 'Removed',
  duplicateLabel: 'Already added',
  maxLabel: 'Tag limit reached',
  size: 'md',
  variant: 'outline',
  shape: 'rounded',
  status: 'default',
})
const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  /** A tag was added. */
  add: [tag: string]
  /** A tag was removed. */
  remove: [tag: string]
  /** The text matched an existing tag (case-sensitive) and was not added. */
  duplicate: [tag: string]
  /** Any rejected addition: duplicate, or `max` reached. */
  reject: [payload: { value: string; reason: TagRejectReason }]
}>()

const fieldStatus = computed(() => normalizeStatus(props.status))
const fieldSize = computed(() => normalizeFieldSize(props.size))
const control = useFieldControl({ invalid: () => props.invalid || fieldStatus.value === 'error', disabled: () => props.disabled, required: () => props.required })

const model = ref<string[]>([...(props.modelValue ?? props.defaultValue ?? [])])
watch(
  () => props.modelValue,
  (v) => {
    if (v) model.value = [...v]
    else if (v === null) model.value = []
  },
  { deep: true },
)

const trim = (v: unknown) => String(v).trim()
const { message: status, announce } = useAnnouncer()
const uid = useId()
const input = ref<ComponentPublicInstance | null>(null)
useRequireAccessibleName('TagsInput', () => input.value?.$el as HTMLElement | undefined, 'Wrap it in `Field` with a `label`, or set `ariaLabel` / `aria-labelledby`.')

function onUpdate(v: unknown) {
  const raw = Array.isArray(v) ? (v as string[]) : []
  const clean = raw.filter((t) => t !== '')
  const unchanged = clean.length === model.value.length && clean.every((t, i) => t === model.value[i])
  model.value = clean
  if (!unchanged) emit('update:modelValue', [...clean])
}

function onAdd(tag: unknown) {
  if (tag === '') return
  emit('add', tag as string)
  announce(`${props.addedLabel} ${tag}`)
}

/** The focused remove button unmounts with its tag: keep the caret in the text input. */
function onRemove(tag: unknown) {
  emit('remove', tag as string)
  announce(`${props.removedLabel} ${tag}`)
  void nextTick(() => (input.value?.$el as HTMLElement | undefined)?.focus())
}

function onInvalid(tag: unknown) {
  const value = String(tag)
  const reason: TagRejectReason = props.max && model.value.length >= props.max ? 'max' : 'duplicate'
  if (reason === 'duplicate') emit('duplicate', value)
  emit('reject', { value, reason })
  announce(`${reason === 'max' ? props.maxLabel : props.duplicateLabel}: ${value}`)
}

const attrs = useAttrs()
const statusId = `tags-input-status-${uid}`
const hasStatusText = computed(() => fieldStatus.value === 'success' || fieldStatus.value === 'warning')
// Field description, author `aria-describedby` and the hidden success / warning text.
const describedBy = computed(() => [attrs['aria-describedby'], control.describedBy.value, hasStatusText.value ? statusId : undefined].filter(Boolean).join(' ') || undefined)

const rootClasses = computed(() =>
  cn(
    tagsInputVariants({ size: fieldSize.value, variant: normalizeVariant(props.variant), shape: normalizeShape(props.shape), status: fieldStatus.value, pad: fieldStatus.value === 'default' ? 'none' : 'status' }),
    control.invalid.value && 'border-destructive ring-3 ring-destructive/20 dark:ring-destructive/40',
    props.class,
  ),
)
</script>

<template>
  <TagsInputRoot
    data-slot="tags-input"
    :model-value="model"
    :delimiter="delimiter"
    :max="max"
    :disabled="control.disabled.value"
    :required="control.required.value || undefined"
    :add-on-blur="addOnBlur"
    :add-on-paste="addOnPaste"
    :name="name"
    :id="control.id.value"
    :convert-value="trim"
    :data-disabled="control.disabled.value ? '' : undefined"
    :class="rootClasses"
    @update:model-value="onUpdate"
    @add-tag="onAdd"
    @remove-tag="onRemove"
    @invalid="onInvalid"
  >
    <TagsInputItem
      v-for="(tag, i) in model"
      :key="tag"
      :value="tag"
      data-slot="tags-input-item"
      class="inline-flex h-6 max-w-full items-center rounded-sm bg-secondary ps-2 pe-0 text-sm text-secondary-foreground data-[state=active]:ring-2 data-[state=active]:ring-ring forced-colors:data-[state=active]:outline-2 forced-colors:data-[state=active]:outline-solid pointer-coarse:h-9 data-[disabled]:border data-[disabled]:border-input data-[disabled]:bg-transparent data-[disabled]:text-muted-foreground"
    >
      <TagsInputItemText data-slot="tags-input-item-text" class="max-w-48 truncate" />
      <TagsInputItemDelete
        data-slot="tags-input-item-delete"
        :id="`${uid}-remove-${i}`"
        :aria-labelledby="`${uid}-remove-${i}`"
        :aria-label="`${removeLabel} ${tag}`"
        class="inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-hidden transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring forced-colors:focus-visible:outline-2 data-[disabled]:pointer-events-none pointer-coarse:size-9"
      >
        <Icon :icon="faXmark" size="xs" />
      </TagsInputItemDelete>
    </TagsInputItem>
    <TagsInputInput
      ref="input"
      data-slot="tags-input-input"
      :placeholder="model.length ? undefined : placeholder"
      :aria-label="ariaLabel"
      :aria-invalid="control.invalid.value ? 'true' : undefined"
      :class="cn('min-w-24 flex-1 bg-transparent py-0.5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed', TAGS_INPUT_TEXT[fieldSize])"
      v-bind="$attrs"
      :aria-describedby="describedBy"
    />
    <FieldStatusIcon :status="fieldStatus" :id="statusId" :class="['translate-y-0', TAGS_INPUT_ICON_TOP[fieldSize]]" />
    <span data-slot="tags-input-status" role="status" class="sr-only">{{ status }}</span>
  </TagsInputRoot>
</template>
