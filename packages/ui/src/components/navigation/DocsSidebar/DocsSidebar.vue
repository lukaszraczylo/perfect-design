<script setup lang="ts">
import { computed, onMounted, useId } from 'vue'
import type { PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import NavLink from '../NavLink/NavLink.vue'
import type { NavLinkSize, NavLinkVariant } from '../NavLink/variants'
import { checkNavItems, hasListener, isActionItem } from '../contract'
import {
  DOCS_SIDEBAR_RAIL_LINK,
  DOCS_SIDEBAR_SIZES,
  DOCS_SIDEBAR_VARIANTS,
  docsSidebarListVariants,
  docsSidebarTitleVariants,
  docsSidebarVariants,
  type DocsSidebarSize,
  type DocsSidebarVariant,
} from './variants'

export interface DocsSidebarLink {
  id?: string
  label: string
  href?: string
  to?: string | Record<string, unknown>
  badge?: string | number
  active?: boolean
}

export interface DocsSidebarSection {
  id?: string
  title: string
  items: DocsSidebarLink[]
}

export interface DocsSidebarProps extends BaseProps {
  sections: DocsSidebarSection[]
  /** Current location (path or href); a link whose `to`/`href` equals it is active unless it sets `active`. */
  current?: string
  /** Element/component used for links, e.g. RouterLink (receives `to`). */
  linkAs?: PrimitiveProps['as']
  /** Accessible name of the navigation landmark. */
  label?: string
  /** `default` (pill links), `compact` (tighter) or `rail` (links on a vertical rule with a current-page marker). Unknown values fall back to `default`. */
  variant?: DocsSidebarVariant
  /** Link height: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: DocsSidebarSize
}

const props = withDefaults(defineProps<DocsSidebarProps>(), { label: 'Documentation', linkAs: 'a', variant: 'default', size: 'md' })
const emit = defineEmits<{ navigate: [link: DocsSidebarLink, event: MouseEvent] }>()

const hasAction = hasListener('navigate')
onMounted(() => {
  requireText('DocsSidebar', 'label', props.label, 'It names the navigation landmark, for example "Guides".')
  const sections: unknown = props.sections
  if (!Array.isArray(sections) || sections.length === 0) {
    violation('DocsSidebar', 'requires-sections', 'requires `sections` with at least one section `{ title, items: [{ label, href | to }] }`. Render the sidebar once the navigation data is available.')
    return
  }
  sections.forEach((s, si) => {
    if (!s || typeof s !== 'object' || !Array.isArray(s.items) || s.items.length === 0) {
      violation('DocsSidebar', 'requires-items', `requires every section to have an \`items\` array with at least one link (section ${si + 1} has none).`)
      return
    }
    if (typeof s.title !== 'string' || s.title.trim() === '') {
      violation('DocsSidebar', 'requires-title', `requires a non-empty \`title\` on every section (section ${si + 1} has none). The title names its list.`)
      return
    }
    checkNavItems('DocsSidebar', s.items, `section "${s.title}"`, hasAction)
  })
})

const variant = computed<DocsSidebarVariant>(() => (DOCS_SIDEBAR_VARIANTS.includes(props.variant as DocsSidebarVariant) ? (props.variant as DocsSidebarVariant) : 'default'))
const size = computed<DocsSidebarSize>(() => (DOCS_SIDEBAR_SIZES.includes(props.size as DocsSidebarSize) ? (props.size as DocsSidebarSize) : 'md'))
const LINK_SIZE: Record<DocsSidebarSize, NavLinkSize> = { sm: 'xs', md: 'sm', lg: 'md' }
const linkSize = computed(() => LINK_SIZE[size.value])
const linkVariant = computed<NavLinkVariant>(() => (variant.value === 'rail' ? 'default' : 'pill'))
const linkClass = computed(() => (variant.value === 'rail' ? DOCS_SIDEBAR_RAIL_LINK : 'w-full'))

const uid = useId()
const safeSections = computed(() =>
  (Array.isArray(props.sections) ? props.sections : [])
    .filter((s) => s && Array.isArray(s.items))
    .map((s) => ({ ...s, items: s.items.filter((i) => i && typeof i.label === 'string') })),
)

function isActive(link: DocsSidebarLink): boolean | undefined {
  if (link.active !== undefined) return link.active
  const target = link.href ?? (typeof link.to === 'string' ? link.to : undefined)
  return props.current !== undefined && target !== undefined ? target === props.current : undefined
}
</script>

<template>
  <nav data-slot="docs-sidebar" :aria-label="label" :data-variant="variant" :data-size="size" :class="cn(docsSidebarVariants({ variant }), props.class)">
    <div v-for="(section, si) in safeSections" :key="section.id ?? section.title" data-slot="docs-sidebar-section">
      <p :id="`${uid}-${si}`" data-slot="docs-sidebar-title" :class="cn(docsSidebarTitleVariants({ variant }))">
        {{ section.title }}
      </p>
      <ul :aria-labelledby="`${uid}-${si}`" :class="cn(docsSidebarListVariants({ variant }))">
        <li v-for="(link, li) in section.items" :key="link.id ?? `${li}-${link.label}`" data-slot="docs-sidebar-item">
          <NavLink
            :variant="linkVariant"
            :size="linkSize"
            :as="isActionItem(link) ? 'button' : linkAs"
            :type="isActionItem(link) ? 'button' : undefined"
            :href="link.href"
            :to="link.to"
            :active="isActive(link)"
            :badge="link.badge"
            :class="linkClass"
            @click="emit('navigate', link, $event)"
          >{{ link.label }}</NavLink>
        </li>
      </ul>
    </div>
  </nav>
</template>
