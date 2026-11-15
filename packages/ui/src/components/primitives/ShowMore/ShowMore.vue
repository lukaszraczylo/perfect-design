<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import { faChevronDown } from '../../../lib/icons'
import type { BaseProps } from '../../../lib/types'
import Icon from '../Icon/Icon.vue'
import {
  SHOW_MORE_ALIGNS,
  SHOW_MORE_APPEARANCES,
  SHOW_MORE_LAYOUTS,
  SHOW_MORE_MAX_HEIGHTS,
  SHOW_MORE_SIZES,
  resolveShowMoreLines,
  showMoreContentVariants,
  showMoreLineClamp,
  showMoreMaxHeight,
  showMoreToggleVariants,
  showMoreVariants,
  type ShowMoreAlign,
  type ShowMoreAppearance,
  type ShowMoreLayout,
  type ShowMoreMaxHeight,
  type ShowMoreSize,
} from './variants'

export interface ShowMoreProps extends BaseProps {
  /** Lines shown while collapsed, 1 to 6 (default 3). Fractions are truncated, anything below 1 or not a number falls back to 3, above 6 is 6. */
  lines?: number
  /** Collapse to a height preset instead of a line count: `xs` 64px, `sm` 96px, `md` 128px, `lg` 192px, `xl` 256px. Wins over `lines`. Unknown values are ignored. */
  maxHeight?: ShowMoreMaxHeight
  /** Where the toggle goes: `below` the content (default) or `inline`, beside the content at its last line. */
  layout?: ShowMoreLayout
  /** Position of the toggle in the `below` layout: `start` (default), `center` or `end`. Logical, so it flips in right-to-left text. */
  align?: ShowMoreAlign
  /** Toggle look: `link` (default), `button` (tinted) or `outline`. */
  appearance?: ShowMoreAppearance
  /** Toggle size: `sm` 24px, `md` 32px (default), `lg` 40px minimum height. 44px on coarse pointers. */
  size?: ShowMoreSize
  /** Toggle text while collapsed. Must not be blank. */
  moreLabel?: string
  /** Toggle text while expanded. Must not be blank. */
  lessLabel?: string
  /** Show a chevron that turns when expanded. */
  icon?: boolean
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<ShowMoreProps>(), {
  lines: 3,
  layout: 'below',
  align: 'start',
  appearance: 'link',
  size: 'md',
  moreLabel: 'Show more',
  lessLabel: 'Show less',
  icon: true,
  as: 'div',
})
/** `v-model:expanded`. Uncontrolled when the parent passes no `expanded`; controlled when it passes it with an update handler. */
const expanded = defineModel<boolean>('expanded', { default: false })
const emit = defineEmits<{
  /** Fires when the collapsed content starts or stops overflowing. */
  overflow: [overflowing: boolean]
}>()
const slots = useSlots()

const contentId = `show-more-${useId()}`
const contentEl = ref<HTMLElement | null>(null)
const overflowing = ref(false)
// Height of the collapsed content, remembered so the overflow check still works while the content is expanded.
const collapsedHeight = ref<number | null>(null)

const layout = computed<ShowMoreLayout>(() => (SHOW_MORE_LAYOUTS.includes(props.layout) ? props.layout : 'below'))
const align = computed<ShowMoreAlign>(() => (SHOW_MORE_ALIGNS.includes(props.align) ? props.align : 'start'))
const appearance = computed<ShowMoreAppearance>(() => (SHOW_MORE_APPEARANCES.includes(props.appearance) ? props.appearance : 'link'))
const size = computed<ShowMoreSize>(() => (SHOW_MORE_SIZES.includes(props.size) ? props.size : 'md'))
const heightPreset = computed<ShowMoreMaxHeight | undefined>(() => (props.maxHeight && SHOW_MORE_MAX_HEIGHTS.includes(props.maxHeight) ? props.maxHeight : undefined))
const isExpanded = computed(() => expanded.value === true)

const clampClass = computed(() => (heightPreset.value ? showMoreMaxHeight[heightPreset.value] : showMoreLineClamp[resolveShowMoreLines(props.lines)]))
// While expanded the toggle must stay. If the page started expanded the collapsed height is unknown, so the toggle shows.
const showToggle = computed(() => overflowing.value || (isExpanded.value && collapsedHeight.value === null))

const rootClasses = computed(() => cn(showMoreVariants({ layout: layout.value }), props.class))
const contentClasses = computed(() => cn(showMoreContentVariants({ layout: layout.value }), !isExpanded.value && clampClass.value))
const toggleClasses = computed(() => showMoreToggleVariants({ appearance: appearance.value, size: size.value, layout: layout.value, align: align.value }))

/** True when `full` is taller than `visible` by more than rounding noise. */
const taller = (full: number, visible: number) => full - visible > 1

function measure() {
  const el = contentEl.value
  if (!el) return
  let next: boolean
  if (isExpanded.value) {
    next = collapsedHeight.value !== null && taller(el.scrollHeight, collapsedHeight.value)
  } else {
    collapsedHeight.value = el.clientHeight
    next = taller(el.scrollHeight, el.clientHeight)
  }
  if (next !== overflowing.value) {
    overflowing.value = next
    emit('overflow', next)
  }
}

let observer: ResizeObserver | undefined
onMounted(async () => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && contentEl.value) {
    observer = new ResizeObserver(() => measure())
    observer.observe(contentEl.value)
  }
  await nextTick()
  if (!slots.more) requireText('ShowMore', 'moreLabel', props.moreLabel, 'It is the text of the toggle while collapsed, e.g. moreLabel="Show full description".')
  if (!slots.less) requireText('ShowMore', 'lessLabel', props.lessLabel, 'It is the text of the toggle while expanded, e.g. lessLabel="Show less".')
})
onBeforeUnmount(() => {
  observer?.disconnect()
  observer = undefined
})

// A new clamp invalidates the remembered height.
watch([() => props.lines, heightPreset], () => {
  collapsedHeight.value = null
  measure()
}, { flush: 'post' })
watch(isExpanded, () => measure(), { flush: 'post' })

function toggle() {
  expanded.value = !isExpanded.value
}
</script>

<template>
  <Primitive
    data-slot="show-more"
    :as="as"
    :class="rootClasses"
    :data-state="isExpanded ? 'expanded' : 'collapsed'"
    :data-clamp="heightPreset ? 'height' : 'lines'"
    :data-overflowing="overflowing ? '' : undefined"
  >
    <div :id="contentId" ref="contentEl" data-slot="show-more-content" :class="contentClasses">
      <slot />
    </div>
    <button
      v-if="showToggle"
      type="button"
      data-slot="show-more-toggle"
      :class="toggleClasses"
      :aria-expanded="isExpanded ? 'true' : 'false'"
      :aria-controls="contentId"
      @click="toggle"
    >
      <span data-slot="show-more-label">
        <slot v-if="isExpanded" name="less">{{ lessLabel }}</slot>
        <slot v-else name="more">{{ moreLabel }}</slot>
      </span>
      <Icon v-if="icon" :icon="faChevronDown" size="xs" :class="cn('motion-safe:transition-transform', isExpanded && 'rotate-180')" />
    </button>
  </Primitive>
</template>
