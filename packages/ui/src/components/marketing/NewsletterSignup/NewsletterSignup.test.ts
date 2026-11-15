import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import NewsletterSignup from './NewsletterSignup.vue'
import { newsletterSignupVariants } from './variants'

afterEach(() => vi.restoreAllMocks())

async function submit(w: VueWrapper, value?: string) {
  if (value !== undefined) await w.find('input').setValue(value)
  await w.find('form').trigger('submit')
}
const subscribed = (w: VueWrapper) => (w.emitted('subscribe') ?? []).map((e) => e[0])

describe('NewsletterSignup', () => {
  describe('good path', () => {
    it('renders title, description, input and button', () => {
      const w = mount(NewsletterSignup, { props: { title: 'Stay in the loop', description: 'Monthly, no spam.' } })
      expect(w.attributes('data-slot')).toBe('newsletter-signup')
      expect(w.find('h2').text()).toBe('Stay in the loop')
      expect(w.find('[data-slot="newsletter-signup-description"]').text()).toBe('Monthly, no spam.')
      const input = w.find('input')
      expect(input.attributes('type')).toBe('email')
      expect(input.attributes('placeholder')).toBe('Enter your email')
      expect(input.attributes('autocomplete')).toBe('email')
      expect(w.find('button').text()).toBe('Subscribe')
      expect(w.find('button').attributes('type')).toBe('submit')
    })
    it('input has an accessible label; form is named by the title', () => {
      const w = mount(NewsletterSignup, { props: { title: 'T', label: 'Your email' } })
      const label = w.find('label')
      expect(label.text()).toBe('Your email')
      expect(label.attributes('for')).toBe(w.find('input').attributes('id'))
      expect(w.find('form').attributes('aria-labelledby')).toBe(w.find('h2').attributes('id'))
    })
    it('uses custom placeholder and button label', () => {
      const w = mount(NewsletterSignup, { props: { placeholder: 'you@work.com', buttonLabel: 'Join' } })
      expect(w.find('input').attributes('placeholder')).toBe('you@work.com')
      expect(w.find('button').text()).toBe('Join')
    })
    it('emits subscribe with the trimmed email on valid submit', async () => {
      const w = mount(NewsletterSignup)
      await submit(w, '  jane@example.com  ')
      expect(subscribed(w)).toEqual(['jane@example.com'])
      expect(w.find('[data-slot="newsletter-signup-error"]').exists()).toBe(false)
      expect(w.find('input').attributes('aria-invalid')).toBeUndefined()
    })
    it('submits via the button click path (form submit)', async () => {
      const w = mount(NewsletterSignup, { attachTo: document.body })
      await w.find('input').setValue('a@b.co')
      await w.find('form').trigger('submit')
      expect(subscribed(w)).toEqual(['a@b.co'])
      w.unmount()
    })
    it.each([
      ['inline', 'sm:flex-row'],
      ['stacked', 'flex-col'],
      ['card', 'flex-col'],
    ] as const)('variant %s', (variant, formCls) => {
      const w = mount(NewsletterSignup, { props: { variant } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.find('form').classes()).toContain(formCls)
    })
    it('variant specific root styling', () => {
      expect(mount(NewsletterSignup, { props: { variant: 'card' } }).classes()).toEqual(expect.arrayContaining(['border', 'bg-card']))
      expect(mount(NewsletterSignup, { props: { variant: 'stacked' } }).classes()).toEqual(expect.arrayContaining(['text-center', 'max-w-md']))
      expect(mount(NewsletterSignup, { props: { variant: 'inline' } }).classes()).not.toContain('border')
      expect(newsletterSignupVariants({ variant: 'card' })).toContain('bg-card')
    })
    it('title and description slots override props', () => {
      const w = mount(NewsletterSignup, { slots: { title: 'Slot <em>title</em>', description: 'Slot desc' } })
      expect(w.find('h2 em').exists()).toBe(true)
      expect(w.find('[data-slot="newsletter-signup-description"]').text()).toBe('Slot desc')
      expect(w.find('form').attributes('aria-labelledby')).toBeTruthy()
    })
    it('level changes the heading element', () => {
      expect(mount(NewsletterSignup, { props: { title: 'T', level: 4 } }).find('h4').exists()).toBe(true)
    })
  })

  describe('validation', () => {
    it.each(['', '   ', 'plain', 'a@b', '@b.com', 'a@.com x', 'a b@c.com', 'a@b@c.com', 'a@b.', `${'x'.repeat(250)}@b.co`])('rejects %j without emitting', async (bad) => {
      const w = mount(NewsletterSignup)
      await submit(w, bad)
      expect(subscribed(w)).toEqual([])
      const input = w.find('input')
      expect(input.attributes('aria-invalid')).toBe('true')
      const err = w.find('[data-slot="newsletter-signup-error"]')
      expect(err.attributes('role')).toBe('alert')
      expect(err.text()).toBe('Enter a valid email address.')
      expect(input.attributes('aria-describedby')).toBe(err.attributes('id'))
    })
    it.each(['a@b.co', 'first.last+tag@sub.example.org', 'ünï@exämple.de', '用户@例子.广告'])('accepts %j', async (ok) => {
      const w = mount(NewsletterSignup)
      await submit(w, ok)
      expect(subscribed(w)).toEqual([ok])
    })
    it('custom invalidMessage', async () => {
      const w = mount(NewsletterSignup, { props: { invalidMessage: 'Nope' } })
      await submit(w, 'x')
      expect(w.find('[data-slot="newsletter-signup-error"]').text()).toBe('Nope')
    })
    it('clears the validation error once the input becomes valid, keeps it while invalid', async () => {
      const w = mount(NewsletterSignup)
      await submit(w, 'bad')
      await w.find('input').setValue('still-bad')
      expect(w.find('input').attributes('aria-invalid')).toBe('true')
      await w.find('input').setValue('ok@example.com')
      expect(w.find('input').attributes('aria-invalid')).toBeUndefined()
      expect(w.find('[data-slot="newsletter-signup-error"]').exists()).toBe(false)
      expect(w.find('input').attributes('aria-describedby')).toBeUndefined()
    })
    it('a valid resubmit after an invalid one emits and clears the error', async () => {
      const w = mount(NewsletterSignup)
      await submit(w, 'bad')
      await submit(w, 'good@example.com')
      expect(subscribed(w)).toEqual(['good@example.com'])
      expect(w.find('[data-slot="newsletter-signup-error"]').exists()).toBe(false)
    })
  })

  describe('status (controlled)', () => {
    it('idle: nothing shown, button enabled', () => {
      const w = mount(NewsletterSignup, { props: { status: 'idle' } })
      expect(w.find('button').attributes('disabled')).toBeUndefined()
      expect(w.find('[data-slot="newsletter-signup-status"]').text()).toBe('')
      expect(w.find('[data-slot="newsletter-signup-error"]').exists()).toBe(false)
      expect(w.attributes('data-status')).toBe('idle')
    })
    it('loading: button disabled + aria-busy, input readonly, no emit', async () => {
      const w = mount(NewsletterSignup, { props: { status: 'loading' } })
      const btn = w.find('button')
      expect(btn.attributes('disabled')).toBeDefined()
      expect(btn.attributes('aria-busy')).toBe('true')
      expect(w.find('form').attributes('aria-busy')).toBe('true')
      expect(w.find('input').attributes('readonly')).toBeDefined()
      await submit(w, 'a@b.co')
      expect(subscribed(w)).toEqual([])
      await w.find('button').trigger('click')
      expect(subscribed(w)).toEqual([])
    })
    it('success: shows polite status message', () => {
      const w = mount(NewsletterSignup, { props: { status: 'success', successMessage: 'Welcome!' } })
      const s = w.find('[data-slot="newsletter-signup-status"]')
      expect(s.attributes('role')).toBe('status')
      expect(s.text()).toBe('Welcome!')
    })
    it('success: default message', () => {
      expect(mount(NewsletterSignup, { props: { status: 'success' } }).find('[data-slot="newsletter-signup-status"]').text()).toBe('Thanks for subscribing!')
    })
    it('error: shows role=alert with errorMessage, linked to the input, input not marked invalid', () => {
      const w = mount(NewsletterSignup, { props: { status: 'error', errorMessage: 'Server said no' } })
      const err = w.find('[data-slot="newsletter-signup-error"]')
      expect(err.attributes('role')).toBe('alert')
      expect(err.text()).toBe('Server said no')
      expect(w.find('input').attributes('aria-describedby')).toBe(err.attributes('id'))
      expect(w.find('input').attributes('aria-invalid')).toBeUndefined()
    })
    it('error status can be retried', async () => {
      const w = mount(NewsletterSignup, { props: { status: 'error' } })
      await submit(w, 'a@b.co')
      expect(subscribed(w)).toEqual(['a@b.co'])
    })
    it('validation error takes precedence over the error status message', async () => {
      const w = mount(NewsletterSignup, { props: { status: 'error' } })
      await submit(w, 'bad')
      expect(w.find('[data-slot="newsletter-signup-error"]').text()).toBe('Enter a valid email address.')
    })
    it('unknown status falls back to idle', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(NewsletterSignup, { props: { status: 'weird' } })
      expect(w.attributes('data-status')).toBe('idle')
      expect(w.find('button').attributes('aria-busy')).toBeUndefined()
    })
    it('status transitions follow the parent', async () => {
      const w = mount(NewsletterSignup, { props: { status: 'idle' as const } })
      for (const s of ['loading', 'success', 'error', 'idle', 'loading'] as const) {
        await w.setProps({ status: s })
        expect(w.attributes('data-status')).toBe(s)
      }
      expect(w.find('button').attributes('aria-busy')).toBe('true')
    })
  })

  describe('model', () => {
    it('emits update:modelValue on input (uncontrolled keeps its own value)', async () => {
      const w = mount(NewsletterSignup)
      await w.find('input').setValue('abc')
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['abc'])
      expect((w.find('input').element as HTMLInputElement).value).toBe('abc')
    })
    it('controlled: reflects modelValue and updates when it changes', async () => {
      const w = mount(NewsletterSignup, { props: { modelValue: 'start@x.io' } })
      expect((w.find('input').element as HTMLInputElement).value).toBe('start@x.io')
      await w.setProps({ modelValue: 'next@x.io' })
      expect((w.find('input').element as HTMLInputElement).value).toBe('next@x.io')
      await submit(w)
      expect(subscribed(w)).toEqual(['next@x.io'])
      // @ts-expect-error null is tolerated at runtime
      await w.setProps({ modelValue: null })
      expect((w.find('input').element as HTMLInputElement).value).toBe('')
    })
    it('works with v-model in a parent', async () => {
      const Parent = defineComponent({
        components: { NewsletterSignup },
        setup() {
          const email = ref('')
          const status = ref<'idle' | 'success'>('idle')
          const onSubscribe = () => (status.value = 'success')
          return { email, status, onSubscribe }
        },
        template: '<NewsletterSignup v-model="email" :status="status" reset-on-success @subscribe="onSubscribe" />',
      })
      const w = mount(Parent)
      await w.find('input').setValue('p@q.rs')
      expect((w.vm as unknown as { email: string }).email).toBe('p@q.rs')
      await w.find('form').trigger('submit')
      await w.vm.$nextTick()
      expect((w.vm as unknown as { email: string }).email).toBe('')
      expect((w.find('input').element as HTMLInputElement).value).toBe('')
      expect(w.find('[data-slot="newsletter-signup-status"]').text()).toBe('Thanks for subscribing!')
    })
    it('keeps the input on success by default', async () => {
      const w = mount(NewsletterSignup, { props: { status: 'loading' as const } })
      await w.find('input').setValue('keep@me.io')
      await w.setProps({ status: 'success' })
      expect((w.find('input').element as HTMLInputElement).value).toBe('keep@me.io')
    })
    it('resetOnSuccess clears the input, the invalid state and emits update:modelValue ""', async () => {
      const w = mount(NewsletterSignup, { props: { status: 'loading' as const, resetOnSuccess: true } })
      await w.find('input').setValue('clear@me.io')
      await w.setProps({ status: 'success' })
      expect((w.find('input').element as HTMLInputElement).value).toBe('')
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([''])
    })
    it('resetOnSuccess ignores other transitions', async () => {
      const w = mount(NewsletterSignup, { props: { resetOnSuccess: true } })
      await w.find('input').setValue('stay@me.io')
      await w.setProps({ status: 'error' })
      expect((w.find('input').element as HTMLInputElement).value).toBe('stay@me.io')
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs to the root', () => {
      const w = mount(NewsletterSignup, { props: { class: 'gap-1 custom' }, attrs: { id: 'n', 'data-x': '1' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('gap-1')
      expect(w.classes()).not.toContain('gap-4')
      expect(w.attributes('id')).toBe('n')
      expect(w.attributes('data-x')).toBe('1')
    })
    it('keeps the library Input and Button data-slots', () => {
      const w = mount(NewsletterSignup)
      expect(w.find('[data-slot="input"]').exists()).toBe(true)
      expect(w.find('[data-slot="button"]').exists()).toBe(true)
    })
  })

  describe('bad path', () => {
    it('unknown variant falls back to inline', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(NewsletterSignup, { props: { variant: 'huge' } })
      expect(w.attributes('data-variant')).toBe('inline')
      expect(w.find('form').classes()).toContain('sm:flex-row')
    })
    it('invalid heading level falls back to h2', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(NewsletterSignup, { props: { title: 'T', level: 0 } }).find('h2').exists()).toBe(true)
    })
    it('renders without title/description', () => {
      const w = mount(NewsletterSignup)
      expect(w.find('[data-slot="newsletter-signup-header"]').exists()).toBe(false)
      expect(w.find('form').attributes('aria-labelledby')).toBeUndefined()
    })
    it('never touches the network', async () => {
      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)
      const w = mount(NewsletterSignup)
      await submit(w, 'a@b.co')
      expect(fetchSpy).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    })
  })

  describe('edge cases', () => {
    it('blocks double submit in the same tick', () => {
      const w = mount(NewsletterSignup)
      ;(w.find('input').element as HTMLInputElement).value = 'a@b.co'
      return w
        .find('input')
        .trigger('input')
        .then(() => {
          const form = w.find('form').element as HTMLFormElement
          form.dispatchEvent(new Event('submit', { cancelable: true }))
          form.dispatchEvent(new Event('submit', { cancelable: true }))
          form.dispatchEvent(new Event('submit', { cancelable: true }))
          expect(subscribed(w)).toEqual(['a@b.co'])
        })
    })
    it('allows another submit after the tick when the parent did not react', async () => {
      const w = mount(NewsletterSignup)
      await submit(w, 'a@b.co')
      await submit(w)
      expect(subscribed(w)).toEqual(['a@b.co', 'a@b.co'])
    })
    it('rapid submits while the parent flips to loading emit once', async () => {
      const Parent = defineComponent({
        components: { NewsletterSignup },
        setup() {
          const status = ref<'idle' | 'loading'>('idle')
          const calls = ref(0)
          const onSubscribe = () => {
            calls.value++
            status.value = 'loading'
          }
          return { status, calls, onSubscribe }
        },
        template: '<NewsletterSignup :status="status" @subscribe="onSubscribe" />',
      })
      const w = mount(Parent)
      await w.find('input').setValue('a@b.co')
      for (let i = 0; i < 5; i++) await w.find('form').trigger('submit')
      expect((w.vm as unknown as { calls: number }).calls).toBe(1)
    })
    it('rapid status toggles never leave stale messages', async () => {
      const w = mount(NewsletterSignup, { props: { status: 'idle' as const } })
      for (let i = 0; i < 20; i++) await w.setProps({ status: i % 2 ? 'error' : 'success' })
      expect(w.find('[data-slot="newsletter-signup-error"]').exists()).toBe(true)
      await w.setProps({ status: 'idle' })
      expect(w.find('[data-slot="newsletter-signup-error"]').exists()).toBe(false)
      expect(w.find('[data-slot="newsletter-signup-status"]').text()).toBe('')
    })
    it('handles very long and unicode text props', () => {
      const long = 'x'.repeat(3000)
      const w = mount(NewsletterSignup, { props: { title: long, description: 'Bleib auf dem Laufenden 📬 مرحبا', buttonLabel: '登録' } })
      expect(w.find('h2').text()).toHaveLength(3000)
      expect(w.find('button').text()).toBe('登録')
    })
    it('escapes HTML in text props', () => {
      const w = mount(NewsletterSignup, { props: { title: '<b>x</b>', status: 'success', successMessage: '<i>y</i>' } })
      expect(w.find('h2 b').exists()).toBe(false)
      expect(w.find('[data-slot="newsletter-signup-status"] i').exists()).toBe(false)
    })
    it('instances in one app get unique ids', () => {
      const Two = defineComponent({ components: { NewsletterSignup }, template: '<div><NewsletterSignup title="A" /><NewsletterSignup title="B" /></div>' })
      const ids = mount(Two).findAll('input').map((i) => i.attributes('id'))
      expect(ids).toHaveLength(2)
      expect(ids[0]).not.toBe(ids[1])
    })
    it('unmounts cleanly, including mid-latch', async () => {
      const w = mount(NewsletterSignup)
      await w.find('input').setValue('a@b.co')
      void w.find('form').trigger('submit')
      expect(() => w.unmount()).not.toThrow()
    })
  })

  describe('accessibility and slop regressions', () => {
    it('an invalid submit moves focus to the email input (the form is novalidate) and sets aria-invalid + a described alert', async () => {
      const w = mount(NewsletterSignup, { attachTo: document.body })
      await submit(w, 'nope')
      const input = w.find('input')
      expect(document.activeElement).toBe(input.element)
      expect(input.attributes('aria-invalid')).toBe('true')
      const err = w.find('[data-slot="newsletter-signup-error"]')
      expect(err.attributes('role')).toBe('alert')
      expect(input.attributes('aria-describedby')).toBe(err.attributes('id'))
      expect(subscribed(w)).toEqual([])
      w.unmount()
    })
    it('a valid submit does not steal focus and clears the invalid state', async () => {
      const w = mount(NewsletterSignup, { attachTo: document.body })
      await submit(w, 'nope')
      await w.find('input').setValue('name@example.com')
      expect(w.find('input').attributes('aria-invalid')).not.toBe('true')
      expect(w.find('[data-slot="newsletter-signup-error"]').exists()).toBe(false)
      ;(document.activeElement as HTMLElement | null)?.blur()
      await submit(w)
      expect(document.activeElement).not.toBe(w.find('input').element)
      expect(subscribed(w)).toEqual(['name@example.com'])
      w.unmount()
    })
    it('the card variant is a flat rounded-lg panel: no shadow, no rounded-xl', () => {
      const w = mount(NewsletterSignup, { props: { variant: 'card' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card']))
      expect(w.classes().join(' ')).not.toMatch(/shadow|rounded-xl/)
      expect(newsletterSignupVariants({ variant: 'card' })).not.toMatch(/shadow|rounded-xl/)
    })
    it('the input text aligns with the writing direction (text-start, not text-left)', () => {
      const cls = mount(NewsletterSignup).find('input').classes().join(' ')
      expect(cls).not.toContain('text-left')
    })
    it('the visually hidden label, email type and autocomplete are present, and the status region exists before any message', () => {
      const w = mount(NewsletterSignup)
      const input = w.find('input')
      expect(w.find('label').attributes('for')).toBe(input.attributes('id'))
      expect(input.attributes('type')).toBe('email')
      expect(input.attributes('autocomplete')).toBe('email')
      expect(w.find('[data-slot="newsletter-signup-status"]').attributes('role')).toBe('status')
    })
  })
})
