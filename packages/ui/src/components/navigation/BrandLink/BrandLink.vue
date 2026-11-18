<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import type { IconDefinition } from '../../../lib/icons-tools'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { BRAND_LINK_SIZES, brandLinkLogoVariants, brandLinkVariants, type BrandLinkSize } from './variants'

export interface BrandLinkProps extends BaseProps {
  /** Product name. Required: it is the link's accessible name. Rendered in `<bdi>` so a Latin brand stays intact on right-to-left pages. */
  name: string
  /** Logo icon, decorative and tinted with the primary colour. The `logo` slot replaces it. */
  icon?: IconDefinition
  /** Target when rendered as an anchor. For a router link pass `as` a RouterLink plus `to`. */
  href?: string
  /** Name and logo size. Unknown values fall back to `md`. */
  size?: BrandLinkSize
  /** Element or component to render. Pass a RouterLink with `to` for client-side routing. */
  as?: PrimitiveProps['as']
  /** Render the single child instead of an `<a>`. The child supplies its own content; use `as` to keep the logo and name. */
  asChild?: boolean
}

const props = withDefaults(defineProps<BrandLinkProps>(), { as: 'a', href: '/', size: 'md' })
defineSlots<{ default?: () => unknown; logo?: () => unknown }>()

const size = computed<BrandLinkSize>(() => (BRAND_LINK_SIZES.includes(props.size) ? props.size : 'md'))
const classes = computed(() => cn(brandLinkVariants({ size: size.value }), props.class))
const logoClasses = computed(() => brandLinkLogoVariants({ size: size.value }))
/** `href` only applies to a plain anchor; a rendered component takes its own `to`. */
const linkAttrs = computed(() => (props.asChild || props.as !== 'a' ? {} : { href: props.href }))

onMounted(async () => {
  await nextTick()
  requireText('BrandLink', 'name', props.name, "The product name is the link's accessible name.")
})
</script>

<template>
  <Primitive data-slot="brand-link" :as="as" :as-child="asChild" v-bind="linkAttrs" :class="classes">
    <slot v-if="asChild" />
    <template v-else>
      <span v-if="$slots.logo || icon" data-slot="brand-link-logo" :class="logoClasses" aria-hidden="true">
        <slot name="logo"><Icon v-if="icon" :icon="icon" class="size-full" /></slot>
      </span>
      <bdi data-slot="brand-link-name" class="min-w-0 truncate">{{ name }}</bdi>
    </template>
  </Primitive>
</template>
