<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { THEME_STYLES, useThemeStore, type ThemeStyle } from '../../../stores/theme'
import { withPinia } from '../contract'

export interface StylePickerProps extends BaseProps {
  /** Style packs to offer, in order. Unknown names are ignored. Defaults to every pack. */
  styles?: readonly ThemeStyle[]
  /** Accessible name of the radiogroup. */
  label?: string
}

const props = withDefaults(defineProps<StylePickerProps>(), { styles: () => THEME_STYLES, label: 'Style' })

const NAMES: Record<string, string> = { quiet: 'Quiet', workbench: 'Workbench', tactile: 'Tactile', editorial: 'Editorial', raw: 'Raw', contrast: 'Contrast', terminal: 'Terminal' }
const nameOf = (s: string) => NAMES[s] ?? s.charAt(0).toUpperCase() + s.slice(1)

const theme = withPinia('StylePicker', useThemeStore)
const options = computed<ThemeStyle[]>(() => {
  const list: readonly string[] = Array.isArray(props.styles) ? props.styles : []
  return list.filter((s): s is ThemeStyle => (THEME_STYLES as readonly string[]).includes(s))
})
onMounted(() => {
  requireText('StylePicker', 'label', props.label, 'It names the radio group, for example "Style".')
  if (!options.value.length) violation('StylePicker', 'requires-styles', `requires at least one known style in \`styles\` (known: ${THEME_STYLES.join(', ')}). Unknown names are ignored, so this renders an empty group.`)
})
/** Roving tabindex: the selected option is the tab stop (or the first one when none is selected). */
const tabStop = computed(() => (options.value.includes(theme.style) ? theme.style : options.value[0]))

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
  theme.setStyle(options.value[next])
  group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}
</script>

<template>
  <div data-slot="style-picker" role="radiogroup" :aria-label="label" :class="cn('flex flex-wrap items-center gap-1.5', props.class)">
    <button
      v-for="(style, i) in options"
      :key="style"
      type="button"
      role="radio"
      data-slot="style-picker-option"
      :data-style-option="style"
      :aria-checked="theme.style === style"
      :tabindex="tabStop === style ? 0 : -1"
      :class="
        cn(
          'inline-flex min-h-8 cursor-pointer items-center rounded-md border px-3 text-sm font-medium pointer-coarse:min-h-11',
          theme.style === style ? 'border-foreground bg-foreground text-background' : 'bg-background text-foreground hover:bg-accent',
          focusRing,
        )
      "
      @click="theme.setStyle(style)"
      @keydown="onKeydown($event, i)"
    >
      {{ nameOf(style) }}
    </button>
  </div>
</template>
