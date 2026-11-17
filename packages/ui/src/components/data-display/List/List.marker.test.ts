import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import List from './List.vue'
import ListItem from './ListItem.vue'

const mk = (props: Record<string, unknown> = {}, rows = 2) =>
  mount(List, { props: props as never, slots: { default: () => Array.from({ length: rows }, (_, i) => h(ListItem, null, () => `Row ${i + 1}`)) } })

describe('List marker', () => {
  it('default output is unchanged', () => {
    const w = mk()
    expect(w.element.tagName).toBe('UL')
    expect(w.classes()).toEqual(['flex', 'flex-col', 'divide-y', 'divide-border'])
    expect(w.attributes('data-marker')).toBeUndefined()
    expect(w.find('li').classes()).toContain('flex')
    expect(mk({ marker: 'none' }).html()).toBe(w.html())
  })

  it('disc renders a block ul with disc markers and plain rows', () => {
    const w = mk({ marker: 'disc' })
    expect(w.element.tagName).toBe('UL')
    expect(w.attributes('data-marker')).toBe('disc')
    expect(w.classes()).toEqual(expect.arrayContaining(['list-disc', 'ps-5', 'marker:text-muted-foreground']))
    expect(w.classes()).not.toContain('flex')
    expect(w.classes()).not.toContain('divide-y')
    const li = w.find('li')
    expect(li.classes()).not.toContain('flex')
    expect(li.classes()).not.toContain('px-3')
    expect(li.text()).toBe('Row 1')
  })

  it('decimal renders an ol with decimal markers', () => {
    const w = mk({ marker: 'decimal' })
    expect(w.element.tagName).toBe('OL')
    expect(w.classes()).toEqual(expect.arrayContaining(['list-decimal', 'ps-6']))
    expect(w.attributes('role')).toBe('list')
  })

  it('uses logical padding only (RTL safe)', () => {
    for (const marker of ['disc', 'decimal']) {
      const cls = mk({ marker }).classes().join(' ')
      expect(cls).not.toMatch(/(^|\s)(pl|pr|ml|mr)-/)
    }
  })

  it('an explicit `as` wins over the marker default', () => {
    expect(mk({ marker: 'decimal', as: 'ul' }).element.tagName).toBe('UL')
    expect(mk({ marker: 'disc', as: 'ol' }).element.tagName).toBe('OL')
  })

  it('unknown marker falls back to none', () => {
    expect(mk({ marker: 'square' }).html()).toBe(mk().html())
  })

  it('row size sets the text size', () => {
    expect(mk({ marker: 'disc', size: 'sm' }).find('li').classes()).toContain('text-xs')
    expect(mk({ marker: 'disc', size: 'lg' }).find('li').classes()).toContain('text-base')
  })

  it('class wins, and a description renders under the text', () => {
    const w = mount(List, { props: { marker: 'disc', class: 'ps-8' }, slots: { default: () => h(ListItem, null, { default: () => 'Term', description: () => 'Detail' }) } })
    expect(w.classes()).toContain('ps-8')
    expect(w.classes()).not.toContain('ps-5')
    expect(w.find('[data-slot="list-item-description"]').text()).toBe('Detail')
  })

  it('handles an empty list and long text', () => {
    expect(mk({ marker: 'decimal' }, 0).findAll('li')).toHaveLength(0)
    const w = mount(List, { props: { marker: 'disc' }, slots: { default: () => h(ListItem, null, () => 'x'.repeat(500)) } })
    expect(w.find('li').text()).toHaveLength(500)
  })
})
