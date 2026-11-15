<script setup lang="ts">
import { computed, provide, type HTMLAttributes } from 'vue'
import { SelectContent, SelectPortal, SelectScrollDownButton, SelectScrollUpButton, SelectViewport } from 'reka-ui'
import { faChevronDown, faChevronUp } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRegisterPart } from '../../../lib/contract'
import { floatingSurface } from '../../../lib/styles'
import Icon from '../../primitives/Icon/Icon.vue'
import { normalizeSelectItemSize, SELECT_ITEM_SIZE_KEY, type SelectItemSize } from './select-size'

export interface SelectContentProps {
  /** `popper` anchors below the trigger (default); `item-aligned` overlays the selected item like a native menu. */
  position?: 'popper' | 'item-aligned'
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  /** Distance in px between trigger and content (popper only). */
  sideOffset?: number
  /** Density of the items: `sm` is compact, `md` (default) the standard row, `lg` a roomy row. A `size` on a `SelectItem` wins. */
  size?: SelectItemSize
  class?: HTMLAttributes['class']
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<SelectContentProps>(), { position: 'popper', sideOffset: 4, size: 'md' })
const itemSize = computed(() => normalizeSelectItemSize(props.size))
provide(SELECT_ITEM_SIZE_KEY, () => itemSize.value)

useRegisterPart('Select', 'SelectContent')
const popper = computed(() => props.position !== 'item-aligned')
const classes = computed(() =>
  cn(
    floatingSurface,
    'relative max-h-(--reka-select-content-available-height) max-w-(--reka-select-content-available-width) min-w-32 origin-(--reka-select-content-transform-origin) overflow-x-hidden overflow-y-auto',
    'data-[state=open]:animate-ds-pop-in data-[state=closed]:animate-ds-pop-out',
    props.class,
  ),
)
</script>

<template>
  <SelectPortal>
    <SelectContent
      data-slot="select-content"
      :data-size="itemSize === 'md' ? undefined : itemSize"
      :position="position"
      :side="side"
      :align="align"
      :side-offset="popper ? sideOffset : undefined"
      v-bind="$attrs"
      :class="classes"
    >
      <SelectScrollUpButton data-slot="select-scroll-up" class="flex cursor-default items-center justify-center py-1 text-muted-foreground">
        <Icon :icon="faChevronUp" size="xs" />
      </SelectScrollUpButton>
      <SelectViewport :class="cn('p-1', popper && 'w-full min-w-(--reka-select-trigger-width)')">
        <slot />
      </SelectViewport>
      <SelectScrollDownButton data-slot="select-scroll-down" class="flex cursor-default items-center justify-center py-1 text-muted-foreground">
        <Icon :icon="faChevronDown" size="xs" />
      </SelectScrollDownButton>
    </SelectContent>
  </SelectPortal>
</template>
