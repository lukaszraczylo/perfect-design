<script setup lang="ts">
import { computed, inject, onMounted, type HTMLAttributes } from 'vue'
import { SelectItem, SelectItemIndicator, SelectItemText } from 'reka-ui'
import { faCheck } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import Icon from '../../primitives/Icon/Icon.vue'
import { normalizeSelectItemSize, SELECT_ITEM_SIZE_CLASSES, SELECT_ITEM_SIZE_KEY, type SelectItemSize } from './select-size'

export interface SelectItemProps {
  /** Value this item represents. Must be a non-empty string. */
  value: string
  disabled?: boolean
  /** Text used for typeahead and the trigger display; defaults to the item's text content. */
  textValue?: string
  /** Row density. Defaults to the `size` of the surrounding `SelectContent`, then `md`. */
  size?: SelectItemSize
  class?: HTMLAttributes['class']
}

const props = defineProps<SelectItemProps>()
const inherited = inject(SELECT_ITEM_SIZE_KEY, null)
const size = computed(() => normalizeSelectItemSize(props.size ?? inherited?.()))

// reka throws while rendering an item with an empty value; a blank item is skipped and reported here instead.
const valid = computed(() => typeof props.value === 'string' && props.value !== '')
onMounted(() => requireText('SelectItem', 'value', props.value, 'An empty value is reserved for "nothing selected": give the item a real value, or use the `placeholder` on SelectValue for the empty state.'))
</script>

<template>
  <SelectItem
    v-if="valid"
    data-slot="select-item"
    :value="value"
    :disabled="disabled"
    :text-value="textValue"
    :class="
      cn(
        'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 ps-2 pe-8 text-sm outline-hidden select-none pointer-coarse:min-h-11',
        'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground forced-colors:data-[highlighted]:outline',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        SELECT_ITEM_SIZE_CLASSES[size],
        props.class,
      )
    "
  >
    <span class="absolute end-2 flex size-3.5 items-center justify-center">
      <SelectItemIndicator data-slot="select-item-indicator">
        <Icon :icon="faCheck" size="sm" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
