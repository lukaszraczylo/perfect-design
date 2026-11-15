<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { faXmark } from '../../../lib/icons'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { requireText, useRequireAccessibleName } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Icon from '../Icon/Icon.vue'
import { chipVariants, type ChipRounded, type ChipSize, type ChipTone, type ChipVariant } from './variants'

export interface ChipProps extends BaseProps {
  /** Look. `soft`, `solid` and `outline` combine with `tone`; the others have fixed colours. */
  variant?: ChipVariant
  /** Semantic colour for the `soft`, `solid` and `outline` variants. Ignored by the fixed-colour variants. */
  tone?: ChipTone
  size?: ChipSize
  /** Corner radius: `full` (pill, default), `md` or `none`. */
  rounded?: ChipRounded
  /** Text of the chip (default slot overrides it) and the name used in the remove button label. */
  label?: string
  /** Leading FontAwesome icon. Use the `leading` slot for anything else (avatar, dot...). */
  icon?: IconDefinition
  /** Shows a remove button; Backspace/Delete on the focused chip emits `remove` too. */
  removable?: boolean
  /** Renders the content as a toggle button (aria-pressed) bound with `v-model:selected`. */
  selectable?: boolean
  /** Blocks selection, removal and keyboard shortcuts. */
  disabled?: boolean
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<ChipProps>(), { variant: 'default', size: 'md', rounded: 'full', as: 'span' })
const selected = defineModel<boolean>('selected', { default: false })
const emit = defineEmits<{ remove: [] }>()

const VARIANTS: readonly ChipVariant[] = ['default', 'secondary', 'outline', 'primary', 'success', 'warning', 'destructive', 'info', 'soft', 'solid']
const TONES: readonly ChipTone[] = ['neutral', 'primary', 'success', 'warning', 'danger', 'info']
const SIZES: readonly ChipSize[] = ['sm', 'md', 'lg']
const ROUNDED: readonly ChipRounded[] = ['full', 'md', 'none']
const variant = computed<ChipVariant>(() => (VARIANTS.includes(props.variant) ? props.variant : 'default'))
const tone = computed<ChipTone | undefined>(() => (props.tone && TONES.includes(props.tone) ? props.tone : undefined))
const size = computed<ChipSize>(() => (SIZES.includes(props.size) ? props.size : 'md'))
const rounded = computed<ChipRounded>(() => (ROUNDED.includes(props.rounded) ? props.rounded : 'full'))
const classes = computed(() =>
  cn(chipVariants({ variant: variant.value, tone: tone.value, size: size.value, rounded: rounded.value }), props.class),
)
// A removable, non-selectable chip is itself the keyboard focus stop (the toggle button is it otherwise).
const focusable = computed(() => props.removable && !props.selectable && !props.disabled)
const removeLabel = computed(() => (props.label ? `Remove ${props.label}` : 'Remove'))

const toggleEl = ref<HTMLElement | null>(null)
onMounted(async () => {
  await nextTick()
  if (props.removable) requireText('Chip', 'label', props.label, 'The remove button is named "Remove <label>", so a removable chip needs one.')
})
useRequireAccessibleName('Chip', () => toggleEl.value, 'A selectable chip needs a `label` or default slot content.', () => !!props.selectable)

function toggle() {
  if (!props.disabled) selected.value = !selected.value
}

function remove() {
  if (!props.disabled) emit('remove')
}

function onKeydown(e: KeyboardEvent) {
  if (props.removable && (e.key === 'Backspace' || e.key === 'Delete')) {
    e.preventDefault()
    remove()
  }
}
</script>

<template>
  <Primitive
    data-slot="chip"
    :as="as"
    :role="focusable ? 'group' : undefined"
    :aria-label="focusable && label ? label : undefined"
    :aria-keyshortcuts="focusable ? 'Delete Backspace' : undefined"
    :tabindex="focusable ? 0 : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :data-selectable="selectable ? '' : undefined"
    :data-selected="selectable && selected ? '' : undefined"
    :class="classes"
    @keydown="onKeydown"
  >
    <span v-if="$slots.leading || icon" data-slot="chip-leading" class="inline-flex items-center">
      <slot name="leading"><Icon v-if="icon" :icon="icon" size="xs" /></slot>
    </span>
    <button
      v-if="selectable"
      type="button"
      ref="toggleEl"
      data-slot="chip-toggle"
      :aria-pressed="selected ? 'true' : 'false'"
      :disabled="disabled"
      :class="cn('rounded-full', focusRing)"
      @click="toggle"
    >
      <slot>{{ label }}</slot>
    </button>
    <span v-else data-slot="chip-label" class="truncate"><slot>{{ label }}</slot></span>
    <button
      v-if="removable"
      type="button"
      data-slot="chip-remove"
      tabindex="-1"
      :aria-label="removeLabel"
      :disabled="disabled"
      :class="cn('-my-1 -me-1.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-foreground/10', focusRing)"
      @click.stop="remove"
    >
      <Icon :icon="faXmark" size="xs" />
    </button>
  </Primitive>
</template>
