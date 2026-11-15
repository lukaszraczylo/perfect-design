import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import Alert from './Alert.vue'
import AlertDescription from './AlertDescription.vue'
import AlertTitle from './AlertTitle.vue'
import { ALERT_LAYOUTS, alertActionsVariants, alertBodyVariants } from './variants'

const make = (props: Record<string, unknown> = {}, actions = true) =>
  mount(Alert, {
    props,
    slots: {
      default: () => [h(AlertTitle, null, () => 'Update ready'), h(AlertDescription, null, () => 'Restart to apply it.')],
      ...(actions ? { actions: () => h('button', { type: 'button' }, 'Restart') } : {}),
    },
  })

describe('Alert layout', () => {
  it('default keeps the original body classes and adds no data-layout', () => {
    const w = make({}, false)
    expect(w.find('[data-slot="alert-body"]').classes()).toEqual(['grid', 'min-w-0', 'flex-1', 'gap-1'])
    expect(w.attributes('data-layout')).toBeUndefined()
    expect(alertBodyVariants()).toBe('grid min-w-0 flex-1 gap-1')
  })

  it('inline turns the body into a wrapping row', () => {
    const w = make({ layout: 'inline' })
    const body = w.find('[data-slot="alert-body"]').classes()
    expect(body).toEqual(expect.arrayContaining(['flex', 'flex-wrap', 'items-center', 'gap-x-3', 'gap-y-1', 'min-w-0', 'flex-1']))
    expect(body).not.toContain('grid')
    expect(w.attributes('data-layout')).toBe('inline')
  })

  it('an unknown layout falls back to default', () => {
    const w = make({ layout: 'sideways' })
    expect(w.attributes('data-layout')).toBeUndefined()
    expect(w.find('[data-slot="alert-body"]').classes()).toContain('grid')
  })

  it('every layout renders different classes', () => {
    expect(new Set(ALERT_LAYOUTS.map((layout) => make({ layout }).html())).size).toBe(ALERT_LAYOUTS.length)
  })
})

describe('Alert actions', () => {
  it('renders nothing without the actions slot', () => {
    expect(make({}, false).find('[data-slot="alert-actions"]').exists()).toBe(false)
  })

  it('puts the actions under the text in the default layout', () => {
    const actions = make().find('[data-slot="alert-body"] [data-slot="alert-actions"]')
    expect(actions.classes()).toEqual(expect.arrayContaining(['flex', 'flex-wrap', 'gap-2', 'pt-1']))
    expect(actions.classes()).not.toContain('ms-auto')
    expect(actions.find('button').text()).toBe('Restart')
  })

  it('pushes the actions to the end of the row in the inline layout, with a logical margin', () => {
    const cls = alertActionsVariants({ layout: 'inline' })
    expect(cls).toContain('ms-auto')
    expect(cls).not.toContain('pt-1')
    expect(make({ layout: 'inline' }).find('[data-slot="alert-actions"]').classes()).toContain('ms-auto')
  })

  it('actions stay reachable and keep the role and dismiss button in every layout', () => {
    for (const layout of ALERT_LAYOUTS) {
      const w = make({ layout, variant: 'warning', dismissible: true, icon: faCircleInfo })
      expect(w.attributes('role')).toBe('alert')
      expect(w.find('[data-slot="alert-dismiss"]').attributes('aria-label')).toBe('Dismiss')
      expect(w.find('[data-slot="alert-actions"] button').exists()).toBe(true)
      expect(w.find('[data-slot="alert-icon"]').exists()).toBe(true)
    }
  })

  it('combines with appearance and size without losing either', () => {
    const w = make({ layout: 'inline', appearance: 'solid', size: 'sm', variant: 'info' })
    expect(w.classes()).toEqual(expect.arrayContaining(['bg-info', 'text-info-foreground', 'px-3', 'py-2', 'text-xs']))
    expect(w.attributes('data-layout')).toBe('inline')
    expect(w.attributes('data-appearance')).toBe('solid')
    expect(w.attributes('data-size')).toBe('sm')
  })

  it('class prop still wins', () => {
    expect(make({ layout: 'inline', class: 'px-9' }).classes()).toContain('px-9')
  })

  it('is icon-less by default in every layout', () => {
    for (const layout of ALERT_LAYOUTS) expect(make({ layout }).find('[data-slot="alert-icon"]').exists()).toBe(false)
  })
})
