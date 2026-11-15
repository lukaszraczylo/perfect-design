<script setup lang="ts">
import { computed, ref } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { accessibleName, violation } from '../../../lib/contract'
import { faCheck, faCircleExclamation } from '../../../lib/icons'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import Markdown from '../../typography/Markdown/Markdown.vue'
import { useMountedCheck } from '../_shared/contract'
import ChatMessageImageLink from './ChatMessageImageLink.vue'
import { formatTime, toDate, type ChatDateInput } from './date'
import {
  CHAT_MESSAGE_ALIGNS,
  CHAT_MESSAGE_ROLES,
  CHAT_MESSAGE_STATUSES,
  CHAT_MESSAGE_VARIANTS,
  chatMessageActionsClasses,
  chatMessageBodyVariants,
  chatMessageMainVariants,
  chatMessageVariants,
  type ChatMessageAlign,
  type ChatMessageRole,
  type ChatMessageStatus,
  type ChatMessageVariant,
} from './variants'

export interface ChatMessageProps extends BaseProps {
  /** Who wrote it: `user` (default alignment `end`), `assistant` (default), `system` or `tool`. Unknown values fall back to `assistant`. */
  role?: ChatMessageRole
  /** Surface: `bubble` (default, tinted box), `plain` (no box, for transcripts) or `card` (bordered panel). Unknown values fall back to `bubble`. */
  variant?: ChatMessageVariant
  /** Side the message sits on: `start` or `end`. Defaults to `end` for `user` and `start` for every other role. Unknown values use that default. */
  align?: ChatMessageAlign
  /** Display name shown in the header, for example the participant or tool name. */
  name?: string
  /** When it was sent. A valid value renders a real `<time datetime>` in the header; an invalid one is ignored. */
  datetime?: ChatDateInput
  /** Visible time text instead of the formatted time, for example `Just now`. Shown as plain text when `datetime` is missing or invalid. */
  timeLabel?: string
  /** BCP 47 locale for the formatted time. Bad values fall back to the runtime default. */
  locale?: string
  /** IANA time zone for the formatted time (for example `UTC`), so server and browser render the same text. Bad values fall back to local time. */
  timeZone?: string
  /** Visually hidden text read before the content, for example `Ada said`. Defaults to a plain phrase for the role ("You said", "Assistant said", "System message", "Tool result"); the appended colon is added for you. */
  roleLabel?: string
  /** Delivery state, always written as text: `sending`, `sent`, `error` or `streaming`. Unknown values show nothing. */
  status?: ChatMessageStatus
  /** Text for the status instead of the default ("Sending", "Sent", "Failed to send", "Responding"). */
  statusLabel?: string
  /** Put the status text in a polite `role="status"` region so changes are announced. Off by default: a thread would otherwise announce every message. */
  live?: boolean
  /** Markdown source rendered through `Markdown` (HTML is never parsed, unsafe link and image URLs are dropped). Wins over the default slot. Use with `status="streaming"` while text arrives. */
  markdown?: string
  /** Render http(s) images from `markdown` inline. Off by default: they become links, so reading a message sends no request. */
  showImages?: boolean
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<ChatMessageProps>(), {
  role: 'assistant',
  variant: 'bubble',
  align: undefined,
  name: undefined,
  datetime: undefined,
  timeLabel: undefined,
  locale: undefined,
  timeZone: undefined,
  roleLabel: undefined,
  status: undefined,
  statusLabel: undefined,
  live: false,
  markdown: undefined,
  showImages: false,
  as: 'div',
})

defineSlots<{
  default(): unknown
  avatar(): unknown
  header(props: { author?: string; datetime: Date | null }): unknown
  actions(): unknown
}>()

const ROLE_LABELS: Record<ChatMessageRole, string> = {
  user: 'You said',
  assistant: 'Assistant said',
  system: 'System message',
  tool: 'Tool result',
}
const STATUS_LABELS: Record<ChatMessageStatus, string> = {
  sending: 'Sending',
  sent: 'Sent',
  error: 'Failed to send',
  streaming: 'Responding',
}

