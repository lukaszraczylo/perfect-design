<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch, type HTMLAttributes } from 'vue'
import { faArrowUp, faCircleExclamation } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import { useFieldControl } from '../Field/useFieldContext'
import { stopIcon } from './icons'
import { normalizePromptSize, normalizePromptVariant, promptInputVariants, type PromptInputSize, type PromptInputVariant } from './variants'

export interface PromptInputProps {
  /** Text of the prompt (`v-model`). Uncontrolled when omitted. */
  modelValue?: string | null
  placeholder?: string
  /** Which key sends: `enter` (Shift+Enter inserts a line break) or `mod-enter` (Ctrl or Cmd with Enter sends, Enter inserts a line break). */
  submitOn?: 'enter' | 'mod-enter'
  /** A response is in progress: the Send button is replaced by a Stop button and submitting is blocked. */
  loading?: boolean
  /** Blocks editing, sending and Stop. Also inherited from a surrounding Field. */
  disabled?: boolean
  /** Blocks editing and sending; Stop keeps working while `loading`. */
  readonly?: boolean
  /** Marks the prompt invalid (`aria-invalid`) and applies destructive styling. Also set when over `maxLength`. */
  invalid?: boolean
  /** Surface of the prompt box: `default` (bordered), `filled` (muted fill) or `minimal` (border on hover and focus). */
  variant?: PromptInputVariant
  /** Text size and padding: `sm`, `md` or `lg`. */
  size?: PromptInputSize
  /** Rows shown while the text is short. */
  rows?: number
  /** Rows the field grows to before it scrolls. */
  maxRows?: number
  /** Character limit, counted in code points. Typing past it is allowed, shows an over-limit state and blocks sending. */
  maxLength?: number
  /** Empty the field after a successful submit (and emit `update:modelValue` with `''`). Turn off to keep the text until the app decides. */
  clearOnSubmit?: boolean
  /** Name of the Send button. */
  submitLabel?: string
  /** Name of the Stop button. */
  stopLabel?: string
  /** Announced politely once when the text reaches 90% of `maxLength`. */
  limitNearLabel?: string
  /** Shown beside the counter and announced politely once when the text is over `maxLength`. */
  limitOverLabel?: string
  /** Merged onto the root (the prompt box). Other attributes go to the `<textarea>`. */
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<PromptInputProps>(), {
  modelValue: undefined,
  submitOn: 'enter',
  variant: 'default',
  size: 'md',
  rows: 1,
  maxRows: 8,
  clearOnSubmit: true,
  submitLabel: 'Send',
  stopLabel: 'Stop',
  limitNearLabel: 'Close to the character limit',
  limitOverLabel: 'Over the character limit',
})
const emit = defineEmits<{ 'update:modelValue': [value: string]; submit: [value: string]; stop: [] }>()

const BUTTON_SIZES = { sm: 'icon-sm', md: 'icon', lg: 'icon-lg' } as const
/** Share of `maxLength` at which the polite warning is announced. */
const NEAR = 0.9

const attrs = useAttrs()
const uid = useId()
const control = useFieldControl({ invalid: () => props.invalid || over.value, disabled: () => props.disabled })
const countId = `prompt-input-${uid}-count`

const model = ref(props.modelValue ?? '')
watch(
  () => props.modelValue,
  (v) => {
    model.value = v ?? ''
  },
)

const el = ref<HTMLTextAreaElement | null>(null)
useRequireAccessibleName('PromptInput', () => el.value, 'Wrap it in `Field` with a `label`, wrap it in a `<label>`, or set `aria-label` / `aria-labelledby`. A placeholder is not a name.')

const variant = computed(() => normalizePromptVariant(props.variant))
const size = computed(() => normalizePromptSize(props.size))

const count = computed(() => Array.from(model.value).length)
const limit = computed(() => (typeof props.maxLength === 'number' && props.maxLength > 0 ? props.maxLength : 0))
const over = computed(() => limit.value > 0 && count.value > limit.value)
const near = computed(() => limit.value > 0 && !over.value && count.value >= limit.value * NEAR)
/** Static messages only (never the running count), so the live region speaks when the state changes, not on every key. */
const liveMessage = computed(() => (over.value ? props.limitOverLabel : near.value ? props.limitNearLabel : ''))

const trimmed = computed(() => model.value.trim())
const locked = computed(() => control.disabled.value || !!props.readonly)
const canSubmit = computed(() => !locked.value && !props.loading && trimmed.value !== '' && !over.value)

function submit() {
  if (!canSubmit.value) return
  const value = trimmed.value
  emit('submit', value)
  if (props.clearOnSubmit) {
    model.value = ''
    emit('update:modelValue', '')
  }
}

