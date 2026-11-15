<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, useId, watch, type HTMLAttributes } from 'vue'
import { faCloudArrowUp, faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import Icon from '../../primitives/Icon/Icon.vue'
import { useFieldControl } from '../Field/useFieldContext'
import FieldStatusIcon from '../Field/FieldStatusIcon.vue'
import { normalizeFieldSize, normalizeStatus, type FieldSize, type FieldStatus } from '../Field/field-variants'
import { FILE_DROPZONE_ICON_SIZES, FILE_DROPZONE_VARIANTS, fileDropzoneVariants, type FileDropzoneVariant } from './variants'

export type FileRejectReason = 'type' | 'size' | 'count'
export interface FileRejection {
  file: File
  reason: FileRejectReason
}

export interface FileDropzoneProps {
  /** Accepted files, v-model. Always an array, also in single mode. */
  modelValue?: File[] | null
  /** Native `accept` syntax: MIME types, wildcards and extensions, e.g. `image/*,.pdf`. */
  accept?: string
  /** Maximum size per file in bytes. */
  maxSize?: number
  /** Maximum number of files kept in total (only meaningful with `multiple`). */
  maxFiles?: number
  multiple?: boolean
  disabled?: boolean
  required?: boolean
  /** Marks the dropzone invalid (aria-invalid, destructive styling). */
  invalid?: boolean
  /** Form field name of the hidden file input. */
  name?: string
  /** Show the list of accepted files with remove buttons. */
  showFiles?: boolean
  /**
   * Extra accessible name prefix, rendered as visually hidden text inside the dropzone so the visible
   * prompt stays part of the name (WCAG 2.5.3). A surrounding `Field` label is added to the name too.
   */
  ariaLabel?: string
  /** Height of the drop area: `xs`, `sm`, `md` (default) or `lg`. */
  size?: FieldSize
  /** Surface of the drop area: `outline` (dashed, default), `solid`, `filled` or `ghost`. */
  variant?: FileDropzoneVariant
  /** Validation status shown with an icon in the top corner as well as colour. `error` also sets `aria-invalid`. */
  status?: FieldStatus
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<FileDropzoneProps>(), { showFiles: true, size: 'md', variant: 'outline', status: 'default' })
const emit = defineEmits<{
  'update:modelValue': [files: File[]]
  /** Files that were not accepted, each with the reason. */
  reject: [rejections: FileRejection[]]
  /** Human-readable summary whenever something was rejected. */
  error: [message: string]
}>()
defineSlots<{
  default?: (props: { dragging: boolean }) => unknown
}>()

const fieldStatus = computed(() => normalizeStatus(props.status))
const fieldSize = computed(() => normalizeFieldSize(props.size))
const control = useFieldControl({ invalid: () => props.invalid || fieldStatus.value === 'error', disabled: () => props.disabled, required: () => props.required })

const files = ref<File[]>([...(props.modelValue ?? [])])
// Keep in sync with controlled usage.
watch(
  () => props.modelValue,
  (v) => {
    if (v) files.value = [...v]
  },
)

const dragging = ref(false)
const errorMessage = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const uid = useId()
const errorId = `file-dropzone-error-${uid}`
const areaId = `file-dropzone-area-${uid}`
const labelId = `file-dropzone-label-${uid}`
const statusMessage = ref('')
// Ids of the `<label>` elements pointing at the hidden input (a surrounding Field label).
const labelIds = ref<string[]>([])
onMounted(() => {
  const labels = Array.from(inputEl.value?.labels ?? [])
  labelIds.value = labels.map((l, i) => {
    if (!l.id) l.id = `${areaId}-field-label-${i}`
    return l.id
  })
})

// Registered after the hook above: the Field label ids must be wired before the name is checked.
// The hidden file input is not a tab stop, but the browser focuses it when native validation (`required`) fails: the template forwards that focus here.
const areaEl = ref<HTMLButtonElement | null>(null)
useRequireAccessibleName('FileDropzone', () => areaEl.value, 'The drop area is a button named by its content: keep the default prompt or put text in the slot (an icon alone has no name), or set `ariaLabel`, or wrap it in `Field` with a `label`.')

const acceptTokens = computed(() =>
  (props.accept ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean),
)

function matchesType(file: File): boolean {
  const tokens = acceptTokens.value
  if (!tokens.length) return true
  const name = file.name.toLowerCase()
  const mime = (file.type || '').toLowerCase()
  return tokens.some((t) => {
    if (t.startsWith('.')) return name.endsWith(t)
    if (t.endsWith('/*')) return mime.startsWith(t.slice(0, -1))
    return mime === t
  })
}

const limit = computed(() => (props.multiple ? (props.maxFiles && props.maxFiles > 0 ? props.maxFiles : Infinity) : 1))
const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${+(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${+(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${+(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function describe(rejections: FileRejection[]): string {
  const by = (r: FileRejectReason) => rejections.filter((x) => x.reason === r)
  const parts: string[] = []
  if (by('type').length) parts.push(`${by('type').map((x) => x.file.name).join(', ')}: file type not allowed`)
  if (by('size').length) parts.push(`${by('size').map((x) => x.file.name).join(', ')}: larger than ${formatSize(props.maxSize!)}`)
  if (by('count').length) {
    parts.push(limit.value === 1 ? 'Only one file is allowed' : `At most ${limit.value} files are allowed`)
  }
  return parts.join('. ')
}

function addFiles(incoming: File[]) {
  if (control.disabled.value || !incoming.length) return
  const rejections: FileRejection[] = []
  const accepted: File[] = []
  // Single mode replaces the current file; multiple mode appends to the current ones.
  const base = props.multiple ? files.value : []
  for (const file of incoming) {
    if (!matchesType(file)) rejections.push({ file, reason: 'type' })
    else if (props.maxSize !== undefined && file.size > props.maxSize) rejections.push({ file, reason: 'size' })
    else if (base.some((f) => sameFile(f, file)) || accepted.some((f) => sameFile(f, file))) continue
    else if (base.length + accepted.length >= limit.value) rejections.push({ file, reason: 'count' })
    else accepted.push(file)
  }
  if (rejections.length) {
    errorMessage.value = describe(rejections)
    emit('reject', rejections)
    emit('error', errorMessage.value)
  } else {
    errorMessage.value = ''
  }
  if (accepted.length) {
    files.value = [...base, ...accepted]
    statusMessage.value = accepted.length === 1 ? `${accepted[0].name} added` : `${accepted.length} files added`
    emit('update:modelValue', [...files.value])
  }
}

function removeFile(index: number) {
  if (control.disabled.value) return
  const removed = files.value[index]
  files.value = files.value.filter((_, i) => i !== index)
  errorMessage.value = ''
  statusMessage.value = removed ? `${removed.name} removed` : ''
  emit('update:modelValue', [...files.value])
}

function open() {
  if (!control.disabled.value) inputEl.value?.click()
}

function onChange(e: Event) {
  const el = e.target as HTMLInputElement
  addFiles(Array.from(el.files ?? []))
  // Allow picking the same file again.
  try {
    el.value = ''
  } catch {
    /* some environments forbid resetting file inputs */
  }
}

let dragDepth = 0
function onDragEnter(e: DragEvent) {
  if (control.disabled.value) return
  e.preventDefault()
  dragDepth++
  dragging.value = true
}
function onDragOver(e: DragEvent) {
  if (control.disabled.value) return
  e.preventDefault()
  dragging.value = true
}
function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dragging.value = false
}
function onDrop(e: DragEvent) {
  e.preventDefault()
  dragDepth = 0
  dragging.value = false
  addFiles(Array.from(e.dataTransfer?.files ?? []))
}

const hasError = computed(() => !!errorMessage.value)
const invalid = computed(() => control.invalid.value || hasError.value)
const attrs = useAttrs()
const statusId = `file-dropzone-status-${uid}`
// Field description, author `aria-describedby`, the rejection message and the hidden success / warning text.
const describedBy = computed(
  () =>
    [attrs['aria-describedby'], control.describedBy.value, hasError.value ? errorId : '', fieldStatus.value === 'success' || fieldStatus.value === 'warning' ? statusId : '']
      .filter(Boolean)
      .join(' ') || undefined,
)

const hint = computed(() => {
  const parts: string[] = []
  if (props.accept) parts.push(`Accepts ${props.accept.split(',').map((t) => t.trim()).filter(Boolean).join(', ')}`)
  if (props.maxSize !== undefined) parts.push(`Up to ${formatSize(props.maxSize)}`)
  if (props.multiple && props.maxFiles) parts.push(`Max ${props.maxFiles} files`)
  return parts.join('. ')
})

// Labelled by the Field label (if any) plus the area itself, so the visible prompt is always in the name.
const labelledBy = computed(() => (labelIds.value.length ? [...labelIds.value, areaId].join(' ') : undefined))

const areaClasses = computed(() =>
  cn(
    fileDropzoneVariants({
      size: fieldSize.value,
      variant: FILE_DROPZONE_VARIANTS.includes(props.variant) ? props.variant : 'outline',
      status: fieldStatus.value,
    }),
    invalid.value && 'border-destructive ring-destructive/20',
  ),
)
</script>

<template>
  <div data-slot="file-dropzone" :data-dragging="dragging ? '' : undefined" :class="cn('flex w-full flex-col gap-2', fieldStatus !== 'default' && 'relative', props.class)">
    <button
      ref="areaEl"
      :id="areaId"
      data-slot="file-dropzone-area"
      type="button"
      :disabled="control.disabled.value"
      :aria-labelledby="labelledBy"
      :aria-invalid="invalid ? 'true' : undefined"
      :data-dragging="dragging ? '' : undefined"
      :class="areaClasses"
      v-bind="$attrs"
      :aria-describedby="describedBy"
      @click="open"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <span v-if="ariaLabel" :id="labelId" data-slot="file-dropzone-label" class="sr-only">{{ ariaLabel }}</span>
      <slot :dragging="dragging">
        <Icon :icon="faCloudArrowUp" :size="FILE_DROPZONE_ICON_SIZES[fieldSize]" />
        <span class="font-medium text-foreground">{{ dragging ? 'Drop to upload' : 'Drag and drop files here, or click to browse' }}</span>
        <span v-if="hint" class="text-xs">{{ hint }}</span>
      </slot>
    </button>
    <FieldStatusIcon :status="fieldStatus" :id="statusId" :class="'top-3 end-3 translate-y-0'" />
    <input
      ref="inputEl"
      data-slot="file-dropzone-input"
      type="file"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      :id="control.id.value"
      :name="name"
      :accept="accept"
      :multiple="multiple"
      :disabled="control.disabled.value"
      :required="control.required.value || undefined"
      @focus="areaEl?.focus()"
      @change="onChange"
    />
    <p data-slot="file-dropzone-status" role="status" class="sr-only">{{ statusMessage }}</p>
    <p v-if="hasError" :id="errorId" data-slot="file-dropzone-error" role="alert" class="text-sm text-destructive">
      {{ errorMessage }}
    </p>
    <ul v-if="showFiles && files.length" data-slot="file-dropzone-list" class="flex flex-col gap-1">
      <li
        v-for="(file, i) in files"
        :key="`${file.name}-${file.size}-${file.lastModified}-${i}`"
        data-slot="file-dropzone-item"
        class="flex min-w-0 items-center justify-between gap-2 rounded-md border bg-card px-3 py-1.5 text-sm"
      >
        <span class="min-w-0 flex-1 truncate" :title="file.name">{{ file.name }}</span>
        <span class="shrink-0 text-xs text-muted-foreground tabular-nums">{{ formatSize(file.size) }}</span>
        <button
          type="button"
          data-slot="file-dropzone-remove"
          :aria-label="`Remove ${file.name}`"
          :disabled="control.disabled.value"
          :class="cn('inline-flex size-6 shrink-0 items-center pointer-coarse:size-11 justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50', focusRing)"
          @click="removeFile(i)"
        >
          <Icon :icon="faXmark" size="sm" />
        </button>
      </li>
    </ul>
  </div>
</template>
