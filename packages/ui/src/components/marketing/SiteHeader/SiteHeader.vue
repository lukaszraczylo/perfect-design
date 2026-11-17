<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue'
import { requireText, violation } from '../../../lib/contract'
import { faBars, faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { linkAttrs } from '../shared/motion'
import { oneOf } from '../shared/pick'
import { trackStickyOffset } from './sticky-offset'
import {
  siteHeaderAppearanceNames,
  siteHeaderBarVariants,
  siteHeaderBrandVariants,
  siteHeaderInvertedFocus,
  siteHeaderLinkVariants,
  siteHeaderMutedTextVariants,
  siteHeaderPanelVariants,
  siteHeaderRuleVariants,
  siteHeaderSizeNames,
  siteHeaderToggleVariants,
  siteHeaderToneNames,
  siteHeaderVariantNames,
  siteHeaderVariants,
  type SiteHeaderAppearance,
  type SiteHeaderSize,
  type SiteHeaderTone,
  type SiteHeaderVariant,
} from './variants'

export interface SiteLink {
  label: string
  href: string
  /** Force the active state; otherwise `activeHref` is compared with `href`. */
  active?: boolean
  external?: boolean
}

/** A titled group of links. Rendered inline (no dropdown) on desktop and as a headed section in the mobile menu. */
export interface SiteLinkGroup {
  title: string
  links: SiteLink[]
}

export interface SiteHeaderProps extends BaseProps {
  /** Look and layout. Unknown values fall back to `default`. */
  variant?: SiteHeaderVariant
  /** Bar height and type: `sm` (3rem), `md` (4rem, default) or `lg` (5rem); `minimal` and `floating` are one step slimmer. The bar is a minimum height. Unknown values fall back to `md`. */
  size?: SiteHeaderSize
  /** Surface: `default` (page), `muted` or `inverted` (ink surface, page-coloured text). The `transparent` variant takes it once it turns solid. Unknown values fall back to `default`. */
  tone?: SiteHeaderTone
  /** Edge: `bordered` (default hairline), `flat` (no border) or `elevated` (2px stronger border; no shadow). Unknown values fall back to `bordered`. */
  appearance?: SiteHeaderAppearance
  /** Brand text used when the `logo` slot is empty. */
  brand?: string
  brandHref?: string
  links?: SiteLink[]
  /** Titled link groups shown after `links` (no dropdowns). */
  linkGroups?: SiteLinkGroup[]
  /** Current path; the link whose `href` equals it gets aria-current="page". */
  activeHref?: string
  /**
   * Stay in view while scrolling (`transparent` becomes fixed instead of absolute). While sticky, the page's
   * `scroll-padding-top` is kept equal to the header height so focused elements are never hidden behind it (WCAG 2.4.11).
   */
  sticky?: boolean
  /** `with-announcement`: text of the top bar. */
  announcement?: string
  /** `with-announcement`: makes the top bar text a link. */
  announcementHref?: string
  /** v-model for the mobile menu. Uncontrolled when omitted. */
  modelValue?: boolean
  /** Accessible name of the primary navigation landmark. Give each header on a page a distinct name. */
  navLabel?: string
  /** Name of the mobile menu button. It stays the same while open or closed; `aria-expanded` carries the state. */
  menuLabel?: string
  /** Optional: name of the menu button while closed. Setting it (or `closeLabel`) switches to a name that changes with state; prefer `menuLabel`. */
  openLabel?: string
  /** Optional: name of the menu button while open. See `openLabel`. */
  closeLabel?: string
}

const props = withDefaults(defineProps<SiteHeaderProps>(), {
  variant: 'default',
  size: 'md',
  tone: 'default',
  appearance: 'bordered',
  brandHref: '/',
  links: () => [],
  linkGroups: () => [],
  sticky: true,
  modelValue: undefined,
  navLabel: 'Main',
  menuLabel: 'Menu',
  openLabel: undefined,
  closeLabel: undefined,
})
const emit = defineEmits<{ 'update:modelValue': [open: boolean]; navigate: [link: SiteLink] }>()
const slots = useSlots()

const uid = useId()
const panelId = `${uid}-mobile-menu`
const inner = ref(false)
const open = computed(() => props.modelValue ?? inner.value)
const scrolled = ref(false)
const toggle = ref<HTMLButtonElement | null>(null)
const root = ref<HTMLElement | null>(null)
let stopTracking = () => {}

const kind = computed(() => oneOf(props.variant, siteHeaderVariantNames, 'default'))
const size = computed(() => oneOf(props.size, siteHeaderSizeNames, 'md'))
const tone = computed(() => oneOf(props.tone, siteHeaderToneNames, 'default'))
const appearance = computed(() => oneOf(props.appearance, siteHeaderAppearanceNames, 'bordered'))
/** `minimal` hides the desktop nav and keeps the menu button at every width. */
const collapsed = computed(() => kind.value === 'minimal')
const sections = computed(() => {
  const flat = Array.isArray(props.links) ? props.links.filter(Boolean) : []
  const groups = (Array.isArray(props.linkGroups) ? props.linkGroups : []).filter((g) => g && Array.isArray(g.links) && g.links.length > 0)
  return [...(flat.length ? [{ title: undefined as string | undefined, links: flat }] : []), ...groups]
})
const hasNav = computed(() => sections.value.length > 0 || !!slots.links)
const showAnnouncement = computed(() => kind.value === 'with-announcement' && (!!props.announcement || !!slots.announcement))

function setOpen(v: boolean) {
  inner.value = v
  emit('update:modelValue', v)
}
const isActive = (l: SiteLink) => l.active ?? (props.activeHref !== undefined && l.href === props.activeHref)

function onNavigate(l: SiteLink) {
  emit('navigate', l)
  if (open.value) setOpen(false)
}
async function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    setOpen(false)
    await nextTick()
    toggle.value?.focus()
  }
}
const blank = (v: unknown) => typeof v !== 'string' || v.trim() === ''
// Reports the first broken link once, not once per link. Link text and href make a link; a group title names its group.
function brokenLink(): string | undefined {
  const check = (l: SiteLink | undefined, where: string) => (!l || blank(l.label) ? `${where} has no \`label\`` : blank(l.href) ? `${where} ("${l.label}") has no \`href\`` : undefined)
  const flat = Array.isArray(props.links) ? props.links : []
  for (const [i, l] of flat.entries()) {
    const bad = check(l, `links[${i}]`)
    if (bad) return bad
  }
  const groups = Array.isArray(props.linkGroups) ? props.linkGroups : []
  for (const [gi, g] of groups.entries()) {
    if (!g) continue
    if (blank(g.title)) return `linkGroups[${gi}] has no \`title\``
    for (const [i, l] of (Array.isArray(g.links) ? g.links : []).entries()) {
      const bad = check(l, `linkGroups[${gi}].links[${i}]`)
      if (bad) return bad
    }
  }
  return undefined
}
onMounted(async () => {
  await nextTick()
  const bad = brokenLink()
  if (bad && !slots.links) violation('SiteHeader', 'requires-link-fields', `requires a non-empty \`label\` and \`href\` on every link and a \`title\` on every group (${bad}). A link without text or a target is an empty control.`)
  if (!hasNav.value) return
  requireText('SiteHeader', 'navLabel', props.navLabel, 'It names the navigation landmark.')
  // The open/close pair falls back to 'Open menu' / 'Close menu', so only `menuLabel` can leave the icon-only button unnamed.
  if (!props.openLabel && !props.closeLabel) requireText('SiteHeader', 'menuLabel', props.menuLabel, 'It names the icon-only menu button.')
})