function onInput(e: Event) {
  const v = (e.target as HTMLTextAreaElement).value
  model.value = v
  emit('update:modelValue', v)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  // An Enter that confirms an IME candidate (isComposing, or keyCode 229 in browsers that clear the flag first) never sends.
  if (e.isComposing || e.keyCode === 229) return
  if (props.submitOn === 'mod-enter') {
    if (!(e.ctrlKey || e.metaKey)) return
  } else if (e.shiftKey || e.altKey) {
    return
  }
  e.preventDefault()
  submit()
}

function resize() {
  const t = el.value
  if (!t) return
  t.style.height = 'auto'
  const full = t.scrollHeight
  // No layout (jsdom, a hidden container): there is nothing to measure, so leave the height to `rows`.
  if (!full) {
    t.style.height = ''
    return
  }
  const cs = getComputedStyle(t)
  const line = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 16) * 1.5
  const pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
  const rows = Math.max(1, props.maxRows || 1)
  t.style.height = `${Math.min(full, line * rows + pad)}px`
}

let observer: ResizeObserver | undefined
let lastWidth = 0
onMounted(() => {
  resize()
  if (typeof ResizeObserver === 'undefined' || !el.value) return
  // A narrower box wraps the same text onto more lines: measure again when the width (not the height) changes.
  observer = new ResizeObserver((entries) => {
    const w = entries[0]?.contentRect.width ?? 0
    if (w !== lastWidth) {
      lastWidth = w
      resize()
    }
  })
  observer.observe(el.value)
})
onBeforeUnmount(() => observer?.disconnect())
watch(model, () => nextTick(resize))
watch(() => [props.maxRows, props.size, props.rows], () => nextTick(resize))

function describedBy(): string | undefined {
  const ids = [attrs['aria-describedby'] as string | undefined, control.describedBy.value, limit.value ? countId : undefined].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
}

defineExpose({ el, resize, submit, focus: () => el.value?.focus() })
</script>

<template>
  <div
    data-slot="prompt-input"
    :data-loading="loading ? '' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :class="cn(promptInputVariants({ variant, size }), props.class)"
  >
    <div v-if="$slots.header" data-slot="prompt-input-header" class="min-w-0">
      <slot name="header" />
    </div>
    <textarea
      ref="el"
      data-slot="prompt-input-textarea"
      v-bind="$attrs"
      :id="($attrs.id as string | undefined) ?? control.id.value"
      :value="model"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="control.disabled.value"
      :readonly="readonly"
      :aria-invalid="control.invalid.value ? 'true' : undefined"
      :aria-describedby="describedBy()"
      class="block w-full min-w-0 resize-none overflow-y-auto bg-transparent px-2 py-1.5 break-words text-inherit outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed"
      @input="onInput"
      @keydown="onKeydown"
    />
    <div data-slot="prompt-input-toolbar" class="flex min-w-0 flex-wrap items-center gap-2">
      <div v-if="$slots.attach" data-slot="prompt-input-attach" class="flex min-w-0 items-center gap-1">
        <slot name="attach" />
      </div>
      <div class="ms-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
        <span
          v-if="limit"
          :id="countId"
          data-slot="prompt-input-count"
          :data-state="over ? 'over' : near ? 'near' : 'ok'"
          :class="cn('inline-flex items-center gap-1 text-xs tabular-nums', over ? 'font-medium text-destructive' : near ? 'font-medium text-foreground' : 'text-muted-foreground')"
        >
          <Icon v-if="over" :icon="faCircleExclamation" size="sm" />
          <span>{{ count }} / {{ limit }}</span>
          <span v-if="over">{{ limitOverLabel }}</span>
        </span>
        <span v-if="limit" data-slot="prompt-input-limit-status" role="status" class="sr-only">{{ liveMessage }}</span>
        <slot name="actions" />
        <Button
          v-if="loading"
          data-slot="prompt-input-stop"
          variant="outline"
          :size="BUTTON_SIZES[size]"
          rounded="full"
          :disabled="control.disabled.value"
          :aria-label="stopLabel"
          @click="emit('stop')"
        >
          <Icon :icon="stopIcon" />
        </Button>
        <Button
          v-else
          data-slot="prompt-input-submit"
          :size="BUTTON_SIZES[size]"
          rounded="full"
          :disabled="!canSubmit"
          :aria-label="submitLabel"
          @click="submit"
        >
          <Icon :icon="faArrowUp" />
        </Button>
      </div>
    </div>
    <div v-if="$slots.footer" data-slot="prompt-input-footer" class="min-w-0 px-2 text-xs text-muted-foreground">
      <slot name="footer" />
    </div>
  </div>
</template>