const role = computed<ChatMessageRole>(() => (CHAT_MESSAGE_ROLES.includes(props.role) ? props.role : 'assistant'))
const variant = computed<ChatMessageVariant>(() => (CHAT_MESSAGE_VARIANTS.includes(props.variant) ? props.variant : 'bubble'))
const align = computed<ChatMessageAlign>(() => (CHAT_MESSAGE_ALIGNS.includes(props.align as ChatMessageAlign) ? (props.align as ChatMessageAlign) : role.value === 'user' ? 'end' : 'start'))
const status = computed<ChatMessageStatus | undefined>(() => (props.status && CHAT_MESSAGE_STATUSES.includes(props.status) ? props.status : undefined))
const statusText = computed(() => (status.value ? (props.statusLabel?.trim() ? props.statusLabel : STATUS_LABELS[status.value]) : ''))
const roleText = computed(() => (props.roleLabel?.trim() ? props.roleLabel.trim().replace(/[:\s]+$/, '') : ROLE_LABELS[role.value]))

const date = computed(() => toDate(props.datetime))
const timeText = computed(() => (props.timeLabel?.trim() ? props.timeLabel : date.value ? formatTime(date.value, props.locale, props.timeZone) : ''))
const hasName = computed(() => !!props.name?.trim())

const markdownComponents = computed(() => (props.showImages ? undefined : { image: ChatMessageImageLink }))

const classes = computed(() => cn(chatMessageVariants({ align: align.value }), props.class))
const mainClasses = computed(() => chatMessageMainVariants({ align: align.value, variant: variant.value }))
const bodyClasses = computed(() => chatMessageBodyVariants({ variant: variant.value, role: role.value }))
const actionsClasses = computed(() => cn(chatMessageActionsClasses, align.value === 'end' && 'justify-end'))

// Every control in the actions slot needs a name: an icon-only copy or retry button would otherwise be announced as just "button".
const actionsEl = ref<HTMLElement | null>(null)
useMountedCheck(() => {
  const controls = actionsEl.value?.querySelectorAll('button, a[href], [role="button"]') ?? []
  for (const control of controls) {
    if (!accessibleName(control)) {
      violation('ChatMessage', 'requires-action-name', 'needs an accessible name on every control in the `actions` slot. Give icon-only buttons an `aria-label` such as "Copy message" or "Retry".')
      return
    }
  }
})
</script>

<template>
  <Primitive
    data-slot="chat-message"
    :as="as"
    :data-role="role"
    :data-variant="variant"
    :data-align="align"
    :data-status="status"
    :aria-busy="status === 'sending' || status === 'streaming' ? 'true' : undefined"
    :class="classes"
  >
    <div v-if="$slots.avatar" data-slot="chat-message-avatar" class="shrink-0">
      <slot name="avatar" />
    </div>
    <div data-slot="chat-message-main" :class="mainClasses">
      <div v-if="$slots.header || hasName || timeText" data-slot="chat-message-header" class="flex min-w-0 max-w-full flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground">
        <slot name="header" :author="name" :datetime="date">
          <span v-if="hasName" data-slot="chat-message-name" class="min-w-0 break-words font-medium text-foreground">{{ name }}</span>
          <time v-if="date && timeText" data-slot="chat-message-time" :datetime="date.toISOString()" class="text-xs tabular-nums">{{ timeText }}</time>
          <span v-else-if="timeText" data-slot="chat-message-time" class="text-xs tabular-nums">{{ timeText }}</span>
        </slot>
      </div>
      <div data-slot="chat-message-body" :class="bodyClasses">
        <span data-slot="chat-message-role" class="sr-only">{{ roleText }}: </span>
        <Markdown v-if="markdown !== undefined" size="sm" :tone="role === 'system' ? 'muted' : 'default'" :streaming="status === 'streaming'" external-target="_blank" :components="markdownComponents" class="max-w-none" :source="markdown" />
        <slot v-else />
      </div>
      <div v-if="status || $slots.actions" data-slot="chat-message-footer" class="flex min-h-6 flex-wrap items-center gap-2 text-xs" :class="align === 'end' ? 'flex-row-reverse' : ''">
        <span
          v-if="status"
          data-slot="chat-message-status"
          :data-status="status"
          :role="live ? 'status' : undefined"
          class="inline-flex items-center gap-1"
          :class="status === 'error' ? 'text-destructive' : 'text-muted-foreground'"
        >
          <Icon v-if="status === 'error'" :icon="faCircleExclamation" size="xs" />
          <Icon v-else-if="status === 'sent'" :icon="faCheck" size="xs" />
          <span v-else-if="status === 'streaming'" aria-hidden="true" class="size-2 rounded-full bg-current motion-safe:animate-pulse" />
          {{ statusText }}
        </span>
        <div v-if="$slots.actions" ref="actionsEl" data-slot="chat-message-actions" :class="actionsClasses">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </Primitive>
</template>