const onScroll = () => (scrolled.value = window.scrollY > 8)
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  if (props.sticky) stopTracking = trackStickyOffset(root.value)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  stopTracking()
})
watch(
  () => props.sticky,
  (sticky) => {
    stopTracking()
    stopTracking = sticky ? trackStickyOffset(root.value) : () => {}
  },
)
/** Constant name by default; the old open/close pair is honoured when a consumer sets either label. */
const toggleLabel = computed(() => (props.openLabel || props.closeLabel ? (open.value ? props.closeLabel || 'Close menu' : props.openLabel || 'Open menu') : props.menuLabel))

const classes = computed(() =>
  cn(
    siteHeaderVariants({ variant: kind.value, sticky: props.sticky, solid: scrolled.value || open.value, tone: tone.value, appearance: appearance.value }),
    props.class,
  ),
)
const barClass = computed(() => siteHeaderBarVariants({ variant: kind.value, size: size.value }))
const centered = computed(() => kind.value === 'centered')
/** `stacked`: brand and actions on the first row, the navigation on a second row of the same bar. */
const stacked = computed(() => kind.value === 'stacked')
/** The tone of the surface the content sits on: `transparent` shows the page until it turns solid, whatever `tone` says. */
const surface = computed<SiteHeaderTone>(() => (kind.value === 'transparent' && !(scrolled.value || open.value) ? 'default' : tone.value))
/** The shared ring does not reach 3:1 on the ink surface of the inverted tone, so it gets an outline in the page colour. */
const focus = computed(() => (surface.value === 'inverted' ? siteHeaderInvertedFocus : focusRing))
const rule = computed(() => siteHeaderRuleVariants({ tone: surface.value }))
const mutedText = computed(() => siteHeaderMutedTextVariants({ tone: surface.value }))
const brandClass = computed(() => cn(siteHeaderBrandVariants({ size: size.value }), focus.value))
const toggleClass = computed(() => cn(siteHeaderToggleVariants({ size: size.value, tone: surface.value }), !collapsed.value && 'md:hidden', focus.value))
const panelClass = computed(() => cn(siteHeaderPanelVariants({ tone: surface.value }), !collapsed.value && 'md:hidden', kind.value === 'floating' && 'rounded-b-lg'))
/** Not colour alone: the current page is also underlined (visible in forced-colors mode too). */
const linkClass = (l: SiteLink) => cn(siteHeaderLinkVariants({ size: size.value, tone: surface.value, active: isActive(l) }), focus.value)
const ctaClass = computed(() => (hasNav.value ? 'hidden items-center gap-2 sm:flex' : 'flex items-center gap-2'))
</script>

