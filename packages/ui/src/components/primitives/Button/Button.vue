<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import type { IconDefinition } from '../../../lib/icons-tools'
import type { BaseProps } from '../../../lib/types'
import Icon from '../Icon/Icon.vue'
import Spinner from '../Spinner/Spinner.vue'
import { buttonVariants, type ButtonRounded, type ButtonSize, type ButtonVariant } from './variants'

export interface ButtonProps extends BaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Corner radius: `default` (rounded-md), `full` (pill / circle for icon sizes) or `none`. */
  rounded?: ButtonRounded
  /** Stretch to the full width of the container. */
  block?: boolean
  /** Icon before the label. While `loading` the spinner takes its place. The `icon-start` slot overrides it. */
  iconStart?: IconDefinition
  /** Icon after the label. The `icon-end` slot overrides it. */
  iconEnd?: IconDefinition
  /** Element or component to render as. Use `a` / a RouterLink for navigation buttons. */
  as?: PrimitiveProps['as']
  /** Render the single child instead of a wrapper element (reka-ui asChild). */
  asChild?: boolean
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  /** Shows a spinner, sets aria-busy and blocks clicks while keeping layout stable. */
  loading?: boolean
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'default',
  size: 'md',
  rounded: 'default',
  as: 'button',
  type: 'button',
})

const isNativeButton = computed(() => props.as === 'button')
const inactive = computed(() => props.disabled || props.loading)

const VARIANTS: readonly ButtonVariant[] = ['default', 'secondary', 'outline', 'ghost', 'link', 'destructive', 'success', 'soft']
const SIZES: readonly ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg']
const ICON_SIZES: readonly ButtonSize[] = ['icon', 'icon-xs', 'icon-sm', 'icon-lg']
const ROUNDED: readonly ButtonRounded[] = ['default', 'full', 'none']

const variant = computed<ButtonVariant>(() => (VARIANTS.includes(props.variant) ? props.variant : 'default'))
const size = computed<ButtonSize>(() => (SIZES.includes(props.size) ? props.size : 'md'))
const rounded = computed<ButtonRounded>(() => (ROUNDED.includes(props.rounded) ? props.rounded : 'default'))

// An icon-sized button shows no text, so it needs `aria-label` / `aria-labelledby` (IconButton checks its own `label`).
const attrs = useAttrs()
const root = ref<{ $el?: unknown } | null>(null)
useRequireAccessibleName(
  'Button',
  () => (root.value?.$el instanceof Element ? root.value.$el : null),
  'An icon-only button needs `aria-label` (or `aria-labelledby`, or visible text). Use IconButton with a `label` for a toolbar action.',
  () => ICON_SIZES.includes(size.value) && attrs['data-slot'] !== 'icon-button',
)

const classes = computed(() =>
  cn(buttonVariants({ variant: variant.value, size: size.value, rounded: rounded.value, block: !!props.block }), props.class),
)

function onClick(e: MouseEvent) {
  // Non-<button> elements cannot use the `disabled` attribute, so block clicks manually.
  if (inactive.value) {
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}
</script>

<template>
  <Primitive
    ref="root"
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :type="isNativeButton ? type : undefined"
    :disabled="isNativeButton ? inactive : undefined"
    :aria-disabled="!isNativeButton && inactive ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :data-loading="loading ? '' : undefined"
    :class="classes"
    @click.capture="onClick"
  >
    <slot v-if="asChild" />
    <template v-else>
      <Spinner v-if="loading" size="sm" label="Loading" />
      <slot v-else-if="$slots['icon-start'] || iconStart" name="icon-start"><Icon v-if="iconStart" :icon="iconStart" /></slot>
      <slot />
      <slot v-if="$slots['icon-end'] || iconEnd" name="icon-end"><Icon v-if="iconEnd" :icon="iconEnd" /></slot>
    </template>
  </Primitive>
</template>
