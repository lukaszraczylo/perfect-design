import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AvatarGroup from './AvatarGroup.vue'
import { avatarGroupVariants } from './variants'

const items = [{ name: 'Author One' }, { name: 'Author Two' }, { name: 'Author Three' }, { name: 'Author Four' }]
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const

describe('AvatarGroup layout', () => {
  it('stacked is the default and keeps the original class string', () => {
    expect(avatarGroupVariants()).toBe(
      'flex items-center [&>*]:ring-2 [&>*]:ring-background forced-colors:[&>*]:outline-2 forced-colors:[&>*]:outline-solid forced-colors:[&>*]:outline-[CanvasText] -space-x-2.5',
    )
    const w = mount(AvatarGroup, { props: { items } })
    expect(w.classes().sort()).toEqual(mount(AvatarGroup, { props: { items, layout: 'stacked', density: 'default' } }).classes().sort())
    expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'items-center', '-space-x-2.5', '[&>*]:ring-2', '[&>*]:ring-background']))
  })

  it.each([
    ['xs', '-space-x-1.5'],
    ['sm', '-space-x-2'],
    ['md', '-space-x-2.5'],
    ['lg', '-space-x-3'],
    ['xl', '-space-x-4'],
    ['2xl', '-space-x-6'],
  ] as const)('stacked size %s keeps its original overlap %s', (size, cls) => {
    expect(avatarGroupVariants({ size })).toContain(cls)
    expect(mount(AvatarGroup, { props: { items, size } }).classes()).toContain(cls)
  })

  it('spaced removes the overlap and the ring and wraps with a gap', () => {
    const w = mount(AvatarGroup, { props: { items, layout: 'spaced' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'items-center', 'flex-wrap', 'gap-2']))
    expect(w.classes().some((c) => c.startsWith('-space-x-'))).toBe(false)
    expect(w.classes()).not.toContain('[&>*]:ring-2')
    expect(w.classes()).not.toContain('[&>*]:ring-background')
    expect(w.findAll('[data-slot="avatar"]')).toHaveLength(4)
  })

  it('spaced keeps the group role, avatar sizes and shape', () => {
    const w = mount(AvatarGroup, { props: { items, layout: 'spaced', size: 'lg', shape: 'square', max: 2 }, attrs: { 'aria-label': 'Project members' } })
    expect(w.attributes('role')).toBe('group')
    expect(w.attributes('aria-label')).toBe('Project members')
    expect(w.find('[data-slot="avatar"]').classes()).toEqual(expect.arrayContaining(['size-12', 'rounded-md']))
    const more = w.find('[data-slot="avatar-group-overflow"]')
    expect(more.text()).toBe('+2')
    expect(more.attributes('aria-label')).toBe('2 more')
    expect(more.classes()).toEqual(expect.arrayContaining(['size-12', 'rounded-md']))
  })

  it('spaced lets an avatar keep its own status dot and ring prop', () => {
    const w = mount(AvatarGroup, { props: { layout: 'spaced', items: [{ name: 'Author One', status: 'success' }] } })
    expect(w.find('[data-slot="avatar-status"]').exists()).toBe(true)
  })

  it('unknown layout falls back to stacked', () => {
    const w = mount(AvatarGroup, { props: { items, layout: 'grid' as never } })
    expect(w.classes()).toEqual(expect.arrayContaining(['-space-x-2.5', '[&>*]:ring-2']))
    expect(w.classes()).not.toContain('flex-wrap')
  })

  it('class wins over the layout classes', () => {
    const w = mount(AvatarGroup, { props: { items, layout: 'spaced', class: 'gap-6' } })
    expect(w.classes()).toContain('gap-6')
    expect(w.classes()).not.toContain('gap-2')
  })
})

