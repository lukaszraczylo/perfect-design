import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createSSRApp } from 'vue'
import { useDirection, useLocale } from 'reka-ui'
import ConfigProvider from './ConfigProvider.vue'
import * as barrel from './index'
import * as layoutBarrel from '../index'
import { mergeConfig, sanitizeConfig, useConfig, useConfigLabels, type ConfigInput, type ResolvedConfig } from './config'

let wrapper: VueWrapper | undefined
/** The provider's own element: the root of the component is reka-ui's provider, which renders only a fragment. */
const host = (w: VueWrapper | undefined = wrapper) => w!.find('[data-slot="config-provider"]')
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

/** Mounts `inner` inside a ConfigProvider and returns what `useConfig()` sees there. */
function probe(props: Record<string, unknown> = {}) {
  let seen!: ReturnType<typeof useConfig>
  const Probe = defineComponent({
    setup() {
      seen = useConfig()
      return () => h('i', { 'data-probe': '' })
    },
  })
  wrapper = mount(ConfigProvider, { props, slots: { default: () => h(Probe) } })
  return { config: () => seen.value, wrapper }
}

describe('ConfigProvider', () => {
  describe('good path', () => {
    it('renders a div with data-slot, children and no attributes by default', () => {
      wrapper = mount(ConfigProvider, { slots: { default: 'Inside' } })
      expect(host().element.tagName).toBe('DIV')
      expect(host().attributes('data-slot')).toBe('config-provider')
      expect(host().text()).toBe('Inside')
      for (const a of ['dir', 'lang', 'data-reduced-motion', 'data-size', 'data-density', 'class']) expect(host().attributes(a), a).toBeUndefined()
    })
    it('sets dir and lang on the wrapper', () => {
      wrapper = mount(ConfigProvider, { props: { dir: 'rtl', locale: 'ar' } })
      expect(host().attributes('dir')).toBe('rtl')
      expect(host().attributes('lang')).toBe('ar')
    })
    it('exposes every value through useConfig()', () => {
      const { config } = probe({ dir: 'auto', locale: 'de-DE', timeZone: 'Europe/Berlin', reducedMotion: 'reduce', size: 'sm', density: 'compact', labels: { 'pagination.next': 'Weiter' } })
      expect(config()).toMatchObject({ dir: 'auto', locale: 'de-DE', timeZone: 'Europe/Berlin', reducedMotion: 'reduce', size: 'sm', density: 'compact' })
      expect(config().labels['pagination.next']).toBe('Weiter')
    })
    it('exports the component, the composables and the types from its index and the layout barrel', () => {
      expect(barrel.ConfigProvider).toBe(ConfigProvider)
      expect(barrel.useConfig).toBe(useConfig)
      expect(barrel.useConfigLabels).toBe(useConfigLabels)
      expect(layoutBarrel.ConfigProvider).toBe(ConfigProvider)
      expect(layoutBarrel.useConfig).toBe(useConfig)
    })
    it('passes direction and locale to the headless primitives', () => {
      let dir = ''
      let locale = ''
      const Reader = defineComponent({
        setup() {
          const d = useDirection()
          const l = useLocale()
          return () => {
            dir = d.value
            locale = l.value
            return h('i')
          }
        },
      })
      wrapper = mount(ConfigProvider, { props: { dir: 'rtl', locale: 'he' }, slots: { default: () => h(Reader) } })
      expect([dir, locale]).toEqual(['rtl', 'he'])
    })
    it('keeps the outer primitive direction when the inner provider sets none, and for `auto`', () => {
      const seen: string[] = []
      const Reader = defineComponent({
        setup() {
          const d = useDirection()
          return () => (seen.push(d.value), h('i'))
        },
      })
      wrapper = mount(ConfigProvider, { props: { dir: 'rtl' }, slots: { default: () => [h(ConfigProvider, null, () => h(Reader)), h(ConfigProvider, { dir: 'auto' }, () => h(Reader))] } })
      expect(seen).toEqual(['rtl', 'rtl'])
    })
    it('reads the primitives defaults (ltr, en) without any dir or locale', () => {
      const seen: string[] = []
      const Reader = defineComponent({
        setup() {
          const d = useDirection()
          const l = useLocale()
          return () => (seen.push(d.value, l.value), h('i'))
        },
      })
      wrapper = mount(ConfigProvider, { slots: { default: () => h(Reader) } })
      expect(seen).toEqual(['ltr', 'en'])
    })
  })

  describe('customisation', () => {
    it('class wins and is merged', () => {
      wrapper = mount(ConfigProvider, { props: { class: 'contents p-2' } })
      expect(host().classes()).toEqual(['contents', 'p-2'])
    })
    it('forwards attributes to the wrapper (the root is the reka provider, which renders no element)', () => {
      wrapper = mount(ConfigProvider, { attrs: { id: 'region', 'aria-label': 'Region', 'data-x': '1' } })
      expect(host().attributes('id')).toBe('region')
      expect(host().attributes('aria-label')).toBe('Region')
      expect(host().attributes('data-x')).toBe('1')
    })
    it('renders as another element', () => {
      wrapper = mount(ConfigProvider, { props: { as: 'section', dir: 'rtl' } })
      expect(host().element.tagName).toBe('SECTION')
      expect(host().attributes('dir')).toBe('rtl')
    })
    it('asChild renders no wrapper: the child receives dir, lang and the data hooks', () => {
      wrapper = mount(ConfigProvider, {
        props: { asChild: true, dir: 'rtl', locale: 'ar', reducedMotion: 'reduce', size: 'lg', density: 'compact', class: 'rounded' },
        slots: { default: () => h('main', { id: 'only' }, 'Child') },
      })
      expect(host().element.tagName).toBe('MAIN')
      expect(host().element.parentElement?.querySelector('[data-slot="config-provider"]')).toBe(host().element)
      expect(host().attributes()).toMatchObject({ id: 'only', dir: 'rtl', lang: 'ar', 'data-reduced-motion': 'reduce', 'data-size': 'lg', 'data-density': 'compact' })
      expect(host().classes()).toContain('rounded')
    })
    it('reducedMotion `user` adds no attribute, the overrides do', () => {
      expect(host(mount(ConfigProvider, { props: { reducedMotion: 'user' } })).attributes('data-reduced-motion')).toBeUndefined()
      expect(host(mount(ConfigProvider, { props: { reducedMotion: 'no-preference' } })).attributes('data-reduced-motion')).toBe('no-preference')
    })
  })

  describe('bad path', () => {
    it('ignores every invalid value: no attribute, no config', () => {
      const bad = { dir: 'sideways', locale: 'not a locale!', timeZone: 'Mars/Olympus', reducedMotion: 'sometimes', size: 'huge', density: 'tiny', labels: 'nope' }
      const { config, wrapper: w } = probe(bad)
      expect(config()).toMatchObject({ dir: undefined, locale: undefined, timeZone: undefined, reducedMotion: 'user', size: undefined, density: undefined })
      expect(Object.keys(config().labels)).toEqual([])
      for (const a of ['dir', 'lang', 'data-reduced-motion', 'data-size', 'data-density']) expect(host(w).attributes(a), a).toBeUndefined()
    })
    it.each([null, 5, true, {}, [], () => 'x', Symbol('s')])('non-string locale and time zone %# are ignored', (v) => {
      const { config } = probe({ locale: v, timeZone: v })
      expect(config().locale).toBeUndefined()
      expect(config().timeZone).toBeUndefined()
    })
    it.each(['', '   '])('blank locale and time zone %j are ignored', (v) => {
      const { config } = probe({ locale: v, timeZone: v })
      expect(config().locale).toBeUndefined()
      expect(config().timeZone).toBeUndefined()
    })
    it('drops non-string, blank and nested label values and keeps the valid ones', () => {
      const { config } = probe({
        labels: { 'pagination.next': 'Weiter', 'pagination.last': 5, 'pagination.first': '', 'pagination.page': '   ', 'datePicker.clear': null, 'datePicker.dialog': { x: 1 }, 'datePicker.required': ['a'], 'confirmDialog.cancel': () => 'x', 'confirmDialog.confirm': undefined },
      })
      expect({ ...config().labels }).toEqual({ 'pagination.next': 'Weiter' })
    })
    it.each([null, 'text', 42, ['pagination.next'], true])('a non-object labels value %j gives no labels', (labels) => {
      expect(Object.keys(probe({ labels }).config().labels)).toEqual([])
    })
    it('a hostile key cannot reach the prototype', () => {
      const labels = JSON.parse('{"__proto__": "x", "constructor": "y", "pagination.next": "ok"}') as Record<string, string>
      const { config } = probe({ labels })
      expect(({} as Record<string, unknown>).x).toBeUndefined()
      expect(Object.getPrototypeOf(config().labels)).toBeNull()
      expect(config().labels['pagination.next']).toBe('ok')
    })
    it('HTML in a label stays text in the config and is never parsed by the wrapper', () => {
      wrapper = mount(ConfigProvider, { props: { labels: { 'pagination.next': '<img src=x onerror=alert(1)>' } }, slots: { default: 'x' } })
      expect(host().find('img').exists()).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('empty slot renders an empty wrapper', () => {
      wrapper = mount(ConfigProvider)
      expect(host().text()).toBe('')
    })
    it('huge and unicode labels pass through unchanged', () => {
      const text = 'ä'.repeat(5000) + '😀 עברית'
      expect(probe({ labels: { 'pagination.nav': text } }).config().labels['pagination.nav']).toBe(text)
    })
    it('accepts the documented valid locale and time zone forms', () => {
      const { config } = probe({ locale: 'zh-Hant-TW', timeZone: 'UTC' })
      expect(config().locale).toBe('zh-Hant-TW')
      expect(config().timeZone).toBe('UTC')
    })
    it('updates reactively when props change', async () => {
      const dir = ref<'ltr' | 'rtl'>('ltr')
      const labels = ref<Record<string, string>>({ 'pagination.next': 'A' })
      let seen!: ReturnType<typeof useConfig>
      const Probe = defineComponent({ setup: () => ((seen = useConfig()), () => h('i')) })
      wrapper = mount(defineComponent({ setup: () => () => h(ConfigProvider, { dir: dir.value, labels: labels.value }, () => h(Probe)) }))
      expect([seen.value.dir, seen.value.labels['pagination.next']]).toEqual(['ltr', 'A'])
      dir.value = 'rtl'
      labels.value = { 'pagination.next': 'B' }
      await nextTick()
      expect([seen.value.dir, seen.value.labels['pagination.next']]).toEqual(['rtl', 'B'])
      expect(host().attributes('dir')).toBe('rtl')
    })
    it('renders on the server without touching window or document', async () => {
      const original = { window: globalThis.window, document: globalThis.document }
      const app = createSSRApp({ render: () => h(ConfigProvider, { dir: 'rtl', locale: 'ar', size: 'sm' }, () => 'Server') })
      const html = await renderToString(app)
      expect(html).toContain('dir="rtl"')
      expect(html).toContain('lang="ar"')
      expect(html).toContain('data-size="sm"')
      expect(html).toContain('Server')
      expect(globalThis.window).toBe(original.window)
    })
  })

  describe('nesting', () => {
    const nested = (outer: Record<string, unknown>, inner: Record<string, unknown>) => {
      let seen!: ReturnType<typeof useConfig>
      const Probe = defineComponent({ setup: () => ((seen = useConfig()), () => h('i')) })
      wrapper = mount(ConfigProvider, { props: outer, slots: { default: () => h(ConfigProvider, inner, () => h(Probe)) } })
      return () => seen.value
    }
    it('the inner provider overrides the outer one per key', () => {
      const config = nested({ dir: 'rtl', locale: 'ar', size: 'lg', density: 'compact', timeZone: 'UTC', reducedMotion: 'reduce' }, { locale: 'de-DE', size: 'sm' })
      expect(config()).toMatchObject({ dir: 'rtl', locale: 'de-DE', size: 'sm', density: 'compact', timeZone: 'UTC', reducedMotion: 'reduce' })
    })
    it('labels merge per key; the inner value wins', () => {
      const config = nested({ labels: { 'pagination.next': 'outer next', 'pagination.last': 'outer last' } }, { labels: { 'pagination.next': 'inner next', 'datePicker.clear': 'inner clear' } })
      expect({ ...config().labels }).toEqual({ 'pagination.next': 'inner next', 'pagination.last': 'outer last', 'datePicker.clear': 'inner clear' })
    })
    it('an invalid inner value falls back to the outer one, not to the default', () => {
      const config = nested({ locale: 'fr-FR', size: 'lg', labels: { 'pagination.nav': 'Pages' } }, { locale: '??', size: 'giant', labels: { 'pagination.nav': 5 } })
      expect(config()).toMatchObject({ locale: 'fr-FR', size: 'lg' })
      expect(config().labels['pagination.nav']).toBe('Pages')
    })
    it('an inner provider with no props changes nothing and the outer config is unchanged', () => {
      const config = nested({ dir: 'rtl', labels: { 'pagination.nav': 'Pages' } }, {})
      expect(config().dir).toBe('rtl')
      expect(config().labels['pagination.nav']).toBe('Pages')
    })
    it('the wrapper only sets attributes the provider itself was given', () => {
      wrapper = mount(ConfigProvider, { props: { dir: 'rtl', locale: 'ar' }, slots: { default: () => h(ConfigProvider, { size: 'sm' }) } })
      const inner = wrapper.find('[data-slot="config-provider"] [data-slot="config-provider"]')
      expect(inner.attributes('dir')).toBeUndefined()
      expect(inner.attributes('lang')).toBeUndefined()
      expect(inner.attributes('data-size')).toBe('sm')
    })
  })
})

describe('useConfig without a provider', () => {
  it('returns empty values and an English-neutral reduced-motion of `user`', () => {
    let seen!: ReturnType<typeof useConfig>
    wrapper = mount(defineComponent({ setup: () => ((seen = useConfig()), () => h('i')) }))
    expect(seen.value).toMatchObject({ dir: undefined, locale: undefined, timeZone: undefined, reducedMotion: 'user', size: undefined, density: undefined })
    expect(Object.keys(seen.value.labels)).toEqual([])
  })
  it('useConfigLabels returns the defaults untouched', () => {
    let seen!: ReturnType<typeof useConfigLabels<{ a: string; b: string }>>
    wrapper = mount(defineComponent({ setup: () => ((seen = useConfigLabels('x', { a: 'A', b: 'B' })), () => h('i')) }))
    expect(seen.value).toEqual({ a: 'A', b: 'B' })
  })
  it('useConfigLabels overlays only the keys the component declares', () => {
    let seen!: ReturnType<typeof useConfigLabels<{ a: string; b: string }>>
    const Reader = defineComponent({ setup: () => ((seen = useConfigLabels('x', { a: 'A', b: 'B' })), () => h('i')) })
    wrapper = mount(ConfigProvider, { props: { labels: { 'x.a': 'one', 'x.c': 'extra', 'y.b': 'other' } }, slots: { default: () => h(Reader) } })
    expect(seen.value).toEqual({ a: 'one', b: 'B' })
  })
  it('useConfigLabels reads plural category keys only for the names in plurals', () => {
    let seen!: ReturnType<typeof useConfigLabels<{ n: string; nOne: string; m: string }>>
    const Reader = defineComponent({ setup: () => ((seen = useConfigLabels('x', { n: '{count} items', nOne: '{count} item', m: 'M' }, ['n'])), () => h('i')) })
    wrapper = mount(ConfigProvider, { props: { labels: { 'x.nFew': '{count} few', 'x.nOne': 'one', 'x.mFew': 'ignored' } }, slots: { default: () => h(Reader) } })
    expect(seen.value).toEqual({ n: '{count} items', nOne: 'one', nFew: '{count} few', m: 'M' })
    wrapper.unmount()
    wrapper = mount(ConfigProvider, { props: { labels: { 'x.n': '{count} элементов' } }, slots: { default: () => h(Reader) } })
    expect(seen.value).toEqual({ n: '{count} элементов', m: 'M' })
  })
})

describe('sanitizeConfig and mergeConfig', () => {
  const base: ResolvedConfig = { dir: undefined, locale: undefined, timeZone: undefined, reducedMotion: 'user', size: undefined, density: undefined, labels: {} }
  const empty = (): ResolvedConfig => mergeConfig(base, undefined)
  it('sanitizeConfig of undefined is all undefined with empty labels', () => {
    expect(sanitizeConfig(undefined)).toMatchObject({ dir: undefined, locale: undefined, reducedMotion: undefined })
    expect(Object.keys(sanitizeConfig(undefined).labels)).toEqual([])
  })
  it('mergeConfig returns a frozen result', () => {
    const merged = mergeConfig(empty(), { dir: 'ltr', labels: { 'pagination.nav': 'x' } } as ConfigInput)
    expect(Object.isFrozen(merged)).toBe(true)
    expect(Object.isFrozen(merged.labels)).toBe(true)
    expect(merged.reducedMotion).toBe('user')
  })
  it('mergeConfig does not mutate its parent', () => {
    const parent = mergeConfig(empty(), { labels: { 'pagination.nav': 'parent' } })
    mergeConfig(parent, { labels: { 'pagination.nav': 'child' } })
    expect(parent.labels['pagination.nav']).toBe('parent')
  })
})
