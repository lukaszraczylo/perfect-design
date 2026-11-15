<script setup lang="ts">
import { MenubarMenu as RekaMenu, type MenubarMenuProps } from 'reka-ui'
import { RequiredPartsProbe, useRequiredParts } from '../../../lib/contract'
import { useEntry } from '../contract'

const props = defineProps<MenubarMenuProps>()
useEntry('Menubar', 'menu', () => props.value)
useRequiredParts('MenubarMenu', [
  { part: 'MenubarTrigger', hint: 'Without a trigger the menu cannot be opened.' },
  { part: 'MenubarContent', hint: 'Without content the menu has nothing to show.' },
])
</script>

<template>
  <RekaMenu data-slot="menubar-menu" v-bind="props">
    <RequiredPartsProbe owner="MenubarMenu" />
    <slot />
  </RekaMenu>
</template>
