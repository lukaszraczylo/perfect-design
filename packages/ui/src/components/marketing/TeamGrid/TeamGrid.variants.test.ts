import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import TeamGrid from './TeamGrid.vue'
import TeamMemberCard from './TeamMemberCard.vue'
import {
  TEAM_ALIGNS,
  TEAM_GAPS,
  TEAM_SHAPES,
  TEAM_SIZES,
  TEAM_VARIANTS,
  teamGridVariants,
  teamMemberAvatarVariants,
  teamMemberBioVariants,
  teamMemberLinksVariants,
  teamMemberNameVariants,
  teamMemberRoleVariants,
  teamMemberVariants,
} from './variants'

const member = { name: 'Sample person', role: 'Role title', bio: 'A short sample biography.', links: [{ label: 'Profile of sample person', href: '/profile' }] }
const card = (props: Record<string, unknown> = {}) => mount(TeamMemberCard, { props: { ...member, ...props } })
const avatar = (w: ReturnType<typeof card>) => w.find('[data-slot="avatar"]')
const tokens = (s: string) => s.split(' ').sort()
const items = [member, { name: 'Second sample person', role: 'Role title' }]
const grid = (props: Record<string, unknown> = {}) => mount(TeamGrid, { props: { items, ...props } })
const cards = (w: ReturnType<typeof grid>) => w.findAll('[data-slot="team-member-card"]')

