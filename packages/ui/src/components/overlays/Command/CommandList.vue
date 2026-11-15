<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, type HTMLAttributes } from 'vue'
import { ListboxContent, useForwardProps, type ListboxContentProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import { triggerElement } from '../triggerCheck'
import { useCommandSize } from './commandContext'
import { commandListVariants } from './variants'

const props = withDefaults(defineProps<ListboxContentProps & { class?: HTMLAttributes['class']; label?: string }>(), { label: 'Results' })
const attrs = useAttrs()
const delegated = computed(() => {
  const { class: _c, label: _l, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)

const size = useCommandSize()
const list = useTemplateRef('list')
useRequireAccessibleName('CommandList', () => triggerElement(list.value), 'It defaults to `label="Results"`; do not blank it, pass a descriptive `label` or `aria-labelledby` instead.')
</script>

<template>
  <ListboxContent
    ref="list"
    data-slot="command-list"
    v-bind="forwarded"
    :aria-label="attrs['aria-labelledby'] ? undefined : label"
    :class="cn(commandListVariants({ size }), props.class)"
  >
    <div role="presentation">
      <slot />
    </div>
  </ListboxContent>
</template>
