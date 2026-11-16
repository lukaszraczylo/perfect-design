<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue'
import { faBars, faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import MobileNav from '../MobileNav/MobileNav.vue'

export interface AppHeaderProps extends BaseProps {
  /** Stick to the top of the viewport while scrolling. */
  sticky?: boolean
  /** Bottom border. */
  bordered?: boolean
  /** Mobile menu open state (v-model:mobileOpen). */
  mobileOpen?: boolean
  /** Presentation of the mobile panel. */
  mobileVariant?: 'dropdown' | 'sheet'
  /** aria-label of the desktop `nav` slot landmark. Give each header on a page its own. */
  navLabel?: string
  /** Accessible name of the menu button. It stays constant; `aria-expanded` carries the state. */
  menuLabel?: string
}

const props = withDefaults(defineProps<AppHeaderProps>(), { mobileOpen: undefined, bordered: true, mobileVariant: 'dropdown', navLabel: 'Main', menuLabel: 'Menu' })
const emit = defineEmits<{ 'update:mobileOpen': [open: boolean] }>()
defineSlots<{
  brand?: () => unknown
  nav?: () => unknown
  actions?: () => unknown
  mobile?: (p: { close: () => void }) => unknown
}>()

const slots = useSlots()
onMounted(() => {
  if (slots.nav) {
    if (!slots.mobile) violation('AppHeader', 'requires-mobile', 'requires a `mobile` slot when a `nav` slot is given. The `nav` is hidden below `md`, so without a `mobile` slot its links cannot be reached on small screens.')
    requireText('AppHeader', 'navLabel', props.navLabel, 'It names the desktop navigation landmark, for example "Main".')
  }
  if (slots.mobile) requireText('AppHeader', 'menuLabel', props.menuLabel, 'It is the accessible name of the menu button, for example "Menu".')
})

const panelId = `${useId()}-mobile-nav`
const inner = ref(props.mobileOpen ?? false)
watch(
  () => props.mobileOpen,
  (o) => {
    if (o !== undefined) inner.value = o
  },
)
const open = computed({
  get: () => inner.value,
  set: (v: boolean) => {
    if (props.mobileOpen === undefined) inner.value = v
    emit('update:mobileOpen', v)
  },
})

// The mobile panel is hidden from `md` up; close it there so a stale open state (and a sheet overlay) never lingers.
let wide: MediaQueryList | null = null
const onWide = (e: MediaQueryListEvent) => {
  if (e.matches) open.value = false
}
onMounted(() => {
  wide = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(min-width: 48rem)') : null
  wide?.addEventListener?.('change', onWide)
  if (wide?.matches && open.value) open.value = false
})
onBeforeUnmount(() => wide?.removeEventListener?.('change', onWide))
</script>

<template>
  <header
    data-slot="app-header"
    :data-sticky="sticky ? '' : undefined"
    :class="
      cn(
        'z-(--z-sticky) w-full bg-background',
        sticky ? 'sticky top-0' : 'relative',
        bordered && 'border-b',
        props.class,
      )
    "
  >
    <div class="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-4 px-4">
      <div v-if="$slots.brand" data-slot="app-header-brand" class="flex shrink-0 items-center gap-2"><slot name="brand" /></div>
      <nav v-if="$slots.nav" data-slot="app-header-nav" :aria-label="navLabel" class="hidden min-w-0 flex-1 items-center gap-1 md:flex"><slot name="nav" /></nav>
      <div v-else class="flex-1" />
      <div v-if="$slots.actions" data-slot="app-header-actions" class="ms-auto flex shrink-0 items-center gap-2"><slot name="actions" /></div>
      <Button
        v-if="$slots.mobile"
        data-slot="app-header-menu-button"
        variant="ghost"
        size="icon"
        class="md:hidden"
        :aria-label="menuLabel"
        :aria-expanded="open"
        :aria-controls="open ? panelId : undefined"
        @click="open = !open"
      >
        <Icon :icon="open ? faXmark : faBars" />
      </Button>
    </div>
    <MobileNav v-if="$slots.mobile" :id="panelId" v-model:open="open" :variant="mobileVariant" class="md:hidden">
      <template #default="{ close }"><slot name="mobile" :close="close" /></template>
    </MobileNav>
  </header>
</template>
