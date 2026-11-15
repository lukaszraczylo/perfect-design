<script setup lang="ts">
import { computed, nextTick, onMounted, type HTMLAttributes } from 'vue'
import { useForwardPropsEmits, type DialogRootEmits, type DialogRootProps } from 'reka-ui'
import { requireText } from '../../../lib/contract'
import Dialog from '../Dialog/Dialog.vue'
import DialogContent from '../Dialog/DialogContent.vue'
import DialogDescription from '../Dialog/DialogDescription.vue'
import DialogTitle from '../Dialog/DialogTitle.vue'
import Command from './Command.vue'
import { commandDialogWidth, normalizeCommandSize, type CommandSize } from './variants'

const props = withDefaults(
  defineProps<DialogRootProps & { title?: string; description?: string; shouldFilter?: boolean; size?: CommandSize; class?: HTMLAttributes['class'] }>(),
  { title: 'Command palette', description: 'Search for a command and press Enter to run it.', shouldFilter: true, size: 'md' },
)
const emits = defineEmits<DialogRootEmits>()
onMounted(async () => {
  await nextTick()
  requireText('CommandDialog', 'title', props.title, 'It is the accessible name of the dialog (shown only to screen readers).')
})
const search = defineModel<string>('search', { default: '' })

const delegated = computed(() => {
  const { title: _t, description: _d, shouldFilter: _f, size: _s, class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
const sizeKey = computed(() => normalizeCommandSize(props.size))
</script>

<template>
  <Dialog data-slot="command-dialog" v-bind="forwarded">
    <DialogContent
      :show-close="false"
      :class="['top-4 translate-y-0 gap-0 overflow-hidden p-0 sm:top-24', commandDialogWidth[sizeKey], props.class]"
    >
      <DialogTitle class="sr-only">{{ title }}</DialogTitle>
      <DialogDescription class="sr-only">{{ description }}</DialogDescription>
      <Command v-model:search="search" :should-filter="shouldFilter" :size="sizeKey">
        <slot />
      </Command>
    </DialogContent>
  </Dialog>
</template>
