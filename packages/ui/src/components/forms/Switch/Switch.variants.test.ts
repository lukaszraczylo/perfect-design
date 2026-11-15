import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import Switch from './Switch.vue'
import Field from '../Field/Field.vue'
import { switchTextVariants, switchThumbVariants, switchVariants, normalizeSwitchSize } from './variants'
import { CHOICE_TONES } from '../Checkbox/tones'
import * as barrel from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const sw = (w: VueWrapper) => w.find('[data-slot="switch"]')
const thumb = (w: VueWrapper) => w.find('[data-slot="switch-thumb"]')
const named = { 'aria-label': 'Sample setting' }

const DEFAULT_TRACK =
  'peer relative inline-flex shrink-0 items-center rounded-full border-2 border-transparent shadow-xs transition-colors after:absolute after:inset-x-0 after:-inset-y-1 pointer-coarse:after:-inset-y-3 motion-reduce:transition-none forced-colors:border-[ButtonText] forced-colors:data-[state=checked]:bg-[Highlight] forced-colors:data-[state=checked]:text-[HighlightText] forced-colors:aria-invalid:border-dashed data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80 disabled:cursor-not-allowed disabled:opacity-50 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:data-[state=unchecked]:bg-destructive/30 h-5 w-9'
const DEFAULT_THUMB =
  'pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform motion-reduce:transition-none data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground forced-colors:bg-[ButtonText] forced-colors:data-[state=checked]:bg-[HighlightText] size-4 data-[state=checked]:translate-x-4 rtl:data-[state=checked]:-translate-x-4'

const TONES = {
  primary: { bg: 'primary', thumb: 'primary-foreground', icon: 'primary' },
  success: { bg: 'success', thumb: 'success-foreground', icon: 'success' },
  danger: { bg: 'destructive', thumb: 'destructive-foreground', icon: 'destructive' },
  info: { bg: 'info', thumb: 'info-foreground', icon: 'info' },
  neutral: { bg: 'foreground', thumb: 'background', icon: 'foreground' },
} as const