describe('AvatarGroup density', () => {
  const OVERLAP = {
    xs: ['-space-x-2', '-space-x-1.5', '-space-x-1'],
    sm: ['-space-x-3', '-space-x-2', '-space-x-1'],
    md: ['-space-x-3.5', '-space-x-2.5', '-space-x-1.5'],
    lg: ['-space-x-4', '-space-x-3', '-space-x-2'],
    xl: ['-space-x-6', '-space-x-4', '-space-x-2'],
    '2xl': ['-space-x-8', '-space-x-6', '-space-x-3'],
  } as const

  it.each(SIZES)('stacked size %s: compact overlaps more, loose overlaps less', (size) => {
    const [compact, normal, loose] = OVERLAP[size]
    for (const [density, cls] of [['compact', compact], ['default', normal], ['loose', loose]] as const) {
      const c = mount(AvatarGroup, { props: { items, size, density } }).classes()
      expect(c).toContain(cls)
      expect(c.filter((x) => x.startsWith('-space-x-'))).toEqual([cls])
    }
  })

  it.each([
    ['compact', 'gap-1'],
    ['default', 'gap-2'],
    ['loose', 'gap-3'],
  ] as const)('spaced density %s sets %s and never an overlap', (density, cls) => {
    for (const size of SIZES) {
      const c = mount(AvatarGroup, { props: { items, layout: 'spaced', density, size } }).classes()
      expect(c).toContain(cls)
      expect(c.some((x) => x.startsWith('-space-x-'))).toBe(false)
    }
  })

  it('unknown density falls back to default in both layouts', () => {
    expect(mount(AvatarGroup, { props: { items, density: 'tight' as never } }).classes()).toContain('-space-x-2.5')
    expect(mount(AvatarGroup, { props: { items, layout: 'spaced', density: 'tight' as never } }).classes()).toContain('gap-2')
  })

  it('overlap is written with logical spacing (space-x), so it mirrors in RTL', () => {
    for (const size of SIZES) for (const density of ['compact', 'default', 'loose'] as const) expect(avatarGroupVariants({ size, density })).not.toMatch(/\b-?m[lr]-/)
  })

  it('reacts to prop changes', async () => {
    const w = mount(AvatarGroup, { props: { items } })
    await w.setProps({ density: 'compact' })
    expect(w.classes()).toContain('-space-x-3.5')
    await w.setProps({ layout: 'spaced' })
    expect(w.classes()).toContain('gap-1')
    expect(w.classes()).not.toContain('-space-x-3.5')
  })
})

describe('AvatarGroup cross-products', () => {
  it.each(SIZES.flatMap((size) => (['stacked', 'spaced'] as const).flatMap((layout) => (['compact', 'default', 'loose'] as const).map((density) => [size, layout, density] as const))))(
    'size %s, layout %s, density %s: one spacing rule, right avatar size, overflow bubble matches',
    (size, layout, density) => {
      const w = mount(AvatarGroup, { props: { items, size, layout, density, max: 2, shape: 'rounded' } })
      const c = w.classes()
      expect(c.filter((x) => x.startsWith('-space-x-') || /^gap-\d/.test(x))).toHaveLength(1)
      const px = { xs: 'size-6', sm: 'size-8', md: 'size-10', lg: 'size-12', xl: 'size-16', '2xl': 'size-24' }[size]
      expect(w.find('[data-slot="avatar"]').classes()).toContain(px)
      expect(w.find('[data-slot="avatar-group-overflow"]').classes()).toEqual(expect.arrayContaining([px, 'rounded-xl']))
    },
  )

  it('empty group with every look renders an empty group', () => {
    const w = mount(AvatarGroup, { props: { layout: 'spaced', density: 'loose' } })
    expect(w.element.children).toHaveLength(0)
    expect(w.attributes('role')).toBe('group')
  })
})

describe('AvatarGroup forced colours', () => {
  const FORCED = ['forced-colors:[&>*]:outline-2', 'forced-colors:[&>*]:outline-solid', 'forced-colors:[&>*]:outline-[CanvasText]']

  it('the stacked ring (a box-shadow) is backed by a CanvasText outline on every avatar in forced-colors mode', () => {
    const w = mount(AvatarGroup, { props: { items } })
    expect(w.classes()).toEqual(expect.arrayContaining(['[&>*]:ring-2', '[&>*]:ring-background', ...FORCED]))
  })

  it.each(SIZES.flatMap((size) => (['compact', 'default', 'loose'] as const).map((density) => [size, density] as const)))(
    'size %s, density %s keeps the outline',
    (size, density) => {
      expect(mount(AvatarGroup, { props: { items, size, density } }).classes()).toEqual(expect.arrayContaining(FORCED))
      expect(avatarGroupVariants({ size, density })).toContain('forced-colors:[&>*]:outline-[CanvasText]')
    },
  )

  it('spaced does not overlap, so it has neither the ring nor the outline', () => {
    const w = mount(AvatarGroup, { props: { items, layout: 'spaced' } })
    for (const c of FORCED) expect(w.classes()).not.toContain(c)
  })

  it('unknown layout falls back to stacked and keeps the outline', () => {
    expect(mount(AvatarGroup, { props: { items, layout: 'pile' as never } }).classes()).toEqual(expect.arrayContaining(FORCED))
  })

  it('a consumer class can still replace the outline colour', () => {
    const w = mount(AvatarGroup, { props: { items, class: 'forced-colors:[&>*]:outline-[Highlight]' } })
    expect(w.classes()).toContain('forced-colors:[&>*]:outline-[Highlight]')
    expect(w.classes()).not.toContain('forced-colors:[&>*]:outline-[CanvasText]')
  })
})
