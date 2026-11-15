<script setup lang="ts">
import { computed, provide, ref, useAttrs } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { CARD_LAYOUT_KEY, CARD_SIZE_KEY } from './context'
import { CARD_SIZES, cardVariants, type CardLayout, type CardSize, type CardVariant } from './variants'

export interface CardProps extends BaseProps {
  /**
   * Surface style: `default`, `outline`, `elevated`, `ghost`, `filled`, `with-image-header`
   * or `interactive` (hover + focus styles; pair it with `as="a"`/`as-child` so it is keyboard reachable).
   */
  variant?: CardVariant
  /** Padding and gap: `sm` 1rem, `md` 1.5rem (default), `lg` 2rem. The header, content, footer and body parts follow. Unknown values fall back to `md`. */
  size?: CardSize
  /** `horizontal` puts `CardMedia` beside the content from the `sm` breakpoint up (stacked below). */
  layout?: CardLayout
  /** Make the whole card a toggle: role="checkbox", Space/Enter/click toggle it. */
  selectable?: boolean
  /** v-model of the selected state (selectable cards). */
  modelValue?: boolean
  /** One-way / `v-model:checked` alias of `modelValue`. */
  checked?: boolean
  /** Blocks selection (selectable cards). */
  disabled?: boolean
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<CardProps>(), {
  variant: 'default',
  size: 'md',
  layout: 'vertical',
  selectable: false,
  modelValue: undefined,
  checked: undefined,
  disabled: false,
  as: 'div',
})
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:checked': [value: boolean]
}>()

const attrs = useAttrs()
const root = ref<{ $el?: unknown } | null>(null)
// A plain card is a generic div. A selectable card (role checkbox) or a card made a region by the caller needs a name.
useRequireAccessibleName(
  'Card',
  () => (root.value?.$el instanceof Element ? root.value.$el : null),
  'A selectable card takes its name from its text; a card with `role="region"` needs `aria-label` or `aria-labelledby`.',
  () => props.selectable || attrs.role === 'region',
)

const internal = ref(false)
const isChecked = computed(() => props.modelValue ?? props.checked ?? internal.value)
const layout = computed<CardLayout>(() => (props.layout === 'horizontal' ? 'horizontal' : 'vertical'))
const size = computed<CardSize>(() => (CARD_SIZES.includes(props.size) ? props.size : 'md'))
provide(CARD_LAYOUT_KEY, layout)
provide(CARD_SIZE_KEY, size)

const classes = computed(() => cn(cardVariants({ size: size.value, variant: props.variant, layout: layout.value, selectable: props.selectable }), props.class))

function toggle() {
  if (!props.selectable || props.disabled) return
  const next = !isChecked.value
  internal.value = next
  emit('update:modelValue', next)
  emit('update:checked', next)
}
function onClick(e: MouseEvent) {
  if (!props.selectable) return
  if (props.disabled) {
    e.preventDefault()
    e.stopImmediatePropagation()
    return
  }
  // Clicks on inner links/buttons/inputs keep their own behaviour and do not toggle the card.
  const inner = (e.target as HTMLElement | null)?.closest('a,button,input,select,textarea,label,[role=button]')
  if (inner && inner !== e.currentTarget && (e.currentTarget as HTMLElement).contains(inner)) return
  toggle()
}
function onKeydown(e: KeyboardEvent) {
  if (!props.selectable || e.target !== e.currentTarget) return
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    toggle()
  }
}
</script>

<template>
  <Primitive
    ref="root"
    data-slot="card"
    :data-variant="variant"
    :data-layout="layout === 'horizontal' ? 'horizontal' : undefined"
    :data-size="size === 'md' ? undefined : size"
    :as="as"
    :as-child="asChild"
    :class="classes"
    :role="selectable ? 'checkbox' : undefined"
    :tabindex="selectable && !disabled ? 0 : undefined"
    :aria-checked="selectable ? (isChecked ? 'true' : 'false') : undefined"
    :aria-disabled="selectable && disabled ? 'true' : undefined"
    :data-state="selectable ? (isChecked ? 'checked' : 'unchecked') : undefined"
    @click="onClick"
    @keydown="onKeydown"
  >
    <slot />
  </Primitive>
</template>
