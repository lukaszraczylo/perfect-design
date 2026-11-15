<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName, violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'

export interface BreadcrumbLinkProps extends BaseProps {
  href?: string
  /** Router target; forwarded as `to` when `as` is a component such as RouterLink. */
  to?: string | Record<string, unknown>
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<BreadcrumbLinkProps>(), { as: 'a' })

const linkAttrs = computed(() => {
  if (props.asChild) return {}
  if (props.as === 'a') {
    const target = props.href ?? (typeof props.to === 'string' ? props.to : undefined)
    return target === undefined ? {} : { href: target }
  }
  if (typeof props.as !== 'string') return { to: props.to ?? props.href }
  return {}
})

const link = ref<{ $el?: Element } | null>(null)
onMounted(async () => {
  await nextTick()
  // A string `as` other than `a` (a button with @click) carries its own action; `as-child` leaves the target to the child.
  const needsTarget = !props.asChild && (props.as === 'a' || typeof props.as !== 'string')
  const target = props.to ?? props.href
  if (needsTarget && (target === undefined || target === '')) {
    violation('BreadcrumbLink', 'requires-href', 'requires `href` or `to`. A link without a target is not focusable and goes nowhere; use BreadcrumbPage for the current page.')
  }
})
useRequireAccessibleName(
  'BreadcrumbLink',
  () => link.value?.$el,
  'Give the link visible text, or `aria-label` when it only shows an icon.',
  () => !!link.value?.$el?.matches?.('a[href],button,[role=link],[role=button]'),
)
</script>

<template>
  <Primitive
    ref="link"
    data-slot="breadcrumb-link"
    :as="as"
    :as-child="asChild"
    v-bind="linkAttrs"
    :class="cn('inline-flex items-center gap-1 rounded-sm motion-safe:transition-colors hover:text-foreground hover:underline [&_svg]:size-3.5', focusRing, props.class)"
  >
    <slot />
  </Primitive>
</template>