describe('TeamMemberCard variations', () => {
  describe('defaults keep the original output', () => {
    it('root, avatar, name, role, bio and links keep the original class set', () => {
      const w = card()
      expect(w.classes().sort()).toEqual(tokens('flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-6 text-card-foreground'))
      expect(avatar(w).classes()).toEqual(expect.arrayContaining(['size-20', 'text-xl', 'shrink-0', 'rounded-full']))
      expect(w.find('h3').classes().sort()).toEqual(tokens('text-lg font-semibold tracking-tight [overflow-wrap:anywhere]'))
      expect(w.find('[data-slot="team-member-role"]').classes().sort()).toEqual(tokens('text-sm font-medium text-primary [overflow-wrap:anywhere]'))
      expect(w.find('[data-slot="team-member-bio"]').classes().sort()).toEqual(tokens('mt-1 text-pretty text-sm text-muted-foreground [overflow-wrap:anywhere]'))
      expect(w.find('[data-slot="team-member-links"]').classes().sort()).toEqual(tokens('mt-1 flex flex-wrap items-center gap-x-3 gap-y-1'))
    })
    it('the other layouts keep their original classes', () => {
      expect(tokens(teamMemberVariants({ variant: 'minimal' }))).toEqual(tokens('flex min-w-0 flex-col gap-4'))
      expect(tokens(teamMemberVariants({ variant: 'centered' }))).toEqual(tokens('flex min-w-0 flex-col items-center gap-4 text-center'))
      expect(tokens(teamMemberVariants({ variant: 'horizontal' }))).toEqual(tokens('flex min-w-0 flex-row items-start gap-4 sm:gap-5'))
      expect(tokens(teamMemberAvatarVariants({ variant: 'horizontal' }))).toEqual(tokens('shrink-0 size-16 text-lg'))
      expect(tokens(teamMemberAvatarVariants({ variant: 'minimal' }))).toEqual(tokens('shrink-0 size-24 text-2xl'))
      expect(teamMemberLinksVariants({ variant: 'centered' })).toContain('justify-center')
    })
    it('reports the default dimensions as data attributes', () => {
      const w = card()
      expect([w.attributes('data-size'), w.attributes('data-shape'), w.attributes('data-align')]).toEqual(['md', 'circle', 'start'])
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'size-16', 'text-base', 'p-4', 'gap-3'],
      ['md', 'size-20', 'text-lg', 'p-6', 'gap-4'],
      ['lg', 'size-28', 'text-xl', 'p-8', 'gap-5'],
    ] as const)('card %s: avatar %s, name %s, padding %s, gap %s', (size, box, name, pad, gap) => {
      const w = card({ size })
      expect(w.attributes('data-size')).toBe(size)
      expect(avatar(w).classes()).toContain(box)
      expect(w.find('h3').classes()).toContain(name)
      expect(w.classes()).toEqual(expect.arrayContaining([pad, gap]))
      expect(w.classes().filter((c) => /^p-\d/.test(c))).toHaveLength(1)
    })
    it.each([
      ['minimal', 'sm', 'size-20'],
      ['minimal', 'lg', 'size-32'],
      ['centered', 'sm', 'size-20'],
      ['centered', 'lg', 'size-32'],
      ['horizontal', 'sm', 'size-12'],
      ['horizontal', 'lg', 'size-20'],
    ] as const)('%s %s uses a %s avatar', (variant, size, box) => {
      const w = card({ variant, size })
      expect(avatar(w).classes()).toContain(box)
      expect(avatar(w).classes().filter((c) => /^size-/.test(c))).toHaveLength(1)
    })
    it('horizontal scales its gap, role and bio', () => {
      expect(card({ variant: 'horizontal', size: 'lg' }).classes()).toEqual(expect.arrayContaining(['gap-5', 'sm:gap-6']))
      expect(card({ size: 'lg' }).find('[data-slot="team-member-role"]').classes()).toContain('text-base')
      expect(card({ size: 'lg' }).find('[data-slot="team-member-bio"]').classes()).toContain('text-base')
      expect(card({ size: 'sm' }).find('[data-slot="team-member-bio"]').classes()).toContain('text-sm')
      expect(teamMemberNameVariants({ size: 'lg' })).toContain('text-xl')
      expect(teamMemberRoleVariants()).toContain('text-sm')
      expect(teamMemberBioVariants({ size: 'lg' })).toContain('text-base')
    })
    it('link targets keep 24px and 44px coarse minimums at every size', () => {
      for (const size of TEAM_SIZES) expect(card({ size }).find('[data-slot="team-member-link"]').classes()).toEqual(expect.arrayContaining(['min-h-6', 'min-w-6', 'pointer-coarse:min-h-11', 'pointer-coarse:min-w-11']))
    })
    it('unknown values fall back to md', () => {
      for (const size of ['xl', '', 'LG', 2, null]) {
        const w = card({ size })
        expect(w.attributes('data-size')).toBe('md')
        expect(avatar(w).classes()).toContain('size-20')
      }
    })
  })

  describe('shape', () => {
    it.each([
      ['circle', 'rounded-full'],
      ['rounded', 'rounded-xl'],
      ['square', 'rounded-md'],
    ] as const)('%s avatar uses %s with a photo and with initials', (shape, cls) => {
      const initials = card({ shape })
      expect(initials.attributes('data-shape')).toBe(shape)
      expect(avatar(initials).classes()).toContain(cls)
      expect(avatar(initials).text()).toBe('SP')
      const photo = card({ shape, avatar: 'data:image/svg+xml;utf8,x', avatarAlt: 'Sample portrait' })
      expect(avatar(photo).classes()).toContain(cls)
      expect(photo.find('img').attributes('alt')).toBe('Sample portrait')
    })
    it('the card surface keeps its own radius whatever the avatar shape', () => {
      for (const shape of TEAM_SHAPES) expect(card({ shape }).classes()).toContain('rounded-lg')
    })
    it('unknown values fall back to circle', () => {
      const w = card({ shape: 'hexagon' })
      expect(w.attributes('data-shape')).toBe('circle')
      expect(avatar(w).classes()).toContain('rounded-full')
    })
    it('the avatar keeps its accessible name in every shape', () => {
      for (const shape of TEAM_SHAPES) {
        expect(avatar(card({ shape })).attributes('role')).toBe('img')
        expect(avatar(card({ shape })).attributes('aria-label')).toBe('Sample person')
      }
    })
  })

  describe('align', () => {
    it('center centres the card and minimal layouts, including the links', () => {
      for (const variant of ['card', 'minimal'] as const) {
        const w = card({ variant, align: 'center' })
        expect(w.attributes('data-align')).toBe('center')
        expect(w.classes()).toEqual(expect.arrayContaining(['items-center', 'text-center']))
        expect(w.find('[data-slot="team-member-links"]').classes()).toContain('justify-center')
      }
    })
    it('start keeps the original left-aligned classes', () => {
      const w = card({ align: 'start' })
      expect(w.classes()).not.toContain('items-center')
      expect(w.classes()).not.toContain('text-center')
      expect(w.find('[data-slot="team-member-links"]').classes()).not.toContain('justify-center')
    })
    it('centered stays centred and horizontal stays start-aligned whatever the value', () => {
      for (const align of TEAM_ALIGNS) {
        expect(card({ variant: 'centered', align }).classes()).toEqual(expect.arrayContaining(['items-center', 'text-center']))
        const h = card({ variant: 'horizontal', align })
        expect(h.classes()).toContain('items-start')
        expect(h.classes()).not.toContain('text-center')
      }
    })
    it('unknown values fall back to start', () => {
      for (const align of ['end', 'middle', '', 3]) expect(card({ align }).attributes('data-align')).toBe('start')
    })
  })

  describe('combinations, overrides and a11y', () => {
    it('variant x size x shape x align never duplicates size, radius or alignment classes', () => {
      for (const variant of TEAM_VARIANTS)
        for (const size of TEAM_SIZES)
          for (const align of TEAM_ALIGNS) {
            const w = card({ variant, size, align, shape: 'square' })
            const root = w.classes()
            expect(root.filter((c) => /^items-/.test(c)).length, `${variant}/${size}/${align}`).toBeLessThanOrEqual(1)
            expect(avatar(w).classes().filter((c) => /^size-/.test(c))).toHaveLength(1)
            expect(avatar(w).classes().filter((c) => /^rounded-/.test(c))).toHaveLength(1)
            expect(w.find('h3').text()).toBe('Sample person')
          }
    })
    it('the class prop wins over variant classes', () => {
      const w = card({ size: 'lg', class: 'p-2 custom' })
      expect(w.classes()).toEqual(expect.arrayContaining(['p-2', 'custom']))
      expect(w.classes()).not.toContain('p-8')
    })
    it('long names and missing optional parts render at every size', () => {
      const long = 'x'.repeat(120)
      for (const size of TEAM_SIZES) {
        const w = mount(TeamMemberCard, { props: { name: long, size } })
        expect(w.find('h3').classes().join(' ')).toContain('overflow-wrap:anywhere')
        expect(w.find('[data-slot="team-member-role"]').exists()).toBe(false)
        expect(w.find('[data-slot="team-member-links"]').exists()).toBe(false)
      }
    })
    it('the avatar slot still replaces the avatar', () => {
      const w = mount(TeamMemberCard, { props: { name: 'Sample person', size: 'lg', shape: 'square' }, slots: { avatar: '<i id="mine" />' } })
      expect(w.find('#mine').exists()).toBe(true)
      expect(w.find('[data-slot="avatar"]').exists()).toBe(false)
    })
  })

  describe('contract stays enforced', () => {
    const t = strictMount()
    beforeEach(() => configureStrictMode('throw'))
    afterEach(() => {
      t.reset()
      configureStrictMode('off')
    })
    it('a missing name and a link without a label still throw with size, shape and align set', async () => {
      await t.mount(() => el(TeamMemberCard, { role: 'Role title', size: 'lg', shape: 'square', align: 'center' }))
      // A nameless member also makes its Avatar complain; only the card's own report is asserted.
      const own = t.errors.filter((e) => e.message.includes('TeamMemberCard:'))
      expect(own).toHaveLength(1)
      expect(own[0].message).toContain('TeamMemberCard: requires a non-empty `name`')
      t.reset()
      await t.mount(() => el(TeamMemberCard, { name: 'Sample person', size: 'sm', shape: 'rounded', links: [{ label: '', href: '/x' }] }))
      expect(t.errors[0].message).toContain('requires a non-empty `label` on links[0]')
    })
  })
})

