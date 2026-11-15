import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { cn } from '../../../lib/cn'
import Prose from './Prose.vue'
import { proseVariants } from './variants'

const html = '<h2>Title</h2><p>Text</p><ul><li>One</li></ul><pre><code>x</code></pre>'

describe('Prose density', () => {
  it('default adds nothing and keeps the original rhythm classes', () => {
    const base = mount(Prose).classes()
    const explicit = mount(Prose, { props: { density: 'default' } }).classes()
    expect(explicit).toEqual(base)
    expect(base).toEqual(expect.arrayContaining(['[&_p]:my-4', '[&_ul]:my-4', '[&_li]:my-1.5', '[&_h2]:mt-10', '[&_pre]:my-6', '[&_hr]:my-8']))
    expect(base).not.toContain('leading-relaxed')
  })

  describe('compact', () => {
    const c = mount(Prose, { props: { density: 'compact' } }).classes()
    it('replaces the block margins with smaller ones', () => {
      expect(c).toEqual(expect.arrayContaining(['[&_p]:my-2', '[&_ul]:my-2', '[&_ol]:my-2', '[&_li]:my-0.5', '[&_h2]:mt-6', '[&_h2]:mb-2', '[&_pre]:my-4', '[&_hr]:my-5', '[&_table]:my-4']))
      for (const dropped of ['[&_p]:my-4', '[&_ul]:my-4', '[&_li]:my-1.5', '[&_h2]:mt-10', '[&_pre]:my-6', '[&_hr]:my-8']) expect(c).not.toContain(dropped)
    })
    it('does not shrink the font size or change line height', () => {
      expect(c).toContain('text-md')
      expect(c).not.toContain('leading-relaxed')
    })
  })

  describe('relaxed', () => {
    const c = mount(Prose, { props: { density: 'relaxed' } }).classes()
    it('replaces the block margins with larger ones and raises the line height', () => {
      expect(c).toEqual(expect.arrayContaining(['leading-relaxed', '[&_p]:my-6', '[&_ul]:my-6', '[&_li]:my-2.5', '[&_h2]:mt-14', '[&_h2]:mb-4', '[&_pre]:my-8', '[&_hr]:my-12']))
      for (const dropped of ['[&_p]:my-4', '[&_li]:my-1.5', '[&_h2]:mt-10', '[&_pre]:my-6']) expect(c).not.toContain(dropped)
    })
    it('keeps leading-relaxed with every size (tailwind-merge drops leading before a later text size)', () => {
      for (const size of ['xs', 'sm', 'base', 'md', 'lg', 'xl'] as const) expect(mount(Prose, { props: { density: 'relaxed', size } }).classes()).toContain('leading-relaxed')
    })
  })

  it('first and last child margin trimming survives every density', () => {
    for (const density of ['compact', 'default', 'relaxed'] as const) {
      expect(mount(Prose, { props: { density } }).classes()).toEqual(expect.arrayContaining(['[&>:first-child]:mt-0', '[&>:last-child]:mb-0']))
    }
  })

  it('unknown density falls back to default', () => {
    expect(mount(Prose, { props: { density: 'tight' as never } }).classes()).toEqual(mount(Prose).classes())
  })

  it('composes with size, tone and measure without conflicts', () => {
    const c = mount(Prose, { props: { density: 'compact', tone: 'inverted', size: 'lg', measure: true } }).classes()
    expect(c).toEqual(expect.arrayContaining(['[&_p]:my-2', 'bg-foreground', 'text-background', 'text-lg', 'max-w-prose', '[&_a]:text-background']))
    const dark = mount(Prose, { props: { density: 'relaxed', tone: 'dark' } }).classes()
    expect(dark).toEqual(expect.arrayContaining(['dark', 'leading-relaxed', '[&_p]:my-6']))
  })

  it('class prop wins over density', () => {
    const c = mount(Prose, { props: { density: 'compact', class: '[&_p]:my-8 leading-loose' } }).classes()
    expect(c).toContain('[&_p]:my-8')
    expect(c).not.toContain('[&_p]:my-2')
    expect(c).toContain('leading-loose')
  })

  it('renders content untouched for every density, including empty content', () => {
    for (const density of ['compact', 'default', 'relaxed'] as const) {
      const w = mount(Prose, { props: { density }, slots: { default: html } })
      expect(w.find('h2').text()).toBe('Title')
      expect(w.findAll('li')).toHaveLength(1)
      expect(mount(Prose, { props: { density } }).text()).toBe('')
    }
  })

  it('reacts to density changes', async () => {
    const w = mount(Prose, { props: { density: 'compact' } })
    expect(w.classes()).toContain('[&_p]:my-2')
    await w.setProps({ density: 'relaxed' })
    expect(w.classes()).toContain('[&_p]:my-6')
    expect(w.classes()).not.toContain('[&_p]:my-2')
  })

  it('proseVariants is reusable and needs cn() to resolve the margin conflicts', () => {
    expect(cn(proseVariants({ density: 'compact' }))).not.toContain('[&_p]:my-4')
    expect(proseVariants({ density: 'compact' })).toContain('[&_p]:my-2')
  })
})
