<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { faArrowUpRightFromSquare } from '../../../lib/icons'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { useConfigLabels } from '../../layout/ConfigProvider/config'
import Icon from '../Icon/Icon.vue'
import { LINK_SIZES, LINK_VARIANTS, linkVariants, type LinkSize, type LinkVariant } from './variants'

export interface LinkProps extends BaseProps {
  /** Look: `default`, `underline`, `muted`, `subtle`, `plain` (inherits the text colour) or `destructive`. */
  variant?: LinkVariant
  /** Text size: `inherit` keeps the surrounding size; `sm`, `md` and `lg` set it. */
  size?: LinkSize
  href?: string
  /** Opens in a new tab with rel="noopener noreferrer", adds an icon and an sr-only hint. */
  external?: boolean
  /** Visually hidden hint after an external link, e.g. a translation of "(opens in new tab)". Wins over `ConfigProvider` `labels['link.externalHint']`. */
  externalLabel?: string
  /** Show the trailing icon on external links. */
  externalIcon?: boolean
  /** Blocks navigation, sets aria-disabled and removes the link from the tab order. */
  disabled?: boolean
  /** Use a RouterLink (or any component) here; pass its `to` as an attribute. */
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<LinkProps>(), { variant: 'default', size: 'inherit', externalIcon: true, as: 'a' })

const labels = useConfigLabels('link', { externalHint: '(opens in new tab)' })
const hint = computed(() => (props.externalLabel?.trim() ? props.externalLabel : labels.value.externalHint))

const variant = computed<LinkVariant>(() => (LINK_VARIANTS.includes(props.variant) ? props.variant : 'default'))
const size = computed<LinkSize>(() => (LINK_SIZES.includes(props.size) ? props.size : 'inherit'))
const classes = computed(() => cn(linkVariants({ variant: variant.value, size: size.value }), props.class))

const root = ref<{ $el?: unknown } | null>(null)
const el = () => (root.value?.$el instanceof Element ? root.value.$el : null)

// A link that goes nowhere is a button in disguise. The plain `<a>` needs `href`; `as` a router link (with its `to`) or
// `asChild` over a real anchor provides navigation itself. A disabled link has no href on purpose.
onMounted(async () => {
  await nextTick()
  if (props.disabled) return
  const node = el()
  const goesSomewhere = props.as === 'a' && !props.asChild ? !!props.href?.trim() : props.asChild ? !!node?.hasAttribute('href') : true
  if (!goesSomewhere) {
    violation(
      'Link',
      'requires-href',
      props.asChild
        ? 'with `asChild` needs a child that navigates (an `<a href>` or a router link).'
        : 'requires an `href` (or `as` a router link with its `to`). For an action that goes nowhere use Button.',
    )
  }
})
// An icon-only link has no text to name it.
useRequireAccessibleName('Link', el, 'An icon-only link needs `aria-label` (or `aria-labelledby`, or visible text).', () => !!el()?.matches('a[href],[role=link]'))

/** Only defined attributes are bound: an explicit `href: undefined` would override a RouterLink's computed href. */
const linkAttrs = computed(() => {
  const attrs: Record<string, string | number> = {}
  if (props.href && !props.disabled) attrs.href = props.href
  if (props.external) {
    attrs.target = '_blank'
    attrs.rel = 'noopener noreferrer'
    attrs['data-external'] = ''
  }
  if (props.disabled) {
    attrs.role = 'link'
    attrs['aria-disabled'] = 'true'
    attrs.tabindex = -1
  }
  return attrs
})

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
    data-slot="link"
    :as="as"
    :as-child="asChild"
    v-bind="linkAttrs"
    :class="classes"
    @click.capture="onClick"
  >
    <slot v-if="asChild" />
    <template v-else>
      <slot />
      <Icon
        v-if="external && externalIcon"
        data-slot="link-external-icon"
        :icon="faArrowUpRightFromSquare"
        size="xs"
        class="ms-1 inline align-baseline"
      />
      <span v-if="external" class="sr-only"> {{ hint }}</span>
    </template>
  </Primitive>
</template>
