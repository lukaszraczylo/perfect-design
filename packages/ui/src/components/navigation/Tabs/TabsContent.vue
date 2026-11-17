<script setup lang="ts">
import { computed } from 'vue'
import { TabsContent as RekaContent, type TabsContentProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import { useEntry } from '../contract'
import type { BaseProps } from '../../../lib/types'

const props = defineProps<TabsContentProps & BaseProps>()
useEntry('Tabs', 'content', () => props.value)
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
</script>

<template>
  <RekaContent data-slot="tabs-content" v-bind="delegated" :class="cn('flex-1 rounded-md text-sm data-[state=inactive]:hidden', focusRing, props.class)">
    <slot />
  </RekaContent>
</template>
