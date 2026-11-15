import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import Alert from './Alert.vue'
import AlertDescription from './AlertDescription.vue'
import AlertTitle from './AlertTitle.vue'
import { alertIconVariants, alertVariants } from './variants'

const VARIANTS = ['default', 'info', 'success', 'warning', 'destructive'] as const
const APPEARANCES = ['soft', 'solid', 'outline', 'minimal'] as const

describe('Alert', () => {
  describe('good path', () => {
    it('renders slot content with data-slot and status role by default', () => {
      const w = mount(Alert, { slots: { default: 'Hello' } })
      expect(w.attributes('data-slot')).toBe('alert')
      expect(w.attributes('role')).toBe('status')
      expect(w.text()).toBe('Hello')
    })

    it.each(VARIANTS)('applies the %s variant', (variant) => {
      const w = mount(Alert, { props: { variant } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.classes().join(' ')).toContain(alertVariants({ variant }).split(' ').at(-1)!)
    })

    it.each([
      ['default', 'status'],
      ['info', 'status'],
      ['success', 'status'],
      ['warning', 'alert'],
      ['destructive', 'alert'],
    ] as const)('%s variant uses role=%s', (variant, role) => {
      expect(mount(Alert, { props: { variant } }).attributes('role')).toBe(role)
    })

    it('renders an icon only when provided', () => {
      expect(mount(Alert).find('[data-slot="alert-icon"]').exists()).toBe(false)
      const w = mount(Alert, { props: { icon: faCircleInfo } })
      expect(w.find('[data-slot="alert-icon"] svg').exists()).toBe(true)
    })

    it('composes AlertTitle and AlertDescription', () => {
      const Comp = defineComponent({
        setup: () => () => h(Alert, null, () => [h(AlertTitle, null, () => 'Heads up'), h(AlertDescription, null, () => 'Details')]),
      })
      const w = mount(Comp)
      expect(w.find('[data-slot="alert-title"]').text()).toBe('Heads up')
      expect(w.find('[data-slot="alert-description"]').text()).toBe('Details')
    })

    it('has no dismiss button unless dismissible', () => {
      expect(mount(Alert).find('[data-slot="alert-dismiss"]').exists()).toBe(false)
    })

    it('dismisses: removes itself and emits dismiss once', async () => {
      const w = mount(Alert, { props: { dismissible: true }, slots: { default: 'x' } })
      await w.find('[data-slot="alert-dismiss"]').trigger('click')
      expect(w.emitted('dismiss')).toHaveLength(1)
      expect(w.find('[data-slot="alert"]').exists()).toBe(false)
    })
  })

  describe('customisation', () => {
    it('merges class last so it wins over internal classes', () => {
      const w = mount(Alert, { props: { class: 'px-8 custom' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('px-8')
      expect(w.classes()).not.toContain('px-4')
    })

    it('falls attrs through to the root', () => {
      const w = mount(Alert, { attrs: { id: 'a1', 'data-test': 'z', 'aria-label': 'note' } })
      expect(w.attributes('id')).toBe('a1')
      expect(w.attributes('data-test')).toBe('z')
      expect(w.attributes('aria-label')).toBe('note')
    })

    it('role prop overrides the computed role', () => {
      expect(mount(Alert, { props: { variant: 'destructive', role: 'status' } }).attributes('role')).toBe('status')
    })

    it('custom dismiss label', () => {
      const w = mount(Alert, { props: { dismissible: true, dismissLabel: 'Close it' } })
      expect(w.find('[data-slot="alert-dismiss"]').attributes('aria-label')).toBe('Close it')
    })

    it('AlertTitle / AlertDescription merge classes', () => {
      expect(mount(AlertTitle, { props: { class: 'text-lg' } }).classes()).toContain('text-lg')
      expect(mount(AlertDescription, { props: { class: 'text-xs' } }).classes()).toContain('text-xs')
    })
  })

  describe('bad path', () => {
    it('falls back to default for an unknown variant', () => {
      const w = mount(Alert, { props: { variant: 'bogus' as never } })
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.attributes('role')).toBe('status')
    })

    it('double dismiss emits only once', async () => {
      const w = mount(Alert, { props: { dismissible: true } })
      const btn = w.find('[data-slot="alert-dismiss"]')
      await btn.trigger('click')
      ;(btn.element as HTMLButtonElement).click()
      await w.vm.$nextTick()
      expect(w.emitted('dismiss')).toHaveLength(1)
    })

    it('renders with no content at all', () => {
      const w = mount(Alert)
      expect(w.find('[data-slot="alert-body"]').text()).toBe('')
    })
  })

  describe('edge cases', () => {
    it('handles very long unbroken text and unicode/RTL', () => {
      const long = 'x'.repeat(5000)
      const w = mount(Alert, { slots: { default: `${long} 🚀 مرحبا 日本語` } })
      expect(w.text()).toContain(long)
      expect(w.text()).toContain('مرحبا')
      expect(w.find('[data-slot="alert-body"]').classes()).toContain('min-w-0')
    })
  })

  describe('appearance', () => {
    it('default usage is unchanged: soft, md, no extra data attributes', () => {
      const w = mount(Alert)
      expect(w.attributes('data-appearance')).toBeUndefined()
      expect(w.attributes('data-size')).toBeUndefined()
      expect(w.attributes('class')).toBe('relative flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm bg-card text-card-foreground')
    })

    it.each(APPEARANCES)('renders the %s appearance for every variant without crashing', (appearance) => {
      for (const variant of VARIANTS) {
        const w = mount(Alert, { props: { appearance, variant }, slots: { default: 'x' } })
        expect(w.attributes('data-variant')).toBe(variant)
        expect(w.attributes('data-appearance')).toBe(appearance === 'soft' ? undefined : appearance)
      }
    })

    it('solid uses the filled tone with its foreground token', () => {
      expect(mount(Alert, { props: { appearance: 'solid', variant: 'info' } }).classes()).toEqual(expect.arrayContaining(['bg-info', 'text-info-foreground', 'border-info']))
      expect(mount(Alert, { props: { appearance: 'solid', variant: 'destructive' } }).classes()).toEqual(expect.arrayContaining(['bg-destructive', 'text-destructive-foreground']))
      expect(mount(Alert, { props: { appearance: 'solid' } }).classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background']))
    })

    it('solid drops the tinted soft classes (conflicts are merged)', () => {
      const cls = mount(Alert, { props: { appearance: 'solid', variant: 'success' } }).classes()
      expect(cls).not.toContain('bg-success/10')
      expect(cls).not.toContain('border-success/40')
      expect(cls).not.toContain('text-foreground')
    })

    it('solid recolours icon and dismiss button to currentColor', () => {
      const w = mount(Alert, { props: { appearance: 'solid', variant: 'info', icon: faCircleInfo, dismissible: true } })
      expect(w.find('[data-slot="alert-icon"]').classes()).toContain('text-current')
      expect(w.find('[data-slot="alert-icon"]').classes()).not.toContain('text-info')
      expect(w.find('[data-slot="alert-dismiss"]').classes()).toContain('text-current')
      const soft = mount(Alert, { props: { variant: 'info', icon: faCircleInfo, dismissible: true } })
      expect(soft.find('[data-slot="alert-icon"]').classes()).toContain('text-info')
      expect(soft.find('[data-slot="alert-dismiss"]').classes()).toContain('text-muted-foreground')
    })

    it('outline has a transparent background and a full-strength tone border', () => {
      const cls = mount(Alert, { props: { appearance: 'outline', variant: 'warning' } }).classes()
      expect(cls).toEqual(expect.arrayContaining(['bg-transparent', 'border-warning']))
      expect(cls).not.toContain('bg-warning/15')
      expect(mount(Alert, { props: { appearance: 'outline' } }).classes()).toContain('border-border')
    })

    it('the removed left-accent appearance falls back to soft and adds no edge stripe', () => {
      const w = mount(Alert, { props: { appearance: 'left-accent' as never, variant: 'info' } })
      expect(w.attributes('data-appearance')).toBeUndefined()
      expect(w.classes().join(' ')).not.toMatch(/border-l-4/)
    })

    it('minimal has no surface and no horizontal padding', () => {
      const cls = mount(Alert, { props: { appearance: 'minimal', variant: 'info' } }).classes()
      expect(cls).toEqual(expect.arrayContaining(['bg-transparent', 'border-transparent', 'px-0']))
      expect(cls).not.toContain('bg-info/10')
      expect(cls).not.toContain('px-4')
    })

    it('unknown appearance falls back to soft', () => {
      const w = mount(Alert, { props: { appearance: 'glass' as never, variant: 'info' } })
      expect(w.attributes('data-appearance')).toBeUndefined()
      expect(w.classes()).toContain('bg-info/10')
    })

    it('class prop still wins over appearance classes', () => {
      const w = mount(Alert, { props: { appearance: 'solid', variant: 'info', class: 'bg-primary' } })
      expect(w.classes()).toContain('bg-primary')
      expect(w.classes()).not.toContain('bg-info')
    })

    it('alertVariants works standalone and merges conflicts', () => {
      const cls = alertVariants({ appearance: 'solid', variant: 'info' }).split(' ')
      expect(cls).toContain('bg-info')
      expect(cls).not.toContain('bg-info/10')
      expect(alertVariants({ class: 'px-8' })).toContain('px-8')
      expect(alertVariants()).toContain('bg-card')
      expect(alertIconVariants({ variant: 'info', appearance: 'solid' }).split(' ')).not.toContain('text-info')
    })
  })

  describe('size', () => {
    it('md is the unchanged default', () => {
      expect(mount(Alert).classes()).toEqual(expect.arrayContaining(['px-4', 'py-3', 'text-sm', 'gap-3']))
    })

    it('sm is compact', () => {
      const w = mount(Alert, { props: { size: 'sm', icon: faCircleInfo } })
      expect(w.attributes('data-size')).toBe('sm')
      expect(w.classes()).toEqual(expect.arrayContaining(['px-3', 'py-2', 'text-xs', 'gap-2']))
      expect(w.classes()).not.toContain('px-4')
      expect(w.find('[data-slot="alert-icon"]').classes()).toContain('[&_svg]:size-3.5')
    })

    it('lg is roomy', () => {
      const w = mount(Alert, { props: { size: 'lg', icon: faCircleInfo } })
      expect(w.attributes('data-size')).toBe('lg')
      expect(w.classes()).toEqual(expect.arrayContaining(['px-5', 'py-4', 'text-base', 'gap-4']))
      expect(w.find('[data-slot="alert-icon"]').classes()).toContain('[&_svg]:size-5')
    })

    it('unknown size falls back to md', () => {
      const w = mount(Alert, { props: { size: 'xxl' as never } })
      expect(w.attributes('data-size')).toBeUndefined()
      expect(w.classes()).toContain('px-4')
    })

    it('minimal keeps zero horizontal padding at every size', () => {
      for (const size of ['sm', 'md', 'lg'] as const) {
        const cls = mount(Alert, { props: { appearance: 'minimal', size } }).classes()
        expect(cls).toContain('px-0')
        expect(cls).not.toContain('px-3')
        expect(cls).not.toContain('px-5')
      }
    })

    it('combines appearance, size, dismiss and slots', async () => {
      const w = mount(Alert, { props: { appearance: 'solid', size: 'lg', variant: 'warning', dismissible: true, icon: faCircleInfo }, slots: { default: '<b>hi</b>' } })
      expect(w.attributes('role')).toBe('alert')
      expect(w.find('b').exists()).toBe(true)
      await w.find('[data-slot="alert-dismiss"]').trigger('click')
      expect(w.emitted('dismiss')).toHaveLength(1)
    })
  })

describe('Alert touch targets and contrast', () => {
  it('dismiss button is logically placed and larger on coarse pointers', () => {
    const cls = mount(Alert, { props: { dismissible: true } }).find('[data-slot="alert-dismiss"]').classes()
    expect(cls).toEqual(expect.arrayContaining(['-me-2', 'size-7', 'pointer-coarse:size-10']))
  })

  it('the solid appearance keeps full-strength description text', () => {
    const cls = mount(Alert, { props: { appearance: 'solid', variant: 'info' } }).classes().join(' ')
    expect(cls).toContain('[&_[data-slot=alert-description]]:text-current')
    expect(cls).not.toContain('text-current/80')
  })
})
})
