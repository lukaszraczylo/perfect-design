<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { ListboxGroup, ListboxGroupLabel, useForwardProps, type ListboxGroupProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { provideCommandGroup, useCommand, useCommandSize } from './commandContext'
import { commandHeadingVariants } from './variants'

const props = defineProps<ListboxGroupProps & { heading?: string; class?: HTMLAttributes['class'] }>()
const delegated = computed(() => {
  const { class: _c, heading: _h, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)

const command = useCommand()
const size = useCommandSize()
const group = provideCommandGroup()
// v-show (not v-if) so hidden groups keep their items mounted and registered.
const hidden = computed(() => !!command && command.shouldFilter.value && group.visible.size === 0)
</script>

<template>
  <ListboxGroup v-show="!hidden" data-slot="command-group" v-bind="forwarded" :class="cn('overflow-hidden text-foreground', props.class)">
    <ListboxGroupLabel v-if="heading" data-slot="command-group-heading" :class="commandHeadingVariants({ size })">
      {{ heading }}
    </ListboxGroupLabel>
    <slot />
  </ListboxGroup>
</template>
