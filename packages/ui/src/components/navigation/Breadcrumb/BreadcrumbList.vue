<script setup lang="ts">
import { computed, inject } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { BREADCRUMB_OPTIONS_KEY } from './context'
import { breadcrumbListVariants } from './variants'

const props = defineProps<BaseProps>()
const options = inject(BREADCRUMB_OPTIONS_KEY, undefined)
const classes = computed(() => cn(breadcrumbListVariants({ size: options?.value.size }), props.class))
</script>

<template>
  <ol data-slot="breadcrumb-list" :class="classes">
    <slot />
  </ol>
</template>
