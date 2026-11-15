<script setup lang="ts">
import { computed, onMounted, reactive, useId } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import type { PrimitiveProps } from 'reka-ui'
import { faChevronDown } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import NavLink from '../NavLink/NavLink.vue'
import { navLinkVariants, type NavLinkSize } from '../NavLink/variants'
import { checkNavItems, hasListener, isActionItem } from '../contract'
import {
  SIDEBAR_NAV_SIZES,
  SIDEBAR_NAV_VARIANTS,
  SIDEBAR_RAIL_TILE,
  sidebarNavGroupLabelVariants,
  sidebarNavVariants,
  type SidebarNavSize,
  type SidebarNavVariant,
} from './variants'

export interface SidebarNavItem {
  /** Stable key; falls back to the label. */
  id?: string
  label: string
  href?: string
  to?: string | Record<string, unknown>
  icon?: IconDefinition
  badge?: string | number
  /** Explicit active state; otherwise matched against `current` or the injected predicate. */
  active?: boolean
  disabled?: boolean
  /** Nested links, shown in a collapsible sub-list (hidden in collapsed mode). */
  children?: SidebarNavItem[]
}

export interface SidebarNavGroup {
  id?: string
  /** Optional heading shown above the items (hidden in collapsed mode). */
  label?: string
  items: SidebarNavItem[]
}

export interface SidebarNavProps extends BaseProps {
  groups: SidebarNavGroup[]
  /** Icons-only presentation with the label as `title` tooltip. */
  collapsed?: boolean
  /** Current location (path or href). An item whose `to`/`href` equals it is active, unless it sets `active` itself. */
  current?: string
  /** Element/component used for links, e.g. RouterLink (receives `to`). */
  linkAs?: PrimitiveProps['as']
  /** Accessible name of the navigation landmark. */
  label?: string
  /** `default`, `compact` (denser and narrower) or `rail` (icon above a short label in a narrow strip). Unknown values fall back to `default`. */
  variant?: SidebarNavVariant
  /** Height of the links: `sm`, `md` (default) or `lg`. Sub-items are one step smaller. Unknown values fall back to `md`. */
  size?: SidebarNavSize
}

const props = withDefaults(defineProps<SidebarNavProps>(), { label: 'Sidebar', linkAs: 'a', variant: 'default', size: 'md' })
const emit = defineEmits<{
  navigate: [item: SidebarNavItem, event: MouseEvent]
  'update:collapsed': [collapsed: boolean]
}>()
defineSlots<{ header?: (p: { collapsed: boolean }) => unknown; footer?: (p: { collapsed: boolean }) => unknown }>()

const hasAction = hasListener('navigate')
onMounted(() => {
  requireText('SidebarNav', 'label', props.label, 'It names the navigation landmark, for example "Project".')
  const groups: unknown = props.groups
  if (!Array.isArray(groups) || groups.length === 0) {
    violation('SidebarNav', 'requires-groups', 'requires `groups` with at least one group `{ items: [{ label, href | to }] }`. Render the sidebar once the navigation data is available.')
    return
  }
  groups.forEach((g, gi) => {
    if (!g || typeof g !== 'object' || !Array.isArray(g.items) || g.items.length === 0) {
      violation('SidebarNav', 'requires-items', `requires every group to have an \`items\` array with at least one item (group ${gi + 1} has none).`)
      return
    }
    checkNavItems('SidebarNav', g.items, `group ${gi + 1}`, hasAction)
  })
})

const variant = computed<SidebarNavVariant>(() => (SIDEBAR_NAV_VARIANTS.includes(props.variant as SidebarNavVariant) ? (props.variant as SidebarNavVariant) : 'default'))
const size = computed<SidebarNavSize>(() => (SIDEBAR_NAV_SIZES.includes(props.size as SidebarNavSize) ? (props.size as SidebarNavSize) : 'md'))
const LINK_SIZE: Record<SidebarNavSize, NavLinkSize> = { sm: 'sm', md: 'md', lg: 'lg' }
const CHILD_SIZE: Record<SidebarNavSize, NavLinkSize> = { sm: 'xs', md: 'sm', lg: 'md' }
const linkSize = computed(() => LINK_SIZE[size.value])
const childSize = computed(() => CHILD_SIZE[size.value])
/** Tiles only apply to an expanded rail: a collapsed rail is icons only like every other variant. */
const tile = computed(() => variant.value === 'rail' && !props.collapsed)
const tileClass = computed(() => (tile.value ? SIDEBAR_RAIL_TILE : undefined))
const labelTitle = (item: SidebarNavItem) => (props.collapsed || tile.value ? item.label : undefined)

const uid = useId()
const toggled = reactive<Record<string, boolean>>({})

const safeGroups = computed(() =>
  (Array.isArray(props.groups) ? props.groups : [])
    .filter((g) => g && Array.isArray(g.items))
    .map((g) => ({ ...g, items: g.items.filter((i) => i && typeof i.label === 'string') })),
)

