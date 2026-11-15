<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch, type HTMLAttributes } from 'vue'
import { ListboxRoot, useForwardPropsEmits, type ListboxRootEmits, type ListboxRootProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { RequiredPartsProbe, useRequiredParts } from '../../../lib/contract'
import { provideCommand } from './commandContext'
import { commandVariants, normalizeCommandSize, normalizeCommandVariant, type CommandSize, type CommandVariant } from './variants'

export interface CommandOwnProps {
  class?: HTMLAttributes['class']
  /** Filter items by the search text (default). Turn off to filter yourself (async search). */
  shouldFilter?: boolean
  /** `palette` (default) fills its surface; `inline` adds a border and light shadow for use in a page. */
  variant?: CommandVariant
  /** Density of the search row, rows and list height: `sm`, `md` (default) or `lg`. */
  size?: CommandSize
}

const props = withDefaults(defineProps<ListboxRootProps & CommandOwnProps>(), {
  shouldFilter: true,
  variant: 'palette',
  size: 'md',
  highlightOnHover: true,
  loop: true,
})
const emits = defineEmits<ListboxRootEmits>()
/** Search text, shared with CommandInput (v-model:search). */
const search = defineModel<string>('search', { default: '' })

const delegated = computed(() => {
  const { class: _c, shouldFilter: _f, variant: _v, size: _s, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)

useRequiredParts('Command', [{ part: 'CommandEmpty', hint: 'Render <CommandEmpty> inside the list so an empty search result is announced (it has a default message).' }])
const command = provideCommand({ search, shouldFilter: computed(() => props.shouldFilter), size: computed(() => normalizeCommandSize(props.size)) })
const variantKey = computed(() => normalizeCommandVariant(props.variant))
// Visually hidden live region: reports the result count while the user types (not in the listbox, where only options are allowed).
const statusText = computed(() => {
  if (!search.value.trim()) return ''
  const n = command.visible.size
  return n === 0 ? 'No results found.' : `${n} ${n === 1 ? 'result' : 'results'} available`
})

const root = useTemplateRef<{ highlightFirstItem: () => void }>('root')
// Keep the first remaining item highlighted so Enter always runs the best match.
watch(search, () => nextTick(() => root.value?.highlightFirstItem()))

defineExpose({ highlightFirstItem: () => root.value?.highlightFirstItem() })
</script>

<template>
  <ListboxRoot
    ref="root"
    data-slot="command"
    :data-variant="variantKey === 'palette' ? undefined : variantKey"
    :data-size="command.size.value === 'md' ? undefined : command.size.value"
    v-bind="forwarded"
    :class="cn(commandVariants({ variant: variantKey }), props.class)"
  >
    <RequiredPartsProbe owner="Command" />
    <slot />
    <div data-slot="command-status" role="status" class="sr-only">{{ statusText }}</div>
  </ListboxRoot>
</template>
