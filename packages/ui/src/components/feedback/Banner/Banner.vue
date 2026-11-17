<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { checkAfterMount, useRequireContent } from '../requireContent'
import { isBannerDismissed, persistBannerDismissal } from './storage'
import { pick } from '../pick'
import { focusAfterDismiss } from '../focusAfterDismiss'
import { BANNER_LAYOUTS, BANNER_SIZES, bannerVariants, type BannerAppearance, type BannerLayout, type BannerPlacement, type BannerSize, type BannerVariant } from './variants'

export interface BannerProps extends BaseProps {
  /** Tone. */
  variant?: BannerVariant
  /** Where the banner sits: `top` (default full-width strip), `bottom`, `floating` (fixed, centred, rounded card) or `inline` (rounded, in the content flow). */
  placement?: BannerPlacement
  /** `solid` (filled, default) or `soft` (tinted background with a tone border). */
  appearance?: BannerAppearance
  /** Padding, gap and type scale: `sm`, `md` (default) or `lg`. */
  size?: BannerSize
  /** `default` (message at the start) or `centered` (text and actions centred, for announcement strips). */
  layout?: BannerLayout
  /** Stick to the edge of the scroll container (top, or bottom for `placement="bottom"`). Ignored for `floating` and `inline`. */
  sticky?: boolean
  /** Optional leading FontAwesome icon. */
  icon?: IconDefinition
  /** Show a dismiss button. */
  dismissible?: boolean
  dismissLabel?: string
  /** When set, dismissal is remembered in localStorage under `pd-banner:<storageKey>` and the banner stays hidden next time. */
  storageKey?: string
  role?: 'alert' | 'status' | 'note'
  /** Call-to-action label. Renders a small action button (or a link with `actionHref`) in the action area. The `action` slot overrides it. */
  actionLabel?: string
  /** Makes the call-to-action a link to this URL instead of a button. */
  actionHref?: string
}

const props = withDefaults(defineProps<BannerProps>(), {
  variant: 'default',
  placement: 'top',
  appearance: 'solid',
  size: 'md',
  layout: 'default',
  dismissLabel: 'Dismiss',
})
const emit = defineEmits<{
  dismiss: []
  /** The built-in call-to-action (`actionLabel`) was activated. */
  action: []
}>()

// Storage is read after mount so the first client render matches the server render.
const visible = ref(true)
onMounted(() => {
  if (isBannerDismissed(props.storageKey)) visible.value = false
})
const root = useTemplateRef('root')
useRequireContent('Banner', () => root.value, 'Put the message in the default slot.')
checkAfterMount(() => {
  if (props.dismissible) requireText('Banner', 'dismissLabel', props.dismissLabel, 'It is the accessible name of the dismiss (X) button.')
})
const resolvedVariant = computed<BannerVariant>(() =>
  (['default', 'info', 'success', 'warning', 'destructive'] as const).includes(props.variant) ? props.variant : 'default',
)
const resolvedPlacement = computed<BannerPlacement>(() =>
  (['top', 'bottom', 'floating', 'inline'] as const).includes(props.placement) ? props.placement : 'top',
)
const resolvedAppearance = computed<BannerAppearance>(() => (['solid', 'soft'] as const).includes(props.appearance) ? props.appearance : 'solid')
const resolvedSize = computed<BannerSize>(() => pick(props.size, BANNER_SIZES, 'md'))
const resolvedLayout = computed<BannerLayout>(() => pick(props.layout, BANNER_LAYOUTS, 'default'))
const resolvedRole = computed(() => props.role ?? (resolvedVariant.value === 'destructive' || resolvedVariant.value === 'warning' ? 'alert' : 'status'))
const classes = computed(() =>
  cn(
    bannerVariants({
      variant: resolvedVariant.value,
      placement: resolvedPlacement.value,
      appearance: resolvedAppearance.value,
      size: resolvedSize.value,
      layout: resolvedLayout.value,
      sticky: !!props.sticky && (resolvedPlacement.value === 'top' || resolvedPlacement.value === 'bottom'),
    }),
    props.class,
  ),
)
const hasCta = computed(() => !!props.actionLabel?.trim())
const ctaClasses = cn(
  'inline-flex h-7 items-center rounded-md border border-current/40 px-2.5 text-xs font-medium whitespace-nowrap pointer-coarse:h-10 transition-colors hover:bg-current/10',
  focusRing,
)

function dismiss() {
  if (!visible.value) return
  focusAfterDismiss(root.value)
  visible.value = false
  persistBannerDismissal(props.storageKey)
  emit('dismiss')
}
</script>

<template>
  <div
    v-if="visible"
    ref="root"
    data-slot="banner"
    :data-variant="resolvedVariant"
    :data-placement="resolvedPlacement === 'top' ? undefined : resolvedPlacement"
    :data-appearance="resolvedAppearance === 'solid' ? undefined : resolvedAppearance"
    :data-size="resolvedSize === 'md' ? undefined : resolvedSize"
    :data-layout="resolvedLayout === 'default' ? undefined : resolvedLayout"
    :role="resolvedRole"
    :class="classes"
  >
    <span v-if="icon" data-slot="banner-icon" class="shrink-0 [&_svg]:size-4"><Icon :icon="icon" /></span>
    <div data-slot="banner-content" class="min-w-0 flex-1 basis-48 break-words">
      <slot />
    </div>
    <div v-if="$slots.action || hasCta" data-slot="banner-action" class="flex shrink-0 items-center gap-2">
      <slot name="action">
        <a v-if="actionHref" data-slot="banner-cta" :href="actionHref" :class="ctaClasses" @click="emit('action')">{{ actionLabel }}</a>
        <button v-else type="button" data-slot="banner-cta" :class="ctaClasses" @click="emit('action')">{{ actionLabel }}</button>
      </slot>
    </div>
    <button
      v-if="dismissible"
      type="button"
      data-slot="banner-dismiss"
      :aria-label="dismissLabel"
      :class="cn('-my-1 -me-2 inline-flex size-7 shrink-0 pointer-coarse:size-10 items-center justify-center rounded-md opacity-80 transition hover:bg-foreground/15 hover:opacity-100', focusRing)"
      @click="dismiss"
    >
      <Icon :icon="faXmark" />
    </button>
  </div>
</template>
