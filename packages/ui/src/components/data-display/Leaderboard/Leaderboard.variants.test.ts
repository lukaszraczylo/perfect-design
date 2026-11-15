import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Leaderboard from './Leaderboard.vue'
import { leaderboardCellVariants, leaderboardPodiumVariants, leaderboardRowVariants, leaderboardVariants } from './variants'

const E = [
  { id: 'a', label: 'Team A', value: 30, delta: 2 },
  { id: 'b', label: 'Team B', value: 20 },
  { id: 'c', label: 'Team C', value: 10 },
  { id: 'd', label: 'Team D', value: 5 },
]
const mk = (props: Record<string, unknown> = {}) => mount(Leaderboard, { props: { label: 'Scores', entries: E, ...props } as never })

describe('Leaderboard variations', () => {
  it('default output is pinned', () => {
    const w = mk()
    expect(w.attributes('class')).toBe('min-w-0 max-w-full text-foreground flex flex-col text-sm')
    expect(w.attributes('data-variant')).toBe('list')
    expect(w.attributes('data-size')).toBeUndefined()
    expect(w.attributes('data-density')).toBeUndefined()
    expect(w.find('li').attributes('class')).toBe('flex min-w-0 items-center gap-3 border-b px-2 last:border-b-0 py-3')
  })

  describe('variant', () => {
    it.each([['list', 'OL'], ['table', 'DIV'], ['podium', 'DIV']])('%s renders its own structure', (variant, tag) => {
      const w = mk({ variant })
      expect(w.element.tagName).toBe(tag)
      expect(w.attributes('data-variant')).toBe(variant)
    })
    it('the three variants differ', () => {
      expect(new Set(['list', 'table', 'podium'].map((v) => mk({ variant: v }).html())).size).toBe(3)
    })
    it('unknown falls back to list', () => expect(mk({ variant: 'grid' }).html()).toBe(mk().html()))
  })

  describe('size', () => {
    it.each([['sm', 'text-xs'], ['md', 'text-sm'], ['lg', 'text-base']])('%s -> %s', (size, cls) => {
      for (const variant of ['list', 'table', 'podium']) expect(mk({ size, variant }).classes()).toContain(cls)
    })
    it('sets data-size except for the default and scales avatars', () => {
      expect(mk({ size: 'sm' }).attributes('data-size')).toBe('sm')
      const av = (size: string, variant = 'list') => mount(Leaderboard, { props: { label: 'x', size, variant, entries: [{ id: 1, label: 'A', value: 1, avatar: { fallback: 'A' } }] } as never }).find('[data-slot="avatar"]').classes().join(' ')
      expect(av('sm')).not.toBe(av('lg'))
      expect(av('sm', 'podium')).not.toBe(av('lg', 'podium'))
    })
    it('unknown falls back to md', () => expect(mk({ size: 'xl' }).html()).toBe(mk().html()))
  })

  describe('density', () => {
    it.each([['comfortable', 'py-3'], ['compact', 'py-1.5']])('%s -> %s on rows and cells', (density, cls) => {
      expect(mk({ density }).find('li').classes()).toContain(cls)
      expect(mk({ density, variant: 'table' }).find('tbody th').classes()).toContain(cls)
      expect(mk({ density, variant: 'podium', entries: [...E, { id: 'e', label: 'E', value: 1 }] }).find('[data-slot="leaderboard-rest"] li').classes()).toContain(cls)
    })
    it('sets data-density except for the default', () => {
      expect(mk({ density: 'compact' }).attributes('data-density')).toBe('compact')
      expect(mk({ density: 'compact', variant: 'table' }).attributes('data-density')).toBe('compact')
      expect(mk({ density: 'compact', variant: 'podium' }).attributes('data-density')).toBe('compact')
    })
    it('unknown falls back to comfortable', () => expect(mk({ density: 'tight' }).html()).toBe(mk().html()))
  })

  describe('combinations', () => {
    it.each([['list'], ['table'], ['podium']])('%s with size, density, bars, highlight and delta does not conflict', (variant) => {
      const w = mk({ variant, size: 'lg', density: 'compact', bars: true, highlight: 'a', ties: 'dense', sort: 'asc' })
      expect(w.classes()).toContain('text-base')
      expect(w.find('[data-slot="leaderboard-highlight"]').exists()).toBe(true)
      expect(w.findAll('[data-slot="leaderboard-bar"]')).toHaveLength(4)
      expect(w.findAll('[data-slot="leaderboard-delta"]')).toHaveLength(1)
    })
  })

  describe('cva exports', () => {
    it('leaderboardVariants is reusable on plain elements', () => {
      expect(leaderboardVariants({ variant: 'table', size: 'lg' })).toContain('overflow-x-auto')
      expect(leaderboardVariants({ variant: 'podium' })).toContain('gap-4')
      expect(leaderboardVariants()).toBe(mk().attributes('class')!.replace(/\s*$/, ''))
    })
    it('row, cell and podium place variants', () => {
      expect(leaderboardRowVariants({ highlighted: true, density: 'compact' })).toContain('bg-muted')
      expect(leaderboardCellVariants()).toContain('py-3')
      expect(leaderboardPodiumVariants({ place: 'second', highlighted: true })).toContain('order-1')
      expect(leaderboardPodiumVariants()).toContain('bg-card')
    })
  })

  describe('responsive, forced colours and motion', () => {
    it('the table scroll region is focusable with the shared focus ring and does not rely on colour for the highlight', () => {
      const w = mk({ variant: 'table', highlight: 'a' })
      expect(w.classes().join(' ')).toContain('focus-visible:ring-3')
      expect(w.find('[data-slot="leaderboard-highlight"]').classes()).toEqual(expect.arrayContaining(['border', 'border-primary']))
    })
    it('podium places are flex-1 and shrinkable so three steps fit at 320px', () => {
      const li = mk({ variant: 'podium' }).find('li')
      expect(li.classes()).toEqual(expect.arrayContaining(['min-w-0', 'flex-1']))
    })
    it('rows and labels can shrink and the root never exceeds its container', () => {
      expect(mk().classes()).toEqual(expect.arrayContaining(['min-w-0', 'max-w-full']))
      expect(mk().find('[data-slot="leaderboard-label"]').classes()).toContain('min-w-0')
    })
  })
})
