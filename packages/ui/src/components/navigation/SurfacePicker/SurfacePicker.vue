<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { THEME_SURFACES, useThemeStore, type ThemeSurface } from '../../../stores/theme'
import { withPinia } from '../contract'

export interface SurfacePickerProps extends BaseProps {
  /** Surfaces to offer, in order. Unknown names are ignored. Defaults to every surface. */
  surfaces?: readonly ThemeSurface[]
  /** Accessible name of the radiogroup. */
  label?: string
}

const props = withDefaults(defineProps<SurfacePickerProps>(), { surfaces: () => THEME_SURFACES, label: 'Surface' })

const NAMES: Record<string, string> = { solid: 'Solid', glass: 'Glass' }
const nameOf = (s: string) => NAMES[s] ?? s.charAt(0).toUpperCase() + s.slice(1)

const theme = withPinia('SurfacePicker', useThemeStore)
const options = computed<ThemeSurface[]>(() => {
  const list: readonly string[] = Array.isArray(props.surfaces) ? props.surfaces : []
  return list.filter((s): s is ThemeSurface => (THEME_SURFACES as readonly string[]).includes(s))
})
onMounted(() => {
  requireText('SurfacePicker', 'label', props.label, 'It names the radio group, for example "Surface".')
  if (!options.value.length) violation('SurfacePicker', 'requires-surfaces', `requires at least one known surface in \`surfaces\` (known: ${THEME_SURFACES.join(', ')}). Unknown names are ignored, so this renders an empty group.`)
})
/** Roving tabindex: the selected option is the tab stop (or the first one when none is selected). */
const tabStop = computed(() => (options.value.includes(theme.surface) ? theme.surface : options.value[0]))

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
  theme.setSurface(options.value[next])
  group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}
</script>

<template>
  <div data-slot="surface-picker" role="radiogroup" :aria-label="label" :class="cn('flex flex-wrap items-center gap-1.5', props.class)">
    <button
      v-for="(surface, i) in options"
      :key="surface"
      type="button"
      role="radio"
      data-slot="surface-picker-option"
      :data-surface-option="surface"
      :aria-checked="theme.surface === surface"
      :tabindex="tabStop === surface ? 0 : -1"
      :class="
        cn(
          'inline-flex min-h-8 cursor-pointer items-center rounded-md border px-3 text-sm font-medium pointer-coarse:min-h-11',
          theme.surface === surface ? 'border-foreground bg-foreground text-background' : 'bg-background text-foreground hover:bg-accent',
          focusRing,
        )
      "
      @click="theme.setSurface(surface)"
      @keydown="onKeydown($event, i)"
    >
      {{ nameOf(surface) }}
    </button>
  </div>
</template>
