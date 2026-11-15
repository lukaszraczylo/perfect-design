/**
 * Contract tests for the layout components: documented requirements throw a ContractError in strict mode, every accepted
 * alternative passes, and normal usage stays quiet.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, type VNodeChild } from 'vue'
import { configureStrictMode } from '../../lib/contract'
import { Affix } from './Affix'
import { AppShell } from './AppShell'
import { CenteredLayout } from './CenteredLayout'
import { InfiniteScroll } from './InfiniteScroll'
import { ResizableHandle, ResizablePanel, ResizablePanels } from './ResizablePanels'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

const errors: Error[] = []
let wrapper: VueWrapper | undefined
const mounted = (root: () => VNodeChild) => {
  wrapper = mount(
    defineComponent({
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return root
      },
    }),
    { attachTo: document.body },
  )
  return settle()
}
const remount = async (root: () => VNodeChild) => {
  wrapper?.unmount()
  errors.length = 0
  await mounted(root)
}
const quiet = () => vi.spyOn(console, 'error').mockImplementation(() => {})

beforeEach(() => {
  errors.length = 0
  configureStrictMode('throw')
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  configureStrictMode('off')
})

describe('AppShell', () => {
  const shell = (props: Record<string, unknown>, slots: Record<string, () => VNodeChild> = { sidebar: () => 'Nav', default: () => 'Page' }) =>
    h('div', null, [h('main', null, h(AppShell, { main: false, ...props }, slots))])

  it('throws when a shown sidebar has a blank label', async () => {
    await mounted(() => shell({ sidebarLabel: '  ' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('AppShell: requires a non-empty `sidebarLabel`')
  })
  it('throws when the end sidebar of a dual-sidebar shell has a blank label', async () => {
    await mounted(() => shell({ layout: 'dual-sidebar', sidebarEndLabel: '' }, { sidebar: () => 'Nav', 'sidebar-end': () => 'Details', default: () => 'Page' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('`sidebarEndLabel`')
  })
  it('does not check labels of sidebars that are not rendered', async () => {
    await mounted(() => shell({ sidebarLabel: '', sidebarEndLabel: '' }, { default: () => 'Page' }))
    expect(errors).toEqual([])
  })
  it('throws when the skip link has no target id or no text', async () => {
    await mounted(() => shell({ skipLink: true, mainId: '' }, { default: () => 'Page' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('`mainId`')
    await remount(() => shell({ skipLink: true, skipLinkLabel: ' ' }, { default: () => 'Page' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('`skipLinkLabel`')
  })
  it('accepts the defaults, labelled sidebars and a skip link', async () => {
    await mounted(() => shell({ skipLink: true, sidebarLabel: 'Project navigation' }))
    expect(errors).toEqual([])
  })
  it('with `main` false needs a main landmark on the page', async () => {
    await mounted(() => h(AppShell, { main: false }, { default: () => 'Page' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('AppShell: with `main` set to false needs a `<main>`')
  })
  it('is satisfied by a main element or role="main" elsewhere, and by the default main', async () => {
    await mounted(() => h('div', { role: 'main' }, h(AppShell, { main: false }, { default: () => 'Page' })))
    expect(errors).toEqual([])
    await remount(() => h(AppShell, null, { default: () => 'Page' }))
    expect(errors).toEqual([])
  })
  it('does nothing in off mode and only logs in warn mode', async () => {
    configureStrictMode('warn')
    const spy = quiet()
    await mounted(() => h(AppShell, { main: false }, { default: () => 'Page' }))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('AppShell: with `main` set to false'))
    spy.mockRestore()
    configureStrictMode('off')
    await remount(() => h(AppShell, { main: false }, { default: () => 'Page' }))
    expect(errors).toEqual([])
  })
})

describe('ResizablePanels', () => {
  const panel = (text: string) => h(ResizablePanel, null, () => text)
  const handle = (props: Record<string, unknown> = { 'aria-label': 'Resize sidebar' }) => h(ResizableHandle, props)
  const group = (children: VNodeChild[]) => () => h(ResizablePanels, null, () => children)

  it('throws when a handle comes first or last', async () => {
    await mounted(group([handle(), panel('A'), handle(), panel('B')]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ResizablePanels: starts with a ResizableHandle')
    await remount(group([panel('A'), handle(), panel('B'), handle()]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ends with a ResizableHandle')
  })
  it('throws when two handles or two panels follow each other', async () => {
    await mounted(group([panel('A'), handle(), handle(), panel('B')]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('two ResizableHandles in a row')
    expect(errors[0].message).toContain('alternate ResizablePanel, ResizableHandle')
    await remount(group([panel('A'), panel('B')]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('two ResizablePanels in a row')
  })
  it('throws when it has no children', async () => {
    await mounted(group([]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ResizablePanels: requires ResizablePanel children')
  })
  it('accepts alternating panels and handles, in any count', async () => {
    await mounted(group([panel('A'), handle(), panel('B'), handle({ label: 'Resize B and C' }), panel('C')]))
    expect(errors).toEqual([])
    await remount(group([panel('Only')]))
    expect(errors).toEqual([])
  })
  it('throws when a handle has no name', async () => {
    await mounted(group([panel('A'), handle({}), panel('B')]))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ResizableHandle: requires `label` or `aria-label` or `aria-labelledby`')
  })
  it('accepts a handle named by label, aria-label or aria-labelledby', async () => {
    await mounted(() => [
      h('span', { id: 'rh-name' }, 'Sidebar width'),
      h(ResizablePanels, null, () => [panel('A'), handle({ label: 'Resize A and B' }), panel('B'), handle({ 'aria-label': 'Resize B and C' }), panel('C'), handle({ 'aria-labelledby': 'rh-name' }), panel('D')]),
    ])
    expect(errors).toEqual([])
    expect(document.querySelectorAll('[role=separator]')[0].getAttribute('aria-label')).toBe('Resize A and B')
  })
  it('throws for a panel or a handle outside ResizablePanels', async () => {
    await mounted(() => [panel('Loose'), handle()])
    expect(errors).toHaveLength(2)
    expect(errors[0].message).toContain('ResizablePanel: must be a child of ResizablePanels')
    expect(errors[1].message).toContain('ResizableHandle: must be placed between two ResizablePanel')
  })
  it('does nothing in off mode and only logs in warn mode', async () => {
    configureStrictMode('warn')
    const spy = quiet()
    await mounted(group([panel('A'), panel('B')]))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('two ResizablePanels in a row'))
    spy.mockRestore()
    configureStrictMode('off')
    await remount(group([panel('A'), panel('B')]))
    expect(errors).toEqual([])
  })
})

describe('Affix', () => {
  it('throws when `root` is a selector that matches nothing', async () => {
    await mounted(() => h(Affix, { root: '#missing-scroller' }, () => 'Pinned'))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Affix: has `root` "#missing-scroller" but no element in the page matches it')
  })
  it('throws for an invalid selector', async () => {
    await mounted(() => h(Affix, { root: '#[' }, () => 'Pinned'))
    expect(errors).toHaveLength(1)
  })
  it('is satisfied by an existing container, an element, no root, or a disabled affix', async () => {
    await mounted(() => [
      h('div', { id: 'scroller' }),
      h(Affix, { root: '#scroller' }, () => 'Pinned'),
      h(Affix, { root: document.body }, () => 'Pinned'),
      h(Affix, null, () => 'Pinned'),
      h(Affix, { root: '#missing-scroller', disabled: true }, () => 'Pinned'),
    ])
    expect(errors).toEqual([])
  })
  it('does nothing in off mode and only logs in warn mode', async () => {
    configureStrictMode('warn')
    const spy = quiet()
    await mounted(() => h(Affix, { root: '#missing' }, () => 'Pinned'))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Affix: has `root`'))
    spy.mockRestore()
    configureStrictMode('off')
    await remount(() => h(Affix, { root: '#missing' }, () => 'Pinned'))
    expect(errors).toEqual([])
  })
})

describe('InfiniteScroll', () => {
  it('throws when nothing listens for `load`', async () => {
    await mounted(() => h(InfiniteScroll, null, () => 'Items'))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('InfiniteScroll: requires an `@load` handler')
  })
  it('is satisfied by a load listener, or when there is nothing left to load', async () => {
    await mounted(() => [h(InfiniteScroll, { onLoad: () => {} }, () => 'Items'), h(InfiniteScroll, { finished: true }, () => 'Items')])
    expect(errors).toEqual([])
  })
  it('throws when `root` is a selector that matches nothing', async () => {
    await mounted(() => h(InfiniteScroll, { root: '#missing-feed', onLoad: () => {} }, () => 'Items'))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('InfiniteScroll: has `root` "#missing-feed"')
    await remount(() => [h('div', { id: 'feed' }), h(InfiniteScroll, { root: '#feed', onLoad: () => {} }, () => 'Items')])
    expect(errors).toEqual([])
  })
  it('does nothing in off mode and only logs in warn mode', async () => {
    configureStrictMode('warn')
    const spy = quiet()
    await mounted(() => h(InfiniteScroll, null, () => 'Items'))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('InfiniteScroll: requires an `@load` handler'))
    spy.mockRestore()
    configureStrictMode('off')
    await remount(() => h(InfiniteScroll, null, () => 'Items'))
    expect(errors).toEqual([])
  })
})

describe('CenteredLayout', () => {
  it('throws when layout="split" has no illustration slot', async () => {
    await mounted(() => h(CenteredLayout, { layout: 'split' }, () => 'Form'))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('CenteredLayout: with `layout="split"` requires an `illustration` slot')
  })
  it('is satisfied by the slot, and the other layouts need none', async () => {
    await mounted(() => h(CenteredLayout, { layout: 'split' }, { default: () => 'Form', illustration: () => 'Picture' }))
    expect(errors).toEqual([])
    await remount(() => [h(CenteredLayout, null, () => 'Form'), h(CenteredLayout, { layout: 'card' }, () => 'Form')])
    expect(errors).toEqual([])
  })
  it('does nothing in off mode and only logs in warn mode', async () => {
    configureStrictMode('warn')
    const spy = quiet()
    await mounted(() => h(CenteredLayout, { layout: 'split' }, () => 'Form'))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('CenteredLayout: with `layout="split"`'))
    spy.mockRestore()
    configureStrictMode('off')
    await remount(() => h(CenteredLayout, { layout: 'split' }, () => 'Form'))
    expect(errors).toEqual([])
  })
})
