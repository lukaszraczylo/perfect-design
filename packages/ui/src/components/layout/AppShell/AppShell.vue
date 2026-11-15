<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { containerSizes, containerVariants, type ContainerSize } from '../Container/variants'
import AppShellSidebar from './AppShellSidebar.vue'
import {
  appShellBreakpoints,
  appShellCollapseModes,
  appShellLayouts,
  appShellMediaQueries,
  appShellWidths,
  type AppShellBreakpoint,
  type AppShellCollapseMode,
  type AppShellLayout,
  type AppShellRailWidth,
  type AppShellSidebarWidth,
} from './variants'

export interface AppShellProps extends BaseProps {
  /**
   * Page frame. `top-nav-sidebar` (default): full-width header above sidebar and content. `sidebar-left` / `sidebar-right`:
   * full-height sidebar with the header over the content column. `top-nav`: header and content only (the sidebar slots are ignored).
   * `dual-sidebar`: start sidebar (`sidebar` slot) plus end sidebar (`sidebar-end` slot). Unknown values fall back to `top-nav-sidebar`.
   */
  layout?: AppShellLayout
  /** Expanded sidebar width: `sm` w-56, `md` w-64, `lg` w-72. Unknown values fall back to `md`. */
  sidebarWidth?: AppShellSidebarWidth
  /** Collapsed rail width: `sm` w-12, `md` w-14, `lg` w-16. Unknown values fall back to `md`. */
  railWidth?: AppShellRailWidth
  /** What collapsing does on desktop: `rail` shrinks to an icon rail, `hidden` removes the sidebar. Unknown values fall back to `rail`. */
  collapseMode?: AppShellCollapseMode
  /** Viewport below which sidebars are off-canvas drawers: `md` (768px) or `lg` (1024px). Unknown values fall back to `md`. */
  drawerBreakpoint?: AppShellBreakpoint
  /** Constrain the page content to a max width (centred, with responsive padding). Unset renders the slot edge to edge. Unknown values are ignored. */
  contentMaxWidth?: ContainerSize
  /** With `contentMaxWidth`: add the responsive horizontal padding. */
  contentPadded?: boolean
  /** Lock page scrolling while a drawer is open (below the drawer breakpoint). */
  lockScroll?: boolean
  /** `id` of the `<main>` element; target for skip links. */
  mainId?: string
  /** Render the page region as a `<main>` landmark (default). Set `false` when AppShell is nested inside another page that already has one (e.g. a live demo): it becomes a plain `div`. */
  main?: boolean
  /** Accessible name of the (start) sidebar `<aside>` landmark. */
  sidebarLabel?: string
  /** Accessible name of the end sidebar `<aside>` landmark (dual-sidebar). */
  sidebarEndLabel?: string
  /** Render a visually hidden "skip to content" link that becomes visible on focus. */
  skipLink?: boolean
  /** Text of the skip link. */
  skipLinkLabel?: string
  as?: PrimitiveProps['as']
}

export interface AppShellSlotProps {
  /** Primary sidebar rail state (the `sidebar` slot, whichever side it is on). */
  collapsed: boolean
  open: boolean
  /** Collapses/expands the primary sidebar on desktop and opens/closes its drawer below the drawer breakpoint. */
  toggle: () => void
  /** `id` of the primary sidebar; `aria-controls` target. */
  sidebarId: string
  /** Whether the primary sidebar is currently shown (desktop: not collapsed, drawer breakpoint and below: open). */
  expanded: boolean
  /** Spread on the menu button that toggles the primary sidebar: `v-bind="triggerProps"` adds `aria-controls` and `aria-expanded`. */
  triggerProps: { 'aria-controls': string; 'aria-expanded': 'true' | 'false' }
  /** `sidebar-end` state (dual-sidebar). */
  collapsedEnd: boolean
  openEnd: boolean
  toggleEnd: () => void
}

const props = withDefaults(defineProps<AppShellProps>(), {
  layout: 'top-nav-sidebar',
  sidebarWidth: 'md',
  railWidth: 'md',
  collapseMode: 'rail',
  drawerBreakpoint: 'md',
  contentPadded: true,
  lockScroll: true,
  mainId: 'main-content',
  main: true,
  sidebarLabel: 'Sidebar',
  sidebarEndLabel: 'Secondary sidebar',
  skipLink: false,
  skipLinkLabel: 'Skip to main content',
  as: 'div',
})

const slots = useSlots()
const uid = useId()
const sidebarDomId = computed(() => `${uid}-sidebar`)
const sidebarEndDomId = computed(() => `${uid}-sidebar-end`)

/** Desktop: the primary sidebar shrinks to a rail (or hides) when true. */
const collapsed = defineModel<boolean>('collapsed', { default: false })
/** Below the drawer breakpoint: the primary sidebar is shown as a drawer over the page when true. */
const open = defineModel<boolean>('open', { default: false })
/** Same as `collapsed`, for the `sidebar-end` of `dual-sidebar`. */
const collapsedEnd = defineModel<boolean>('collapsedEnd', { default: false })
/** Same as `open`, for the `sidebar-end` of `dual-sidebar`. */
const openEnd = defineModel<boolean>('openEnd', { default: false })

