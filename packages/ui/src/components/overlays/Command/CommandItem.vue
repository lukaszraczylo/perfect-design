<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, watch, useId, type HTMLAttributes } from 'vue'
import { ListboxItem, useForwardPropsEmits, type ListboxItemEmits, type ListboxItemProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { menuItem } from '../menuStyles'
import { useCommand, useCommandGroup, useCommandSize } from './commandContext'
import { commandItemVariants } from './variants'

const props = defineProps<ListboxItemProps & { class?: HTMLAttributes['class']; keywords?: string[] }>()
const emits = defineEmits<ListboxItemEmits>()

const delegated = computed(() => {
  const { class: _c, keywords: _k, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)

const command = useCommand()
const group = useCommandGroup()
const id = useId()
const size = useCommandSize()

const haystack = computed(() => {
  const v = typeof props.value === 'string' || typeof props.value === 'number' ? String(props.value) : ''
  return [v, ...(props.keywords ?? [])].join(' ')
})
const visible = computed(() => !command || command.matches(haystack.value))

watch(
  visible,
  (v) => {
    for (const set of [command?.visible, group?.visible]) {
      if (!set) continue
      if (v) set.add(id)
      else set.delete(id)
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  command?.visible.delete(id)
  group?.visible.delete(id)
  unregisterValue()
})

// Contract: every item has a non-empty value, unique inside its Command. The value is what Enter selects and what the
// search matches, so a blank or repeated one makes rows indistinguishable.
const blank = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (typeof v === 'number' && Number.isNaN(v))
let registered: { value: unknown } | undefined
function unregisterValue() {
  if (!command || !registered) return
  const ids = command.values.get(registered.value)?.filter((x) => x !== id) ?? []
  if (ids.length) command.values.set(registered.value, ids)
  else command.values.delete(registered.value)
  registered = undefined
}
function registerValue() {
  unregisterValue()
  if (!command || blank(props.value)) return
  registered = { value: props.value }
  command.values.set(props.value, [...(command.values.get(props.value) ?? []), id])
}
registerValue()
function checkValue() {
  if (blank(props.value)) {
    violation('CommandItem', 'requires-value', 'requires a non-empty `value`. Set `value` to a unique string, it is what the search matches and what Enter selects.')
    return
  }
  const ids = command?.values.get(props.value)
  if (ids && ids.length > 1 && ids[0] !== id) {
    const shown = typeof props.value === 'object' ? 'the same object' : `"${String(props.value)}"`
    violation('CommandItem', 'unique-value', `shares its value (${shown}) with another CommandItem in this Command. Give every item its own \`value\` (add \`keywords\` for the text to search).`)
  }
}
onMounted(async () => {
  await nextTick()
  checkValue()
})
watch(
  () => props.value,
  async () => {
    registerValue()
    await nextTick()
    checkValue()
  },
)
</script>

<template>
  <ListboxItem v-if="visible" data-slot="command-item" v-bind="forwarded" :class="cn(menuItem, commandItemVariants({ size }), 'data-[disabled]:text-muted-foreground data-[disabled]:opacity-100', props.class)">
    <slot />
  </ListboxItem>
</template>
