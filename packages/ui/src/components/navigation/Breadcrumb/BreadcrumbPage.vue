<script setup lang="ts">
import { cn } from '../../../lib/cn'
import { useRegisterPart } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'

const props = defineProps<BaseProps>()
useRegisterPart('Breadcrumb', 'BreadcrumbPage')
</script>

<template>
  <span
    data-slot="breadcrumb-page"
    role="link"
    aria-disabled="true"
    aria-current="page"
    :class="cn('inline-flex items-center gap-1 font-medium text-foreground [&_svg]:size-3.5', props.class)"
  >
    <slot />
  </span>
</template>
