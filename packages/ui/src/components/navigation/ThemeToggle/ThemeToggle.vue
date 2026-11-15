<script setup lang="ts">
import { computed } from 'vue'
import { faDesktop, faMoon, faSun } from '../../../lib/icons'
import type { IconDefinition } from '../../../lib/icons-tools'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { useThemeStore, type ThemeMode } from '../../../stores/theme'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import { withPinia } from '../contract'
import {
  THEME_TOGGLE_SIZES,
  THEME_TOGGLE_VARIANTS,
  themeSegmentVariants,
  themeSegmentedVariants,
  themeSwitchThumbVariants,
  themeSwitchVariants,
  type ThemeToggleSize,
  type ThemeToggleVariant,
} from './variants'

export interface ThemeToggleProps extends BaseProps {
  /**
   * `icon` is a square icon-only button; `button` also shows the current mode name; `switch` is a light and dark switch;
   * `segmented` is a radio group of light, dark and system. Unknown values fall back to `icon`.
   */
  variant?: ThemeToggleVariant
  /** `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: ThemeToggleSize
  /** Accessible name of the `switch` (default "Dark mode") and of the `segmented` group (default "Theme"). */
  label?: string
}

const props = withDefaults(defineProps<ThemeToggleProps>(), { variant: 'icon', size: 'md', label: undefined })

const MODES: Record<ThemeMode, { icon: IconDefinition; name: string; next: ThemeMode }> = {
  light: { icon: faSun, name: 'Light', next: 'dark' },
  dark: { icon: faMoon, name: 'Dark', next: 'system' },
  system: { icon: faDesktop, name: 'System', next: 'light' },
}
const ORDER: ThemeMode[] = ['light', 'dark', 'system']

const theme = withPinia('ThemeToggle', useThemeStore)
const current = computed(() => MODES[theme.mode] ?? MODES.system)
// The name starts with the visible mode text (WCAG 2.5.3 label in name) and then states what the next press does.
const label = computed(() => `Theme: ${current.value.name}. Switch to ${MODES[current.value.next].name.toLowerCase()}.`)

const variant = computed<ThemeToggleVariant>(() => (THEME_TOGGLE_VARIANTS.includes(props.variant as ThemeToggleVariant) ? (props.variant as ThemeToggleVariant) : 'icon'))
const size = computed<ThemeToggleSize>(() => (THEME_TOGGLE_SIZES.includes(props.size as ThemeToggleSize) ? (props.size as ThemeToggleSize) : 'md'))
const asButton = computed(() => variant.value === 'button')
const BUTTON_SIZE = { sm: 'sm', md: 'md', lg: 'lg' } as const
const ICON_SIZE = { sm: 'icon-xs', md: 'icon', lg: 'icon-lg' } as const
const buttonSize = computed(() => (asButton.value ? BUTTON_SIZE[size.value] : ICON_SIZE[size.value]))

const switchName = computed(() => (props.label && props.label.trim() ? props.label : 'Dark mode'))
const groupName = computed(() => (props.label && props.label.trim() ? props.label : 'Theme'))

/** Roving tabindex: the selected mode is the tab stop. Arrow keys select and focus the neighbour, like any radio group. */
function onKeydown(e: KeyboardEvent, index: number) {
  const group = (e.currentTarget as HTMLElement).parentElement
  const rtl = !!group && getComputedStyle(group).direction === 'rtl'
  const forward = e.key === 'ArrowDown' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')
  const backward = e.key === 'ArrowUp' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')
  const step = forward ? 1 : backward ? -1 : 0
  const jump = e.key === 'Home' ? 0 : e.key === 'End' ? ORDER.length - 1 : -1
  if (!step && jump < 0) return
  e.preventDefault()
  const next = jump >= 0 ? jump : (index + step + ORDER.length) % ORDER.length
  theme.setMode(ORDER[next])
  group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}
</script>

<template>
  <button
    v-if="variant === 'switch'"
    data-slot="theme-toggle"
    data-variant="switch"
    type="button"
    role="switch"
    :data-mode="theme.mode"
    :data-size="size"
    :aria-checked="theme.isDark"
    :aria-label="switchName"
    :class="cn(themeSwitchVariants({ size }), props.class)"
    @click="theme.toggle()"
  >
    <span data-slot="theme-toggle-thumb" aria-hidden="true" :class="themeSwitchThumbVariants({ size, checked: theme.isDark })">
      <Icon :icon="theme.isDark ? faMoon : faSun" />
    </span>
  </button>

  <div
    v-else-if="variant === 'segmented'"
    data-slot="theme-toggle"
    data-variant="segmented"
    role="radiogroup"
    :data-mode="theme.mode"
    :data-size="size"
    :aria-label="groupName"
    :class="cn(themeSegmentedVariants({ size }), props.class)"
  >
    <button
      v-for="(mode, i) in ORDER"
      :key="mode"
      type="button"
      role="radio"
      data-slot="theme-toggle-option"
      :data-mode-option="mode"
      :aria-checked="theme.mode === mode"
      :aria-label="MODES[mode].name"
      :title="MODES[mode].name"
      :tabindex="theme.mode === mode || (!ORDER.includes(theme.mode) && i === 0) ? 0 : -1"
      :class="cn(themeSegmentVariants({ size }), focusRing)"
      @click="theme.setMode(mode)"
      @keydown="onKeydown($event, i)"
    >
      <Icon :icon="MODES[mode].icon" />
    </button>
  </div>

  <Button
    v-else
    data-slot="theme-toggle"
    :data-variant="variant"
    :data-mode="theme.mode"
    :data-size="size"
    :variant="asButton ? 'outline' : 'ghost'"
    :size="buttonSize"
    :aria-label="label"
    :title="label"
    :class="cn(size === 'sm' && 'pointer-coarse:min-h-10 pointer-coarse:min-w-10', props.class)"
    @click="theme.cycleMode()"
  >
    <Icon :icon="current.icon" />
    <span v-if="asButton" data-slot="theme-toggle-label">{{ current.name }}</span>
  </Button>
</template>
