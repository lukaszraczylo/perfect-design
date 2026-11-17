<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { THEME_FONTS, useThemeStore, type ThemeFont } from '../../../stores/theme'
import { withPinia } from '../contract'

export interface FontPickerProps extends BaseProps {
  /** Font families to offer, in order. Unknown names are ignored. Defaults to every family. */
  fonts?: readonly ThemeFont[]
  /** Accessible name of the radiogroup. */
  label?: string
}

const props = withDefaults(defineProps<FontPickerProps>(), { fonts: () => THEME_FONTS, label: 'Font' })

const NAMES: Record<string, string> = { default: 'Plex', system: 'System', humanist: 'Humanist', geometric: 'Geometric', grotesque: 'Grotesque', rounded: 'Rounded', serif: 'Serif', slab: 'Slab', mono: 'Mono' }
const nameOf = (s: string) => NAMES[s] ?? s.charAt(0).toUpperCase() + s.slice(1)

const theme = withPinia('FontPicker', useThemeStore)
const options = computed<ThemeFont[]>(() => {
  const list: readonly string[] = Array.isArray(props.fonts) ? props.fonts : []
  return list.filter((s): s is ThemeFont => (THEME_FONTS as readonly string[]).includes(s))
})
onMounted(() => {
  requireText('FontPicker', 'label', props.label, 'It names the radio group, for example "Font".')
  if (!options.value.length) violation('FontPicker', 'requires-fonts', `requires at least one known font in \`fonts\` (known: ${THEME_FONTS.join(', ')}). Unknown names are ignored, so this renders an empty group.`)
})
/** Roving tabindex: the selected option is the tab stop (or the first one when none is selected). */
const tabStop = computed(() => (options.value.includes(theme.font) ? theme.font : options.value[0]))

function onKeydown(e: KeyboardEvent, index: number) {
  const n = options.value.length
  const group = (e.currentTarget as HTMLElement).parentElement
  const rtl = !!group && getComputedStyle(group).direction === 'rtl'
  const forward = e.key === 'ArrowDown' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')
  const backward = e.key === 'ArrowUp' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')
  const step = forward ? 1 : backward ? -1 : 0
  const jump = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
  if (!step && jump < 0) return
  e.preventDefault()
  const next = jump >= 0 ? jump : (index + step + n) % n
  theme.setFont(options.value[next])
  group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}
</script>

<template>
  <div data-slot="font-picker" role="radiogroup" :aria-label="label" :class="cn('flex flex-wrap items-center gap-1.5', props.class)">
    <button
      v-for="(font, i) in options"
      :key="font"
      type="button"
      role="radio"
      data-slot="font-picker-option"
      :data-font-option="font"
      :data-font="font"
      :aria-checked="theme.font === font"
      :tabindex="tabStop === font ? 0 : -1"
      :class="
        cn(
          'inline-flex min-h-8 cursor-pointer items-center rounded-md border px-3 text-sm font-medium pointer-coarse:min-h-11',
          theme.font === font ? 'border-foreground bg-foreground text-background' : 'bg-background text-foreground hover:bg-accent',
          focusRing,
        )
      "
      @click="theme.setFont(font)"
      @keydown="onKeydown($event, i)"
    >
      {{ nameOf(font) }}
    </button>
  </div>
</template>
