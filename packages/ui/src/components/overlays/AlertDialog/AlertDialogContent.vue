<script setup lang="ts">
import { computed, provide, useAttrs, type HTMLAttributes } from 'vue'
import {
  AlertDialogContent as RekaContent,
  AlertDialogOverlay as RekaOverlay,
  AlertDialogPortal as RekaPortal,
  useForwardPropsEmits,
  type AlertDialogContentEmits,
  type AlertDialogContentProps,
} from 'reka-ui'
import { cn } from '../../../lib/cn'
import { RequiredPartsProbe, useRequiredParts } from '../../../lib/contract'
import { normalizeOverlayTone, type OverlayTone } from '../overlayTone'
import { ALERT_DIALOG_TONE_KEY } from './context'
import { alertDialogContentVariants, alertDialogSizes, alertDialogVariantNames, type AlertDialogSize, type AlertDialogVariant } from './variants'

export interface AlertDialogContentOwnProps {
  class?: HTMLAttributes['class']
  /** Max width preset, applied from the `sm` breakpoint. */
  size?: AlertDialogSize
  /** `default` left-aligned text, or `centered` text and footer buttons. */
  variant?: AlertDialogVariant
  /** Border colour for a danger, warning, success or info prompt. `danger` also makes `AlertDialogAction` destructive by default. */
  tone?: OverlayTone
}

const props = withDefaults(defineProps<AlertDialogContentProps & AlertDialogContentOwnProps>(), { size: 'md', variant: 'default', tone: 'neutral' })
defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
useRequiredParts('AlertDialogContent', [{ part: 'AlertDialogTitle', orAttrs: ['aria-label', 'aria-labelledby'], hint: 'Wrap it in VisuallyHidden if it must not be visible.' }, { part: 'AlertDialogDescription', orAttrs: ['aria-describedby'], hint: 'An alert dialog states what is being confirmed; wrap it in VisuallyHidden if it must not be visible.' }], attrs)

const emits = defineEmits<AlertDialogContentEmits>()

const delegated = computed(() => {
  const { class: _c, size: _s, variant: _v, tone: _t, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)

const sizeKey = computed<AlertDialogSize>(() => (alertDialogSizes.includes(props.size) ? props.size : 'md'))
const variantKey = computed<AlertDialogVariant>(() => (alertDialogVariantNames.includes(props.variant) ? props.variant : 'default'))
const toneKey = computed<OverlayTone>(() => normalizeOverlayTone(props.tone))
provide(ALERT_DIALOG_TONE_KEY, () => toneKey.value)
</script>

<template>
  <RekaPortal>
    <RekaOverlay
      data-slot="alert-dialog-overlay"
      class="fixed inset-0 z-(--z-overlay) bg-scrim data-[state=open]:animate-ds-fade-in data-[state=closed]:animate-ds-fade-out"
    />
    <RekaContent
      data-slot="alert-dialog-content"
      :data-tone="toneKey === 'neutral' ? undefined : toneKey"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(alertDialogContentVariants({ size: sizeKey, variant: variantKey, tone: toneKey }), props.class)"
    >
      <RequiredPartsProbe owner="AlertDialogContent" />
      <slot />
    </RekaContent>
  </RekaPortal>
</template>
