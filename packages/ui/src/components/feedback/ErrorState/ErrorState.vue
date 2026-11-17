<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { faRotateRight, faTriangleExclamation } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import { checkAfterMount } from '../requireContent'
import { pick } from '../pick'
import { getErrorStatePreset } from './presets'
import {
  errorStateActionsVariants,
  errorStateCodeVariants,
  errorStateDetailsVariants,
  errorStateIconVariants,
  errorStateMessageVariants,
  errorStateTitleVariants,
  errorStateVariants,
  ERROR_STATE_LAYOUTS,
  ERROR_STATE_SIZES,
  ERROR_STATE_TONES,
  ERROR_STATE_VARIANTS,
  type ErrorStateLayout,
  type ErrorStateSize,
  type ErrorStateTone,
  type ErrorStateVariant,
} from './variants'

export interface ErrorStateProps extends BaseProps {
  /** Heading. Falls back to the `status` preset title, then to "Something went wrong". */
  title?: string
  /** Human-readable explanation. Keep it short and actionable. Falls back to the `status` preset message. */
  message?: string
  /** Technical detail (stack, response body, request id) shown in a collapsible block. */
  details?: string
  /**
   * Layout: `default` (centred block), `card` (bordered surface), `inline` (single row: icon, text, retry; for widgets and list items)
   * or `page` (full-viewport 404/500 layout with an `h1` title and larger type).
   */
  variant?: ErrorStateVariant
  /** Padding, gap and type scale of the `default` and `card` variants: `sm`, `md` (default) or `lg`. */
  size?: ErrorStateSize
  /** `center` (default) or `start` (icon, text and actions aligned to the start edge; for forms, panels and left-aligned pages). */
  layout?: ErrorStateLayout
  /** Colour of the icon: `danger` (default), `warning` (degraded service) or `neutral` (not found, no access). */
  tone?: ErrorStateTone
  /** HTTP status preset (`404`, `403`, `500`, `503`): fills `code`, title, message and the default of `retryable` (false for 403/404). */
  status?: number | string
  /** Large code shown instead of the icon, e.g. `404`. Defaults to `status`. */
  code?: number | string
  /** Show the retry button. Defaults to true, or to the `status` preset (false for 403/404). */
  retryable?: boolean
  retryLabel?: string
  /** Disables the retry button and shows a spinner while the retry is running. */
  retrying?: boolean
  detailsLabel?: string
  icon?: IconDefinition
  /** Heading element for the title. Defaults to `h1` for `page` and `h3` otherwise. */
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div'
}

const props = withDefaults(defineProps<ErrorStateProps>(), {
  variant: 'default',
  size: 'md',
  layout: 'center',
  tone: 'danger',
  retryable: undefined,
  retryLabel: 'Try again',
  detailsLabel: 'Technical details',
  icon: () => faTriangleExclamation,
})
const emit = defineEmits<{ retry: [] }>()

const resolvedVariant = computed<ErrorStateVariant>(() => pick(props.variant, ERROR_STATE_VARIANTS, 'default'))
const resolvedSize = computed<ErrorStateSize>(() => pick(props.size, ERROR_STATE_SIZES, 'md'))
const resolvedLayout = computed<ErrorStateLayout>(() => pick(props.layout, ERROR_STATE_LAYOUTS, 'center'))
const resolvedTone = computed<ErrorStateTone>(() => pick(props.tone, ERROR_STATE_TONES, 'danger'))
const preset = computed(() => getErrorStatePreset(props.status))
const heading = computed(() => props.title?.trim() || preset.value?.title || 'Something went wrong')
const messageText = computed(() => props.message || preset.value?.message)
const codeText = computed(() => {
  const c = props.code ?? props.status
  return c === undefined || c === null || String(c).trim() === '' ? undefined : String(c)
})
const slots = useSlots()
// An error without an explanation leaves the person nowhere to go: a `message`, a known `status`, or the default slot.
checkAfterMount(() => {
  if (!messageText.value?.trim() && !slots.default) {
    violation('ErrorState', 'requires-message', 'requires a `message` (or a known `status` such as 404, or the default slot). Say what went wrong and what the person can do about it.')
  }
})

const showRetry = computed(() => props.retryable ?? preset.value?.retryable ?? true)
const hasDetails = computed(() => !!props.details?.trim())
const titleTag = computed(() => {
  const allowed = ['h1', 'h2', 'h3', 'h4', 'p', 'div']
  if (props.titleAs && allowed.includes(props.titleAs)) return props.titleAs
  return resolvedVariant.value === 'page' ? 'h1' : 'h3'
})
const parts = computed(() => ({ variant: resolvedVariant.value, size: resolvedSize.value }))
const classes = computed(() =>
  cn(errorStateVariants({ variant: resolvedVariant.value, size: resolvedSize.value, layout: resolvedLayout.value, tone: resolvedTone.value }), props.class),
)

function retry() {
  if (props.retrying) return
  emit('retry')
}
</script>

<template>
  <div
    data-slot="error-state"
    role="alert"
    :data-variant="resolvedVariant === 'default' ? undefined : resolvedVariant"
    :data-size="resolvedSize === 'md' ? undefined : resolvedSize"
    :data-layout="resolvedLayout === 'center' ? undefined : resolvedLayout"
    :data-tone="resolvedTone === 'danger' ? undefined : resolvedTone"
    :class="classes"
  >
    <p v-if="codeText" data-slot="error-state-code" :class="errorStateCodeVariants(parts)">{{ codeText }}</p>
    <div v-else data-slot="error-state-icon" :class="errorStateIconVariants({ ...parts, tone: resolvedTone })">
      <Icon :icon="icon" />
    </div>
    <component :is="titleTag" data-slot="error-state-title" :class="errorStateTitleVariants(parts)">{{ heading }}</component>
    <p v-if="messageText || $slots.default" data-slot="error-state-message" :class="errorStateMessageVariants(parts)">
      <slot>{{ messageText }}</slot>
    </p>
    <div v-if="showRetry || $slots.actions" data-slot="error-state-actions" :class="errorStateActionsVariants({ variant: resolvedVariant, layout: resolvedLayout })">
      <Button v-if="showRetry" variant="outline" size="sm" :loading="retrying" :aria-busy="retrying ? 'true' : undefined" data-slot="error-state-retry" @click="retry">
        <Icon v-if="!retrying" :icon="faRotateRight" />
        {{ retryLabel }}
      </Button>
      <slot name="actions" />
    </div>
    <details v-if="hasDetails" data-slot="error-state-details" :class="errorStateDetailsVariants({ variant: resolvedVariant, layout: resolvedLayout })">
      <summary :class="cn('w-fit cursor-pointer rounded-sm text-xs font-medium text-muted-foreground select-none hover:text-foreground', focusRing)">
        {{ detailsLabel }}
      </summary>
      <pre
        tabindex="0"
        role="region"
        :aria-label="detailsLabel"
        :class="cn('mt-2 max-h-64 overflow-auto rounded-md border bg-muted p-3 text-start text-xs break-words whitespace-pre-wrap text-foreground', focusRing)"
      >{{ details }}</pre>
    </details>
  </div>
</template>
