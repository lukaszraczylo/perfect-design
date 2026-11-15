<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import type { IconDefinition } from '../../../lib/icons-tools'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Badge from '../../primitives/Badge/Badge.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import { NAV_IS_ACTIVE_KEY } from './context'
import { NAV_LINK_SHAPES, NAV_LINK_SIZES, NAV_LINK_VARIANTS, navLinkVariants, type NavLinkShape, type NavLinkSize, type NavLinkVariant } from './variants'

export interface NavLinkProps extends BaseProps {
  /** Plain URL. Rendered as `href` on `<a>`. */
  href?: string
  /** Router target. A string is also used as the target for the injected `isActive` predicate; objects are forwarded as `to` to a component passed via `as`. */
  to?: string | Record<string, unknown>
  /** Explicit active state. When omitted, the injected `NAV_IS_ACTIVE_KEY` predicate decides (inactive if none is provided). */
  active?: boolean
  disabled?: boolean
  variant?: NavLinkVariant
  size?: NavLinkSize
  /** Corner style: `rounded` (default, the variant's own radius), `pill` or `square`. Unknown values fall back to `rounded`. */
  shape?: NavLinkShape
  /** FontAwesome icon shown before the label (the `icon` slot overrides it). */
  icon?: IconDefinition
  /** Short trailing badge text (the `badge` slot overrides it). */
  badge?: string | number
  /** Icon-only presentation: the label stays in the DOM for screen readers but is visually hidden. */
  collapsed?: boolean
  /** Element or component to render. Pass a RouterLink to use `to` with vue-router. */
  as?: PrimitiveProps['as']
  /** Render the single child (e.g. a RouterLink) instead of an `<a>`. */
  asChild?: boolean
}

const props = withDefaults(defineProps<NavLinkProps>(), { as: 'a', variant: 'default', size: 'md', shape: 'rounded', active: undefined })
defineSlots<{ default?: () => unknown; icon?: () => unknown; badge?: () => unknown }>()

const isActiveFn = inject(NAV_IS_ACTIVE_KEY, undefined)

const target = computed(() => props.href ?? (typeof props.to === 'string' ? props.to : undefined))
const isActive = computed(() => {
  if (props.active !== undefined) return props.active
  if (!isActiveFn || target.value === undefined) return false
  try {
    return !!isActiveFn(target.value)
  } catch {
    return false
  }
})

const isAnchor = computed(() => props.as === 'a')
const isComponent = computed(() => typeof props.as !== 'string')
/** Only bind href/to when they apply: an explicit `undefined` would override a rendered component's own attribute. */
const linkAttrs = computed(() => {
  if (props.asChild) return {}
  if (isAnchor.value) return props.disabled || target.value === undefined ? {} : { href: target.value }
  if (isComponent.value) return { to: props.to ?? props.href }
  return {}
})
/** Unknown values fall back to the defaults instead of dropping the classes. */
const pick = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback)
const classes = computed(() =>
  cn(
    navLinkVariants({
      variant: pick(NAV_LINK_VARIANTS, props.variant, 'default'),
      size: pick(NAV_LINK_SIZES, props.size, 'md'),
      shape: pick(NAV_LINK_SHAPES, props.shape, 'rounded'),
    }),
    props.class,
  ),
)

const link = ref<{ $el?: Element } | null>(null)
onMounted(async () => {
  await nextTick()
  // A disabled link needs no target; `as-child` leaves the target to the child; a string `as` other than `a` (a button) runs @click.
  const needsTarget = !props.asChild && !props.disabled && (isAnchor.value || isComponent.value)
  if (needsTarget && !(props.href || props.to)) {
    violation('NavLink', 'requires-href', 'requires `href` or `to`. A link without a target is not focusable and goes nowhere; pass `as="button"` for an action, or `disabled`.')
  }
})
useRequireAccessibleName(
  'NavLink',
  () => link.value?.$el,
  'Give the link visible text in its default slot, or `aria-label` when it only shows an icon (`collapsed` keeps the text for screen readers).',
  () => !!link.value?.$el?.matches?.('a[href],button,[role=link],[role=button]'),
)

function onClick(e: MouseEvent) {
  if (props.disabled) {
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}
</script>

<template>
  <Primitive
    ref="link"
    data-slot="nav-link"
    :as="as"
    :as-child="asChild"
    v-bind="linkAttrs"
    :aria-current="isActive ? 'page' : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :tabindex="disabled ? -1 : undefined"
    :data-active="isActive ? '' : undefined"
    :class="classes"
    @click.capture="onClick"
  >
    <slot v-if="asChild" />
    <template v-else>
      <span v-if="$slots.icon || icon" data-slot="nav-link-icon" class="inline-flex shrink-0 items-center">
        <slot name="icon"><Icon v-if="icon" :icon="icon" /></slot>
      </span>
      <span data-slot="nav-link-label" :class="collapsed ? 'sr-only' : 'min-w-0 truncate'"><slot /></span>
      <span v-if="!collapsed && ($slots.badge || (badge !== undefined && badge !== ''))" data-slot="nav-link-badge" class="ms-auto inline-flex shrink-0">
        <slot name="badge"><Badge variant="secondary">{{ badge }}</Badge></slot>
      </span>
    </template>
  </Primitive>
</template>