<template>
  <header ref="root" data-slot="site-header" :data-variant="kind" :data-size="size" :data-tone="tone" :data-appearance="appearance" :data-scrolled="scrolled ? '' : undefined" :class="classes" @keydown="onKeydown">
    <div
      v-if="showAnnouncement"
      data-slot="site-header-announcement"
      class="bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
    >
      <slot name="announcement">
        <component
          :is="announcementHref ? 'a' : 'span'"
          :href="announcementHref || undefined"
          :class="cn('rounded-sm', announcementHref && 'underline underline-offset-4 hover:no-underline', focusRing)"
          >{{ announcement }}</component
        >
      </slot>
    </div>
    <!-- The side columns share what the centred logo leaves, instead of a fixed third each. -->
    <div data-slot="site-header-bar" :class="barClass" :style="centered ? { gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)' } : undefined">
      <div data-slot="site-header-logo" :class="cn('flex min-w-0 shrink-0 items-center', centered && 'col-start-2 row-start-1 justify-self-center')">
        <slot name="logo">
          <a v-if="brand" :href="brandHref" :class="brandClass">{{ brand }}</a>
        </slot>
      </div>
      <nav
        v-if="hasNav && !collapsed"
        data-slot="site-header-nav"
        :aria-label="navLabel"
        :class="cn('hidden min-w-0 flex-wrap items-center gap-1 md:flex', centered && 'col-start-1 row-start-1 flex-nowrap justify-self-start', stacked && cn('order-3 w-full border-t pt-1', rule))"
      >
        <slot name="links">
          <div
            v-for="(s, si) in sections"
            :key="si"
            :role="s.title ? 'group' : undefined"
            :aria-label="s.title"
            :data-slot="s.title ? 'site-header-group' : undefined"
            :class="s.title ? cn('ms-2 flex items-center gap-1 border-s ps-2', rule) : 'contents'"
          >
            <a
              v-for="(l, i) in s.links"
              :key="i"
              data-slot="site-header-link"
              :href="l.href"
              :aria-current="isActive(l) ? 'page' : undefined"
              :data-active="isActive(l) ? '' : undefined"
              :class="linkClass(l)"
              v-bind="linkAttrs(l.external)"
              @click="emit('navigate', l)"
              >{{ l.label }}</a
            >
          </div>
        </slot>
      </nav>
      <div :class="cn('flex items-center gap-2', centered && 'col-start-3 row-start-1 justify-self-end', stacked && 'order-2')">
        <div v-if="$slots.cta" data-slot="site-header-cta" :class="ctaClass">
          <slot name="cta" />
        </div>
        <button
          v-if="hasNav"
          ref="toggle"
          type="button"
          data-slot="site-header-toggle"
          :aria-expanded="open ? 'true' : 'false'"
          :aria-controls="panelId"
          :aria-label="toggleLabel"
          :class="toggleClass"
          @click="setOpen(!open)"
        >
          <Icon :icon="open ? faXmark : faBars" size="lg" />
        </button>
      </div>
    </div>
    <div
      v-if="open && hasNav"
      :id="panelId"
      data-slot="site-header-mobile"
      :class="panelClass"
    >
      <nav :aria-label="`${navLabel} (mobile)`" class="flex flex-col gap-1">
        <slot name="links">
          <div
            v-for="(s, si) in sections"
            :key="si"
            :role="s.title ? 'group' : undefined"
            :aria-label="s.title"
            :data-slot="s.title ? 'site-header-mobile-group' : undefined"
            class="flex flex-col gap-1"
          >
            <p v-if="s.title" data-slot="site-header-mobile-group-title" aria-hidden="true" :class="cn('px-3 pt-3 text-sm font-medium', mutedText)">
              {{ s.title }}
            </p>
            <a
              v-for="(l, i) in s.links"
              :key="i"
              data-slot="site-header-mobile-link"
              :href="l.href"
              :aria-current="isActive(l) ? 'page' : undefined"
              :class="cn(linkClass(l), 'text-base')"
              v-bind="linkAttrs(l.external)"
              @click="onNavigate(l)"
              >{{ l.label }}</a
            >
          </div>
        </slot>
      </nav>
      <div v-if="$slots.cta" data-slot="site-header-mobile-cta" class="mt-3 flex flex-col gap-2 sm:hidden">
        <slot name="cta" />
      </div>
    </div>
  </header>
</template>
