<script setup lang="ts">
import { computed } from 'vue'
import { useOnline } from '../../../lib/use-helpers'
import type { IconDefinition } from '../../../lib/icons-tools'
import { faWifi } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { pick } from '../pick'
import { OFFLINE_INDICATOR_VARIANTS, offlineIndicatorIconVariants, offlineIndicatorVariants, type OfflineIndicatorVariant } from './variants'

export interface OfflineIndicatorProps extends BaseProps {
  /** Look while offline: `default` (bordered box), `banner` (full-width filled strip), `pill` (small chip) or `inline` (icon and text only). */
  variant?: OfflineIndicatorVariant
  /** Message shown while offline. The default slot overrides it. */
  label?: string
  icon?: IconDefinition
  /** Force the state instead of reading `navigator.onLine` (docs, tests, custom connectivity checks). */
  offline?: boolean
}

const props = withDefaults(defineProps<OfflineIndicatorProps>(), {
  variant: 'default',
  label: 'You are offline. Changes may not be saved.',
  icon: () => faWifi,
  offline: undefined,
})

// The live region root stays mounted so screen readers announce the message when it appears.
const online = useOnline()
const resolvedVariant = computed<OfflineIndicatorVariant>(() => pick(props.variant, OFFLINE_INDICATOR_VARIANTS, 'default'))
const isOffline = computed(() => props.offline ?? !online.value)
</script>

<template>
  <div
    data-slot="offline-indicator"
    role="status"
    aria-live="polite"
    :data-state="isOffline ? 'offline' : 'online'"
    :data-variant="resolvedVariant === 'default' ? undefined : resolvedVariant"
    :class="cn(isOffline ? offlineIndicatorVariants({ variant: resolvedVariant }) : 'contents', props.class)"
  >
    <template v-if="isOffline">
      <Icon :icon="icon" :class="offlineIndicatorIconVariants({ variant: resolvedVariant })" />
      <span data-slot="offline-indicator-message" class="min-w-0 break-words"><slot>{{ label }}</slot></span>
    </template>
  </div>
</template>
