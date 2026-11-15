<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { faCircleCheck, faCircleExclamation, faCircleInfo, faCircleXmark, faLightbulb, faTriangleExclamation, faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { checkAfterMount, useRequireContent } from '../requireContent'
import { pick } from '../pick'
import Icon from '../../primitives/Icon/Icon.vue'
import { exampleIcon, quoteIcon } from './icons'
import { CALLOUT_APPEARANCES, CALLOUT_SIZES, calloutIconVariants, calloutVariants, type CalloutAppearance, type CalloutSize, type CalloutType } from './variants'

export interface CalloutProps extends BaseProps {
  /** Semantic kind of the block: note, tip, important, warning, caution, danger, success, quote or example. */
  type?: CalloutType
  /** Bold heading line. Falls back to the `title` slot. */
  title?: string
  /** Replace the default icon of the type. */
  icon?: IconDefinition
  /** Hide the icon entirely. */
  hideIcon?: boolean
  /** Surface: `soft` (tinted, default), `solid` (filled), `outline` (border only) or `minimal` (no surface, icon and text only). */
  appearance?: CalloutAppearance
  /** Padding, gap and type scale: `sm`, `md` (default) or `lg`. */
  size?: CalloutSize
  /** Show a dismiss (X) button. Dismissing hides the callout and emits `dismiss` once. */
  dismissible?: boolean
  /** Accessible name of the dismiss button. */
  dismissLabel?: string
}

const props = withDefaults(defineProps<CalloutProps>(), { type: 'note', appearance: 'soft', size: 'md', dismissLabel: 'Dismiss' })
const emit = defineEmits<{ dismiss: [] }>()

const DEFAULT_ICONS: Record<CalloutType, IconDefinition> = {
  note: faCircleInfo,
  tip: faLightbulb,
  important: faCircleExclamation,
  warning: faTriangleExclamation,
  caution: faCircleXmark,
  danger: faCircleExclamation,
  success: faCircleCheck,
  quote: quoteIcon,
  example: exampleIcon,
}

const root = useTemplateRef('root')
useRequireContent('Callout', () => root.value, 'Pass a `title`, or put the text in the default slot.')

checkAfterMount(() => {
  if (props.dismissible) requireText('Callout', 'dismissLabel', props.dismissLabel, 'It is the accessible name of the dismiss (X) button.')
})

const visible = ref(true)
const resolvedAppearance = computed<CalloutAppearance>(() => pick(props.appearance, CALLOUT_APPEARANCES, 'soft'))
const resolvedSize = computed<CalloutSize>(() => pick(props.size, CALLOUT_SIZES, 'md'))
const resolvedType = computed<CalloutType>(() => (Object.hasOwn(DEFAULT_ICONS, props.type) ? props.type : 'note'))
const resolvedIcon = computed(() => props.icon ?? DEFAULT_ICONS[resolvedType.value])
const classes = computed(() =>
  cn(calloutVariants({ type: resolvedType.value, appearance: resolvedAppearance.value, size: resolvedSize.value }), props.class),
)
const iconClasses = computed(() => calloutIconVariants({ type: resolvedType.value, appearance: resolvedAppearance.value, size: resolvedSize.value }))
const dismissClasses = computed(() =>
  cn(
    '-my-1 -me-2 inline-flex size-7 shrink-0 pointer-coarse:size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground',
    resolvedAppearance.value === 'solid' && 'text-current hover:bg-current/15 hover:text-current',
    focusRing,
  ),
)

function dismiss() {
  if (!visible.value) return
  visible.value = false
  emit('dismiss')
}
</script>

<template>
  <div
    v-if="visible"
    ref="root"
    data-slot="callout"
    :data-type="resolvedType"
    :data-appearance="resolvedAppearance === 'soft' ? undefined : resolvedAppearance"
    :data-size="resolvedSize === 'md' ? undefined : resolvedSize"
    role="note"
    :class="classes"
  >
    <span v-if="!hideIcon" data-slot="callout-icon" :class="iconClasses"><Icon :icon="resolvedIcon" /></span>
    <div data-slot="callout-body" class="min-w-0 flex-1 space-y-1 break-words">
      <div v-if="title || $slots.title" data-slot="callout-title" class="font-semibold leading-snug">
        <slot name="title">{{ title }}</slot>
      </div>
      <div data-slot="callout-content" :class="cn('text-foreground/90 [&_p+p]:mt-2', resolvedAppearance === 'solid' && 'text-current', resolvedType === 'quote' && 'italic')">
        <slot />
      </div>
      <div v-if="$slots.actions" data-slot="callout-actions" class="flex flex-wrap items-center gap-2 pt-1">
        <slot name="actions" />
      </div>
    </div>
    <button v-if="dismissible" type="button" data-slot="callout-dismiss" :aria-label="dismissLabel" :class="dismissClasses" @click="dismiss">
      <Icon :icon="faXmark" />
    </button>
  </div>
</template>
