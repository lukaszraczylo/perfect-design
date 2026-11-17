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
import { useConfigLabels } from '../../layout/ConfigProvider/config'
import { normalizeOverlayTone, type OverlayTone } from '../overlayTone'
import { dialogSizes, dialogVariantNames, dialogContentVariants, type DialogSize, type DialogVariant } from './variants'
import Icon from '../../primitives/Icon/Icon.vue'

export interface DialogContentOwnProps {
  class?: HTMLAttributes['class']
  /** Max width preset (applied from the `sm` breakpoint; ignored by `fullscreen`). */
  size?: DialogSize
  /** Layout: centred card, centred form, fullscreen, or bottom drawer on mobile. */
  variant?: DialogVariant
  /** Border colour for a danger, warning, success or info dialog. The title and actions must still say it in words. */
  tone?: OverlayTone
  /** Show the built-in close (X) button. */
  showClose?: boolean
  /** Accessible name of the close (X) button. Also read from a ConfigProvider as `dialog.close`. A blank value keeps the default. */
  closeLabel?: string
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<DialogContentProps & DialogContentOwnProps>(), {
  size: 'md',
  variant: 'default',
  tone: 'neutral',
  showClose: true,
})
const attrs = useAttrs()
useRequiredParts('DialogContent', [{ part: 'DialogTitle', orAttrs: ['aria-label', 'aria-labelledby'], hint: 'Wrap it in VisuallyHidden if it must not be visible.' }], attrs)

const emits = defineEmits<DialogContentEmits>()

const delegated = computed(() => {
  const { class: _c, size: _s, variant: _v, tone: _t, showClose: _x, closeLabel: _l, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
// Precedence: `closeLabel` prop, then a surrounding ConfigProvider (`dialog.close`), then the English default.
const configured = useConfigLabels('dialog', { close: 'Close' })
const closeName = computed(() => props.closeLabel?.trim() || configured.value.close)

const sizeKey = computed<DialogSize>(() => (dialogSizes.includes(props.size) ? props.size : 'md'))
const variantKey = computed<DialogVariant>(() => (dialogVariantNames.includes(props.variant) ? props.variant : 'default'))
const toneKey = computed<OverlayTone>(() => normalizeOverlayTone(props.tone))
</script>

<template>
  <RekaPortal>
    <RekaOverlay
      data-slot="dialog-overlay"
      class="fixed inset-0 z-(--z-overlay) bg-scrim data-[state=open]:animate-ds-fade-in data-[state=closed]:animate-ds-fade-out"
    />
    <RekaContent
      data-slot="dialog-content"
      :data-tone="toneKey === 'neutral' ? undefined : toneKey"
      v-bind="{ ...attrs, ...forwarded }"
      :class="cn(dialogContentVariants({ variant: variantKey, size: sizeKey, tone: toneKey }), props.class)"
    >
      <RequiredPartsProbe owner="DialogContent" />
      <slot />
      <RekaClose
        v-if="showClose"
        data-slot="dialog-close-x"
        :aria-label="closeName"
        :class="cn('absolute end-4 top-4 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100 pointer-coarse:size-10 forced-colors:opacity-100', focusRing)"
      >
        <Icon :icon="faXmark" />
      </RekaClose>
    </RekaContent>
  </RekaPortal>
</template>
