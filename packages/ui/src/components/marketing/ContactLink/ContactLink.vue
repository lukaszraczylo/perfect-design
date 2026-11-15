<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { faEnvelope, faPhone } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { accessibleName, violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { oneOf } from '../shared/pick'
import {
  CONTACT_LINK_SHAPES,
  CONTACT_LINK_SIZES,
  CONTACT_LINK_TONES,
  CONTACT_LINK_VARIANTS,
  contactLinkIconTileVariants,
  contactLinkInteractiveVariants,
  contactLinkVariants,
  type ContactLinkShape,
  type ContactLinkSize,
  type ContactLinkTone,
  type ContactLinkVariant,
} from './variants'

export interface ContactLinkProps extends BaseProps {
  /** `email` builds a mailto: link, `tel` builds a tel: link. */
  type?: 'email' | 'tel'
  /** Address or phone number. Empty value renders plain text instead of a link. */
  value?: string
  /** Visible text; defaults to `value`. In the `card` variant `label` is the headline and `value` the secondary line. */
  label?: string
  /** Optional mailto subject (email only). */
  subject?: string
  /** Override the default icon. */
  icon?: IconDefinition
  /** Hide the icon. */
  noIcon?: boolean
  /** Look: `inline` (text link), `button` (filled), `outline` (bordered button), `ghost` (borderless button with a hover fill) or `card` (bordered block with an icon tile). Unknown values fall back to `inline`. */
  variant?: ContactLinkVariant
  /** Text, icon and padding scale: `sm`, `md` or `lg`. Unknown values fall back to `md`. */
  size?: ContactLinkSize
  /** Colour: `primary` (the original), `neutral` (foreground) or `muted`. Colours the text, the button fill or the card icon; a non-link span keeps the surrounding colour. Unknown values fall back to `primary`. */
  tone?: ContactLinkTone
  /** Corners: `rounded` (the original radius of the variant), `pill` or `square`. Unknown values fall back to `rounded`. */
  shape?: ContactLinkShape
}

const props = withDefaults(defineProps<ContactLinkProps>(), { type: 'email', variant: 'inline', size: 'md', tone: 'primary', shape: 'rounded' })

const el = ref<HTMLElement | null>(null)
onMounted(async () => {
  await nextTick()
  const node = el.value
  if (node && !accessibleName(node) && !(node.textContent ?? '').trim()) {
    violation('ContactLink', 'requires-text', 'requires a `value`, a `label` or default slot text. Without visible text the link has no name.')
  }
})

const kind = computed(() => (props.type === 'tel' ? 'tel' : 'email'))
const value = computed(() => (props.value ?? '').trim())
const href = computed(() => {
  if (!value.value) return undefined
  if (kind.value === 'tel') {
    // Keep what dialers understand: digits, leading +, and * # , ; pause/extension characters.
    const dial = value.value.replace(/[^\d+*#,;]/g, '')
    return dial ? `tel:${dial}` : undefined
  }
  const subject = props.subject ? `?subject=${encodeURIComponent(props.subject)}` : ''
  return `mailto:${value.value.replace(/\s+/g, '')}${subject}`
})
const icon = computed(() => props.icon ?? (kind.value === 'tel' ? faPhone : faEnvelope))
const variant = computed<ContactLinkVariant>(() => (CONTACT_LINK_VARIANTS.includes(props.variant) ? props.variant : 'inline'))
const size = computed<ContactLinkSize>(() => (CONTACT_LINK_SIZES.includes(props.size) ? props.size : 'md'))
const tone = computed<ContactLinkTone>(() => oneOf(props.tone, CONTACT_LINK_TONES, 'primary'))
const shape = computed<ContactLinkShape>(() => oneOf(props.shape, CONTACT_LINK_SHAPES, 'rounded'))
const iconSize = computed(() => size.value)
const classes = computed(() =>
  cn(contactLinkVariants({ variant: variant.value, size: size.value, shape: shape.value }), href.value && [contactLinkInteractiveVariants({ variant: variant.value, tone: tone.value }), focusRing], props.class),
)
const tileClass = computed(() => contactLinkIconTileVariants({ size: size.value, tone: tone.value }))
/** Card shows the label as headline and the raw value beneath it when they differ. */
const secondary = computed(() => (variant.value === 'card' && props.label && props.label !== value.value ? value.value : ''))
</script>

<template>
  <component :is="href ? 'a' : 'span'" ref="el" data-slot="contact-link" :data-type="kind" :data-variant="variant" :data-size="size" :data-tone="tone" :data-shape="shape" :href="href" :class="classes">
    <span v-if="variant === 'card' && !noIcon" data-slot="contact-link-icon" :class="tileClass"><Icon :icon="icon" :size="iconSize" /></span>
    <Icon v-else-if="!noIcon" :icon="icon" :size="iconSize" />
    <span v-if="variant === 'card'" data-slot="contact-link-text" class="flex min-w-0 flex-col">
      <span data-slot="contact-link-label" class="break-words"><slot>{{ label ?? value }}</slot></span>
      <span v-if="secondary" data-slot="contact-link-value" class="break-words text-xs font-normal text-muted-foreground">{{ secondary }}</span>
    </span>
    <slot v-else>{{ label ?? value }}</slot>
  </component>
</template>
