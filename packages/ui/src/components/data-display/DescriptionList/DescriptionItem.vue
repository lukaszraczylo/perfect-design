<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { useMountedCheck } from '../_shared/contract'
import CopyButton from '../_shared/CopyButton.vue'
import { descriptionListDensityKey, descriptionListKey } from './context'
import { descriptionDetailsVariants, descriptionItemVariants } from './variants'

export interface DescriptionItemProps extends BaseProps {
  /** The term (label). Use the `term` slot for rich content. */
  term?: string
  /** Show a copy button next to the definition. */
  copyable?: boolean
  /** Text to copy. Defaults to the rendered text of the definition. */
  copyText?: string
}

const props = defineProps<DescriptionItemProps>()
defineEmits<{ copy: [text: string] }>()

const listVariant = inject(descriptionListKey, () => 'stacked' as const)
const listDensity = inject(descriptionListDensityKey, () => 'default' as const)
const dd = ref<HTMLElement | null>(null)
const dt = ref<HTMLElement | null>(null)
useMountedCheck(() => {
  const term = dt.value
  if (!term) return
  if (!term.closest('dl')) violation('DescriptionItem', 'requires-description-list', 'must be rendered inside a DescriptionList (a `dl`): `dt` and `dd` are invalid elsewhere.')
  const named = (term.textContent ?? '').trim() !== '' || !!term.querySelector('[aria-label]:not([aria-label=""]),img[alt]:not([alt=""])')
  if (!named) violation('DescriptionItem', 'requires-term', 'requires a `term` (or the `term` slot with text): a value without a term has no meaning.')
})
const classes = computed(() =>
  cn(
    'grid gap-0.5 group-data-[divided=true]/dl:py-2 group-data-[orientation=horizontal]/dl:sm:grid-cols-[minmax(8rem,12rem)_1fr] group-data-[orientation=horizontal]/dl:sm:gap-4',
    descriptionItemVariants({ variant: listVariant(), density: listDensity() }),
    props.class,
  ),
)
const detailsClasses = computed(() => descriptionDetailsVariants({ variant: listVariant() }))
function textToCopy(): string {
  return props.copyText ?? dd.value?.textContent?.trim() ?? ''
}
</script>

<template>
  <div data-slot="description-item" :class="classes">
    <dt ref="dt" data-slot="description-term" class="text-muted-foreground">
      <slot name="term">{{ term }}</slot>
    </dt>
    <dd data-slot="description-details" :class="detailsClasses">
      <span ref="dd" class="min-w-0 flex-1"><slot /></span>
      <CopyButton v-if="copyable" :text="textToCopy" :label="term ? `Copy ${term}` : 'Copy value'" @copy="(t) => $emit('copy', t)" />
    </dd>
  </div>
</template>
