import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import ConfigProvider from './ConfigProvider.vue'
import { mergeConfig, sanitizeConfig, useConfig } from './config'

describe('ConfigProvider blurMedia', () => {
  it('is undefined without a provider and by default', () => {
    let seen: boolean | undefined = true
    const Probe = defineComponent({ setup: () => { const c = useConfig(); return () => ((seen = c.value.blurMedia), h('i')) } })
    mount(Probe)
    expect(seen).toBeUndefined()
    mount({ render: () => h(ConfigProvider, {}, () => h(Probe)) })
    expect(seen).toBeUndefined()
  })

  it('exposes the value to descendants; inner overrides outer; unset inherits', () => {
    const seen: (boolean | undefined)[] = []
    const Probe = defineComponent({ setup: () => { const c = useConfig(); return () => (seen.push(c.value.blurMedia), h('i')) } })
    mount({ render: () => h(ConfigProvider, { blurMedia: true }, () => [h(Probe), h(ConfigProvider, { blurMedia: false }, () => h(Probe)), h(ConfigProvider, {}, () => h(Probe))]) })
    expect(seen).toEqual([true, false, true])
  })

  it('ignores non-boolean values', () => {
    expect(sanitizeConfig({ blurMedia: 'yes' as unknown as boolean }).blurMedia).toBeUndefined()
    expect(mergeConfig(mergeConfig(sanitizeMerge(), { blurMedia: true }), { blurMedia: 1 as unknown as boolean }).blurMedia).toBe(true)
  })

  it('reactively follows the prop', async () => {
    const Host = defineComponent({ props: { on: { type: Boolean, default: false } }, setup: (p) => () => h(ConfigProvider, { blurMedia: p.on }, () => h('span')) })
    const w = mount(Host, { props: { on: false } })
    expect(w.find('[data-slot="config-provider"]').attributes('data-blur-media')).toBeUndefined()
    await w.setProps({ on: true })
    expect(w.find('[data-slot="config-provider"]').attributes('data-blur-media')).toBe('')
  })
})

function sanitizeMerge() {
  return mergeConfig({ dir: undefined, locale: undefined, timeZone: undefined, reducedMotion: 'user', size: undefined, density: undefined, labels: {}, blurMedia: undefined }, {})
}
