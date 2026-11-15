import { describe, expect, it, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { ContractError, configureStrictMode } from '../../../lib/contract'
import { FormattedNumber, formatNumber, formattedNumberVariants } from './index'
import * as barrel from '../index'

const mountNum = (props: Record<string, unknown>, extra: Record<string, unknown> = {}) => mount(FormattedNumber, { props: props as never, ...extra })
const text = (props: Record<string, unknown>) => mountNum(props).text()

describe('FormattedNumber', () => {
  describe('good path', () => {
    it('renders a span root with data-slot and a bdi value', () => {
      const w = mountNum({ value: 1234.5 })
      expect(w.element.tagName).toBe('SPAN')
      expect(w.attributes('data-slot')).toBe('formatted-number')
      expect(w.find('bdi').attributes('data-slot')).toBe('formatted-number-value')
      expect(w.text()).toBe('1,234.5')
    })
    it('default classes: nowrap and tabular figures', () => {
      expect(mountNum({ value: 1 }).classes()).toEqual(['whitespace-nowrap', 'tabular-nums'])
    })
    it.each([
      [{ format: 'percent', value: 0.5 }, '50%'],
      [{ format: 'currency', currency: 'USD', value: 5 }, '$5.00'],
      [{ format: 'compact', value: 1500 }, '1.5K'],
      [{ format: 'decimal', value: 1500 }, '1,500'],
      [{ format: 'unit', unit: 'kilometer', value: 5 }, '5 km'],
    ])('%j renders %s', (props, out) => expect(text(props)).toBe(out))
    it('passes notation, digits, sign and locale through', () => {
      expect(text({ value: 1234567, notation: 'compact', maximumFractionDigits: 2 })).toBe('1.23M')
      expect(text({ value: 3, minimumFractionDigits: 2, signDisplay: 'always' })).toBe('+3.00')
      expect(text({ value: 1234.5, locale: 'de-DE' })).toBe('1.234,5')
    })
    it('formats bigint and numeric strings', () => {
      expect(text({ value: 12345678901234567890n })).toBe('12,345,678,901,234,567,890')
      expect(text({ value: '1e3' })).toBe('1,000')
    })
    it('updates when the value changes', async () => {
      const w = mountNum({ value: 1 })
      await w.setProps({ value: 2000 })
      expect(w.text()).toBe('2,000')
    })
    it('matches formatNumber exactly', () => {
      expect(text({ value: 0.256, format: 'percent', maximumFractionDigits: 1 })).toBe(formatNumber(0.256, { style: 'percent', maximumFractionDigits: 1 }))
    })
  })

  describe('the style naming', () => {
    const Host = defineComponent({
      components: { FormattedNumber },
      props: { s: { type: String, default: 'percent' } },
      template: `<div><FormattedNumber :value="0.25" :style="s" /></div>`,
    })
    it('a dynamic :style string naming a format works as an alias and is not an inline style', () => {
      const el = mount(Host).find('[data-slot=formatted-number]')
      expect(el.text()).toBe('25%')
      expect(el.attributes('style')).toBeUndefined()
    })
    it('the format prop wins over the alias', () => {
      const w = mount(FormattedNumber, { props: { value: 0.25, format: 'decimal' }, attrs: { style: 'percent' } })
      expect(w.text()).toBe('0.25')
    })
    it('a real inline style object still reaches the root', () => {
      const w = mount(FormattedNumber, { props: { value: 1 }, attrs: { style: 'color: red' } })
      expect(w.attributes('style')).toContain('color: red')
      expect(w.text()).toBe('1')
    })
    it('a static style="percent" in a template is compiled to an empty style (documented trap)', () => {
      const T = defineComponent({ components: { FormattedNumber }, template: `<FormattedNumber :value="0.25" style="percent" />` })
      expect(mount(T).text()).toBe('0.25')
    })
    it('style is not a declared prop', () => {
      expect(Object.keys((FormattedNumber as unknown as { props: object }).props)).not.toContain('style')
      expect(Object.keys((FormattedNumber as unknown as { props: object }).props)).toContain('format')
    })
  })

  describe('customisation', () => {
    it('class wins over internal classes', () => {
      const c = mountNum({ value: 1, class: 'whitespace-normal font-black' }).classes()
      expect(c).toContain('whitespace-normal')
      expect(c).not.toContain('whitespace-nowrap')
      expect(c).toContain('font-black')
    })
    it('attributes fall through to the root', () => {
      const w = mountNum({ value: 1 }, { attrs: { id: 'n1', 'aria-label': 'Total', 'data-x': 'y' } })
      expect(w.attributes('id')).toBe('n1')
      expect(w.attributes('aria-label')).toBe('Total')
      expect(w.attributes('data-x')).toBe('y')
    })
    it('listeners fall through', async () => {
      let n = 0
      const w = mountNum({ value: 1 }, { attrs: { onClick: () => n++ } })
      await w.trigger('click')
      expect(n).toBe(1)
    })
    it('as swaps the root element', () => {
      expect(mountNum({ value: 1, as: 'strong' }).element.tagName).toBe('STRONG')
      expect(mountNum({ value: 1, as: 'div' }).element.tagName).toBe('DIV')
    })
    it('isolate false renders bare text', () => {
      const w = mountNum({ value: 1, isolate: false })
      expect(w.find('bdi').exists()).toBe(false)
      expect(w.text()).toBe('1')
    })
    it('tabular false drops tabular-nums', () => expect(mountNum({ value: 1, tabular: false }).classes()).not.toContain('tabular-nums'))
  })

  describe('invalid and hostile input', () => {
    it.each([NaN, Infinity, -Infinity, '', ' ', 'abc', '1e999', '9'.repeat(400)])('%s renders the fallback', (value) => {
      const w = mountNum({ value })
      expect(w.text()).toBe('n/a')
      expect(w.attributes('data-invalid')).toBe('true')
    })
    it('valid values have no data-invalid', () => expect(mountNum({ value: 1 }).attributes('data-invalid')).toBeUndefined())
    it('custom and empty fallback', () => {
      expect(text({ value: NaN, fallback: 'No data' })).toBe('No data')
      expect(text({ value: NaN, fallback: '' })).toBe('')
    })
    it('does not colour an invalid value even with a status tone', () => {
      const c = mountNum({ value: NaN, tone: 'negative' }).classes()
      expect(c).not.toContain('text-destructive')
    })
    it('escapes hostile fallback text', () => {
      const w = mountNum({ value: NaN, fallback: '<img src=x onerror=alert(1)>' })
      expect(w.find('img').exists()).toBe(false)
      expect(w.text()).toBe('<img src=x onerror=alert(1)>')
    })
    it('a huge number does not throw', () => expect(text({ value: Number.MAX_VALUE })).toMatch(/^179,769/))
    it('a huge fraction digit request is clamped', () => expect(text({ value: 1, minimumFractionDigits: 1e9 })).toBe('1.' + '0'.repeat(20)))
    it('bad locale, bad currency and missing unit never throw', () => {
      expect(text({ value: 5, locale: 'not_a_locale', format: 'currency', currency: 'XX' })).toBe('5')
      expect(text({ value: 5, format: 'unit' })).toBe('5')
    })
    it('unknown variant, size, tone and weight fall back', () => {
      const d = mountNum({ value: 1 }).classes()
      expect(mountNum({ value: 1, variant: 'zzz', size: 'zzz', tone: 'zzz', weight: 'zzz' }).classes()).toEqual(d)
    })
  })

  describe('right to left', () => {
    it('Arabic locale uses Arabic digits inside a bdi', () => {
      const w = mountNum({ value: -1234.5, locale: 'ar-EG' })
      expect(w.find('bdi').text()).toMatch(/[٠-٩]/)
      expect(w.text()).not.toMatch(/[0-9]/)
    })
    it('keeps the bdi inside an rtl parent', () => {
      const Host = defineComponent({ render: () => h('p', { dir: 'rtl' }, [h(FormattedNumber, { value: 5, locale: 'ar' })]) })
      const w = mount(Host)
      expect(w.find('p > span > bdi').exists()).toBe(true)
    })
    it('uses no physical left/right classes', () => {
      expect(mountNum({ value: 1, variant: 'outline' }).classes().join(' ')).not.toMatch(/\b(?:ml|mr|pl|pr|left|right)-/)
    })
  })

  describe('contract (strict mode)', () => {
    beforeEach(() => configureStrictMode('throw'))
    afterEach(() => configureStrictMode('off'))

    const settle = async () => {
      for (let i = 0; i < 4; i++) await Promise.resolve()
      await nextTick()
      await nextTick()
    }
    async function errorsFor(props: Record<string, unknown>) {
      const errors: Error[] = []
      const Wrapper = defineComponent({
        setup() {
          onErrorCaptured((e) => {
            errors.push(e as Error)
            return false
          })
          return () => h(FormattedNumber, props as never)
        },
      })
      const w = mount(Wrapper)
      await settle()
      w.unmount()
      return errors
    }

    it('throws a ContractError for format currency without currency', async () => {
      const [e] = await errorsFor({ value: 1, format: 'currency' })
      expect(e).toBeInstanceOf(ContractError)
      expect(e.message).toContain('FormattedNumber')
      expect(e.message).toContain('requires `currency`')
      expect((e as ContractError).rule).toBe('requires-currency')
    })
    it('throws for a blank currency', async () => {
      expect((await errorsFor({ value: 1, format: 'currency', currency: '   ' })).length).toBe(1)
    })
    it('throws a ContractError for format unit without unit', async () => {
      const [e] = await errorsFor({ value: 1, format: 'unit' })
      expect(e).toBeInstanceOf(ContractError)
      expect(e.message).toContain('requires `unit`')
    })
    it('also catches the :style alias', async () => {
      const Host = defineComponent({ components: { FormattedNumber }, template: `<FormattedNumber :value="1" :style="'currency'" />` })
      const errors: Error[] = []
      const Wrapper = defineComponent({
        setup() {
          onErrorCaptured((e) => {
            errors.push(e as Error)
            return false
          })
          return () => h(Host)
        },
      })
      mount(Wrapper)
      await settle()
      expect(errors.length).toBe(1)
    })
    it.each([
      { value: 1, format: 'currency', currency: 'EUR' },
      { value: 1, format: 'currency', currency: 'nonsense' },
      { value: 1, format: 'unit', unit: 'kilometer' },
      { value: 1, format: 'unit', unit: 'parsec' },
      { value: 1, format: 'percent' },
      { value: NaN },
      { value: 1 },
    ])('does not throw for %j', async (props) => expect(await errorsFor(props)).toEqual([]))
    it('does not throw when strict mode is off', async () => {
      configureStrictMode('off')
      expect(await errorsFor({ value: 1, format: 'currency' })).toEqual([])
    })
    it('only logs in warn mode', async () => {
      configureStrictMode('warn')
      const spy = (await import('vitest')).vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(await errorsFor({ value: 1, format: 'unit' })).toEqual([])
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('requires `unit`'))
      spy.mockRestore()
    })
  })

  describe('exports', () => {
    it('is exported from the typography barrel with its helpers', () => {
      expect(barrel.FormattedNumber).toBe(FormattedNumber)
      expect(barrel.formatNumber).toBe(formatNumber)
      expect(barrel.formattedNumberVariants).toBe(formattedNumberVariants)
    })
  })
})
