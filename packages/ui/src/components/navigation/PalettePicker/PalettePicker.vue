<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import { THEME_PALETTES, type ThemePalette } from '../../../lib/palettes'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { useThemeStore } from '../../../stores/theme'
import { withPinia } from '../contract'

export interface PalettePickerProps extends BaseProps {
  /** Palettes to offer, in order. Unknown names are ignored. Defaults to every palette. */
  palettes?: readonly ThemePalette[]
  /** Accessible name of the radiogroup. */
  label?: string
}

const props = withDefaults(defineProps<PalettePickerProps>(), { palettes: () => THEME_PALETTES, label: 'Palette' })

const nameOf = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const theme = withPinia('PalettePicker', useThemeStore)
const options = computed<ThemePalette[]>(() => {
  const list: readonly string[] = Array.isArray(props.palettes) ? props.palettes : []
  return list.filter((s): s is ThemePalette => (THEME_PALETTES as readonly string[]).includes(s))
})
onMounted(() => {
  requireText('PalettePicker', 'label', props.label, 'It names the radio group, for example "Palette".')
  if (!options.value.length) violation('PalettePicker', 'requires-palettes', `requires at least one known palette in \`palettes\` (known: ${THEME_PALETTES.join(', ')}). Unknown names are ignored, so this renders an empty group.`)
})
/** Roving tabindex: the selected option is the tab stop (or the first one when none is selected). */
const tabStop = computed(() => (options.value.includes(theme.palette) ? theme.palette : options.value[0]))

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
  theme.setPalette(options.value[next])
  group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}
</script>

<template>
  <div data-slot="palette-picker" role="radiogroup" :aria-label="label" :class="cn('flex flex-wrap items-center gap-1.5', props.class)">
    <button
      v-for="(palette, i) in options"
      :key="palette"
      type="button"
      role="radio"
      data-slot="palette-picker-option"
      :data-palette-option="palette"
      :aria-checked="theme.palette === palette"
      :tabindex="tabStop === palette ? 0 : -1"
      :class="
        cn(
          'inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-sm font-medium pointer-coarse:min-h-11',
          theme.palette === palette ? 'border-foreground bg-foreground text-background' : 'bg-background text-foreground hover:bg-accent',
          focusRing,
        )
      "
      @click="theme.setPalette(palette)"
      @keydown="onKeydown($event, i)"
    >
      <span data-slot="palette-picker-swatch" :data-palette="palette" aria-hidden="true" class="flex items-center gap-0.5 rounded-sm border bg-background p-0.5">
        <span class="size-2.5 rounded-full bg-primary" />
        <span class="size-2.5 rounded-full bg-foreground" />
        <span class="size-2.5 rounded-full bg-muted" />
      </span>
      {{ nameOf(palette) }}
    </button>
  </div>
</template>
