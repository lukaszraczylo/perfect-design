<script setup lang="ts">
import { computed, nextTick, onMounted, useId, useSlots } from 'vue'
import { requireText, violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { linkAttrs } from '../shared/motion'
import { headingTag, oneOf } from '../shared/pick'
import {
  siteFooterAlignNames,
  siteFooterAlignVariants,
  siteFooterBrandAlignVariants,
  siteFooterBrandVariants,
  siteFooterColumnsVariants,
  siteFooterContainerVariants,
  siteFooterLegalAlignVariants,
  siteFooterLegalVariants,
  siteFooterListAlignVariants,
  siteFooterMainAlignVariants,
  siteFooterMainVariants,
  siteFooterSizeNames,
  siteFooterTextVariants,
  siteFooterToneNames,
  siteFooterVariantNames,
  siteFooterVariants,
  type SiteFooterAlign,
  type SiteFooterSize,
  type SiteFooterTone,
  type SiteFooterVariant,
} from './variants'

export interface FooterLink {
  label: string
  href: string
  external?: boolean
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface SiteFooterProps extends BaseProps {
  /** Layout. Unknown values fall back to `columns`. */
  variant?: SiteFooterVariant
  /** `dark` inverts the footer (foreground background, background text); `muted` uses the muted surface. Unknown values fall back to `default`. */
  tone?: SiteFooterTone
  /** Vertical padding and text size: `sm`, `md` (default) or `lg` (links, titles and legal text step up to 16px). Unknown values fall back to `md`. */
  size?: SiteFooterSize
  /** Text and item alignment: `start`, `center` or `end`. Unset keeps the variant's own alignment (`centered` centres, the others start). Unknown values are ignored. */
  align?: SiteFooterAlign
  columns?: FooterColumn[]
  /** Flat links for `simple` and `centered`. Defaults to every link from `columns`. */
  links?: FooterLink[]
  /** Copyright / legal text, e.g. "© 2026 Example". Compute the year; do not hard-code it. */
  legal?: string
  /** Links shown in the bottom row (Privacy, Terms...). */
  legalLinks?: FooterLink[]
  /** Brand tagline shown under the brand slot. */
  description?: string
  /** `newsletter` variant: heading above the `newsletter` slot. */
  newsletterTitle?: string
  /** `newsletter` variant: supporting text above the `newsletter` slot. */
  newsletterDescription?: string
  /** Accessible name of the footer navigation landmark. Give each footer on a page a distinct name. */
  navLabel?: string
  /** Heading level of the column and newsletter titles (1-6). Invalid values fall back to 2. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

const props = withDefaults(defineProps<SiteFooterProps>(), {
  variant: 'columns',
  tone: 'default',
  size: 'md',
  align: undefined,
  columns: () => [],
  links: undefined,
  legalLinks: () => [],
  navLabel: 'Footer',
  headingLevel: 2,
})
const slots = useSlots()

const uid = useId()
const kind = computed(() => oneOf(props.variant, siteFooterVariantNames, 'columns'))
const tone = computed(() => oneOf(props.tone, siteFooterToneNames, 'default'))
const dark = computed(() => tone.value === 'dark')
const size = computed(() => oneOf(props.size, siteFooterSizeNames, 'md'))
/** `undefined` keeps the variant's own alignment. */
const align = computed<SiteFooterAlign | undefined>(() => (siteFooterAlignNames as readonly unknown[]).includes(props.align) ? props.align : undefined)
const cols = computed(() => (Array.isArray(props.columns) ? props.columns : []).filter((c) => c && Array.isArray(c.links)))
const flat = computed(() => {
  const own = Array.isArray(props.links) ? props.links.filter((l) => l && l.href) : []
  return props.links === undefined ? cols.value.flatMap((c) => c.links.filter(Boolean)) : own
})
const legalLinks = computed(() => (Array.isArray(props.legalLinks) ? props.legalLinks : []))

const showColumns = computed(() => ['columns', 'newsletter', 'mega', 'split'].includes(kind.value) && cols.value.length > 0)
const showFlat = computed(() => ['simple', 'centered'].includes(kind.value) && flat.value.length > 0)
const minimal = computed(() => kind.value === 'minimal')
/** simple/centered put social icons beside the links; minimal puts them in the legal row. */
const socialSeparate = computed(() => ['simple', 'centered'].includes(kind.value) && !!slots.social)
const hasBrand = computed(() => !minimal.value && (!!slots.brand || !!props.description || (!!slots.social && !socialSeparate.value)))
const showNewsletter = computed(() => kind.value === 'newsletter' && (!!slots.newsletter || !!props.newsletterTitle || !!props.newsletterDescription))
const hasMain = computed(() => hasBrand.value || showColumns.value || showFlat.value || socialSeparate.value || showNewsletter.value)
const hasLegal = computed(() => !!props.legal || legalLinks.value.length > 0 || !!slots.legal || (minimal.value && (!!slots.brand || !!slots.social)))

const blank = (v: unknown) => typeof v !== 'string' || v.trim() === ''
// Reports the first broken column or link once, not once per link.
function brokenPart(): string | undefined {
  const check = (l: FooterLink | undefined, where: string) => (!l || blank(l.label) ? `${where} has no \`label\`` : blank(l.href) ? `${where} ("${l.label}") has no \`href\`` : undefined)
  const columns = Array.isArray(props.columns) ? props.columns : []
  for (const [ci, c] of columns.entries()) {
    if (!c) continue
    if (blank(c.title)) return `columns[${ci}] has no \`title\``
    for (const [i, l] of (Array.isArray(c.links) ? c.links : []).entries()) {
      const bad = check(l, `columns[${ci}].links[${i}]`)
      if (bad) return bad
    }
  }
  for (const [name, list] of [['links', props.links], ['legalLinks', props.legalLinks]] as const) {
    for (const [i, l] of (Array.isArray(list) ? list : []).entries()) {
      const bad = check(l, `${name}[${i}]`)
      if (bad) return bad
    }
  }
  return undefined
}
onMounted(async () => {
  await nextTick()
  const bad = brokenPart()
  if (bad) violation('SiteFooter', 'requires-link-fields', `requires a non-empty \`label\` and \`href\` on every link and a \`title\` on every column (${bad}). A link without text or a target is an empty control, and an untitled column leaves its list unnamed.`)
  if (showColumns.value || showFlat.value) requireText('SiteFooter', 'navLabel', props.navLabel, 'It names the footer navigation landmark.')
})

const muted = computed(() => (dark.value ? 'text-background/70' : 'text-muted-foreground'))
const tag = computed(() => headingTag(props.headingLevel, 'h2'))
const text = computed(() => siteFooterTextVariants({ size: size.value }))
const linkClass = computed(() =>
  cn('inline-flex min-h-6 items-center rounded-sm transition-colors pointer-coarse:min-h-11', text.value, dark.value ? 'text-background/70 hover:text-background' : 'text-muted-foreground hover:text-foreground', focusRing),
)
const titleClass = computed(() => cn('font-semibold', text.value))
const classes = computed(() => cn(siteFooterVariants({ tone: tone.value }), align.value && siteFooterAlignVariants({ align: align.value }), props.class))
const containerClass = computed(() => siteFooterContainerVariants({ variant: kind.value, size: size.value }))
// The classes set by `align` replace the variant's own (tailwind-merge in `cn` keeps the later ones).
const mainClass = computed(() =>
  cn(siteFooterMainVariants({ variant: kind.value }), align.value && ['simple', 'centered'].includes(kind.value) && siteFooterMainAlignVariants({ align: align.value })),
)
const brandClass = computed(() => cn(siteFooterBrandVariants({ variant: kind.value }), align.value && siteFooterBrandAlignVariants({ align: align.value })))
const listClass = computed(() => cn('flex flex-wrap gap-x-6 gap-y-2', kind.value === 'centered' && 'justify-center', align.value && siteFooterListAlignVariants({ align: align.value })))
const legalClass = computed(() => cn(siteFooterLegalVariants({ variant: kind.value, tone: tone.value }), align.value && siteFooterLegalAlignVariants({ align: align.value })))
</script>

<template>
  <footer data-slot="site-footer" :data-variant="kind" :data-tone="tone" :data-size="size" :data-align="align" :class="classes">
    <div data-slot="site-footer-container" :class="containerClass">
      <div v-if="hasMain" data-slot="site-footer-main" :class="mainClass">
        <div v-if="hasBrand" data-slot="site-footer-brand" :class="brandClass">
          <slot name="brand" />
          <p v-if="description" :class="cn(text, muted, kind === 'centered' ? 'max-w-md' : 'max-w-xs')">{{ description }}</p>
          <div v-if="$slots.social && !socialSeparate" data-slot="site-footer-social" class="flex items-center gap-2">
            <slot name="social" />
          </div>
        </div>
        <nav v-if="showColumns" data-slot="site-footer-nav" :aria-label="navLabel" :class="siteFooterColumnsVariants({ variant: kind })">
          <div v-for="(col, i) in cols" :key="i" data-slot="site-footer-column">
            <component :is="tag" :id="`${uid}-col-${i}`" data-slot="site-footer-column-title" :class="titleClass">{{ col.title }}</component>
            <ul :aria-labelledby="`${uid}-col-${i}`" role="list" class="mt-4 flex flex-col gap-1">
              <li v-for="(l, j) in col.links" :key="j">
                <a data-slot="site-footer-link" :href="l.href" :class="linkClass" v-bind="linkAttrs(l.external)">{{ l.label }}</a>
              </li>
            </ul>
          </div>
        </nav>
        <nav v-if="showFlat" data-slot="site-footer-nav" :aria-label="navLabel">
          <ul role="list" :class="listClass">
            <li v-for="(l, i) in flat" :key="i">
              <a data-slot="site-footer-link" :href="l.href" :class="linkClass" v-bind="linkAttrs(l.external)">{{ l.label }}</a>
            </li>
          </ul>
        </nav>
        <div v-if="socialSeparate" data-slot="site-footer-social" class="flex items-center gap-2">
          <slot name="social" />
        </div>
        <div v-if="showNewsletter" data-slot="site-footer-newsletter" class="flex flex-col gap-3">
          <component :is="tag" v-if="newsletterTitle" data-slot="site-footer-newsletter-title" :class="titleClass">{{ newsletterTitle }}</component>
          <p v-if="newsletterDescription" :class="cn(text, muted)">{{ newsletterDescription }}</p>
          <slot name="newsletter" />
        </div>
      </div>
      <slot />
      <div v-if="hasLegal" data-slot="site-footer-legal" :class="legalClass">
        <div v-if="minimal && $slots.brand" data-slot="site-footer-brand" class="flex items-center">
          <slot name="brand" />
        </div>
        <slot name="legal">
          <p v-if="legal" :class="cn(text, muted)">{{ legal }}</p>
        </slot>
        <ul v-if="legalLinks.length" role="list" class="flex flex-wrap gap-x-6 gap-y-2">
          <li v-for="(l, i) in legalLinks" :key="i">
            <a data-slot="site-footer-legal-link" :href="l.href" :class="linkClass" v-bind="linkAttrs(l.external)">{{ l.label }}</a>
          </li>
        </ul>
        <div v-if="minimal && $slots.social" data-slot="site-footer-social" class="flex items-center gap-2">
          <slot name="social" />
        </div>
      </div>
    </div>
  </footer>
</template>
