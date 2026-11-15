<script setup lang="ts">
import { computed, inject } from 'vue'
import { faChevronRight } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { BREADCRUMB_OPTIONS_KEY } from './context'

const props = defineProps<BaseProps>()
const options = inject(BREADCRUMB_OPTIONS_KEY, undefined)
const kind = computed(() => options?.value.separator ?? 'chevron')
</script>

<template>
  <li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" :data-kind="kind" :class="cn('inline-flex items-center [&>svg]:size-3', props.class)">
    <slot>
      <span v-if="kind === 'slash'" data-slot="breadcrumb-separator-glyph">/</span>
      <span v-else-if="kind === 'dot'" data-slot="breadcrumb-separator-glyph" class="size-1 rounded-full bg-current" />
      <Icon v-else :icon="faChevronRight" size="xs" class="rtl:rotate-180" />
    </slot>
  </li>
</template>