const keyOf = (item: SidebarNavItem) => item.id ?? item.label
const targetOf = (item: SidebarNavItem) => item.href ?? (typeof item.to === 'string' ? item.to : undefined)

function isActive(item: SidebarNavItem): boolean | undefined {
  if (item.active !== undefined) return item.active
  const target = targetOf(item)
  return props.current !== undefined && target !== undefined ? target === props.current : undefined
}
function hasActiveChild(item: SidebarNavItem): boolean {
  return (item.children ?? []).some((c) => isActive(c) === true || hasActiveChild(c))
}
function isOpen(item: SidebarNavItem): boolean {
  return toggled[keyOf(item)] ?? hasActiveChild(item)
}
function toggle(item: SidebarNavItem) {
  if (props.collapsed) {
    // A collapsed rail has no room for sub-lists: ask the parent to expand it first.
    toggled[keyOf(item)] = true
    emit('update:collapsed', false)
    return
  }
  toggled[keyOf(item)] = !isOpen(item)
}
const hasChildren = (item: SidebarNavItem) => Array.isArray(item.children) && item.children.length > 0
const subListId = (item: SidebarNavItem) => `${uid}-${keyOf(item).replace(/\s+/g, '-')}`
</script>

<template>
  <nav
    data-slot="sidebar-nav"
    :aria-label="label"
    :data-collapsed="collapsed ? '' : undefined"
    :data-variant="variant"
    :data-size="size"
    :class="cn(sidebarNavVariants({ variant, collapsed: !!collapsed }), props.class)"
  >
    <div v-if="$slots.header" data-slot="sidebar-nav-header"><slot name="header" :collapsed="!!collapsed" /></div>

    <div
      v-for="(group, gi) in safeGroups"
      :key="group.id ?? group.label ?? gi"
      data-slot="sidebar-nav-group"
      role="group"
      :aria-label="group.label"
      :class="cn('flex flex-col gap-1', collapsed && gi > 0 && 'border-t border-sidebar-border pt-3')"
    >
      <p v-if="group.label && !collapsed" data-slot="sidebar-nav-group-label" :class="cn(sidebarNavGroupLabelVariants({ variant }))">
        {{ group.label }}
      </p>
      <ul class="flex flex-col gap-0.5">
        <li v-for="item in group.items" :key="keyOf(item)" data-slot="sidebar-nav-item">
          <template v-if="!hasChildren(item)">
            <NavLink
              variant="sidebar"
              :as="isActionItem(item) ? 'button' : linkAs"
              :type="isActionItem(item) ? 'button' : undefined"
              :href="item.href"
              :to="item.to"
              :active="isActive(item)"
              :disabled="item.disabled"
              :icon="item.icon"
              :badge="item.badge"
              :collapsed="collapsed"
              :size="linkSize"
              :class="tileClass"
              :title="labelTitle(item)"
              @click="emit('navigate', item, $event)"
            >{{ item.label }}</NavLink>
          </template>
          <template v-else>
            <button
              type="button"
              data-slot="sidebar-nav-parent"
              :class="cn(navLinkVariants({ variant: 'sidebar', size: linkSize }), 'cursor-pointer', tileClass)"
              :aria-expanded="collapsed ? undefined : isOpen(item)"
              :aria-controls="collapsed ? undefined : subListId(item)"
              :disabled="item.disabled"
              :title="labelTitle(item)"
              @click="toggle(item)"
            >
              <span v-if="item.icon" class="inline-flex shrink-0"><Icon :icon="item.icon" /></span>
              <span :class="collapsed ? 'sr-only' : tile ? 'min-w-0 max-w-full truncate' : 'min-w-0 flex-1 truncate text-start'">{{ item.label }}</span>
              <Icon v-if="!collapsed" :icon="faChevronDown" size="sm" :class="cn('motion-safe:transition-transform', !tile && 'ms-auto', isOpen(item) && 'rotate-180')" />
            </button>
            <ul v-if="!collapsed && isOpen(item)" :id="subListId(item)" data-slot="sidebar-nav-children" :class="cn('mt-0.5 flex flex-col gap-0.5', tile ? 'border-t border-sidebar-border pt-0.5' : 'ms-4 border-s border-sidebar-border ps-2')">
              <li v-for="child in item.children" :key="keyOf(child)" data-slot="sidebar-nav-item">
                <NavLink
                  variant="sidebar"
                  :size="childSize"
                  :class="tileClass"
                  :title="tile ? child.label : undefined"
                  :as="isActionItem(child) ? 'button' : linkAs"
                  :type="isActionItem(child) ? 'button' : undefined"
                  :href="child.href"
                  :to="child.to"
                  :active="isActive(child)"
                  :disabled="child.disabled"
                  :icon="child.icon"
                  :badge="child.badge"
                  @click="emit('navigate', child, $event)"
                >{{ child.label }}</NavLink>
              </li>
            </ul>
          </template>
        </li>
      </ul>
    </div>

    <div v-if="$slots.footer" data-slot="sidebar-nav-footer" class="mt-auto"><slot name="footer" :collapsed="!!collapsed" /></div>
  </nav>
</template>