const root = ref<{ $el: HTMLElement } | null>(null)
/** Reactive mirror of the drawer breakpoint media query (false before mount, so SSR renders the drawer-safe markup). */
const desktop = ref(false)

const layout = computed<AppShellLayout>(() => (appShellLayouts.includes(props.layout) ? props.layout : 'top-nav-sidebar'))
const breakpoint = computed<AppShellBreakpoint>(() => (appShellBreakpoints.includes(props.drawerBreakpoint) ? props.drawerBreakpoint : 'md'))
const sidebarWidth = computed<AppShellSidebarWidth>(() => (appShellWidths.includes(props.sidebarWidth) ? props.sidebarWidth : 'md'))
const railWidth = computed<AppShellRailWidth>(() => (appShellWidths.includes(props.railWidth) ? props.railWidth : 'md'))
const collapseMode = computed<AppShellCollapseMode>(() => (appShellCollapseModes.includes(props.collapseMode) ? props.collapseMode : 'rail'))
const contentSize = computed(() => (props.contentMaxWidth && containerSizes.includes(props.contentMaxWidth) ? props.contentMaxWidth : undefined))

/** Header spans the whole width only in the layouts without a full-height sidebar. */
const headerOutside = computed(() => layout.value === 'top-nav-sidebar' || layout.value === 'top-nav')
const fullHeight = computed(() => !headerOutside.value)
const primarySide = computed(() => (layout.value === 'sidebar-right' ? 'end' : 'start'))

/** Slots are not reactive; evaluated at render time (see the template calls). */
const showPrimary = () => layout.value !== 'top-nav' && !!slots.sidebar
const showSecondary = () => layout.value === 'dual-sidebar' && !!slots['sidebar-end']

function isDesktop(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(appShellMediaQueries[breakpoint.value]).matches
  )
}

function toggle() {
  if (isDesktop()) collapsed.value = !collapsed.value
  else open.value = !open.value
}

function toggleEnd() {
  if (isDesktop()) collapsedEnd.value = !collapsedEnd.value
  else openEnd.value = !openEnd.value
}

function closeAll() {
  open.value = false
  openEnd.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeAll()
}

const anyOpen = computed(() => open.value || openEnd.value)
/** A drawer is showing over the page: everything behind it is inert and the drawer is a modal dialog. */
const modal = computed(() => anyOpen.value && !desktop.value)

watch(
  anyOpen,
  (isOpen) => {
    if (typeof document === 'undefined') return
    if (isOpen) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  },
  { immediate: true },
)

/* Scroll lock + focus handling while a drawer is showing (mobile only). */
let returnFocus: HTMLElement | null = null
let previousOverflow: string | null = null

function unlock() {
  if (previousOverflow !== null) {
    document.body.style.overflow = previousOverflow
    previousOverflow = null
  }
}

watch(
  anyOpen,
  async (isOpen, wasOpen) => {
    if (typeof document === 'undefined') return
    if (isOpen && !isDesktop()) {
      if (props.lockScroll && previousOverflow === null) {
        previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
      }
      // `wasOpen` is undefined on the immediate first run: a drawer that starts open locks the scroll but does not steal focus
      if (wasOpen === undefined) return
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      root.value?.$el.querySelector<HTMLElement>('[data-slot="app-shell-sidebar"][data-open]')?.focus()
    } else if (!isOpen) {
      unlock()
      returnFocus?.focus()
      returnFocus = null
    }
  },
  { immediate: true },
)

/* A drawer left open must not survive a resize to the desktop layout. */
let media: MediaQueryList | null = null
function onMediaChange(e: MediaQueryListEvent) {
  desktop.value = e.matches
  if (e.matches) closeAll()
}
function listen() {
  media?.removeEventListener('change', onMediaChange)
  media = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(appShellMediaQueries[breakpoint.value]) : null
  media?.addEventListener('change', onMediaChange)
  desktop.value = !!media?.matches
}
onMounted(listen)
watch(breakpoint, listen)

onMounted(async () => {
  await nextTick()
  // Each sidebar is an <aside> landmark and needs its own name; skip link needs a target and a visible text.
  if (showPrimary()) requireText('AppShell', 'sidebarLabel', props.sidebarLabel, 'It names the sidebar landmark, e.g. sidebar-label="Project navigation".')
  if (showSecondary()) requireText('AppShell', 'sidebarEndLabel', props.sidebarEndLabel, 'It names the end sidebar landmark, e.g. sidebar-end-label="Filters".')
  if (props.skipLink) {
    requireText('AppShell', 'mainId', props.mainId, 'The skip link points at it.')
    requireText('AppShell', 'skipLinkLabel', props.skipLinkLabel, 'It is the visible text of the skip link.')
  }
  // `main` false hands the landmark to the page: a connected shell then needs a <main> somewhere around it.
  const node = root.value?.$el
  if (!props.main && node instanceof Element && node.isConnected && !node.ownerDocument.querySelector('main, [role="main"]')) {
    violation('AppShell', 'requires-main', 'with `main` set to false needs a `<main>` (or `role="main"`) landmark elsewhere on the page. Remove `:main="false"` to let AppShell render it.')
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', onKeydown)
    unlock()
  }
  media?.removeEventListener('change', onMediaChange)
})

