<script setup lang="ts">
import { faChevronDown } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { focusRing, touchTarget } from '../../../lib/styles'
import Icon from '../../primitives/Icon/Icon.vue'
import { faqItemVariants, type FaqListVariant } from './variants'

/** Internal part of FaqList: one native <details> item. */
export interface FaqEntryProps {
  item: { q: string; a: string }
  index: number
  open: boolean
  variant: FaqListVariant
  numbered?: boolean
}

defineProps<FaqEntryProps>()
defineEmits<{ toggle: [event: Event] }>()
</script>

<template>
  <details data-slot="faq-item" :class="faqItemVariants({ variant })" :open="open" @toggle="$emit('toggle', $event)">
    <summary
      data-slot="faq-question"
      :class="cn('flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm text-start text-base font-medium marker:hidden [&::-webkit-details-marker]:hidden', touchTarget, focusRing)"
    >
      <span v-if="numbered" data-slot="faq-number" aria-hidden="true" class="w-6 shrink-0 font-semibold tabular-nums text-muted-foreground">{{ index + 1 }}.</span>
      <span :class="numbered && 'min-w-0 flex-1'">{{ item.q }}</span>
      <Icon :icon="faChevronDown" class="mt-1 text-muted-foreground transition-transform motion-reduce:transition-none group-open:rotate-180" />
    </summary>
    <div data-slot="faq-answer" :class="cn('mt-3 text-pretty text-sm text-muted-foreground', numbered && 'ps-10')">
      <slot name="answer" :item="item" :index="index">{{ item.a }}</slot>
    </div>
  </details>
</template>
