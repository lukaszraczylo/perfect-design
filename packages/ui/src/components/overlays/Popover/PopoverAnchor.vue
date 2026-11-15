<script setup lang="ts">
import { PopoverAnchor as RekaAnchor, type PopoverAnchorProps } from 'reka-ui'

const props = defineProps<PopoverAnchorProps>()
</script>

<template>
  <RekaAnchor data-slot="popover-anchor" v-bind="props">
    <slot />
  </RekaAnchor>
</template>
