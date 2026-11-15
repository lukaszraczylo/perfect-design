import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import Toggle from './Toggle.vue'
import { toggleVariants } from './variants'
import { toggleGroupItemVariants } from '../ToggleGroup/variants'

const el = (w: { find: (s: string) => any }) => w.find('[data-slot="toggle"]')
const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()
const TONES = ['primary', 'success', 'warning', 'danger', 'info'] as const

describe('Toggle variations', () => {
  describe('default output is frozen', () => {
    const BASE =
      'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] select-none hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground forced-colors:data-[state=on]:border-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40'
    it('default/md emits the original class set', () => {
      const expected = set(`${BASE} bg-transparent h-9 min-w-9 px-2.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11`)
      expect(set(toggleVariants())).toEqual(expected)
      expect(set(el(mount(Toggle)).classes().join(' '))).toEqual(expected)
    })
    it('outline and the three original sizes keep their class sets', () => {
      expect(set(toggleVariants({ variant: 'outline' }))).toEqual(
        set(`${BASE} border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground data-[state=on]:border-foreground h-9 min-w-9 px-2.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11`),
      )
      expect(set(toggleVariants({ size: 'sm' }))).toEqual(set(`${BASE} bg-transparent h-8 min-w-8 px-2 pointer-coarse:min-h-10 pointer-coarse:min-w-10`))
      expect(set(toggleVariants({ size: 'lg' }))).toEqual(set(`${BASE} bg-transparent h-10 min-w-10 px-3 pointer-coarse:min-h-11 pointer-coarse:min-w-11`))
    })
    it('a pressed outline toggle differs from a hovered one (ink border), so the pressed state stays visible under the pointer', () => {
      const c = toggleVariants({ variant: 'outline' })
      expect(c).toContain('data-[state=on]:border-foreground')
      expect(c).toContain('hover:bg-accent')
      expect(c).toContain('data-[state=on]:bg-accent')
      expect(c).not.toContain('hover:border-foreground')
    })
    it('ToggleGroup items, which reuse toggleVariants, are unchanged', () => {
      const c = toggleGroupItemVariants({})
      expect(c).toContain('rounded-none')
      expect(c).not.toContain('rounded-md')
      expect(c).toContain('h-9')
      expect(toggleGroupItemVariants({ size: 'xs' })).toContain('h-7')
      expect(toggleGroupItemVariants({ size: 'xl' })).toContain('h-11')
    })
  })

  describe('variant', () => {
    it('soft: muted fill, primary tint when pressed, hover keeps the pressed look', () => {
      const c = el(mount(Toggle, { props: { variant: 'soft' } })).classes()
      expect(c).toEqual(
        expect.arrayContaining([
          'bg-muted',
          'text-muted-foreground',
          'hover:bg-accent',
          'data-[state=on]:bg-primary/10',
          'data-[state=on]:text-primary',
          'data-[state=on]:hover:bg-primary/10',
        ]),
      )
      expect(c).not.toContain('data-[state=on]:bg-accent')
      expect(c).not.toContain('bg-transparent')
    })

    it('filled: secondary fill, solid primary when pressed, hover darkens by 10%', () => {
      const c = el(mount(Toggle, { props: { variant: 'filled' } })).classes()
      expect(c).toEqual(
        expect.arrayContaining([
          'bg-secondary',
          'text-secondary-foreground',
          'data-[state=on]:bg-primary',
          'data-[state=on]:text-primary-foreground',
          'data-[state=on]:hover:bg-primary/90',
        ]),
      )
      expect(c).not.toContain('data-[state=on]:bg-accent')
      expect(c).not.toContain('data-[state=on]:text-accent-foreground')
    })

    it('soft and filled keep a border in forced-colors mode (they rely on a fill alone); every pressed toggle gets a 2px one', () => {
      for (const variant of ['soft', 'filled'] as const) {
        const c = el(mount(Toggle, { props: { variant } })).classes()
        expect(c, variant).toContain('forced-colors:border')
        expect(c, variant).toContain('forced-colors:data-[state=on]:border-2')
      }
      for (const variant of ['default', 'outline'] as const) expect(el(mount(Toggle, { props: { variant } })).classes()).toContain('forced-colors:data-[state=on]:border-2')
    })

    it('keeps data-state and aria-pressed working in the new variants', async () => {
      for (const variant of ['soft', 'filled'] as const) {
        const w = mount(Toggle, { props: { variant }, slots: { default: 'Pin' } })
        expect(el(w).attributes('aria-pressed')).toBe('false')
        await el(w).trigger('click')
        expect(el(w).attributes('aria-pressed')).toBe('true')
        expect(el(w).attributes('data-state')).toBe('on')
        expect(w.emitted('update:modelValue')?.[0]).toEqual([true])
      }
    })

    it('unknown variant falls back to default', () => {
      expect(set(el(mount(Toggle, { props: { variant: 'neon' as never } })).classes().join(' '))).toEqual(set(el(mount(Toggle)).classes().join(' ')))
    })
  })

  describe('tone', () => {
    it.each([
      ['primary', ['data-[state=on]:bg-primary/10', 'data-[state=on]:text-primary']],
      ['success', ['data-[state=on]:bg-success/15', 'data-[state=on]:text-success']],
      ['warning', ['data-[state=on]:bg-warning/20', 'data-[state=on]:text-warning-foreground', 'dark:data-[state=on]:text-warning']],
      ['danger', ['data-[state=on]:bg-destructive/10', 'data-[state=on]:text-destructive']],
      ['info', ['data-[state=on]:bg-info/15', 'data-[state=on]:text-info']],
    ] as const)('%s tints the pressed default, outline and soft toggles', (tone, cls) => {
      for (const variant of ['default', 'outline', 'soft'] as const) {
        const c = el(mount(Toggle, { props: { variant, tone } })).classes()
        expect(c, `${variant} ${tone}`).toEqual(expect.arrayContaining([...cls]))
        expect(c, `${variant} ${tone}`).not.toContain('data-[state=on]:bg-accent')
      }
    })

    it.each([
      ['primary', ['data-[state=on]:bg-primary', 'data-[state=on]:text-primary-foreground']],
      ['success', ['data-[state=on]:bg-success', 'data-[state=on]:text-success-foreground']],
      ['warning', ['data-[state=on]:bg-warning', 'data-[state=on]:text-warning-foreground']],
      ['danger', ['data-[state=on]:bg-destructive', 'data-[state=on]:text-destructive-foreground']],
      ['info', ['data-[state=on]:bg-info', 'data-[state=on]:text-info-foreground']],
    ] as const)('%s fills the pressed filled toggle', (tone, cls) => {
      const c = el(mount(Toggle, { props: { variant: 'filled', tone } })).classes()
      expect(c).toEqual(expect.arrayContaining([...cls]))
      expect(c).not.toContain('data-[state=on]:bg-accent')
    })

    it('a tone replaces the soft primary tint (no conflicting pressed colours after merge)', () => {
      const c = el(mount(Toggle, { props: { variant: 'soft', tone: 'success' } })).classes()
      expect(c).not.toContain('data-[state=on]:bg-primary/10')
      expect(c).not.toContain('data-[state=on]:text-primary')
      const filled = el(mount(Toggle, { props: { variant: 'filled', tone: 'danger' } })).classes()
      expect(filled).not.toContain('data-[state=on]:bg-primary')
      expect(filled).not.toContain('data-[state=on]:hover:bg-primary/90')
    })

    it('tone does not change the unpressed look', () => {
      const base = el(mount(Toggle, { props: { variant: 'outline' } })).classes()
      const toned = el(mount(Toggle, { props: { variant: 'outline', tone: 'danger' } })).classes()
      for (const c of ['border', 'border-input', 'bg-transparent', 'hover:bg-accent']) {
        expect(base).toContain(c)
        expect(toned).toContain(c)
      }
    })

    it('unknown tone is ignored', () => {
      expect(set(el(mount(Toggle, { props: { tone: 'pink' as never } })).classes().join(' '))).toEqual(set(el(mount(Toggle)).classes().join(' ')))
    })

    it('every tone x variant combination mounts and stays pressable', async () => {
      for (const variant of ['default', 'outline', 'soft', 'filled'] as const)
        for (const tone of TONES) {
          const w = mount(Toggle, { props: { variant, tone }, slots: { default: 'T' } })
          await el(w).trigger('click')
          expect(el(w).attributes('aria-pressed'), `${variant} ${tone}`).toBe('true')
        }
    })
  })

  describe('size', () => {
    it.each([
      ['xs', ['h-7', 'min-w-7', 'px-1.5', 'text-xs'], ['pointer-coarse:min-h-10', 'pointer-coarse:min-w-10']],
      ['sm', ['h-8', 'min-w-8', 'px-2'], ['pointer-coarse:min-h-10']],
      ['md', ['h-9', 'min-w-9', 'px-2.5'], ['pointer-coarse:min-h-11']],
      ['lg', ['h-10', 'min-w-10', 'px-3'], ['pointer-coarse:min-h-11']],
      ['xl', ['h-11', 'min-w-11', 'px-4', 'text-base'], []],
    ] as const)('%s height, padding and coarse-pointer growth', (size, cls, coarse) => {
      const c = el(mount(Toggle, { props: { size } })).classes()
      expect(c).toEqual(expect.arrayContaining([...cls, ...coarse]))
      expect(c.filter((x: string) => /^h-\d/.test(x))).toHaveLength(1)
    })

    it('every size is at least 24px (28px and up) and 44px on coarse pointers or by default', () => {
      const px = { xs: 28, sm: 32, md: 36, lg: 40, xl: 44 }
      for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
        expect(px[size]).toBeGreaterThanOrEqual(24)
        const out = toggleVariants({ size })
        expect(out).toMatch(size === 'xl' ? /\bh-11\b/ : /pointer-coarse:min-h-(?:10|11)/)
      }
    })

    it('unknown size falls back to md', () => {
      expect(el(mount(Toggle, { props: { size: 'huge' as never } })).classes()).toEqual(expect.arrayContaining(['h-9', 'min-w-9']))
    })
  })

  describe('shape', () => {
    it.each([
      ['rounded', 'rounded-md'],
      ['pill', 'rounded-full'],
      ['square', 'rounded-none'],
    ] as const)('%s uses %s and only one radius class', (shape, cls) => {
      const c = el(mount(Toggle, { props: { shape } })).classes()
      expect(c).toContain(cls)
      expect(c.filter((x: string) => /^rounded/.test(x))).toEqual([cls])
    })

    it('unknown shape falls back to rounded', () => {
      expect(el(mount(Toggle, { props: { shape: 'blob' as never } })).classes()).toContain('rounded-md')
    })
  })

  describe('combinations', () => {
    it.each([
      ['soft', 'pill', 'xs'],
      ['filled', 'square', 'xl'],
      ['outline', 'pill', 'lg'],
      ['soft', 'square', 'sm'],
    ] as const)('variant %s x shape %s x size %s applies all dimensions', (variant, shape, size) => {
      const c = el(mount(Toggle, { props: { variant, shape, size } })).classes()
      expect(c).toContain({ rounded: 'rounded-md', pill: 'rounded-full', square: 'rounded-none' }[shape])
      expect(c).toContain({ xs: 'h-7', sm: 'h-8', lg: 'h-10', xl: 'h-11' }[size])
      expect(c).toContain('inline-flex')
    })

    it('class prop wins over variant, tone, size and shape', () => {
      const c = el(mount(Toggle, { props: { variant: 'filled', tone: 'success', size: 'xl', shape: 'pill', class: 'h-14 rounded-sm bg-pink-500' } })).classes()
      expect(c).toEqual(expect.arrayContaining(['h-14', 'rounded-sm', 'bg-pink-500']))
      expect(c).not.toContain('h-11')
      expect(c).not.toContain('rounded-full')
      expect(c).not.toContain('bg-secondary')
    })

    it('icon-only soft toggle with aria-label keeps its name and works as a pill', async () => {
      const w = mount(Toggle, { props: { variant: 'soft', shape: 'pill' }, attrs: { 'aria-label': 'Bold' }, slots: { default: () => h('svg') } })
      expect(el(w).attributes('aria-label')).toBe('Bold')
      await el(w).trigger('click')
      expect(el(w).attributes('aria-pressed')).toBe('true')
    })

    it('disabled still blocks every new variant', async () => {
      for (const variant of ['soft', 'filled'] as const) {
        const w = mount(Toggle, { props: { variant, disabled: true } })
        expect(el(w).attributes('disabled')).toBeDefined()
        await el(w).trigger('click')
        expect(w.emitted('update:modelValue')).toBeUndefined()
      }
    })

    it('reacts to variant, tone and shape changes at runtime', async () => {
      const w = mount(Toggle, { props: { defaultPressed: true } })
      await w.setProps({ variant: 'filled', tone: 'danger', shape: 'pill' })
      await nextTick()
      expect(el(w).classes()).toEqual(expect.arrayContaining(['bg-secondary', 'data-[state=on]:bg-destructive', 'rounded-full']))
    })

    it('uses logical spacing only and no arbitrary values (brackets appear only in data-state, transition and svg selectors)', () => {
      for (const variant of ['default', 'outline', 'soft', 'filled'] as const)
        for (const tone of [undefined, ...TONES]) {
          const out = toggleVariants({ variant, tone, size: 'xl', shape: 'pill' })
          expect(out).not.toMatch(/\b(?:ml|mr|pl|pr)-/)
          const brackets = out.match(/[\w:-]*\[[^\s]*/g) ?? []
          expect(brackets.filter((b) => !/^(?:[\w-]+:)*(?:data-\[state=on\]|transition-\[color,box-shadow\]|\[&_svg)/.test(b))).toEqual([])
        }
    })
  })
})
