<script setup lang="ts">
import { computed, getCurrentInstance, ref } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { toneIcons, type FeedbackTone } from '../tones'
import { pick } from '../pick'
import { useConfigLabels } from '../../layout/ConfigProvider/config'
import Icon from '../../primitives/Icon/Icon.vue'
import { normalizeOverlayTone, type OverlayTone } from '../../overlays/overlayTone'
import {
  alertDialogSizes,
  alertDialogVariantNames,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  type AlertDialogSize,
  type AlertDialogVariant,
} from '../../overlays/AlertDialog'
import Button from '../../primitives/Button/Button.vue'
import { checkAfterMount } from '../requireContent'

export interface ConfirmDialogProps extends BaseProps {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Styles the confirm button as destructive. */
  destructive?: boolean
  /**
   * Tone of the prompt: `neutral` (default), `danger`, `warning`, `success` or `info`. Non-neutral tones tint the panel border and
   * show a status icon beside the title; `danger` also makes the confirm button destructive. The title and labels still carry the meaning.
   */
  tone?: OverlayTone
  /** Max width of the panel from the `sm` breakpoint: `xs`, `sm` (default), `md` or `lg`. */
  size?: AlertDialogSize
  /** `default` (left-aligned) or `centered` (text, icon and buttons centred). */
  variant?: AlertDialogVariant
  /** External busy state (e.g. a request owned by the parent). Blocks closing and double confirm. */
  loading?: boolean
  /**
   * Confirm handler (`@confirm`). Declared as a prop so its returned promise can be awaited:
   * the dialog stays open and shows a spinner until it settles, closes on success and shows the
   * error message (and emits `error`) when it rejects.
   */
  onConfirm?: () => unknown
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  tone: 'neutral',
  size: 'sm',
  variant: 'default',
})
const emit = defineEmits<{
  /** Dismissed without confirming (Cancel button or Escape). */
  cancel: []
  /** The confirm handler threw or rejected. */
  error: [error: unknown]
}>()
const open = defineModel<boolean>('open', { default: false })

// Precedence per string: the prop, then a surrounding ConfigProvider (`confirmDialog.*`), then the English default.
const text = useConfigLabels('confirmDialog', { confirm: 'Confirm', cancel: 'Cancel', defaultTitle: 'Are you sure?', error: 'Something went wrong. Please try again.' })
const confirmText = computed(() => props.confirmLabel ?? text.value.confirm)
const cancelText = computed(() => props.cancelLabel ?? text.value.cancel)

// Contract: a title (the heading falls back to a generic question, which hides the mistake), a way to open it
// (`open` / v-model:open: there is no trigger) and a way to learn the outcome (`@confirm`; Cancel emits `cancel`).
const instance = getCurrentInstance()
checkAfterMount(() => {
  requireText('ConfirmDialog', 'title', props.title, 'Name the action being confirmed, for example "Delete 3 invoices?".')
  // A Boolean prop reads `false` when absent, so look at what the parent actually passed.
  if (!instance?.vnode.props || !('open' in instance.vnode.props)) {
    violation('ConfirmDialog', 'requires-open', 'requires `open` (use v-model:open): it has no trigger of its own, so without it the dialog can never be shown.')
  }
  if (typeof props.onConfirm !== 'function') {
    violation('ConfirmDialog', 'requires-confirm-handler', 'requires an `@confirm` handler, or the answer is lost. Use useConfirm().confirm(...) with <ConfirmHost /> to get a boolean back.')
  }
})

const TONE_BUBBLE: Record<OverlayTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  danger: 'bg-destructive/10 text-destructive',
  warning: 'bg-warning/20 text-warning-foreground dark:text-warning',
  success: 'bg-success/15 text-success',
  info: 'bg-info/15 text-info',
}

const pending = ref(false)
const errorMessage = ref('')
const busy = computed(() => pending.value || props.loading)
const toneKey = computed<OverlayTone>(() => normalizeOverlayTone(props.tone))
const sizeKey = computed<AlertDialogSize>(() => pick(props.size, alertDialogSizes, 'sm'))
const variantKey = computed<AlertDialogVariant>(() => pick(props.variant, alertDialogVariantNames, 'default'))
const toneIcon = computed(() => (toneKey.value === 'neutral' ? undefined : toneIcons[toneKey.value as FeedbackTone]))
const toneBubble = computed(() =>
  cn('mb-1 flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-5', TONE_BUBBLE[toneKey.value], variantKey.value === 'centered' ? 'self-center' : 'self-center sm:self-start'),
)
const confirmVariant = computed(() => (props.destructive || toneKey.value === 'danger' ? 'destructive' : 'default'))
const heading = computed(() => props.title?.trim() || text.value.defaultTitle)

function close() {
  errorMessage.value = ''
  open.value = false
}

function cancel() {
  if (busy.value) return
  emit('cancel')
  close()
}

function onOpenChange(next: boolean) {
  if (next) {
    open.value = true
    return
  }
  cancel()
}

function guard(e: Event) {
  if (busy.value) e.preventDefault()
}

async function confirm() {
  if (busy.value) return
  pending.value = true
  errorMessage.value = ''
  try {
    await props.onConfirm?.()
  } catch (e) {
    errorMessage.value = e instanceof Error && e.message ? e.message : text.value.error
    emit('error', e)
    return
  } finally {
    pending.value = false
  }
  close()
}
</script>

<template>
  <!-- role=alertdialog: initial focus goes to Cancel (the safe action) and the dialog is not dismissed by clicking outside. -->
  <AlertDialog :open="open" @update:open="onOpenChange">
    <AlertDialogContent :size="sizeKey" :variant="variantKey" :tone="toneKey" :class="cn(props.class)" @escape-key-down="guard">
      <AlertDialogHeader>
        <span v-if="toneIcon" data-slot="confirm-dialog-icon" aria-hidden="true" :class="toneBubble"><Icon :icon="toneIcon" /></span>
        <AlertDialogTitle data-slot="confirm-dialog-title" class="break-words">{{ heading }}</AlertDialogTitle>
        <AlertDialogDescription v-if="description" data-slot="confirm-dialog-description" class="break-words">{{ description }}</AlertDialogDescription>
        <AlertDialogDescription v-else class="sr-only">{{ heading }}</AlertDialogDescription>
      </AlertDialogHeader>
      <slot />
      <p v-if="errorMessage" data-slot="confirm-dialog-error" role="alert" class="text-sm break-words text-destructive">{{ errorMessage }}</p>
      <AlertDialogFooter>
        <AlertDialogCancel data-slot="confirm-dialog-cancel" :disabled="busy">{{ cancelText }}</AlertDialogCancel>
        <Button data-slot="confirm-dialog-confirm" :variant="confirmVariant" :loading="busy" @click="confirm">
          {{ confirmText }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
