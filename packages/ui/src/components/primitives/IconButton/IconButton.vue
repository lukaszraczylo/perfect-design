<script setup lang="ts">
import { computed, nextTick, onMounted, useSlots } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import type { PrimitiveProps } from 'reka-ui'
import { requireText, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Button from '../Button/Button.vue'
import Icon from '../Icon/Icon.vue'
import type { ButtonVariant } from '../Button/variants'
import { cn } from '../../../lib/cn'
import {
  ICON_BUTTON_SHAPES,
  ICON_BUTTON_SHAPE_MAP,
  ICON_BUTTON_SIZES,
  ICON_BUTTON_SIZE_MAP,
  iconButtonExtra,
  type IconButtonShape,
  type IconButtonSize,
} from './variants'

export interface IconButtonProps extends BaseProps {
  /** REQUIRED accessible name. Used for `aria-label` and the native `title` tooltip. */
  label: string
  /** FontAwesome icon. Omit when providing the default slot. */
  icon?: IconDefinition
  variant?: ButtonVariant
  /** `xs` 24px, `sm` 32px, `md` 36px (44px on coarse pointers), `lg` 44px, `xl` 48px. The `icon*` Button sizes pass through. */
  size?: IconButtonSize
  /** Corner shape: `rounded` (default), `circle` or `square`. */
  shape?: IconButtonShape
  as?: PrimitiveProps['as']
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  /** Replaces the icon with a spinner, sets aria-busy and blocks clicks. */
  loading?: boolean
}

const props = withDefaults(defineProps<IconButtonProps>(), { variant: 'ghost', size: 'icon', shape: 'rounded', as: 'button', type: 'button' })

const slots = useSlots()

onMounted(async () => {
  await nextTick()
  requireText('IconButton', 'label', props.label, 'It becomes the aria-label and the tooltip, e.g. label="Delete row".')
  if (!props.icon && !slots.default) {
    violation('IconButton', 'requires-icon', 'requires an `icon` (or content in the default slot); without one it renders an empty button.')
  }
})

// Unknown sizes fall back to `icon` so the button always stays square; unknown shapes to `rounded`.
const size = computed<IconButtonSize>(() => (ICON_BUTTON_SIZES.includes(props.size) ? props.size : 'icon'))
const shape = computed<IconButtonShape>(() => (ICON_BUTTON_SHAPES.includes(props.shape) ? props.shape : 'rounded'))
const classes = computed(() => cn(iconButtonExtra({ size: size.value }), props.class))
</script>

<template>
  <Button
    data-slot="icon-button"
    :variant="variant"
    :size="ICON_BUTTON_SIZE_MAP[size]"
    :rounded="ICON_BUTTON_SHAPE_MAP[shape]"
    :as="as"
    :type="type"
    :disabled="disabled"
    :loading="loading"
    :aria-label="label"
    :title="label"
    :class="classes"
  >
    <template v-if="!loading">
      <slot>
        <Icon v-if="icon" :icon="icon" />
      </slot>
    </template>
  </Button>
</template>
