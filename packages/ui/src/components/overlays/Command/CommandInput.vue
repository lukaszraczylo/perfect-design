<script setup lang="ts">
import { computed, useTemplateRef, type HTMLAttributes } from 'vue'
import { ListboxFilter, useForwardProps, type ListboxFilterProps } from 'reka-ui'
import { faMagnifyingGlass } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import Icon from '../../primitives/Icon/Icon.vue'
import { triggerElement } from '../triggerCheck'
import { useCommand, useCommandSize } from './commandContext'
import { commandInputVariants, commandInputWrapperVariants } from './variants'

defineOptions({ inheritAttrs: false })

const props = defineProps<Omit<ListboxFilterProps, 'modelValue'> & { class?: HTMLAttributes['class'] }>()
/** The text lives in the parent Command (v-model:search); CommandInput must be used inside a Command. */
const command = useCommand()

const value = computed({
  get: () => command?.search.value ?? '',
  set: (v: string) => {
    if (command) command.search.value = v
  },
})

const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)

const size = useCommandSize()
const input = useTemplateRef('input')
useRequireAccessibleName('CommandInput', () => triggerElement(input.value), 'It defaults to `aria-label="Search"`; do not override it with an empty value, pass a descriptive `aria-label` instead.')
</script>

<template>
  <div data-slot="command-input-wrapper" :class="commandInputWrapperVariants({ size })">
    <Icon :icon="faMagnifyingGlass" class="text-muted-foreground" />
    <ListboxFilter
      ref="input"
      v-model="value"
      v-bind="{ 'aria-label': 'Search', ...$attrs, ...forwarded }"
      data-slot="command-input"
      :class="cn(commandInputVariants({ size }), props.class)"
    />
  </div>
</template>
