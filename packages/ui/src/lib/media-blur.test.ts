import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import ConfigProvider from '../components/layout/ConfigProvider/ConfigProvider.vue'
import { mediaBlurChildrenClass, mediaBlurClass, mediaBlurSoftClass, MEDIA_BLUR, MEDIA_BLUR_CHILDREN, MEDIA_BLUR_SOFT, useMediaBlur, useMediaBlurToggle } from './media-blur'

const noBackdrop = (c: string) => expect(c).not.toMatch(/backdrop-blur|blur-(2xl|3xl)/)
const motionSafeOnly = (c: string) => {
  for (const cls of c.split(/\s+/).filter((x) => x.includes('transition'))) expect(cls, cls).toMatch(/motion-safe:/)
}

describe('class helpers', () => {
  it('return nothing when not blurred and not toggling (default output unchanged)', () => {
    expect(mediaBlurClass(false)).toBeUndefined()
    expect(mediaBlurSoftClass(false)).toBeUndefined()
    expect(mediaBlurChildrenClass(false)).toBeUndefined()
  })
  it('blurred classes are a filter blur with a motion-safe transition only', () => {
    for (const c of [MEDIA_BLUR, MEDIA_BLUR_SOFT, MEDIA_BLUR_CHILDREN]) {
      expect(c).toContain('blur-md')
      noBackdrop(c)
      motionSafeOnly(c)
    }
    expect(mediaBlurClass(true)).toBe(MEDIA_BLUR)
    expect(MEDIA_BLUR).toContain('scale-105')
    expect(MEDIA_BLUR_CHILDREN).toContain('overflow-hidden')
  })
  it('a toggling component keeps a motion-safe transition while revealed', () => {
    for (const c of [mediaBlurClass(false, true), mediaBlurSoftClass(false, true), mediaBlurChildrenClass(false, true)]) {
      expect(c).toBeTruthy()
      expect(c).not.toMatch(/(^|\s)(?!\[&>\*\]:)transition/)
      motionSafeOnly(c!)
    }
  })
})

function resolve(own: boolean | undefined, provider: boolean | undefined) {
  let seen: boolean | undefined
  const Probe = defineComponent({
    setup() {
      const b = useMediaBlur(() => own)
      return () => ((seen = b.value), h('i'))
    },
  })
  mount(provider === undefined ? Probe : { render: () => h(ConfigProvider, { blurMedia: provider }, () => h(Probe)) })
  return seen
}

describe('useMediaBlur', () => {
  it.each([
    [undefined, undefined, false],
    [undefined, true, true],
    [undefined, false, false],
    [true, undefined, true],
    [true, false, true],
    [false, true, false],
    [false, undefined, false],
  ])('own %s, provider %s -> %s', (own, provider, expected) => {
    expect(resolve(own, provider)).toBe(expected)
  })

  it('an inner provider overrides an outer one; an unset inner inherits', () => {
    let seen: boolean[] = []
    const Probe = defineComponent({ setup: () => { const b = useMediaBlur(() => undefined); return () => (seen.push(b.value), h('i')) } })
    mount({ render: () => h(ConfigProvider, { blurMedia: true }, () => [h(ConfigProvider, { blurMedia: false }, () => h(Probe)), h(ConfigProvider, {}, () => h(Probe))]) })
    expect(seen).toEqual([false, true])
  })
})

describe('useMediaBlurToggle', () => {
  function make(blurred: () => boolean | undefined, dflt: boolean | undefined) {
    const emitted: boolean[] = []
    let api!: ReturnType<typeof useMediaBlurToggle>
    mount(defineComponent({ setup() { api = useMediaBlurToggle(blurred, () => dflt, (v) => emitted.push(v)); return () => h('i') } }))
    return { api, emitted }
  }
  it('uncontrolled: starts from defaultBlurred, toggles and emits', () => {
    const { api, emitted } = make(() => undefined, true)
    expect(api.blurred.value).toBe(true)
    api.toggle()
    expect(api.blurred.value).toBe(false)
    expect(api.hideable.value).toBe(true)
    api.toggle()
    expect(api.blurred.value).toBe(true)
    expect(emitted).toEqual([false, true])
  })
  it('controlled: emits but the parent value stays the truth', () => {
    const value = ref<boolean | undefined>(true)
    const { api, emitted } = make(() => value.value, undefined)
    api.toggle()
    expect(emitted).toEqual([false])
    expect(api.blurred.value).toBe(true)
    value.value = false
    expect(api.blurred.value).toBe(false)
  })
  it('never blurred: nothing to hide', () => {
    expect(make(() => undefined, undefined).api.hideable.value).toBe(false)
  })
})
