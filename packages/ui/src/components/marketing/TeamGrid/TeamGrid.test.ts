import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'
import TeamGrid from './TeamGrid.vue'
import TeamMemberCard from './TeamMemberCard.vue'
import { teamGridVariants, teamMemberVariants } from './variants'

const items = [
  { name: 'Sample person A', role: 'Engineer', bio: 'Writes the first program.', avatar: 'https://x.dev/a.png', links: [{ label: 'GitHub', href: 'https://github.com/sample', icon: faEnvelope, external: true }, { label: 'Site', href: '/ada' }] },
  { name: 'Sample person B', role: 'Admiral' },
  { name: 'Sample person C' },
]

afterEach(() => vi.restoreAllMocks())

describe('TeamGrid', () => {
  describe('good path', () => {
    it('renders a card per member inside a list', () => {
      const w = mount(TeamGrid, { props: { items } })
      expect(w.attributes('data-slot')).toBe('team-grid')
      expect(w.attributes('role')).toBe('list')
      const cards = w.findAll('[data-slot="team-member-card"]')
      expect(cards).toHaveLength(3)
      // regression: ul > li (no div[role=list] holding headings/avatars directly)
      expect(w.element.tagName).toBe('UL')
      expect(w.findAll(':scope > li[data-slot="team-grid-item"]')).toHaveLength(3)
      expect(w.find('[role="listitem"]').exists()).toBe(false)
      expect(cards.every((c) => c.attributes('role') === undefined)).toBe(true)
      expect(w.findAll('h3').map((h) => h.text())).toEqual(['Sample person A', 'Sample person B', 'Sample person C'])
    })
    it('slot mode and empty grids are plain containers without a list role', () => {
      const slotted = mount(TeamGrid, { slots: { default: '<div id="mine" />' } })
      expect(slotted.element.tagName).toBe('DIV')
      expect(slotted.attributes('role')).toBeUndefined()
      const empty = mount(TeamGrid, { props: { items: [] } })
      expect(empty.element.tagName).toBe('DIV')
      expect(empty.attributes('role')).toBeUndefined()
    })
    it('icon-only and text links are at least 24px (44px coarse) and the card has no shadow or xl radius', () => {
      const w = mount(TeamGrid, { props: { items } })
      for (const a of w.findAll('[data-slot="team-member-link"]')) {
        expect(a.classes()).toEqual(expect.arrayContaining(['min-h-6', 'min-w-6', 'pointer-coarse:min-h-11', 'pointer-coarse:min-w-11']))
      }
      const card = w.find('[data-slot="team-member-card"]')
      expect(card.classes()).toContain('rounded-lg')
      expect(card.classes().join(' ')).not.toMatch(/shadow|rounded-xl/)
    })
    it('renders role, bio and name text', () => {
      const w = mount(TeamGrid, { props: { items } })
      expect(w.find('[data-slot="team-member-role"]').text()).toBe('Engineer')
      expect(w.find('[data-slot="team-member-bio"]').text()).toBe('Writes the first program.')
    })
    it('shows the avatar image when provided and initials otherwise', () => {
      const w = mount(TeamGrid, { props: { items } })
      const cards = w.findAll('[data-slot="team-member-card"]')
      expect(cards[0].find('img').attributes('src')).toBe('https://x.dev/a.png')
      expect(cards[1].find('img').exists()).toBe(false)
      expect(cards[1].find('[data-slot="avatar-fallback"]').text()).toBe('SB')
    })
    it('falls back to initials when the image fails to load', async () => {
      const w = mount(TeamGrid, { props: { items: [items[0]] } })
      await w.find('img').trigger('error')
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('[data-slot="avatar-fallback"]').text()).toBe('SA')
    })
    it('uses avatarAlt for the image', () => {
      const w = mount(TeamGrid, { props: { items: [{ ...items[0], avatarAlt: 'Portrait of Ada' }] } })
      expect(w.find('img').attributes('alt')).toBe('Portrait of Ada')
    })
    it('renders links: icon-only get aria-label, text links show label, external gets rel', () => {
      const w = mount(TeamGrid, { props: { items } })
      const links = w.findAll('[data-slot="team-member-link"]')
      expect(links).toHaveLength(2)
      expect(links[0].attributes('aria-label')).toBe('GitHub')
      expect(links[0].find('svg').exists()).toBe(true)
      expect(links[0].attributes('target')).toBe('_blank')
      expect(links[0].attributes('rel')).toBe('noopener noreferrer')
      expect(links[1].text()).toBe('Site')
      expect(links[1].attributes('aria-label')).toBeUndefined()
      expect(links[1].attributes('target')).toBeUndefined()
    })
    it.each([
      [2, 'sm:grid-cols-2'],
      [3, 'lg:grid-cols-3'],
      [4, 'lg:grid-cols-4'],
    ] as const)('columns %s', (columns, cls) => {
      const w = mount(TeamGrid, { props: { columns } })
      expect(w.classes()).toContain(cls)
      expect(w.attributes('data-columns')).toBe(String(columns))
      expect(teamGridVariants({ columns })).toContain(cls)
    })
    it.each([
      ['card', 'border'],
      ['minimal', 'flex-col'],
      ['centered', 'text-center'],
      ['horizontal', 'flex-row'],
    ] as const)('variant %s is forwarded to every card', (variant, cls) => {
      const w = mount(TeamGrid, { props: { items, variant } })
      expect(w.attributes('data-variant')).toBe(variant)
      const cards = w.findAll('[data-slot="team-member-card"]')
      for (const c of cards) {
        expect(c.attributes('data-variant')).toBe(variant)
        expect(c.classes()).toContain(cls)
      }
      expect(teamMemberVariants({ variant })).toContain(cls)
    })
    it('card variant has a surface, minimal does not', () => {
      expect(mount(TeamGrid, { props: { items: [items[1]], variant: 'card' } }).find('[data-slot="team-member-card"]').classes()).toContain('bg-card')
      expect(mount(TeamGrid, { props: { items: [items[1]], variant: 'minimal' } }).find('[data-slot="team-member-card"]').classes()).not.toContain('bg-card')
    })
    it('centered variant centres links', () => {
      const w = mount(TeamGrid, { props: { items, variant: 'centered' } })
      expect(w.find('[data-slot="team-member-links"]').classes()).toContain('justify-center')
    })
    it('slot content replaces generated cards', () => {
      const w = mount(TeamGrid, { props: { items }, slots: { default: '<div id="mine" />' } })
      expect(w.find('#mine').exists()).toBe(true)
      expect(w.findAll('[data-slot="team-member-card"]')).toHaveLength(0)
    })
    it('passes level to names', () => {
      const w = mount(TeamGrid, { props: { items, level: 4 } })
      expect(w.findAll('h4')).toHaveLength(3)
      expect(w.findAll('h3')).toHaveLength(0)
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(TeamGrid, { props: { class: 'gap-2 custom' }, attrs: { id: 'g', 'data-x': '1', 'aria-label': 'Team' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('gap-2')
      expect(w.classes()).not.toContain('gap-6')
      expect(w.attributes('id')).toBe('g')
      expect(w.attributes('data-x')).toBe('1')
      expect(w.attributes('aria-label')).toBe('Team')
    })
    it('TeamMemberCard merges class and attrs', () => {
      const w = mount(TeamMemberCard, { props: { name: 'A', class: 'p-2 custom' }, attrs: { id: 'm' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('p-2')
      expect(w.classes()).not.toContain('p-6')
      expect(w.attributes('id')).toBe('m')
    })
    it('TeamMemberCard supports avatar and default slots', () => {
      const w = mount(TeamMemberCard, { props: { name: 'A' }, slots: { avatar: '<i id="av" />', default: 'Custom <b>bio</b>' } })
      expect(w.find('#av').exists()).toBe(true)
      expect(w.find('[data-slot="avatar"]').exists()).toBe(false)
      expect(w.find('[data-slot="team-member-bio"] b').text()).toBe('bio')
    })
  })

  describe('bad path', () => {
    it('empty items renders an empty grid', () => {
      expect(mount(TeamGrid, { props: { items: [] } }).element.children).toHaveLength(0)
    })
    it('non-array items and null entries are ignored', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(TeamGrid, { props: { items: null } }).element.children).toHaveLength(0)
      // @ts-expect-error deliberately invalid
      expect(mount(TeamGrid, { props: { items: [null, items[1]] } }).findAll('[data-slot="team-member-card"]')).toHaveLength(1)
    })
    it('invalid columns fall back to 3', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(TeamGrid, { props: { columns: 9 } })
      expect(w.attributes('data-columns')).toBe('3')
      expect(w.classes()).toContain('lg:grid-cols-3')
      // @ts-expect-error deliberately invalid
      expect(mount(TeamGrid, { props: { columns: '4' } }).attributes('data-columns')).toBe('3')
    })
    it('unknown variant falls back to card (grid and card)', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(TeamGrid, { props: { items, variant: 'fancy' } })
      expect(w.attributes('data-variant')).toBe('card')
      expect(w.find('[data-slot="team-member-card"]').attributes('data-variant')).toBe('card')
      // @ts-expect-error deliberately invalid
      expect(mount(TeamMemberCard, { props: { name: 'A', variant: 'zzz' } }).attributes('data-variant')).toBe('card')
    })
    it('invalid heading level falls back to h3', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(TeamMemberCard, { props: { name: 'A', level: 9 } }).find('h3').exists()).toBe(true)
    })
    it('drops links without href or label and tolerates non-array links', () => {
      const w = mount(TeamMemberCard, { props: { name: 'A', links: [{ label: '', href: '/x' }, { label: 'L', href: '' }, { label: 'ok', href: '/ok' }] } })
      expect(w.findAll('[data-slot="team-member-link"]')).toHaveLength(1)
      // @ts-expect-error deliberately invalid
      const w2 = mount(TeamMemberCard, { props: { name: 'A', links: 'nope' } })
      expect(w2.find('[data-slot="team-member-links"]').exists()).toBe(false)
    })
    it('member with only a name renders no role, bio or links', () => {
      const w = mount(TeamMemberCard, { props: { name: 'Solo' } })
      expect(w.find('[data-slot="team-member-role"]').exists()).toBe(false)
      expect(w.find('[data-slot="team-member-bio"]').exists()).toBe(false)
      expect(w.find('[data-slot="team-member-links"]').exists()).toBe(false)
    })
    it('member without a name renders no heading', () => {
      const w = mount(TeamMemberCard, { props: { name: '', role: 'Ghost' } })
      expect(w.find('[data-slot="team-member-name"]').exists()).toBe(false)
      expect(w.find('[data-slot="avatar"]').exists()).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('handles one item and 100 items', () => {
      expect(mount(TeamGrid, { props: { items: [items[1]] } }).findAll('[data-slot="team-member-card"]')).toHaveLength(1)
      const many = Array.from({ length: 100 }, (_, i) => ({ name: `Person ${i}` }))
      expect(mount(TeamGrid, { props: { items: many } }).findAll('[data-slot="team-member-card"]')).toHaveLength(100)
    })
    it('handles duplicate names without key warnings', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const w = mount(TeamGrid, { props: { items: [{ name: 'Same' }, { name: 'Same' }] } })
      expect(w.findAll('[data-slot="team-member-card"]')).toHaveLength(2)
      expect(warn).not.toHaveBeenCalled()
    })
    it('handles very long text and unicode', () => {
      const long = 'W'.repeat(2000)
      const w = mount(TeamGrid, { props: { items: [{ name: long, role: long, bio: long }, { name: '李雷 😀', role: 'مهندس', bio: 'Zażółć gęślą jaźń' }] } })
      const cards = w.findAll('[data-slot="team-member-card"]')
      expect(cards[0].find('[data-slot="team-member-name"]').text()).toHaveLength(2000)
      expect(cards[0].find('[data-slot="team-member-name"]').classes().join(' ')).toContain('overflow-wrap:anywhere')
      expect(cards[1].find('[data-slot="team-member-name"]').text()).toBe('李雷 😀')
      expect(cards[1].find('[data-slot="avatar-fallback"]').text()).toBe('李😀')
    })
    it('escapes HTML in text', () => {
      const w = mount(TeamGrid, { props: { items: [{ name: '<img src=x onerror=1>', bio: '<b>x</b>' }] } })
      expect(w.find('[data-slot="team-member-name"] img').exists()).toBe(false)
      expect(w.find('[data-slot="team-member-bio"] b').exists()).toBe(false)
    })
    it('reacts to prop changes and unmounts cleanly', async () => {
      const w = mount(TeamGrid, { props: { items, variant: 'card' as const } })
      await w.setProps({ variant: 'horizontal', columns: 4, items: [items[1]] })
      expect(w.findAll('[data-slot="team-member-card"]')).toHaveLength(1)
      expect(w.attributes('data-variant')).toBe('horizontal')
      expect(() => w.unmount()).not.toThrow()
    })
    it('resets a broken avatar when src changes', async () => {
      const w = mount(TeamMemberCard, { props: { name: 'A B', avatar: '/a.png' } })
      await w.find('img').trigger('error')
      expect(w.find('img').exists()).toBe(false)
      await w.setProps({ avatar: '/b.png' })
      expect(w.find('img').attributes('src')).toBe('/b.png')
    })
  })
})
