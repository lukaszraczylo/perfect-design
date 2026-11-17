<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { violation } from '../../../lib/contract'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { useMountedCheck } from '../_shared/contract'
import { LIST_MARKER_KEY, LIST_SIZE_KEY, LIST_VARIANT_KEY, listDescriptionSizes, listItemSizes, listMarkerItemSizes } from './variants'

export interface ListItemProps extends BaseProps {
  as?: PrimitiveProps['as']
  /** Render the single slot child instead of a wrapper (the leading/trailing layout is skipped). */
  asChild?: boolean
  /**
   * Hover/focus styles and keyboard activation (Enter/Space dispatch a click).
   * Defaults to true inside `<List variant="interactive">`; pass `false` to opt a row out.
   */
  interactive?: boolean
  /** Highlights the item and sets `aria-current`. */
  selected?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<ListItemProps>(), { as: 'li', interactive: undefined })
const listVariant = inject(LIST_VARIANT_KEY, undefined)
const isInteractive = computed(() => props.interactive ?? listVariant?.value === 'interactive')
const root = ref<{ $el?: unknown } | null>(null)
useMountedCheck(() => {
  if (listVariant) return
  const node = root.value?.$el
  // A plain ul / ol / role="list" parent is a list too.
  if (node instanceof Element && node.parentElement?.closest('ul,ol,menu,[role="list"]')) return
  violation('ListItem', 'requires-list', 'must be rendered inside a List (or another `ul` / `ol` / `role="list"` element): a list item outside a list is invalid HTML.')
})
const listSize = inject(LIST_SIZE_KEY, undefined)
const size = computed(() => listSize?.value ?? 'md')
const listMarker = inject(LIST_MARKER_KEY, undefined)
const marked = computed(() => !!listMarker && listMarker.value !== 'none')
const withAvatar = computed(() => listVariant?.value === 'with-avatar')

const native = computed(() => props.as === 'a' || props.as === 'button')
const active = computed(() => isInteractive.value && !props.disabled)
const classes = computed(() =>
  marked.value
    ? cn(listMarkerItemSizes[size.value], props.selected && 'bg-accent text-accent-foreground', props.disabled && 'pointer-events-none opacity-50', props.class)
    : cn(
    'flex items-center gap-3',
    listItemSizes[size.value],
    listVariant?.value === 'card' && 'rounded-lg border bg-card text-card-foreground shadow-xs',
    withAvatar.value && 'gap-4 py-3',
    isInteractive.value && ['cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground', focusRing],
    props.selected && 'bg-accent text-accent-foreground',
    props.disabled && 'pointer-events-none opacity-50',
    props.class,
  ),
)

function onKeydown(e: KeyboardEvent) {
  if (!active.value || native.value || e.target !== e.currentTarget) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).click()
  }
}
function onClick(e: MouseEvent) {
  if (props.disabled) {
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}
</script>

<template>
  <Primitive
    ref="root"
    data-slot="list-item"
    :as="as"
    :as-child="asChild"
    :tabindex="active && !native ? 0 : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :aria-current="selected ? 'true' : undefined"
    :data-state="selected ? 'selected' : undefined"
    :data-interactive="isInteractive ? '' : undefined"
    :class="classes"
    @click.capture="onClick"
    @keydown="onKeydown"
  >
    <slot v-if="asChild" />
    <template v-else-if="marked">
      <slot />
      <span v-if="$slots.description" data-slot="list-item-description" :class="cn('block text-muted-foreground', listDescriptionSizes[size])"><slot name="description" /></span>
    </template>
    <template v-else>
      <span v-if="$slots.leading" data-slot="list-item-leading" :class="cn('flex shrink-0 items-center', withAvatar ? 'text-foreground' : 'text-muted-foreground')"><slot name="leading" /></span>
      <span data-slot="list-item-content" :class="cn('flex min-w-0 flex-1 flex-col', withAvatar && 'font-medium')">
        <slot />
        <span v-if="$slots.description" data-slot="list-item-description" :class="cn(listDescriptionSizes[size], 'text-muted-foreground', withAvatar && 'font-normal')"><slot name="description" /></span>
      </span>
      <span v-if="$slots.trailing" data-slot="list-item-trailing" class="flex shrink-0 items-center gap-2 text-muted-foreground"><slot name="trailing" /></span>
    </template>
  </Primitive>
</template>
