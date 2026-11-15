<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useInputGroup } from './context'
import { inputGroupAddonVariants } from './variants'

export interface InputGroupAddonProps {
  /** Element to render. Use `span` inside a `label`. */
  as?: PrimitiveProps['as']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<InputGroupAddonProps>(), { as: 'div' })
const group = useInputGroup()
const classes = computed(() => cn(inputGroupAddonVariants({ layout: group?.layout() ?? 'inset' }), props.class))
</script>

<template>
  <Primitive data-slot="input-group-addon" :as="as" :class="classes"><slot /></Primitive>
</template>