describe('Switch variations', () => {
  describe('defaults', () => {
    it('keeps the original track and thumb class strings', () => {
      const w = mount(Switch, { attrs: named })
      expect(sw(w).attributes('class')).toBe(DEFAULT_TRACK)
      expect(thumb(w).attributes('class')).toBe(DEFAULT_THUMB)
      expect(w.find('[data-slot="switch-icon"]').exists()).toBe(false)
    })

    it('without a label the root stays the bare switch (no wrapper, no generated id)', () => {
      const w = mount(Switch, { attrs: named })
      expect(w.find('[data-slot="switch-wrapper"]').exists()).toBe(false)
      expect(sw(w).attributes('id')).toBeUndefined()
      expect(w.find('label').exists()).toBe(false)
    })

    it('explicit default values render exactly like omitted ones', () => {
      const plain = mount(Switch, { attrs: named }).html()
      expect(mount(Switch, { props: { tone: 'primary', labelPosition: 'end', showIcons: false }, attrs: named }).html()).toBe(plain)
    })

    it('exports helpers from the barrel', () => {
      expect(barrel.switchVariants).toBe(switchVariants)
      expect(barrel.switchThumbVariants).toBe(switchThumbVariants)
      expect(switchVariants()).toBe(DEFAULT_TRACK)
      expect(switchThumbVariants()).toBe(DEFAULT_THUMB)
    })
  })

  describe('tone', () => {
    it.each(Object.entries(TONES).filter(([t]) => t !== 'primary'))('%s paints the on track and the dark thumb with its own pair', (tone, { bg, thumb: thumbFg }) => {
      const w = mount(Switch, { props: { tone: tone as never }, attrs: named })
      expect(sw(w).classes()).toContain(`data-[state=checked]:bg-${bg}`)
      expect(sw(w).classes()).not.toContain('data-[state=checked]:bg-primary')
      // The off track is the same in every tone, so on and off still differ by the thumb position as well as colour.
      expect(sw(w).classes()).toContain('data-[state=unchecked]:bg-input')
      expect(thumb(w).classes()).toContain(`dark:data-[state=checked]:bg-${thumbFg}`)
      expect(thumb(w).classes()).not.toContain('dark:data-[state=checked]:bg-primary-foreground')
    })

    it('every tone renders a different track', () => {
      expect(new Set(CHOICE_TONES.map((tone) => mount(Switch, { props: { tone }, attrs: named }).html())).size).toBe(CHOICE_TONES.length)
    })

    it('unknown tone falls back to primary', () => {
      const w = mount(Switch, { props: { tone: 'pink' as never }, attrs: named })
      expect(sw(w).attributes('class')).toBe(DEFAULT_TRACK)
      expect(thumb(w).attributes('class')).toBe(DEFAULT_THUMB)
    })

    it.each(CHOICE_TONES)('%s toggles, moves the thumb and keeps the forced-colors fragments', async (tone) => {
      const w = mount(Switch, { props: { tone }, attrs: named })
      expect(sw(w).classes()).toEqual(
        expect.arrayContaining(['forced-colors:border-[ButtonText]', 'forced-colors:data-[state=checked]:bg-[Highlight]', 'forced-colors:data-[state=checked]:text-[HighlightText]']),
      )
      expect(thumb(w).classes()).toEqual(expect.arrayContaining(['data-[state=checked]:translate-x-4', 'data-[state=unchecked]:translate-x-0', 'forced-colors:data-[state=checked]:bg-[HighlightText]']))
      await sw(w).trigger('click')
      expect(sw(w).attributes('aria-checked')).toBe('true')
      expect(thumb(w).attributes('data-state')).toBe('checked')
      await sw(w).trigger('keydown', { key: 'Enter' })
      expect(sw(w).attributes('aria-checked')).toBe('false')
    })

    it('invalid keeps its destructive off track in every tone', () => {
      expect(sw(mount(Switch, { props: { tone: 'success', invalid: true }, attrs: named })).classes()).toContain('aria-invalid:data-[state=unchecked]:bg-destructive/30')
    })
  })

  describe('showIcons', () => {
    it('shows a cross when off and a check when on, decoratively', async () => {
      const w = mount(Switch, { props: { showIcons: true }, attrs: named })
      const icon = () => w.find('[data-slot="switch-icon"]')
      expect(icon().exists()).toBe(true)
      expect(icon().attributes('aria-hidden')).toBe('true')
      expect(icon().find('path').attributes('d')).toBe(faXmark.icon[4])
      await sw(w).trigger('click')
      expect(icon().find('path').attributes('d')).toBe(faCheck.icon[4])
      expect(icon().attributes('aria-hidden')).toBe('true')
    })

    it('starts with the check when defaultValue is on, and follows a controlled model', async () => {
      const w = mount(Switch, { props: { showIcons: true, modelValue: true }, attrs: named })
      expect(w.find('[data-slot="switch-icon"] path').attributes('d')).toBe(faCheck.icon[4])
      await w.setProps({ modelValue: false })
      expect(w.find('[data-slot="switch-icon"] path').attributes('d')).toBe(faXmark.icon[4])
    })

    it('does not change the accessible name or role', () => {
      const w = mount(Switch, { props: { showIcons: true }, attrs: named })
      expect(sw(w).attributes('role')).toBe('switch')
      expect(sw(w).attributes('aria-label')).toBe('Sample setting')
      expect(sw(w).text()).toBe('')
    })

    it.each(Object.entries(TONES))('%s colours the glyph with its own token against the thumb, and keeps a muted off glyph', (tone, { icon }) => {
      const cls = thumb(mount(Switch, { props: { showIcons: true, tone: tone as never }, attrs: named })).classes()
      expect(cls).toContain(`data-[state=checked]:text-${icon}`)
      expect(cls).toContain('data-[state=unchecked]:text-muted-foreground')
      expect(cls).toContain('grid')
      expect(cls).not.toContain('block')
      // The glyph stays readable against the system-colour thumb in forced-colors mode.
      expect(cls).toEqual(expect.arrayContaining(['forced-colors:text-[Canvas]', 'forced-colors:data-[state=checked]:text-[Highlight]']))
    })

    it.each([
      ['sm', 'size-2'],
      ['md', 'size-2.5'],
      ['lg', 'size-3'],
    ] as const)('%s uses a %s glyph', (size, cls) => {
      expect(mount(Switch, { props: { showIcons: true, size }, attrs: named }).find('[data-slot="switch-icon"]').classes()).toContain(cls)
    })

    it('works inside a label wrapper too', () => {
      const w = mount(Switch, { props: { showIcons: true, label: 'Sync' } })
      expect(w.find('[data-slot="switch-icon"]').exists()).toBe(true)
    })
  })

  describe('label', () => {
    it('renders a label for the switch, and clicking it toggles', async () => {
      wrapper = mount(Switch, { props: { label: 'Notifications' }, attachTo: document.body })
      const label = wrapper.find('label')
      expect(label.text()).toBe('Notifications')
      expect(label.attributes('for')).toBe(sw(wrapper).attributes('id'))
      expect(sw(wrapper).attributes('id')).toMatch(/^switch-/)
      expect(wrapper.find('[data-slot="switch-wrapper"]').classes()).toEqual(expect.arrayContaining(['inline-flex', 'items-start', 'max-w-full', 'gap-2']))
      await label.trigger('click')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    it('uses the id prop and the label slot over the prop', () => {
      const w = mount(Switch, { props: { label: 'prop', id: 'wifi' }, slots: { label: '<em>slot</em>' } })
      expect(sw(w).attributes('id')).toBe('wifi')
      expect(w.find('label').attributes('for')).toBe('wifi')
      expect(w.find('label em').text()).toBe('slot')
    })

    it('forwards attrs and class to the switch, not the wrapper', () => {
      const w = mount(Switch, { props: { label: 'L', class: 'custom-track' }, attrs: { 'data-testid': 't' } })
      expect(sw(w).classes()).toContain('custom-track')
      expect(sw(w).attributes('data-testid')).toBe('t')
      expect(w.find('[data-slot="switch-wrapper"]').classes()).not.toContain('custom-track')
    })

    it('aligns a small track with its first label line, larger ones need no margin', () => {
      expect(sw(mount(Switch, { props: { label: 'L', size: 'sm' } })).classes()).toContain('mt-0.5')
      expect(sw(mount(Switch, { props: { label: 'L', size: 'md' } })).classes()).not.toContain('mt-0.5')
      expect(sw(mount(Switch, { props: { size: 'sm' }, attrs: named })).classes()).not.toContain('mt-0.5')
    })

    it('uses base text for the large size and dims with the control when disabled', () => {
      const w = mount(Switch, { props: { label: 'L', size: 'lg', disabled: true } })
      expect(w.find('label').classes()).toEqual(expect.arrayContaining(['text-base', 'opacity-50']))
    })

    it('shows a required asterisk that is aria-hidden', () => {
      const w = mount(Switch, { props: { label: 'L', required: true } })
      expect(w.find('[data-slot="label-required"]').attributes('aria-hidden')).toBe('true')
      expect(sw(w).attributes('aria-required')).toBe('true')
    })

    it('an empty label string renders no wrapper', () => {
      const w = mount(Switch, { props: { label: '' }, attrs: named })
      expect(w.find('[data-slot="switch-wrapper"]').exists()).toBe(false)
    })

    it('renders unicode, right-to-left and very long labels', () => {
      for (const label of ['日本語', 'مرحبا بالعالم', 'x'.repeat(500)]) expect(mount(Switch, { props: { label } }).find('label').text()).toBe(label)
    })

    it('switches into the wrapper when a label appears', async () => {
      const w = mount(Switch, { attrs: named })
      await w.setProps({ label: 'Now labelled' })
      expect(w.find('label').exists()).toBe(true)
    })
  })

  describe('labelPosition', () => {
    it('start reverses the row logically; end and unknown do not', () => {
      const start = mount(Switch, { props: { label: 'L', labelPosition: 'start' } })
      expect(start.find('[data-slot="switch-wrapper"]').classes()).toContain('flex-row-reverse')
      for (const labelPosition of ['end', 'middle'] as never[]) {
        expect(mount(Switch, { props: { label: 'L', labelPosition } }).find('[data-slot="switch-wrapper"]').classes()).not.toContain('flex-row-reverse')
      }
    })

    it('keeps the source order (switch, then label) and uses no physical direction classes', () => {
      const w = mount(Switch, { props: { label: 'L', labelPosition: 'start', description: 'D' } })
      expect([...w.find('[data-slot="switch-wrapper"]').element.children].map((c) => c.getAttribute('data-slot'))).toEqual(['switch', 'switch-text'])
      expect(w.html()).not.toMatch(/class="[^"]*\b(?:ml|mr|pl|pr|left|right|text-left|text-right)-/)
    })
  })

  describe('description', () => {
    it('renders under the label, linked by aria-describedby', () => {
      const w = mount(Switch, { props: { label: 'Email alerts', description: 'Weekly digest.', id: 'em' } })
      const desc = w.find('[data-slot="switch-description"]')
      expect(desc.text()).toBe('Weekly digest.')
      expect(desc.attributes('id')).toBe('em-description')
      expect(sw(w).attributes('aria-describedby')).toBe('em-description')
      expect(w.find('label').text()).toBe('Email alerts')
    })

    it('accepts a slot, and is ignored without a label', () => {
      const w = mount(Switch, { props: { label: 'L' }, slots: { description: '<b>Rich</b>' } })
      expect(w.find('[data-slot="switch-description"] b').text()).toBe('Rich')
      const orphan = mount(Switch, { props: { description: 'Orphan' }, attrs: named })
      expect(orphan.find('[data-slot="switch-description"]').exists()).toBe(false)
      expect(sw(orphan).attributes('aria-describedby')).toBeUndefined()
    })

    it('merges Field hint and error ids with an explicit aria-describedby', () => {
      wrapper = mount(Field, {
        props: { label: 'Alerts', hint: 'Hint', error: 'Err', id: 'al' },
        slots: { default: () => h(Switch, { label: 'Email', description: 'Digest', 'aria-describedby': 'ext' }) },
      })
      expect(wrapper.find('[data-slot="switch"]').attributes('aria-describedby')).toBe('al-hint al-error ext al-description')
    })

    it('dims when disabled, uses the smaller size on sm and wraps long text', () => {
      const w = mount(Switch, { props: { label: 'L', description: 'x'.repeat(300), disabled: true, size: 'sm' } })
      expect(w.find('[data-slot="switch-description"]').classes()).toEqual(expect.arrayContaining(['opacity-50', 'text-xs', 'text-muted-foreground']))
      expect(w.find('[data-slot="switch-text"]').classes()).toContain('min-w-0')
    })
  })

  describe('combinations and class precedence', () => {
    it.each(CHOICE_TONES.flatMap((tone) => (['sm', 'md', 'lg'] as const).flatMap((size) => [true, false].map((showIcons) => [tone, size, showIcons] as const))))(
      'tone=%s size=%s showIcons=%s keep one track colour and one size',
      (tone, size, showIcons) => {
        const w = mount(Switch, { props: { tone, size, showIcons, label: 'L' } })
        expect(sw(w).classes().filter((c) => /^data-\[state=checked\]:bg-/.test(c))).toHaveLength(1)
        expect(sw(w).classes().filter((c) => /^h-\d/.test(c))).toHaveLength(1)
        expect(thumb(w).classes().filter((c) => /^size-/.test(c))).toHaveLength(1)
        expect(thumb(w).classes().filter((c) => /^dark:data-\[state=checked\]:bg-/.test(c))).toHaveLength(1)
        expect(w.find('[data-slot="switch-icon"]').exists()).toBe(showIcons)
      },
    )

    it('class wins over tone classes', () => {
      const w = mount(Switch, { props: { tone: 'danger', class: 'data-[state=checked]:bg-info w-12' }, attrs: named })
      expect(sw(w).classes()).toContain('data-[state=checked]:bg-info')
      expect(sw(w).classes()).not.toContain('data-[state=checked]:bg-destructive')
      expect(sw(w).classes()).toContain('w-12')
      expect(sw(w).classes()).not.toContain('w-9')
    })

    it('the size normaliser falls back to md', () => {
      expect(normalizeSwitchSize('xl')).toBe('md')
      expect(switchVariants({ size: 'lg', tone: 'neutral', labeled: true, class: 'x' })).toContain('h-6')
    })

    it('disabled blocks toggling in every variation', async () => {
      const w = mount(Switch, { props: { disabled: true, tone: 'info', showIcons: true, label: 'L' } })
      await sw(w).trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(sw(w).attributes('aria-checked')).toBe('false')
    })

    it('unmounts cleanly', () => {
      const w = mount(Switch, { props: { tone: 'neutral', showIcons: true, label: 'L', description: 'D', labelPosition: 'start' } })
      w.unmount()
      expect(document.body.innerHTML).toBe('')
    })

    it('inside a Field the Field id and label are used and no second label is added', () => {
      wrapper = mount(Field, { props: { label: 'Alerts', id: 'f1' }, slots: { default: () => h(Switch, { tone: 'success', showIcons: true }) } })
      expect(sw(wrapper).attributes('id')).toBe('f1')
      expect(wrapper.findAll('label')).toHaveLength(1)
    })
  })
})

describe('Switch on and off text', () => {
  const mk = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => {
    wrapper = mount(Switch, { props, attrs: { ...named, ...attrs }, attachTo: document.body })
    return wrapper
  }
  const onText = (w: VueWrapper) => w.find('[data-slot="switch-on-label"]')
  const offText = (w: VueWrapper) => w.find('[data-slot="switch-off-label"]')

  it('without labels nothing changes: the default track and thumb strings are the pinned ones', () => {
    const w = mk()
    expect(onText(w).exists()).toBe(false)
    expect(offText(w).exists()).toBe(false)
    expect(sw(w).classes()).not.toContain('w-14')
    expect(switchVariants()).toBe(DEFAULT_TRACK)
  })

  it('offLabel shows while off, on the end side, aria-hidden, in muted-foreground', () => {
    const w = mk({ onLabel: 'On', offLabel: 'Off' })
    expect(offText(w).text()).toBe('Off')
    expect(offText(w).attributes('aria-hidden')).toBe('true')
    expect(offText(w).classes()).toEqual(expect.arrayContaining(['end-1', 'text-muted-foreground']))
    expect(onText(w).exists()).toBe(false)
  })

  it('onLabel shows while on, on the start side, in the tone foreground', async () => {
    const w = mk({ onLabel: 'On', offLabel: 'Off', defaultValue: true })
    expect(onText(w).text()).toBe('On')
    expect(onText(w).classes()).toEqual(expect.arrayContaining(['start-1', 'text-primary-foreground']))
    expect(offText(w).exists()).toBe(false)
    await sw(w).trigger('click')
    expect(offText(w).exists()).toBe(true)
    expect(onText(w).exists()).toBe(false)
  })

  it.each([
    ['primary', 'text-primary-foreground'],
    ['success', 'text-success-foreground'],
    ['danger', 'text-destructive-foreground'],
    ['info', 'text-info-foreground'],
    ['neutral', 'text-background'],
  ] as const)('tone %s uses its tested foreground for the on text', (tone, cls) => {
    expect(onText(mk({ tone, onLabel: 'On', defaultValue: true })).classes()).toContain(cls)
  })

  it('the accessible name stays the label and the text never joins it', () => {
    const w = mk({ onLabel: 'On', offLabel: 'Off', label: 'Sample notifications' }, { 'aria-label': undefined })
    expect(sw(w).attributes('role')).toBe('switch')
    expect(w.find('label').text()).toBe('Sample notifications')
    expect(offText(w).attributes('aria-hidden')).toBe('true')
    expect(sw(w).attributes('aria-checked')).toBe('false')
  })

  it.each([
    ['md', 'w-14', 'data-[state=checked]:translate-x-9', 'rtl:data-[state=checked]:-translate-x-9'],
    ['lg', 'w-16', 'data-[state=checked]:translate-x-10', 'rtl:data-[state=checked]:-translate-x-10'],
  ] as const)('size %s widens the track to %s and lengthens the thumb travel', (size, track, travel, rtlTravel) => {
    const w = mk({ size, onLabel: 'On' })
    expect(sw(w).classes()).toContain(track)
    expect(sw(w).classes()).not.toContain(size === 'md' ? 'w-9' : 'w-11')
    expect(thumb(w).classes()).toEqual(expect.arrayContaining([travel, rtlTravel]))
  })

  it('sm ignores the labels: no text, no wider track', () => {
    const w = mk({ size: 'sm', onLabel: 'On', offLabel: 'Off' })
    expect(offText(w).exists()).toBe(false)
    expect(sw(w).classes()).toContain('w-7')
  })

  it('the off track is muted with an input border so muted-foreground text is on a tested pair; invalid keeps that fill', () => {
    const c = mk({ onLabel: 'On' }).find('[data-slot="switch"]').classes()
    expect(c).toEqual(expect.arrayContaining(['data-[state=unchecked]:bg-muted', 'data-[state=unchecked]:border-input', 'dark:data-[state=unchecked]:bg-muted', 'aria-invalid:data-[state=unchecked]:bg-muted']))
    expect(c).not.toContain('data-[state=unchecked]:bg-input')
    expect(c).not.toContain('dark:data-[state=unchecked]:bg-input/80')
  })

  it('one label alone is enough, and an empty or unknown-size value falls back cleanly', () => {
    expect(offText(mk({ offLabel: 'Off' })).text()).toBe('Off')
    expect(sw(mk({ offLabel: '', onLabel: '' })).classes()).not.toContain('w-14')
    expect(sw(mk({ size: 'huge' as never, onLabel: 'On' })).classes()).toContain('w-14')
  })

  it('hostile and right-to-left text renders as text and is clipped by max-w-7', () => {
    const w = mk({ offLabel: '<b>إيقاف تشغيل طويل</b>' })
    expect(offText(w).text()).toBe('<b>إيقاف تشغيل طويل</b>')
    expect(offText(w).find('b').exists()).toBe(false)
    expect(offText(w).classes()).toEqual(expect.arrayContaining(['max-w-7', 'overflow-hidden', 'whitespace-nowrap']))
  })

  it('works with showIcons, a Field and a disabled switch', () => {
    const w = mk({ onLabel: 'On', offLabel: 'Off', showIcons: true, disabled: true })
    expect(w.find('[data-slot="switch-icon"]').exists()).toBe(true)
    expect(offText(w).exists()).toBe(true)
    expect(sw(w).attributes('disabled')).toBeDefined()
  })

  it('the thumb mirrors in right-to-left for every size, with and without text', () => {
    for (const size of ['sm', 'md', 'lg'] as const) expect(switchThumbVariants({ size })).toMatch(/rtl:data-\[state=checked\]:-translate-x-\d/)
    expect(switchThumbVariants({ size: 'md', texts: true })).toContain('rtl:data-[state=checked]:-translate-x-9')
    expect(switchThumbVariants({ size: 'md', texts: true })).not.toContain('rtl:data-[state=checked]:-translate-x-4')
  })

  it('class still wins on the track and variants helpers accept texts', () => {
    expect(sw(mk({ onLabel: 'On', class: 'w-20' })).classes()).toContain('w-20')
    expect(switchVariants({ size: 'md', texts: true })).toContain('w-14')
    expect(switchTextVariants()).toContain('start-1')
  })
})
