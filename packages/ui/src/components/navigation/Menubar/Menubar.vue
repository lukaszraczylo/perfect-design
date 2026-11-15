<script setup lang="ts">
import { computed, provide, ref, type HTMLAttributes } from 'vue'
import { MenubarRoot, useForwardProps, type MenubarRootProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName, violation } from '../../../lib/contract'
import { duplicates, isBlank, useEntryRegistry } from '../contract'
import { MENUBAR_SIZE_KEY } from './context'
import { MENUBAR_SIZES, menubarVariants, type MenubarSize } from './variants'

export interface MenubarProps extends MenubarRootProps {
  class?: HTMLAttributes['class']
  /** Bar and trigger size: `sm` (32px), `md` (36px, default) or `lg` (44px). Unknown values fall back to `md`. */
  size?: MenubarSize
}

const props = withDefaults(defineProps<MenubarProps>(), { size: 'md' })
const size = computed<MenubarSize>(() => (MENUBAR_SIZES.includes(props.size as MenubarSize) ? (props.size as MenubarSize) : 'md'))
provide(MENUBAR_SIZE_KEY, size)
const emits = defineEmits<{ 'update:modelValue': [value: string] }>()
const root = ref<{ $el?: Element } | null>(null)
useRequireAccessibleName('Menubar', () => root.value?.$el, 'Add `aria-label` (or `aria-labelledby`) to Menubar, for example `<Menubar aria-label="Application menu">`.')
useEntryRegistry('Menubar', (entries) => {
  const values = entries.filter((e) => e.kind === 'menu').map((e) => e.value())
  if (values.some(isBlank)) violation('Menubar', 'requires-value', 'requires a non-empty `value` on every MenubarMenu. The value identifies the open menu.')
  const dup = duplicates(values)
  if (dup.length) violation('Menubar', 'unique-value', `requires a unique \`value\` on every MenubarMenu (duplicate: ${dup.map((v) => `"${v}"`).join(', ')}). Menus with the same value open together.`)
})
const delegated = computed(() => {
  const { class: _c, size: _s, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <MenubarRoot
    ref="root"
    data-slot="menubar"
    :data-size="size"
    v-bind="forwarded"
    :class="cn(menubarVariants({ size }), props.class)"
    @update:model-value="(v: unknown) => emits('update:modelValue', v as string)"
  >
    <slot />
  </MenubarRoot>
</template>
