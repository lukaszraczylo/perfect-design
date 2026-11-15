<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText, useRequireAccessibleName, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { SKIP_LINK_SIZES, SKIP_LINK_VARIANTS, skipLinkVariants, type SkipLinkSize, type SkipLinkVariant } from './variants'

export interface SkipLinkProps extends BaseProps {
  /** Fragment link to the main landmark. The target should have this id. */
  href?: string
  /** Focused look: `solid` (default), `outline` or `inverted`. Unknown values fall back to `solid`. */
  variant?: SkipLinkVariant
  /** Focused size: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: SkipLinkSize
}

const props = withDefaults(defineProps<SkipLinkProps>(), { href: '#main-content', variant: 'solid', size: 'md' })
const variant = computed<SkipLinkVariant>(() => (SKIP_LINK_VARIANTS.includes(props.variant as SkipLinkVariant) ? (props.variant as SkipLinkVariant) : 'solid'))
const size = computed<SkipLinkSize>(() => (SKIP_LINK_SIZES.includes(props.size as SkipLinkSize) ? (props.size as SkipLinkSize) : 'md'))

const link = ref<HTMLElement | null>(null)
useRequireAccessibleName('SkipLink', () => link.value, 'Keep the default text, or give the slot text such as "Skip to content".')
onMounted(async () => {
  requireText('SkipLink', 'href', props.href, 'Point it at the id of the main landmark, for example `#main-content`.')
  await nextTick()
  await nextTick()
  if (typeof document === 'undefined' || typeof props.href !== 'string' || !props.href.startsWith('#') || props.href.length < 2) return
  let id = props.href.slice(1)
  try {
    id = decodeURIComponent(id)
  } catch {
    /* malformed escape: look the id up as written */
  }
  if (!document.getElementById(id)) {
    violation('SkipLink', 'requires-target', `requires an element with id="${id}" in the document (its \`href\` is "${props.href}"). Put the id on the main landmark, or change \`href\`; without it the link does nothing.`)
  }
})

function onClick(e: MouseEvent) {
  if (typeof document === 'undefined' || !props.href.startsWith('#') || props.href.length < 2) return
  const target = document.getElementById(decodeURIComponent(props.href.slice(1)))
  if (!target) return
  // Moving focus, rather than only scrolling, is what makes the skip effective for keyboard and screen-reader users.
  e.preventDefault()
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus()
  target.scrollIntoView?.({ block: 'start' })
}
</script>

<template>
  <a
    ref="link"
    data-slot="skip-link"
    :href="href"
    :data-variant="variant"
    :data-size="size"
    :class="cn(skipLinkVariants({ variant, size }), props.class)"
    @click="onClick"
  >
    <slot>Skip to main content</slot>
  </a>
</template>
