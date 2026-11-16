import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Markdown from './Markdown.vue'

afterEach(() => (document.body.innerHTML = ''))

describe('Markdown headings event timing', () => {
  it('emits after mount (the heading is already in the DOM), not during setup', () => {
    const seen: boolean[] = []
    mount(Markdown, { props: { source: '# Title', onHeadings: () => seen.push(!!document.querySelector('h1')) }, attachTo: document.body })
    expect(seen).toEqual([true])
  })

  it('still emits again when the source changes', async () => {
    const calls: number[] = []
    const w = mount(Markdown, { props: { source: '# A', onHeadings: (h: unknown[]) => calls.push(h.length) }, attachTo: document.body })
    await w.setProps({ source: '# A\n\n## B' })
    await nextTick()
    expect(calls).toEqual([1, 2])
  })
})
