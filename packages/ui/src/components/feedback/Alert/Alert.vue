<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { checkAfterMount, useRequireContent } from '../requireContent'
import { pick } from '../pick'
import { focusAfterDismiss } from '../focusAfterDismiss'
import { ALERT_LAYOUTS, alertActionsVariants, alertBodyVariants, alertIconVariants, alertVariants, type AlertAppearance, type AlertLayout, type AlertSize, type AlertVariant } from './variants'

export interface AlertProps extends BaseProps {
  /** Tone. */
  variant?: AlertVariant
  /** Surface treatment: `soft` (tinted, default), `solid`, `outline`, `minimal`. */
  appearance?: AlertAppearance
  /** Density: `sm`, `md` (default), `lg`. */
  size?: AlertSize
  /** Body layout: `default` (title, description and actions stacked) or `inline` (one wrapping row, actions at the end). */
  layout?: AlertLayout
  /** Optional leading FontAwesome icon. No icon is rendered when omitted. */
  icon?: IconDefinition
  /** Show a dismiss (X) button. */
  dismissible?: boolean
  /** Accessible label of the dismiss button. */
  dismissLabel?: string
  /** Override the computed ARIA role. Defaults to `alert` for warning/destructive and `status` otherwise. */
  role?: 'alert' | 'status' | 'note'
}

const props = withDefaults(defineProps<AlertProps>(), {
  variant: 'default',
  appearance: 'soft',
  size: 'md',
  layout: 'default',
  dismissLabel: 'Dismiss',
})
const emit = defineEmits<{ dismiss: [] }>()

const visible = ref(true)
const root = useTemplateRef('root')
useRequireContent('Alert', () => root.value, 'Put an `AlertTitle` and/or `AlertDescription` (or plain text) inside it.')
checkAfterMount(() => {
  if (props.dismissible) requireText('Alert', 'dismissLabel', props.dismissLabel, 'It is the accessible name of the dismiss (X) button.')
})
const resolvedVariant = computed<AlertVariant>(() =>
  (['default', 'info', 'success', 'warning', 'destructive'] as const).includes(props.variant) ? props.variant : 'default',
)
const resolvedAppearance = computed<AlertAppearance>(() =>
  (['soft', 'solid', 'outline', 'minimal'] as const).includes(props.appearance) ? props.appearance : 'soft',
)
const resolvedSize = computed<AlertSize>(() => (['sm', 'md', 'lg'] as const).includes(props.size) ? props.size : 'md')
const resolvedLayout = computed<AlertLayout>(() => pick(props.layout, ALERT_LAYOUTS, 'default'))
const resolvedRole = computed(() => props.role ?? (['warning', 'destructive'].includes(resolvedVariant.value) ? 'alert' : 'status'))
const classes = computed(() => cn(alertVariants({ variant: resolvedVariant.value, appearance: resolvedAppearance.value, size: resolvedSize.value }), props.class))

const dismissClasses = computed(() =>
  cn(
    '-my-1 -me-2 inline-flex size-7 shrink-0 pointer-coarse:size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground',
    resolvedAppearance.value === 'solid' && 'text-current hover:bg-current/15 hover:text-current',
    focusRing,
  ),
)

function dismiss() {
  if (!visible.value) return
  focusAfterDismiss(root.value)
  visible.value = false
  emit('dismiss')
}
</script>

<template>
  <div
    v-if="visible"
    ref="root"
    data-slot="alert"
    :data-variant="resolvedVariant"
    :data-appearance="resolvedAppearance === 'soft' ? undefined : resolvedAppearance"
    :data-size="resolvedSize === 'md' ? undefined : resolvedSize"
    :data-layout="resolvedLayout === 'default' ? undefined : resolvedLayout"
    :role="resolvedRole"
    :class="classes"
  >
    <span v-if="icon" data-slot="alert-icon" :class="alertIconVariants({ variant: resolvedVariant, appearance: resolvedAppearance, size: resolvedSize })">
      <Icon :icon="icon" />
    </span>
    <div data-slot="alert-body" :class="alertBodyVariants({ layout: resolvedLayout })">
      <slot />
      <div v-if="$slots.actions" data-slot="alert-actions" :class="alertActionsVariants({ layout: resolvedLayout })">
        <slot name="actions" />
      </div>
    </div>
    <button
      v-if="dismissible"
      type="button"
      data-slot="alert-dismiss"
      :aria-label="dismissLabel"
      :class="dismissClasses"
      @click="dismiss"
    >
      <Icon :icon="faXmark" />
    </button>
  </div>
</template>
