<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { faBars, faCircleHalfStroke, faMoon, faSun, faXmark } from '@fortawesome/free-solid-svg-icons'
import { Button, Icon, NativeSelect, THEME_PALETTES, useThemeStore } from '@ui/index'
import type { ThemePalette } from '@ui/index'
import SideNav from '@/components/SideNav.vue'
import SearchBox from '@/components/SearchBox.vue'

const theme = useThemeStore()
const route = useRoute()
const menuOpen = ref(false)
const menuButton = ref<InstanceType<typeof Button> | null>(null)
watch(() => route.fullPath, () => (menuOpen.value = false))
// Esc closes the mobile navigation and returns focus to its toggle (WCAG 2.1.1 / 2.4.3).
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && menuOpen.value) {
    menuOpen.value = false
    ;(menuButton.value?.$el as HTMLElement | undefined)?.focus()
  }
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

// First render uses the default so it matches the prerendered HTML; the saved mode shows right after hydration.
const mounted = ref(false)
onMounted(() => (mounted.value = true))
const shownMode = computed(() => (mounted.value ? theme.mode : 'system'))
const modeIcon = computed(() => (shownMode.value === 'system' ? faCircleHalfStroke : shownMode.value === 'dark' ? faMoon : faSun))
const shownPalette = computed(() => (mounted.value ? theme.palette : 'default'))
const paletteOptions = THEME_PALETTES.map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))
const modeLabel = computed(() => `Colour mode: ${shownMode.value}. Click to change.`)
</script>

<template>
  <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">Skip to content</a>
  <header class="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4">
    <Button ref="menuButton" variant="ghost" size="icon" class="lg:hidden" aria-controls="site-nav" :aria-label="menuOpen ? 'Close navigation' : 'Open navigation'" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
      <Icon :icon="menuOpen ? faXmark : faBars" />
    </Button>
    <RouterLink to="/" class="flex items-center gap-2 font-semibold tracking-tight">
      <span class="grid size-7 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">P</span>
      Perfect Design
    </RouterLink>
    <div class="ms-auto flex items-center gap-2">
      <SearchBox class="hidden sm:block" />
      <NativeSelect size="xs" aria-label="Palette" class="hidden w-32 sm:block" :model-value="shownPalette" :options="paletteOptions" @update:model-value="(v) => theme.setPalette(v as ThemePalette)" />
      <Button variant="ghost" size="icon" :aria-label="modeLabel" @click="theme.cycleMode()"><Icon :icon="modeIcon" /></Button>
    </div>
  </header>
  <div class="flex w-full min-w-0">
    <aside id="site-nav" class="fixed inset-y-14 start-0 z-30 w-72 max-w-[85vw] shrink-0 overflow-y-auto overscroll-contain border-e bg-sidebar p-4 motion-safe:transition-transform lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:translate-x-0" :class="menuOpen ? 'translate-x-0' : 'max-lg:invisible -translate-x-full rtl:translate-x-full'">
      <SearchBox class="mb-4 sm:hidden" />
      <NativeSelect size="sm" aria-label="Palette" class="mb-4 sm:hidden" :model-value="shownPalette" :options="paletteOptions" @update:model-value="(v) => theme.setPalette(v as ThemePalette)" />
      <SideNav />
    </aside>
    <main id="main" tabindex="-1" class="min-w-0 flex-1 px-4 py-8 outline-none sm:px-10 sm:py-10"><RouterView /></main>
  </div>
</template>
