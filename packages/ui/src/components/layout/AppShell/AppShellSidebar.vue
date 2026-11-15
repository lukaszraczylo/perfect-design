<script setup lang="ts">
import { computed } from 'vue'
import { appShellSidebarClasses, type AppShellBreakpoint, type AppShellCollapseMode, type AppShellRailWidth, type AppShellSide, type AppShellSidebarWidth } from './variants'

/** Internal: one `<aside>` of AppShell (start or end side). Not exported from the package. */
const props = defineProps<{
  side: AppShellSide
  open: boolean
  collapsed: boolean
  label: string
  breakpoint: AppShellBreakpoint
  width: AppShellSidebarWidth
  rail: AppShellRailWidth
  collapseMode: AppShellCollapseMode
  fullHeight: boolean
  /** True while this sidebar is the open off-canvas drawer: it is exposed as a modal dialog. */
  modal?: boolean
  id?: string
}>()

// An open drawer is a modal dialog, and `aside` may not take role=dialog, so it renders as a plain div while open.
const classes = computed(() => appShellSidebarClasses(props))
</script>

<template>
  <component
    :is="modal ? 'div' : 'aside'"
    data-slot="app-shell-sidebar"
    :id="id"
    :role="modal ? 'dialog' : undefined"
    :aria-modal="modal ? 'true' : undefined"
    :aria-label="label"
    :data-side="side === 'end' ? 'end' : undefined"
    :data-collapsed="collapsed ? '' : undefined"
    :data-open="open ? '' : undefined"
    :tabindex="open ? -1 : undefined"
    :class="open ? [classes, 'outline-hidden'] : classes"
  >
    <slot />
  </component>
</template>
