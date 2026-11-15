<script setup lang="ts">
import { computed, useAttrs, type HTMLAttributes } from 'vue'
import {
  DialogClose as RekaClose,
  DialogContent as RekaContent,
  DialogOverlay as RekaOverlay,
  DialogPortal as RekaPortal,
  useForwardPropsEmits,
  type DialogContentEmits,
  type DialogContentProps,
} from 'reka-ui'
import { faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { RequiredPartsProbe, useRequiredParts } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import { normalizeOverlayTone, type OverlayTone } from '../overlayTone'
import { sheetSides, sheetSizes, sheetVariantNames, sheetVariants, type SheetSide, type SheetSize, type SheetVariant } from './variants'
import Icon from '../../primitives/Icon/Icon.vue'

export interface SheetContentOwnProps {
  class?: HTMLAttributes['class']
  /** Edge the sheet slides in from. */
  side?: SheetSide
  /** Width (left/right) or height (top/bottom) preset. */
  size?: SheetSize
  /** Show the built-in close (X) button. */
  showClose?: boolean
  /** Floating card look: margin to the viewport edges, rounded corners, full border. */
  inset?: boolean
  /** `default` padded panel, or `flush` for content that runs edge to edge. */
  variant?: SheetVariant
  /** Border colour for a danger, warning, success or info sheet. The title and actions must still say it in words. */
  tone?: OverlayTone
}

const props = withDefaults(defineProps<DialogContentProps & SheetContentOwnProps>(), {
  side: 'right',
  size: 'md',
  showClose: true,
  inset: false,
  variant: 'default',
  tone: 'neutral',
})
defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
useRequiredParts('SheetContent', [{ part: 'SheetTitle', orAttrs: ['aria-label', 'aria-labelledby'], hint: 'Wrap it in VisuallyHidden if it must not be visible.' }], attrs)

const emits = defineEmits<DialogContentEmits>()

const delegated = computed(() => {
  const { class: _c, side: _s, size: _z, showClose: _x, inset: _i, variant: _v, tone: _t, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)

const sideKey = computed<SheetSide>(() => (sheetSides.includes(props.side) ? props.side : 'right'))
const sizeKey = computed<SheetSize>(() => (sheetSizes.includes(props.size) ? props.size : 'md'))
const variantKey = computed<SheetVariant>(() => (sheetVariantNames.includes(props.variant) ? props.variant : 'default'))
const toneKey = computed<OverlayTone>(() => normalizeOverlayTone(props.tone))
</script>

<template>
  <RekaPortal>
    <RekaOverlay
      data-slot="sheet-overlay"
      class="fixed inset-0 z-(--z-overlay) bg-scrim data-[state=open]:animate-ds-fade-in data-[state=closed]:animate-ds-fade-out"
    />
    <RekaContent
      data-slot="sheet-content"
      :data-side="sideKey"
      :data-inset="inset ? '' : undefined"
      :data-variant="variantKey === 'default' ? undefined : variantKey"
      :data-tone="toneKey === 'neutral' ? undefined : toneKey"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(sheetVariants({ side: sideKey, size: sizeKey, inset, variant: variantKey, tone: toneKey }), props.class)"
    >
      <RequiredPartsProbe owner="SheetContent" />
      <slot />
      <RekaClose
        v-if="showClose"
        data-slot="sheet-close-x"
        aria-label="Close"
        :class="cn('absolute end-4 top-4 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 pointer-coarse:size-10 forced-colors:opacity-100', focusRing)"
      >
        <Icon :icon="faXmark" />
      </RekaClose>
    </RekaContent>
  </RekaPortal>
</template>
