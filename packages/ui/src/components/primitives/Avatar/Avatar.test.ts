import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Avatar from './Avatar.vue'
import { avatarStatusVariants, avatarVariants } from './variants'
import { getInitials } from './context'

describe('Avatar', () => {
  describe('good path', () => {
    it('renders an image when src is given', () => {
      const w = mount(Avatar, { props: { src: '/a.png', alt: 'Ada', name: 'Ada Lovelace' } })
      const img = w.find('img')
      expect(w.attributes('data-slot')).toBe('avatar')
      expect(img.attributes('src')).toBe('/a.png')
      expect(img.attributes('alt')).toBe('Ada')
      expect(w.find('[data-slot="avatar-fallback"]').exists()).toBe(false)
      expect(w.attributes('role')).toBeUndefined()
    })

    it('image alt defaults to name', () => {
      const w = mount(Avatar, { props: { src: '/a.png', name: 'Ada Lovelace' } })
      expect(w.find('img').attributes('alt')).toBe('Ada Lovelace')
    })

    it('derives initials from the name when there is no src', () => {
      const w = mount(Avatar, { props: { name: 'ada lovelace byron' } })
      expect(w.find('img').exists()).toBe(false)
      expect(w.text()).toBe('AB')
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('aria-label')).toBe('ada lovelace byron')
    })

    it('falls back to initials when the image errors', async () => {
      const w = mount(Avatar, { props: { src: '/broken.png', name: 'Grace Hopper' } })
      await w.find('img').trigger('error')
      expect(w.find('img').exists()).toBe(false)
      expect(w.text()).toBe('GH')
    })

    it('retries the image when src changes after a failure', async () => {
      const w = mount(Avatar, { props: { src: '/broken.png', name: 'Grace Hopper' } })
      await w.find('img').trigger('error')
      await w.setProps({ src: '/ok.png' })
      expect(w.find('img').attributes('src')).toBe('/ok.png')
    })

    it('fallback prop overrides initials', () => {
      expect(mount(Avatar, { props: { name: 'Ada Lovelace', fallback: '+3' } }).text()).toBe('+3')
    })

    it('default slot overrides the fallback content', () => {
      const w = mount(Avatar, { props: { name: 'Ada' }, slots: { default: '<b>X</b>' } })
      expect(w.find('b').exists()).toBe(true)
      expect(w.text()).toBe('X')
    })

    it('applies every size and shape', () => {
      const expected = { xs: 'size-6', sm: 'size-8', md: 'size-10', lg: 'size-12', xl: 'size-16' } as const
      for (const [size, cls] of Object.entries(expected)) {
        expect(mount(Avatar, { props: { size: size as never } }).classes()).toContain(cls)
        expect(avatarVariants({ size: size as never })).toContain(cls)
      }
      expect(mount(Avatar).classes()).toContain('size-10')
      expect(mount(Avatar).classes()).toContain('rounded-full')
      expect(mount(Avatar, { props: { shape: 'square' } }).classes()).toContain('rounded-md')
    })

    it.each([
      ['neutral', 'bg-muted-foreground'],
      ['primary', 'bg-primary'],
      ['success', 'bg-success'],
      ['warning', 'bg-warning'],
      ['danger', 'bg-destructive'],
      ['info', 'bg-info'],
    ] as const)('renders a %s status dot', (status, cls) => {
      const w = mount(Avatar, { props: { name: 'A', status } })
      const dot = w.find('[data-slot="avatar-status"]')
      expect(dot.classes()).toContain(cls)
      // The dot is decorative; the status is part of the avatar's own accessible name.
      expect(dot.attributes('aria-hidden')).toBe('true')
      expect(dot.attributes('role')).toBeUndefined()
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('aria-label')).toBe(`A, ${status}`)
      expect(w.attributes('data-status')).toBe(status)
      expect(avatarStatusVariants({ status })).toContain(cls)
    })

    it('statusLabel overrides the status text in the accessible name', () => {
      const w = mount(Avatar, { props: { status: 'success', statusLabel: 'Online' } })
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('aria-label')).toBe('Online')
      const named = mount(Avatar, { props: { name: 'Sample user', status: 'success', statusLabel: 'Online' } })
      expect(named.attributes('aria-label')).toBe('Sample user, Online')
    })

    it('with an image and a status the avatar is a single named image (children are presentational)', () => {
      const w = mount(Avatar, { props: { src: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', name: 'Sample user', status: 'warning' } })
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('aria-label')).toBe('Sample user, warning')
    })
  })

  describe('customisation', () => {
    it('merges class with consumer winning', () => {
      const w = mount(Avatar, { props: { class: 'size-20 bg-primary' } })
      expect(w.classes()).toContain('size-20')
      expect(w.classes()).not.toContain('size-10')
      expect(w.classes()).toContain('bg-primary')
      expect(w.classes()).not.toContain('bg-muted')
    })

    it('passes attributes through and supports `as`', () => {
      const w = mount(Avatar, { props: { as: 'div' }, attrs: { id: 'me', 'data-test': 'x' } })
      expect(w.element.tagName).toBe('DIV')
      expect(w.attributes('id')).toBe('me')
      expect(w.attributes('data-test')).toBe('x')
    })

    it('status dot is not clipped: root has no overflow-hidden', () => {
      expect(mount(Avatar).classes()).not.toContain('overflow-hidden')
    })
  })

  describe('bad path', () => {
    it('invalid size, shape and status fall back', () => {
      const w = mount(Avatar, { props: { size: 'giant' as never, shape: 'hex' as never, status: 'busy' as never } })
      expect(w.classes()).toContain('size-10')
      expect(w.classes()).toContain('rounded-full')
      expect(w.find('[data-slot="avatar-status"]').exists()).toBe(false)
    })

    it('empty src is treated as no image', () => {
      const w = mount(Avatar, { props: { src: '', name: 'Ada Lovelace' } })
      expect(w.find('img').exists()).toBe(false)
      expect(w.text()).toBe('AL')
    })

    it('no props at all renders a generic user icon without a role', () => {
      const w = mount(Avatar)
      expect(w.find('svg').exists()).toBe(true)
      expect(w.attributes('role')).toBeUndefined()
      expect(w.attributes('aria-label')).toBeUndefined()
    })

    it('blank name yields no initials', () => {
      expect(mount(Avatar, { props: { name: '   ' } }).find('svg').exists()).toBe(true)
    })

    it('image without alt or name gets an empty alt', () => {
      expect(mount(Avatar, { props: { src: '/a.png' } }).find('img').attributes('alt')).toBe('')
    })
  })

  describe('edge cases', () => {
    it('getInitials handles unicode, single words, emoji and nullish input', () => {
      expect(getInitials('Łukasz Raczyłło')).toBe('ŁR')
      expect(getInitials('madonna')).toBe('M')
      expect(getInitials('  Jean   Luc  Picard ')).toBe('JP')
      expect(getInitials('😀 smile')).toBe('😀S')
      expect(getInitials('')).toBe('')
      expect(getInitials(undefined)).toBe('')
      expect(getInitials(null)).toBe('')
    })

    it('RTL names produce initials', () => {
      expect(getInitials('محمد علي')).toHaveLength(2)
    })

    it('fallback region is aria-hidden only when a label exists', () => {
      expect(mount(Avatar, { props: { name: 'Ada' } }).find('[data-slot="avatar-fallback"]').attributes('aria-hidden')).toBe('true')
      expect(mount(Avatar, { props: { fallback: '?' } }).find('[data-slot="avatar-fallback"]').attributes('aria-hidden')).toBeUndefined()
    })

    it('very long names still produce two initials', () => {
      expect(mount(Avatar, { props: { name: 'A'.repeat(5000) + ' ' + 'z'.repeat(5000) } }).text()).toBe('AZ')
    })
  })

  describe('backward compatibility (existing class output is frozen)', () => {
    const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()
    const BASE = 'relative inline-flex shrink-0 select-none items-center justify-center bg-muted font-medium text-muted-foreground'
    const SIZES = { xs: 'size-6 text-2xs', sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-12 text-base', xl: 'size-16 text-lg' } as const
    const SHAPES = { circle: 'rounded-full', square: 'rounded-md' } as const
    const STATUS_BASE = 'absolute bottom-0 right-0 block rounded-full ring-2 ring-background'
    const DOT_SIZES = { xs: 'size-1.5', sm: 'size-2', md: 'size-2.5', lg: 'size-3', xl: 'size-4' } as const

    it.each(Object.keys(SIZES).flatMap((z) => Object.keys(SHAPES).map((s) => [z, s] as const)))('avatarVariants %s/%s', (size, shape) => {
      expect(set(avatarVariants({ size: size as never, shape: shape as never }))).toEqual(
        set(`${BASE} ${SIZES[size as keyof typeof SIZES]} ${SHAPES[shape as keyof typeof SHAPES]}`),
      )
    })

    it.each(Object.keys(DOT_SIZES))('avatarStatusVariants emits bottom-right by default (%s)', (size) => {
      const out = avatarStatusVariants({ size: size as never, status: 'success' })
      expect(set(out)).toEqual(set(`${STATUS_BASE} ${DOT_SIZES[size as keyof typeof DOT_SIZES]} bg-success`))
    })

    it('default component has no ring classes', () => {
      expect(mount(Avatar).classes().join(' ')).not.toMatch(/ring/)
    })
  })

  describe('shapes', () => {
    it('rounded is a rounded-xl square', () => {
      const w = mount(Avatar, { props: { shape: 'rounded' } })
      expect(w.classes()).toContain('rounded-xl')
      expect(w.classes()).not.toContain('rounded-full')
      expect(avatarVariants({ shape: 'rounded' })).toContain('rounded-xl')
    })

    it('inner image/fallback inherit the radius', () => {
      const w = mount(Avatar, { props: { shape: 'rounded', src: '/a.png', name: 'Ada' } })
      expect(w.find('img').classes()).toContain('rounded-[inherit]')
    })

    it('class override wins over shape', () => {
      const w = mount(Avatar, { props: { shape: 'rounded', class: 'rounded-none' } })
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-xl')
    })
  })

  describe('2xl size', () => {
    it('renders size-24 with a bigger status dot', () => {
      const w = mount(Avatar, { props: { size: '2xl', name: 'Ada', status: 'success' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['size-24', 'text-2xl']))
      expect(w.classes()).not.toContain('size-10')
      expect(w.find('[data-slot="avatar-status"]').classes()).toContain('size-5')
    })
  })

  describe('status position', () => {
    it.each([
      ['bottom-right', ['bottom-0', 'right-0']],
      ['bottom-left', ['bottom-0', 'left-0']],
      ['top-right', ['top-0', 'right-0']],
      ['top-left', ['top-0', 'left-0']],
    ] as const)('%s', (statusPosition, cls) => {
      const dot = mount(Avatar, { props: { name: 'A', status: 'success', statusPosition } }).find('[data-slot="avatar-status"]')
      expect(dot.classes()).toEqual(expect.arrayContaining([...cls]))
      expect(avatarStatusVariants({ position: statusPosition })).toContain(cls[0])
    })

    it('exactly one vertical and one horizontal anchor', () => {
      const dot = mount(Avatar, { props: { status: 'info', statusPosition: 'top-left' } }).find('[data-slot="avatar-status"]')
      expect(dot.classes()).not.toContain('bottom-0')
      expect(dot.classes()).not.toContain('right-0')
    })

    it('defaults to bottom-right and falls back for unknown values', () => {
      expect(mount(Avatar, { props: { status: 'info' } }).find('[data-slot="avatar-status"]').classes()).toEqual(expect.arrayContaining(['bottom-0', 'right-0']))
      const bad = mount(Avatar, { props: { status: 'info', statusPosition: 'middle' as never } }).find('[data-slot="avatar-status"]')
      expect(bad.classes()).toEqual(expect.arrayContaining(['bottom-0', 'right-0']))
    })

    it('statusPosition without a status draws nothing', () => {
      expect(mount(Avatar, { props: { statusPosition: 'top-left' } }).find('[data-slot="avatar-status"]').exists()).toBe(false)
    })
  })

  describe('ring', () => {
    it.each([
      ['primary', 'ring-primary'],
      ['success', 'ring-success'],
      ['warning', 'ring-warning'],
      ['danger', 'ring-destructive'],
      ['info', 'ring-info'],
      ['border', 'ring-border'],
    ] as const)('ring %s', (ring, cls) => {
      const w = mount(Avatar, { props: { ring } })
      expect(w.classes()).toEqual(expect.arrayContaining(['ring-2', 'ring-offset-2', 'ring-offset-background', cls]))
      expect(avatarVariants({ ring })).toContain(cls)
    })

    it('ring=true and the bare attribute mean primary', () => {
      expect(mount(Avatar, { props: { ring: true } }).classes()).toContain('ring-primary')
      expect(mount(Avatar, { props: { ring: '' as never } }).classes()).toContain('ring-primary')
    })

    it('false, none and unknown values draw no ring', () => {
      for (const ring of [false, 'none', 'rainbow'] as const) {
        expect(mount(Avatar, { props: { ring: ring as never } }).classes().join(' ')).not.toMatch(/ring/)
      }
    })

    it('class can override the ring colour', () => {
      const w = mount(Avatar, { props: { ring: 'primary', class: 'ring-info' } })
      expect(w.classes()).toContain('ring-info')
      expect(w.classes()).not.toContain('ring-primary')
    })

    it('combines with status, shape and size', () => {
      const w = mount(Avatar, { props: { ring: 'success', shape: 'rounded', size: 'lg', status: 'success', statusPosition: 'top-right', name: 'Ada' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['ring-success', 'rounded-xl', 'size-12']))
      expect(w.find('[data-slot="avatar-status"]').classes()).toContain('top-0')
    })
  })
})
