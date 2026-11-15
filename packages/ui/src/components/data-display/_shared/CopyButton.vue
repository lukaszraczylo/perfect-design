<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import { useClipboard } from '../../../lib/use-helpers'
import { faCheck, faCopy } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'

/**
 * Internal copy-to-clipboard icon button shared by CodeBlock, DescriptionItem and DetailField.
 * The button keeps a constant accessible name (what is copied); the result is announced by a sibling
 * `role="status"` element, because a live region inside a button is not reliably announced.
 */
export interface CopyButtonProps extends BaseProps {
  /** Text placed on the clipboard (a function lets callers read it lazily). */
  text: string | (() => string)
  /** Accessible name of the button: say what is copied ("Copy code", "Copy Region"). */
  label?: string
  /** Announced after a successful copy. */
  copiedLabel?: string
  /** Announced when the clipboard rejected the write. */
  failedLabel?: string
}

const props = withDefaults(defineProps<CopyButtonProps>(), { label: 'Copy', copiedLabel: 'Copied', failedLabel: 'Copy failed' })
const emit = defineEmits<{ copy: [text: string] }>()

const FAILED_MS = 2000
const { copy, copied } = useClipboard({ legacy: true })
const failed = ref(false)
let failTimer: ReturnType<typeof setTimeout> | undefined
onScopeDispose(() => clearTimeout(failTimer), true)

const classes = computed(() => cn('text-muted-foreground', props.class))
const message = computed(() => (copied.value ? props.copiedLabel : failed.value ? props.failedLabel : ''))

async function onClick() {
  const text = typeof props.text === 'function' ? props.text() : props.text
  clearTimeout(failTimer)
  failed.value = false
  const ok = await copy(text).catch(() => false)
  if (ok) {
    emit('copy', text)
    return
  }
  failed.value = true
  failTimer = setTimeout(() => (failed.value = false), FAILED_MS)
}
</script>

<template>
  <span data-slot="copy-button-root" class="contents">
    <Button
      data-slot="copy-button"
      variant="ghost"
      size="icon-xs"
      :class="classes"
      :aria-label="label"
      :data-copied="copied ? '' : undefined"
      :data-failed="failed ? '' : undefined"
      @click="onClick"
    >
      <Icon :icon="copied ? faCheck : faCopy" size="xs" />
    </Button>
    <span data-slot="copy-button-status" role="status" class="sr-only">{{ message }}</span>
  </span>
</template>
