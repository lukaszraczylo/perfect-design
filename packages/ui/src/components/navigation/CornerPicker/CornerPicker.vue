<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { THEME_CORNERS, useThemeStore, type ThemeCorner } from '../../../stores/theme'
import { withPinia } from '../contract'

export interface CornerPickerProps extends BaseProps {
  /** Corner shapes to offer, in order. Unknown names are ignored. Defaults to every shape. */
  corners?: readonly ThemeCorner[]
  /** Accessible name of the radiogroup. */
  label?: string
}

const props = withDefaults(defineProps<CornerPickerProps>(), { corners: () => THEME_CORNERS, label: 'Corner' })

const NAMES: Record<string, string> = { round: 'Round', squircle: 'Squircle' }
const nameOf = (s: string) => NAMES[s] ?? s.charAt(0).toUpperCase() + s.slice(1)

const theme = withPinia('CornerPicker', useThemeStore)
const options = computed<ThemeCorner[]>(() => {
  const list: readonly string[] = Array.isArray(props.corners) ? props.corners : []
  return list.filter((s): s is ThemeCorner => (THEME_CORNERS as readonly string[]).includes(s))
})
onMounted(() => {
  requireText('CornerPicker', 'label', props.label, 'It names the radio group, for example "Corner".')
  if (!options.value.length) violation('CornerPicker', 'requires-corners', `requires at least one known corner shape in \`corners\` (known: ${THEME_CORNERS.join(', ')}). Unknown names are ignored, so this renders an empty group.`)
})
/** Roving tabindex: the selected option is the tab stop (or the first one when none is selected). */
const tabStop = computed(() => (options.value.includes(theme.corner) ? theme.corner : options.value[0]))

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
  theme.setCorner(options.value[next])
  group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}
</script>

<template>
  <div data-slot="corner-picker" role="radiogroup" :aria-label="label" :class="cn('flex flex-wrap items-center gap-1.5', props.class)">
    <button
      v-for="(corner, i) in options"
      :key="corner"
      type="button"
      role="radio"
      data-slot="corner-picker-option"
      :data-corner-option="corner"
      :data-corner="corner"
      :aria-checked="theme.corner === corner"
      :tabindex="tabStop === corner ? 0 : -1"
      :class="
        cn(
          'inline-flex min-h-8 cursor-pointer items-center rounded-md border px-3 text-sm font-medium pointer-coarse:min-h-11',
          theme.corner === corner ? 'border-foreground bg-foreground text-background' : 'bg-background text-foreground hover:bg-accent',
          focusRing,
        )
      "
      @click="theme.setCorner(corner)"
      @keydown="onKeydown($event, i)"
    >
      {{ nameOf(corner) }}
    </button>
  </div>
</template>
