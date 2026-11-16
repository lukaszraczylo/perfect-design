import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Grid from './Grid.vue'

describe('Grid gapX/gapY precedence', () => {
  it('gapX and gapY are re-emitted at every breakpoint with a responsive gap', () => {
    const c = mount(Grid, { props: { gap: 4, gapX: 2, gapY: 1, gapSm: 3, gapMd: 6, gapLg: 8 } }).classes()
    for (const bp of ['sm', 'md', 'lg']) {
      expect(c).toContain(`${bp}:gap-x-2`)
      expect(c).toContain(`${bp}:gap-y-1`)
    }
    expect(c.indexOf('md:gap-x-2')).toBeGreaterThan(c.indexOf('md:gap-6'))
    expect(c.indexOf('lg:gap-y-1')).toBeGreaterThan(c.indexOf('lg:gap-8'))
  })

  it('emits no per-breakpoint axis class without a responsive gap or without an axis gap', () => {
    expect(mount(Grid, { props: { gapX: 2, gapMd: 6 } }).classes().filter((x) => /:gap-y-/.test(x))).toEqual([])
    expect(mount(Grid, { props: { gapX: 2 } }).classes().filter((x) => /:gap-x-/.test(x))).toEqual([])
    expect(mount(Grid, { props: { gapMd: 6 } }).classes().filter((x) => /:gap-[xy]-/.test(x))).toEqual([])
  })

  it('ignores an invalid axis gap', () => {
    expect(mount(Grid, { props: { gapX: 7 as never, gapMd: 6 } }).classes().filter((x) => /:gap-x-/.test(x))).toEqual([])
  })
})