const slotProps = computed<AppShellSlotProps>(() => {
  const expanded = desktop.value ? !collapsed.value : open.value
  return {
  collapsed: collapsed.value,
  open: open.value,
  toggle,
  sidebarId: sidebarDomId.value,
  expanded,
  triggerProps: { 'aria-controls': sidebarDomId.value, 'aria-expanded': expanded ? 'true' : 'false' },
  collapsedEnd: collapsedEnd.value,
  openEnd: openEnd.value,
  toggleEnd,
  }
})

const backdropClasses = computed(() =>
  cn('fixed inset-0 z-(--z-overlay) bg-scrim', breakpoint.value === 'lg' ? 'lg:hidden' : 'md:hidden'),
)
const containerClasses = computed(() => containerVariants({ size: contentSize.value, padded: props.contentPadded }))
</script>

<template>
  <Primitive
    ref="root"
    data-slot="app-shell"
    :as="as"
    :data-layout="layout === 'top-nav-sidebar' ? undefined : layout"
    :data-collapsed="collapsed ? '' : undefined"
    :data-open="open ? '' : undefined"
    :class="cn('flex min-h-dvh flex-col bg-background text-foreground', $props.class)"
  >
    <a
      v-if="skipLink"
      data-slot="app-shell-skip-link"
      :href="`#${mainId}`"
      class="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-(--z-toast) focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
    >
      {{ skipLinkLabel }}
    </a>
    <header
      v-if="headerOutside && $slots.header"
      data-slot="app-shell-header"
      :inert="modal || undefined"
      class="sticky top-0 z-(--z-sticky) shrink-0 border-b border-border bg-background"
    >
      <slot name="header" v-bind="slotProps" />
    </header>
    <div data-slot="app-shell-body" class="flex min-h-0 flex-1">
      <template v-if="showPrimary() || showSecondary()">
        <div
          v-if="open || openEnd"
          data-slot="app-shell-backdrop"
          aria-hidden="true"
          :class="backdropClasses"
          @click="closeAll"
        />
      </template>
      <AppShellSidebar
        v-if="showPrimary() && primarySide === 'start'"
        side="start"
        :open="open"
        :collapsed="collapsed"
        :label="sidebarLabel"
        :breakpoint="breakpoint"
        :width="sidebarWidth"
        :rail="railWidth"
        :collapse-mode="collapseMode"
        :full-height="fullHeight"
        :id="sidebarDomId"
        :modal="modal && open"
        :inert="(modal && !open) || undefined"
      >
        <slot name="sidebar" v-bind="slotProps" />
      </AppShellSidebar>
      <div data-slot="app-shell-content" :inert="modal || undefined" class="flex min-w-0 flex-1 flex-col">
        <header
          v-if="!headerOutside && $slots.header"
          data-slot="app-shell-header"
          class="sticky top-0 z-(--z-sticky) shrink-0 border-b border-border bg-background"
        >
          <slot name="header" v-bind="slotProps" />
        </header>
        <component :is="main ? 'main' : 'div'" :id="mainId" data-slot="app-shell-main" tabindex="-1" class="flex-1 outline-hidden">
          <div v-if="contentSize" data-slot="app-shell-container" :class="containerClasses">
            <slot v-bind="slotProps" />
          </div>
          <slot v-else v-bind="slotProps" />
        </component>
        <footer v-if="$slots.footer" data-slot="app-shell-footer" class="shrink-0 border-t border-border">
          <slot name="footer" v-bind="slotProps" />
        </footer>
      </div>
      <AppShellSidebar
        v-if="showPrimary() && primarySide === 'end'"
        side="end"
        :open="open"
        :collapsed="collapsed"
        :label="sidebarLabel"
        :breakpoint="breakpoint"
        :width="sidebarWidth"
        :rail="railWidth"
        :collapse-mode="collapseMode"
        :full-height="fullHeight"
        :id="sidebarDomId"
        :modal="modal && open"
        :inert="(modal && !open) || undefined"
      >
        <slot name="sidebar" v-bind="slotProps" />
      </AppShellSidebar>
      <AppShellSidebar
        v-if="showSecondary()"
        side="end"
        :open="openEnd"
        :collapsed="collapsedEnd"
        :label="sidebarEndLabel"
        :breakpoint="breakpoint"
        :width="sidebarWidth"
        :rail="railWidth"
        :collapse-mode="collapseMode"
        :full-height="fullHeight"
        :id="sidebarEndDomId"
        :modal="modal && openEnd"
        :inert="(modal && !openEnd) || undefined"
      >
        <slot name="sidebar-end" v-bind="slotProps" />
      </AppShellSidebar>
    </div>
  </Primitive>
</template>
