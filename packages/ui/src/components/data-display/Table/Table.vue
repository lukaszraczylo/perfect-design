<script setup lang="ts">
import { computed, inject, provide, ref, useAttrs } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { hasAriaName, useMountedCheck } from '../_shared/contract'
import { tableContextKey, tableNamedByOwnerKey } from './context'
import {
  TABLE_DENSITIES,
  TABLE_LAYOUTS,
  TABLE_SIZES,
  TABLE_VARIANTS,
  tableBorderedClasses,
  tableBorderedContainerClasses,
  tableRowSelectedTones,
  tableVariants,
  type TableDensity,
  type TableLayout,
  type TableSelectedTone,
  type TableSize,
  type TableVariant,
} from './variants'

defineOptions({ inheritAttrs: false })

export interface TableProps extends BaseProps {
  /** Cell padding scale: `compact`, `default` or `comfortable`. Unknown values fall back to `default`. */
  density?: TableDensity
  /** Text size of header and body cells: `sm` (12px), `md` (14px, default) or `lg` (16px). Padding follows `density`. */
  size?: TableSize
  /**
   * `default` (row dividers), `borderless` (no body row dividers; the header keeps its rule) or `filled` (muted header band).
   * Combines with `striped` and `bordered`.
   */
  variant?: TableVariant
  /**
   * `table` (default) or `cards`: below the `sm` breakpoint every body row becomes a stacked card and the header row is
   * hidden visually (kept for assistive tech, shown on keyboard focus). Give each `TableCell` a `label` so the card shows it.
   */
  layout?: TableLayout
  /** Pin header cells to the top of the scroll container. Needs a height-bounded container (`containerClass="max-h-96"`). */
  stickyHeader?: boolean
  /** Tint every second body row (zebra). */
  striped?: boolean
  /** Outer frame with rounded corners plus vertical rules between columns. */
  bordered?: boolean
  /** Tint body rows on hover. Set `false` for non-interactive, read-only tables. */
  hoverable?: boolean
  /** How selected rows (`TableRow selected`) are emphasised: `muted` background or `accent` primary tint. */
  selectedTone?: TableSelectedTone
  /** Classes for the scroll wrapper div. */
  containerClass?: BaseProps['class']
  /** Accessible name of the scroll region. Defaults to the table's `aria-label`, else the `TableCaption` text. One of them is required. */
  label?: string
}

const props = withDefaults(defineProps<TableProps>(), { density: 'default', size: 'md', variant: 'default', layout: 'table', stickyHeader: false, striped: false, bordered: false, hoverable: true, selectedTone: 'muted' })

const density = computed<TableDensity>(() => (TABLE_DENSITIES.includes(props.density) ? props.density : 'default'))
const size = computed<TableSize>(() => (TABLE_SIZES.includes(props.size) ? props.size : 'md'))
const variant = computed<TableVariant>(() => (TABLE_VARIANTS.includes(props.variant) ? props.variant : 'default'))
const layout = computed<TableLayout>(() => (TABLE_LAYOUTS.includes(props.layout) ? props.layout : 'table'))
const tone = computed<TableSelectedTone>(() => (props.selectedTone in tableRowSelectedTones ? props.selectedTone : 'muted'))
const captionId = ref<string>()
provide(tableContextKey, {
  striped: () => props.striped,
  hoverable: () => props.hoverable,
  selectedTone: () => tone.value,
  density: () => density.value,
  size: () => size.value,
  variant: () => variant.value,
  layout: () => layout.value,
  setCaptionId: (id) => (captionId.value = id),
})
const attrs = useAttrs()
// A table named with `aria-label` (which lands on the <table>) names its scroll region too.
const regionLabel = computed(() => props.label || (typeof attrs['aria-label'] === 'string' && attrs['aria-label'] ? attrs['aria-label'] : undefined))
const regionLabelledby = computed(() => (props.label ? undefined : captionId.value))
const named = computed(() => !!regionLabel.value || !!regionLabelledby.value)
// A wrapper that names the table itself (DataTable) reports the missing name with its own props.
const nameOwnedByWrapper = inject(tableNamedByOwnerKey, false)
useMountedCheck(() => {
  if (nameOwnedByWrapper || named.value || hasAriaName(attrs)) return
  violation('Table', 'requires-accessible-name', 'needs an accessible name. Add a `TableCaption` (with `hidden` to keep it out of sight), or set `label` or `aria-label`.')
})

const containerClasses = computed(() => cn('relative w-full overflow-x-auto focus-visible:ring-inset', focusRing, props.bordered && tableBorderedContainerClasses, props.containerClass))
const tableClasses = computed(() => cn(tableVariants({ size: size.value, layout: layout.value }), props.bordered && tableBorderedClasses, props.class))
</script>

<template>
  <div
    data-slot="table-container"
    tabindex="0"
    :role="named ? 'region' : undefined"
    :aria-label="regionLabel"
    :aria-labelledby="regionLabelledby"
    :class="containerClasses"
  >
    <table
      :role="layout === 'cards' ? 'table' : undefined"
      v-bind="$attrs"
      data-slot="table"
      :data-density="density"
      :data-size="size === 'md' ? undefined : size"
      :data-variant="variant === 'default' ? undefined : variant"
      :data-layout="layout === 'table' ? undefined : layout"
      :data-sticky="stickyHeader ? '' : undefined"
      :data-striped="striped ? '' : undefined"
      :data-bordered="bordered ? '' : undefined"
      :data-hoverable="hoverable ? undefined : 'false'"
      :class="tableClasses"
    >
      <slot />
    </table>
  </div>
</template>
