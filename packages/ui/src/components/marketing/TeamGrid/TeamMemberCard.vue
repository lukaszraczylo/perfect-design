<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Avatar from '../../primitives/Avatar/Avatar.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import { parentChecksItems, report } from '../shared/itemsContract'
import { linkAttrs } from '../shared/motion'
import { oneOf } from '../shared/pick'
import { teamMemberProblem } from './contract'
import {
  TEAM_ALIGNS,
  TEAM_SHAPES,
  TEAM_SIZES,
  TEAM_VARIANTS,
  teamMemberAvatarVariants,
  teamMemberBioVariants,
  teamMemberLinksVariants,
  teamMemberNameVariants,
  teamMemberRoleVariants,
  teamMemberVariants,
  type TeamGridVariant,
  type TeamMemberAlign,
  type TeamMemberShape,
  type TeamMemberSize,
} from './variants'

export interface TeamMemberLink {
  /** Visible text, or the accessible name when `icon` is set (the link is then icon-only). */
  label: string
  href: string
  icon?: IconDefinition
  /** Open in a new tab with rel="noopener noreferrer". */
  external?: boolean
}

export interface TeamMember {
  name: string
  role?: string
  bio?: string
  /** Image URL. A missing or broken image falls back to initials. */
  avatar?: string
  /** Alt text for the avatar; defaults to the name. */
  avatarAlt?: string
  links?: TeamMemberLink[]
}

export interface TeamMemberCardProps extends BaseProps, TeamMember {
  /** Layout. Unknown values fall back to `card`. */
  variant?: TeamGridVariant
  /** Spacing, avatar and type scale: `sm`, `md` (the original) or `lg`. Unknown values fall back to `md`. */
  size?: TeamMemberSize
  /** Avatar shape: `circle` (the original), `rounded` or `square`. Unknown values fall back to `circle`. */
  shape?: TeamMemberShape
  /** Text alignment of the `card` and `minimal` layouts: `start` (the original) or `center`. `centered` is always centred and `horizontal` always start-aligned. Unknown values fall back to `start`. */
  align?: TeamMemberAlign
  /** Heading level of the name (1-6). Invalid values fall back to 3. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** Privacy blur on the photo (and the initials); name, role and links stay readable. Wins over `ConfigProvider blurMedia`, true or false. */
  blurred?: boolean
}

const props = withDefaults(defineProps<TeamMemberCardProps>(), { variant: 'card', size: 'md', shape: 'circle', align: 'start', level: 3, links: () => [], blurred: undefined })

const quiet = parentChecksItems()
onMounted(async () => {
  await nextTick()
  if (!quiet) report('TeamMemberCard', teamMemberProblem(props))
})

const variant = computed<TeamGridVariant>(() => (TEAM_VARIANTS.includes(props.variant) ? props.variant : 'card'))
const size = computed<TeamMemberSize>(() => oneOf(props.size, TEAM_SIZES, 'md'))
const shape = computed<TeamMemberShape>(() => oneOf(props.shape, TEAM_SHAPES, 'circle'))
const align = computed<TeamMemberAlign>(() => oneOf(props.align, TEAM_ALIGNS, 'start'))
const tag = computed(() => (Number.isInteger(props.level) && props.level >= 1 && props.level <= 6 ? `h${props.level}` : 'h3'))
const validLinks = computed(() => (Array.isArray(props.links) ? props.links.filter((l) => l && l.href && l.label) : []))
const classes = computed(() => cn(teamMemberVariants({ variant: variant.value, size: size.value, align: align.value }), props.class))
const avatarClass = computed(() => teamMemberAvatarVariants({ variant: variant.value, size: size.value }))
const linksClass = computed(() => teamMemberLinksVariants({ variant: variant.value, align: align.value }))
const nameClass = computed(() => teamMemberNameVariants({ size: size.value }))
const roleClass = computed(() => teamMemberRoleVariants({ size: size.value }))
const bioClass = computed(() => teamMemberBioVariants({ size: size.value }))
// min 24px target (44px on coarse pointers) also for the 20px icon-only links.
const linkClass = cn('inline-flex min-h-6 min-w-6 items-center justify-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11 pointer-coarse:min-w-11', focusRing)
</script>

<template>
  <div data-slot="team-member-card" :data-variant="variant" :data-size="size" :data-shape="shape" :data-align="align" :class="classes">
    <slot name="avatar">
      <Avatar :src="avatar" :alt="avatarAlt" :name="name" :shape="shape" :blurred="blurred" :class="avatarClass" />
    </slot>
    <div data-slot="team-member-body" class="flex min-w-0 flex-1 flex-col gap-1">
      <component :is="tag" v-if="name" data-slot="team-member-name" :class="nameClass">{{ name }}</component>
      <p v-if="role" data-slot="team-member-role" :class="roleClass">{{ role }}</p>
      <p v-if="bio || $slots.default" data-slot="team-member-bio" :class="bioClass">
        <slot>{{ bio }}</slot>
      </p>
      <ul v-if="validLinks.length" data-slot="team-member-links" role="list" :class="linksClass">
        <li v-for="(l, i) in validLinks" :key="`${i}-${l.href}`">
          <a data-slot="team-member-link" :href="l.href" :aria-label="l.icon ? l.label : undefined" v-bind="linkAttrs(l.external)" :class="linkClass">
            <Icon v-if="l.icon" :icon="l.icon" size="lg" />
            <template v-else>{{ l.label }}</template>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
