<script setup lang="ts">
/** Internal: one value cell (check / cross / dash / text) with screen-reader text. Not exported. */
import { computed } from 'vue'
import { faCheck, faMinus, faXmark } from '../../../lib/icons'
import Icon from '../../primitives/Icon/Icon.vue'
import { comparisonKind } from './variants'

const props = withDefaults(
  defineProps<{ value?: unknown; includedLabel?: string; excludedLabel?: string; unavailableLabel?: string }>(),
  { includedLabel: 'Included', excludedLabel: 'Not included', unavailableLabel: 'Not available' },
)
const kind = computed(() => comparisonKind(props.value))
</script>

<template>
  <span data-slot="comparison-table-value" :data-kind="kind" class="inline-flex items-center justify-center gap-1">
    <template v-if="kind === 'yes'">
      <Icon :icon="faCheck" class="text-success" />
      <span class="sr-only">{{ includedLabel }}</span>
    </template>
    <template v-else-if="kind === 'no'">
      <Icon :icon="faXmark" class="text-muted-foreground" />
      <span class="sr-only">{{ excludedLabel }}</span>
    </template>
    <template v-else-if="kind === 'text'">{{ String(value) }}</template>
    <template v-else>
      <Icon :icon="faMinus" class="text-muted-foreground" />
      <span class="sr-only">{{ unavailableLabel }}</span>
    </template>
  </span>
</template>
