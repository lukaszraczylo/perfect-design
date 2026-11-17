import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Blockquote from './Blockquote.vue'
import { blockquoteAligns, blockquoteAuthorVariants, blockquoteSizes, blockquoteVariantNames, blockquoteVariants } from './variants'

describe('Blockquote', () => {
  describe('good path', () => {
    it('renders <blockquote> with left border and slot content', () => {
      const w = mount(Blockquote, { slots: { default: 'Quote' } })
      expect(w.element.tagName).toBe('BLOCKQUOTE')
      expect(w.attributes('data-slot')).toBe('blockquote')
      expect(w.text()).toBe('Quote')
      expect(w.classes()).toContain('border-s-2')
      expect(w.classes()).toContain('border-border')
    })

    it('primary variant uses the primary border', () => {
      const w = mount(Blockquote, { props: { variant: 'primary' } })
      expect(w.classes()).toContain('border-primary')
      expect(w.classes()).not.toContain('border-border')
    })

    it('renders the citation prop in a footer', () => {
      const w = mount(Blockquote, { props: { citation: 'Ada Lovelace' }, slots: { default: 'Quote' } })
      const f = w.find('[data-slot="blockquote-footer"]')
      expect(f.exists()).toBe(true)
      expect(f.element.tagName).toBe('FOOTER')
      expect(f.text()).toBe('Ada Lovelace')
    })

    it('citation slot overrides the prop', () => {
      const w = mount(Blockquote, {
        props: { citation: 'prop' },
        slots: { default: 'Quote', citation: '<cite>Slot</cite>' },
      })
      expect(w.find('footer cite').text()).toBe('Slot')
      expect(w.text()).not.toContain('prop')
    })

    it('citation slot alone renders the footer', () => {
      const w = mount(Blockquote, { slots: { default: 'Q', citation: 'Someone' } })
      expect(w.find('footer').text()).toBe('Someone')
    })

    it('cite sets the native cite attribute', () => {
      expect(mount(Blockquote, { props: { cite: 'https://example.com/src' } }).attributes('cite')).toBe(
        'https://example.com/src',
      )
    })
  })

  describe('customisation', () => {
    it('class merges last and overrides', () => {
      const w = mount(Blockquote, { props: { class: 'not-italic border-success custom-x' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('border-success')
      expect(w.classes()).not.toContain('italic')
      expect(w.classes()).not.toContain('border-border')
    })

    it('as swaps the element', () => {
      expect(mount(Blockquote, { props: { as: 'div' } }).element.tagName).toBe('DIV')
    })

    it('asChild styles the child and skips the footer', () => {
      const w = mount(Blockquote, {
        props: { asChild: true, citation: 'X' },
        slots: { default: '<aside>Q</aside>' },
      })
      expect(w.element.tagName).toBe('ASIDE')
      expect(w.classes()).toContain('border-s-2')
      expect(w.find('footer').exists()).toBe(false)
    })

    it('passes attributes through', () => {
      expect(mount(Blockquote, { attrs: { id: 'q', lang: 'fr' } }).attributes('lang')).toBe('fr')
    })

    it('blockquoteVariants is reusable', () => {
      expect(blockquoteVariants({ variant: 'primary' })).toContain('border-primary')
    })
  })

  describe('bad path / edge cases', () => {
    it('no citation means no footer', () => {
      expect(mount(Blockquote, { slots: { default: 'Q' } }).find('footer').exists()).toBe(false)
    })

    it('empty-string citation renders no footer', () => {
      expect(mount(Blockquote, { props: { citation: '' } }).find('footer').exists()).toBe(false)
    })

    it('no cite attribute when cite is not given', () => {
      expect(mount(Blockquote).attributes('cite')).toBeUndefined()
    })

    it('renders empty and handles unicode/RTL', () => {
      expect(mount(Blockquote).text()).toBe('')
      const w = mount(Blockquote, { props: { citation: 'محمود درويش' }, slots: { default: '“שלום”' } })
      expect(w.text()).toContain('محمود درويش')
    })

    it('unknown variant does not throw', () => {
      expect(mount(Blockquote, { props: { variant: 'x' as never } }).exists()).toBe(true)
    })
  })

  describe('variants', () => {
    it('default keeps the legacy classes', () => {
      expect(mount(Blockquote).classes()).toEqual(
        expect.arrayContaining(['border-s-2', 'ps-4', 'italic', 'text-foreground', 'border-border']),
      )
    })

    it('exposes variant, size and align lists', () => {
      expect(blockquoteVariantNames).toEqual(['default', 'primary', 'tinted', 'card', 'pull'])
      expect(blockquoteSizes).toContain('lg')
      expect(blockquoteAligns).toEqual(['start', 'center'])
    })

    it('tinted is a soft surface with a hairline border and no edge stripe', () => {
      const c = mount(Blockquote, { props: { variant: 'tinted' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['border', 'border-border', 'bg-muted/50', 'rounded-lg']))
      expect(c).not.toContain('border-l-4')
      expect(c).not.toContain('border-s-4')
      expect(c).not.toContain('italic')
    })

    it('card is a flat bordered surface without a shadow', () => {
      const c = mount(Blockquote, { props: { variant: 'card' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card', 'p-6']))
      expect(c).not.toContain('shadow-xs')
      expect(c).not.toContain('border-s-2')
      expect(c).not.toContain('italic')
    })

    it('pull is a large display quote without a decorative glyph', () => {
      const c = mount(Blockquote, { props: { variant: 'pull' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['font-display', 'text-2xl', 'font-medium']))
      expect(c.some((x) => x.startsWith('before:'))).toBe(false)
      expect(c).not.toContain('border-s-2')
    })

    it.each(blockquoteSizes)('size %s', (size) => {
      expect(mount(Blockquote, { props: { size } }).classes()).toContain(`text-${size}`)
    })

    it('size overrides the pull default size', () => {
      const c = mount(Blockquote, { props: { variant: 'pull', size: '3xl' } }).classes()
      expect(c).toContain('text-3xl')
      expect(c).not.toContain('text-2xl')
    })

    it('align center centres the quote', () => {
      expect(mount(Blockquote, { props: { align: 'center' } }).classes()).toContain('text-center')
      expect(mount(Blockquote, { props: { align: 'start' } }).classes()).not.toContain('text-center')
    })

    it('class overrides variant classes', () => {
      const c = mount(Blockquote, { props: { variant: 'card', class: 'rounded-none bg-muted p-2' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['rounded-none', 'bg-muted', 'p-2']))
      expect(c).not.toContain('rounded-lg')
      expect(c).not.toContain('bg-card')
      expect(c).not.toContain('p-6')
    })

    it('variants use only semantic tokens', () => {
      for (const variant of blockquoteVariantNames) {
        const cls = mount(Blockquote, { props: { variant } }).attributes('class') ?? ''
        expect(cls).not.toMatch(/#[0-9a-f]{3,6}|rgb\(|oklch\(|-(red|blue|gray|slate|zinc|neutral)-\d/)
      }
    })

    it('every variant still renders the citation footer', () => {
      for (const variant of blockquoteVariantNames) {
        const w = mount(Blockquote, { props: { variant, citation: 'Someone' }, slots: { default: 'Q' } })
        expect(w.find('footer').text()).toBe('Someone')
      }
    })

    it('unknown variant, size and align fall back to default without crashing', () => {
      const w = mount(Blockquote, { props: { variant: 'wild' as never, size: '9xl' as never, align: 'diagonal' as never } })
      expect(w.classes()).toEqual(expect.arrayContaining(['border-s-2', 'border-border', 'italic']))
      expect(w.classes()).not.toContain('text-center')
      expect(w.classes().some((c) => /^text-(sm|base|md|lg|xl|[23]xl)$/.test(c))).toBe(false)
    })

    it('blockquoteVariants is reusable', () => {
      expect(blockquoteVariants({ variant: 'pull', size: 'xl' })).toContain('text-xl')
      expect(blockquoteVariants({ variant: 'card' })).toContain('bg-card')
    })
  })

  describe('author row', () => {
    it('author prop renders name in a footer without the em-dash', () => {
      const w = mount(Blockquote, { props: { author: 'Ada Lovelace' }, slots: { default: 'Q' } })
      const f = w.find('[data-slot="blockquote-footer"]')
      expect(f.element.tagName).toBe('FOOTER')
      expect(f.find('[data-slot="blockquote-author"]').text()).toBe('Ada Lovelace')
      expect(f.classes()).toEqual(expect.arrayContaining(['flex', 'items-center', 'gap-3', 'not-italic']))
      expect(f.classes().some((c) => c.startsWith('before:'))).toBe(false)
      expect(f.find('[data-slot="blockquote-role"]').exists()).toBe(false)
      expect(f.find('[data-slot="blockquote-avatar"]').exists()).toBe(false)
    })

    it('role renders under the name', () => {
      const w = mount(Blockquote, { props: { author: 'Ada', role: 'CTO, Analytical Co.' }, slots: { default: 'Q' } })
      expect(w.find('[data-slot="blockquote-role"]').text()).toBe('CTO, Analytical Co.')
      expect(w.find('[data-slot="blockquote-role"]').classes()).toContain('text-muted-foreground')
    })

    it('avatar prop renders a decorative image first', () => {
      const w = mount(Blockquote, { props: { author: 'Ada', avatar: '/ada.png' }, slots: { default: 'Q' } })
      const img = w.find('[data-slot="blockquote-avatar"] img')
      expect(img.attributes('src')).toBe('/ada.png')
      expect(img.attributes('alt')).toBe('')
      expect(img.classes()).toContain('rounded-full')
      const kids = Array.from(w.find('footer').element.children).map((e) => e.getAttribute('data-slot') ?? 'text')
      expect(kids[0]).toBe('blockquote-avatar')
    })

    it('avatar slot replaces the image', () => {
      const w = mount(Blockquote, {
        props: { avatar: '/ignored.png', author: 'Ada' },
        slots: { default: 'Q', avatar: '<span id="av">AL</span>' },
      })
      expect(w.find('#av').text()).toBe('AL')
      expect(w.find('img').exists()).toBe(false)
    })

    it('author and role slots override the props', () => {
      const w = mount(Blockquote, {
        props: { author: 'prop-a', role: 'prop-r' },
        slots: { default: 'Q', author: '<b>slot-a</b>', role: '<i>slot-r</i>' },
      })
      expect(w.find('[data-slot="blockquote-author"] b').text()).toBe('slot-a')
      expect(w.find('[data-slot="blockquote-role"] i').text()).toBe('slot-r')
      expect(w.text()).not.toContain('prop-')
    })

    it('slots alone are enough to render the row', () => {
      expect(mount(Blockquote, { slots: { default: 'Q', author: 'A' } }).find('[data-slot="blockquote-author"]').exists()).toBe(true)
      expect(mount(Blockquote, { slots: { default: 'Q', role: 'R' } }).find('[data-slot="blockquote-role"]').exists()).toBe(true)
      expect(mount(Blockquote, { slots: { default: 'Q', avatar: '<i>x</i>' } }).find('[data-slot="blockquote-avatar"]').exists()).toBe(true)
    })

    it('avatar only (no name) renders just the avatar', () => {
      const w = mount(Blockquote, { props: { avatar: '/a.png' }, slots: { default: 'Q' } })
      expect(w.find('[data-slot="blockquote-avatar"]').exists()).toBe(true)
      expect(w.find('[data-slot="blockquote-author"]').exists()).toBe(false)
    })

    it('the author row supersedes the citation footer (a single footer)', () => {
      const w = mount(Blockquote, { props: { author: 'Ada', citation: 'Old way' }, slots: { default: 'Q' } })
      expect(w.findAll('footer')).toHaveLength(1)
      expect(w.text()).not.toContain('Old way')
    })

    it('align center centres the row', () => {
      const w = mount(Blockquote, { props: { author: 'Ada', align: 'center' }, slots: { default: 'Q' } })
      expect(w.find('footer').classes()).toContain('justify-center')
      expect(mount(Blockquote, { props: { author: 'Ada' } }).find('footer').classes()).not.toContain('justify-center')
    })

    it('works with card and pull variants and cite url', () => {
      const w = mount(Blockquote, {
        props: { variant: 'card', author: 'Ada', role: 'CTO', cite: 'https://example.com/q' },
        slots: { default: 'Q' },
      })
      expect(w.attributes('cite')).toBe('https://example.com/q')
      expect(w.classes()).toContain('bg-card')
      expect(w.find('[data-slot="blockquote-author"]').text()).toBe('Ada')
    })

    it('asChild skips the author row', () => {
      const w = mount(Blockquote, { props: { asChild: true, author: 'Ada' }, slots: { default: '<aside>Q</aside>' } })
      expect(w.find('footer').exists()).toBe(false)
    })

    it('empty-string author, role and avatar render no row', () => {
      const w = mount(Blockquote, { props: { author: '', role: '', avatar: '' }, slots: { default: 'Q' } })
      expect(w.find('footer').exists()).toBe(false)
    })

    it('handles unicode/RTL names and reacts to prop changes', async () => {
      const w = mount(Blockquote, { props: { author: 'محمود درويش' }, slots: { default: 'Q' } })
      expect(w.find('[data-slot="blockquote-author"]').text()).toBe('محمود درويش')
      await w.setProps({ author: undefined })
      expect(w.find('footer').exists()).toBe(false)
    })

    it('blockquoteAuthorVariants is reusable', () => {
      expect(blockquoteAuthorVariants({ align: 'center' })).toContain('justify-center')
      expect(blockquoteAuthorVariants()).toContain('gap-3')
    })
  })
})

describe('Blockquote author row', () => {
  it('renders no avatar box without an avatar, so the author lines up with the quote', () => {
    const w = mount(Blockquote, { props: { variant: 'card', author: 'Sample author', authorRole: 'Sample role' }, slots: { default: 'Quote' } })
    expect(w.find('[data-slot="blockquote-avatar"]').exists()).toBe(false)
    expect(w.find('[data-slot="blockquote-author"]').text()).toBe('Sample author')
  })
})
