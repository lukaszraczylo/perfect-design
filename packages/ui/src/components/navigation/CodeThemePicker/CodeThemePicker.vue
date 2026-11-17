<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { cn } from '../../../lib/cn'
import { CODE_THEME_MODES } from '../../../lib/code-themes'
import { requireText, violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { THEME_CODE_THEMES, useThemeStore, type ThemeCodeTheme } from '../../../stores/theme'
import { withPinia } from '../contract'

export interface CodeThemePickerProps extends BaseProps {
  /** Code themes to offer, in order. Unknown names are ignored. Defaults to `default` plus every theme. */
  themes?: readonly ThemeCodeTheme[]
  /** Accessible name of the radiogroup. */
  label?: string
}

const props = withDefaults(defineProps<CodeThemePickerProps>(), { themes: () => THEME_CODE_THEMES, label: 'Code theme' })

const nameOf = (s: string) => (s === 'default' ? 'Follow palette' : s.charAt(0).toUpperCase() + s.slice(1))
const modeOf = (s: ThemeCodeTheme) => (s === 'default' ? '' : CODE_THEME_MODES[s])

const theme = withPinia('CodeThemePicker', useThemeStore)
const options = computed<ThemeCodeTheme[]>(() => {
  const list: readonly string[] = Array.isArray(props.themes) ? props.themes : []
  return list.filter((s): s is ThemeCodeTheme => (THEME_CODE_THEMES as readonly string[]).includes(s))
})
onMounted(() => {
  requireText('CodeThemePicker', 'label', props.label, 'It names the radio group, for example "Code theme".')
  if (!options.value.length) violation('CodeThemePicker', 'requires-themes', `requires at least one known theme in \`themes\` (known: ${THEME_CODE_THEMES.join(', ')}). Unknown names are ignored, so this renders an empty group.`)
})
/** Roving tabindex: the selected option is the tab stop (or the first one when none is selected). */
const tabStop = computed(() => (options.value.includes(theme.codeTheme) ? theme.codeTheme : options.value[0]))

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
  theme.setCodeTheme(options.value[next])
  group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}
</script>

<template>
  <div data-slot="code-theme-picker" role="radiogroup" :aria-label="label" :class="cn('flex flex-wrap items-center gap-1.5', props.class)">
    <button
      v-for="(codeTheme, i) in options"
      :key="codeTheme"
      type="button"
      role="radio"
      data-slot="code-theme-picker-option"
      :data-code-theme-option="codeTheme"
      :aria-checked="theme.codeTheme === codeTheme"
      :tabindex="tabStop === codeTheme ? 0 : -1"
      :class="
        cn(
          'inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-sm font-medium pointer-coarse:min-h-11',
          theme.codeTheme === codeTheme ? 'border-foreground bg-foreground text-background' : 'bg-background text-foreground hover:bg-accent',
          focusRing,
        )
      "
      @click="theme.setCodeTheme(codeTheme)"
      @keydown="onKeydown($event, i)"
    >
      <span
        v-if="codeTheme !== 'default'"
        data-slot="code-theme-picker-swatch"
        :data-code-theme="codeTheme"
        aria-hidden="true"
        class="flex items-center gap-0.5 rounded-sm border bg-(--code-bg) p-1"
      >
        <span class="h-1.5 w-2 rounded-full bg-(--code-keyword)" />
        <span class="h-1.5 w-3 rounded-full bg-(--code-string)" />
        <span class="h-1.5 w-1.5 rounded-full bg-(--code-number)" />
      </span>
      {{ nameOf(codeTheme) }}<template v-if="modeOf(codeTheme)"> ({{ modeOf(codeTheme) }})</template>
    </button>
  </div>
</template>