describe('TeamGrid variations', () => {
  it('defaults keep `grid gap-6` and the three-column classes', () => {
    expect(grid().classes().sort()).toEqual(tokens('grid gap-6 sm:grid-cols-2 lg:grid-cols-3'))
    expect(teamGridVariants()).toBe('grid gap-6 sm:grid-cols-2 lg:grid-cols-3')
    const w = grid()
    expect([w.attributes('data-gap'), w.attributes('data-size'), w.attributes('data-shape'), w.attributes('data-align')]).toEqual(['md', 'md', 'circle', 'start'])
  })

  it.each([
    ['sm', 'gap-4'],
    ['md', 'gap-6'],
    ['lg', 'gap-10'],
  ] as const)('gap %s uses %s next to every column count', (gap, cls) => {
    for (const columns of [2, 3, 4] as const) {
      const w = grid({ gap, columns })
      expect(w.attributes('data-gap')).toBe(gap)
      expect(w.classes()).toContain(cls)
      expect(w.classes().filter((c) => /^gap-\d/.test(c))).toHaveLength(1)
      expect(w.classes()).toContain('sm:grid-cols-2')
    }
    expect(teamGridVariants({ gap })).toContain(cls)
  })
  it('an unknown gap falls back to md and the class prop wins', () => {
    for (const gap of ['xl', '', 4, null]) expect(grid({ gap }).classes()).toContain('gap-6')
    const w = grid({ gap: 'lg', class: 'gap-1' })
    expect(w.classes()).toContain('gap-1')
    expect(w.classes()).not.toContain('gap-10')
    expect(TEAM_GAPS).toEqual(['sm', 'md', 'lg'])
  })

  it('size, shape and align reach every generated card', () => {
    const w = grid({ size: 'lg', shape: 'square', align: 'center' })
    expect(cards(w)).toHaveLength(2)
    for (const c of cards(w)) {
      expect(c.attributes('data-size')).toBe('lg')
      expect(c.attributes('data-shape')).toBe('square')
      expect(c.attributes('data-align')).toBe('center')
      expect(c.find('[data-slot="avatar"]').classes()).toEqual(expect.arrayContaining(['size-28', 'rounded-md']))
    }
  })
  it('a member that sets its own size, shape or align wins over the grid', () => {
    const w = grid({ size: 'sm', shape: 'square', align: 'center', items: [{ ...member, shape: 'rounded' }, { name: 'Other sample person', size: 'lg', align: 'start' }] })
    const [a, b] = cards(w)
    expect([a.attributes('data-shape'), a.attributes('data-size'), a.attributes('data-align')]).toEqual(['rounded', 'sm', 'center'])
    expect([b.attributes('data-shape'), b.attributes('data-size'), b.attributes('data-align')]).toEqual(['square', 'lg', 'start'])
  })
  it('unknown grid values fall back to the card defaults', () => {
    const w = grid({ size: 'huge', shape: 'hexagon', align: 'end' })
    expect([w.attributes('data-size'), w.attributes('data-shape'), w.attributes('data-align')]).toEqual(['md', 'circle', 'start'])
  })
  it('cards in the default slot keep their own props', () => {
    const w = mount(TeamGrid, { props: { size: 'lg', shape: 'square' }, slots: { default: () => [el(TeamMemberCard, { name: 'Slot sample person' })] } })
    expect(w.attributes('data-size')).toBe('lg')
    expect(w.find('[data-slot="team-member-card"]').attributes('data-shape')).toBe('circle')
    expect(w.element.tagName).toBe('DIV')
  })
  it('list semantics, headings and the name contract do not depend on the look', () => {
    for (const size of TEAM_SIZES)
      for (const shape of TEAM_SHAPES) {
        const w = grid({ size, shape, align: 'center', gap: 'lg' })
        expect(w.element.tagName).toBe('UL')
        expect(w.findAll(':scope > li')).toHaveLength(2)
        expect(w.findAll('h3').map((h) => h.text())).toEqual(['Sample person', 'Second sample person'])
      }
  })
})
