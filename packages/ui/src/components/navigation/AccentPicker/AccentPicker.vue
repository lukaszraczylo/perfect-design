<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { faCheck } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { THEME_ACCENTS, useThemeStore, type ThemeAccent } from '../../../stores/theme'
import Icon from '../../primitives/Icon/Icon.vue'
import { withPinia } from '../contract'
import {
  ACCENT_PICKER_LAYOUTS,
  ACCENT_PICKER_SHAPES,
  ACCENT_PICKER_SIZES,
  ACCENT_ROW,
  accentPickerVariants,
  accentSwatchVariants,
  type AccentPickerLayout,
  type AccentPickerShape,
  type AccentPickerSize,
} from './variants'

export interface AccentPickerProps extends BaseProps {
  /** Accent presets to offer, in order. Unknown names are ignored. Defaults to every preset. */
  accents?: readonly ThemeAccent[]
  /** Accessible name of the radiogroup. */
  label?: string
  /** Swatch corners: `circle` (default), `rounded` or `square`. Unknown values fall back to `circle`. */
  shape?: AccentPickerShape
  /** Swatch size: `md` (24px, default), `lg` (32px) or `xl` (40px). Unknown values fall back to `md`. */
  size?: AccentPickerSize
  /** `inline` (default wrapping row), `grid` (three columns) or `list` (rows with the preset name). Unknown values fall back to `inline`. */
  layout?: AccentPickerLayout
}

const props = withDefaults(defineProps<AccentPickerProps>(), { accents: () => THEME_ACCENTS, label: 'Accent colour', shape: 'circle', size: 'md', layout: 'inline' })

// Swatches must show the PRESET colour regardless of the active theme, so they mirror the `--primary`
// hue of each preset instead of using the (live) `bg-primary` token. Keep in sync with `themes/*.css` and
// DESIGN.md. Keyed by plain strings so a preset added to or removed from THEME_ACCENTS never breaks the build:
// an unlisted preset gets a neutral swatch and a capitalised name.
const SWATCH: Record<string, string> = {
  default: 'bg-[oklch(0.46_0.09_205)]',
  indigo: 'bg-[oklch(0.5_0.17_265)]',
  emerald: 'bg-[oklch(0.485_0.13_160)]',
  rose: 'bg-[oklch(0.525_0.19_10)]',
  amber: 'bg-[oklch(0.51_0.15_70)]',
  lime: 'bg-[oklch(0.45_0.11_125)]',
  violet: 'bg-[oklch(0.5_0.16_300)]',
  cyan: 'bg-[oklch(0.48_0.12_235)]',
}
const NAMES: Record<string, string> = { default: 'Default' }
const swatchOf = (accent: string) => SWATCH[accent] ?? 'bg-muted-foreground'
const nameOf = (accent: string) => NAMES[accent] ?? accent.charAt(0).toUpperCase() + accent.slice(1)

const theme = withPinia('AccentPicker', useThemeStore)
const options = computed<ThemeAccent[]>(() => {
  const list: readonly string[] = Array.isArray(props.accents) ? props.accents : []
  return list.filter((a): a is ThemeAccent => (THEME_ACCENTS as readonly string[]).includes(a))
})
onMounted(() => {
  requireText('AccentPicker', 'label', props.label, 'It names the radio group, for example "Accent colour".')
  if (!options.value.length) violation('AccentPicker', 'requires-accents', `requires at least one known accent in \`accents\` (known: ${THEME_ACCENTS.join(', ')}). Unknown names are ignored, so this renders an empty group.`)
})
const shape = computed<AccentPickerShape>(() => (ACCENT_PICKER_SHAPES.includes(props.shape as AccentPickerShape) ? (props.shape as AccentPickerShape) : 'circle'))
const size = computed<AccentPickerSize>(() => (ACCENT_PICKER_SIZES.includes(props.size as AccentPickerSize) ? (props.size as AccentPickerSize) : 'md'))
const layout = computed<AccentPickerLayout>(() => (ACCENT_PICKER_LAYOUTS.includes(props.layout as AccentPickerLayout) ? (props.layout as AccentPickerLayout) : 'inline'))
const isList = computed(() => layout.value === 'list')

/** The coloured square (or circle) itself, with the ring that marks the chosen preset. */
const colorClass = (accent: ThemeAccent) =>
  cn(accentSwatchVariants({ shape: shape.value, size: size.value }), swatchOf(accent), theme.accent === accent ? 'ring-2 ring-foreground' : !isList.value && 'hover:ring-2 hover:ring-border')
/** Forced colours: keep the preset colour; rings are dropped, so the selected swatch gets a thicker outline. */
const FORCED = 'forced-color-adjust-none forced-colors:outline-[CanvasText] forced-colors:aria-checked:outline-4'

/** Roving tabindex: the selected swatch is the tab stop (or the first one when none is selected). */
const tabStop = computed(() => (options.value.includes(theme.accent) ? theme.accent : options.value[0]))

function onKeydown(e: KeyboardEvent, index: number) {
  const n = options.value.length
  const group = (e.currentTarget as HTMLElement).parentElement
  // Left/Right follow the reading direction; Up/Down always go forward/back in DOM order.
  const rtl = !!group && getComputedStyle(group).direction === 'rtl'
  const forward = e.key === 'ArrowDown' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')
  const backward = e.key === 'ArrowUp' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')
  const step = forward ? 1 : backward ? -1 : 0
  const jump = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
  if (!step && jump < 0) return
  e.preventDefault()
  const next = jump >= 0 ? jump : (index + step + n) % n
  theme.setAccent(options.value[next])
  group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}
</script>

<template>
  <div
    data-slot="accent-picker"
    role="radiogroup"
    :aria-label="label"
    :data-layout="layout"
    :data-shape="shape"
    :data-size="size"
    :class="cn(accentPickerVariants({ layout }), props.class)"
  >
    <button
      v-for="(accent, i) in options"
      :key="accent"
      type="button"
      role="radio"
      data-slot="accent-picker-swatch"
      :data-accent="accent"
      :aria-checked="theme.accent === accent"
      :aria-label="nameOf(accent)"
      :title="nameOf(accent)"
      :tabindex="tabStop === accent ? 0 : -1"
      :class="
        isList
          ? cn(ACCENT_ROW, focusRing)
          : cn('cursor-pointer motion-safe:transition-shadow', FORCED, colorClass(accent), focusRing)
      "
      @click="theme.setAccent(accent)"
      @keydown="onKeydown($event, i)"
    >
      <template v-if="isList">
        <span data-slot="accent-picker-swatch-color" aria-hidden="true" :class="cn('motion-safe:transition-shadow', FORCED, colorClass(accent))" />
        <span class="min-w-0 flex-1 truncate">{{ nameOf(accent) }}</span>
        <Icon v-if="theme.accent === accent" :icon="faCheck" aria-hidden="true" class="shrink-0" />
      </template>
    </button>
  </div>
</template>
