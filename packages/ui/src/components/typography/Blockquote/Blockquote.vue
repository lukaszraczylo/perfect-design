<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import {
  blockquoteAligns,
  blockquoteAuthorVariants,
  blockquoteSizes,
  blockquoteVariantNames,
  blockquoteVariants,
  type BlockquoteAlign,
  type BlockquoteSize,
  type BlockquoteVariant,
} from './variants'

export interface BlockquoteProps extends BaseProps {
  /** `default` / `primary` (left border), `tinted` (soft surface), `card` (quote card), `pull` (large display quote). Unknown values fall back to `default`. */
  variant?: BlockquoteVariant
  /** Text size of the quote. Not set by default (inherits; `pull` is 2xl). */
  size?: BlockquoteSize
  /** Alignment of the quote and its attribution. */
  align?: BlockquoteAlign
  /** Attribution shown in a footer, e.g. the author. The `citation` slot overrides it. Ignored when an author row is shown. */
  citation?: string
  /** Author name; switches the footer to an author row (avatar, name, role). */
  author?: string
  /** Author role or company, shown under the name. */
  role?: string
  /** Avatar image URL, shown before the name. Use the `avatar` slot for an `Avatar` component. */
  avatar?: string
  /** URL of the source; rendered as the native `cite` attribute. */
  cite?: string
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<BlockquoteProps>(), { variant: 'default', as: 'blockquote' })
const slots = useSlots()

const hasAvatar = computed(() => Boolean(props.avatar) || Boolean(slots.avatar))
const hasAuthorName = computed(() => Boolean(props.author) || Boolean(slots.author))
const hasRole = computed(() => Boolean(props.role) || Boolean(slots.role))
const hasAuthorRow = computed(() => hasAvatar.value || hasAuthorName.value || hasRole.value)
const hasCitation = computed(() => Boolean(props.citation) || Boolean(slots.citation))

const align = computed<BlockquoteAlign | undefined>(() => (props.align && blockquoteAligns.includes(props.align) ? props.align : undefined))
const classes = computed(() =>
  cn(
    blockquoteVariants({
      variant: blockquoteVariantNames.includes(props.variant) ? props.variant : 'default',
      size: props.size && blockquoteSizes.includes(props.size) ? props.size : undefined,
      align: align.value,
    }),
    props.class,
  ),
)
const authorClasses = computed(() => blockquoteAuthorVariants({ align: align.value }))
</script>

<template>
  <Primitive data-slot="blockquote" :as="as" :as-child="asChild" :cite="cite" :class="classes">
    <slot v-if="asChild" />
    <template v-else>
      <slot />
      <footer v-if="hasAuthorRow" data-slot="blockquote-footer" :class="authorClasses">
        <span v-if="hasAvatar" data-slot="blockquote-avatar" class="shrink-0">
          <slot name="avatar"><img :src="avatar" alt="" class="size-10 rounded-full object-cover" /></slot>
        </span>
        <span v-if="hasAuthorName || hasRole" class="min-w-0 text-start leading-snug">
          <span v-if="hasAuthorName" data-slot="blockquote-author" class="block text-sm font-semibold text-foreground">
            <slot name="author">{{ author }}</slot>
          </span>
          <span v-if="hasRole" data-slot="blockquote-role" class="block text-sm text-muted-foreground">
            <slot name="role">{{ role }}</slot>
          </span>
        </span>
      </footer>
      <footer
        v-else-if="hasCitation"
        data-slot="blockquote-footer"
        class="mt-2 text-sm not-italic text-muted-foreground"
      >
        <slot name="citation">{{ citation }}</slot>
      </footer>
    </template>
  </Primitive>
</template>
