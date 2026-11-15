import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from './StatusBadge.vue'
import { humanizeStatus, normalizeStatus, statusBadgeDefaultTones, statusTone } from './status'
import { statusBadgeDefaultTones as exported, statusTone as exportedTone } from './index'

const dot = (w: ReturnType<typeof mount>) => w.find('[data-slot="status-dot"]')

describe('statusTone helper', () => {
  it('maps built-in statuses', () => {
    expect(statusTone('active')).toBe('success')
    expect(statusTone('pending')).toBe('warning')
    expect(statusTone('running')).toBe('info')
    expect(statusTone('failed')).toBe('danger')
    expect(statusTone('inactive')).toBe('neutral')
  })

  it.each([
    ['approved', 'success'],
    ['online', 'success'],
    ['healthy', 'success'],
    ['ok', 'success'],
    ['completed', 'success'],
    ['degraded', 'warning'],
    ['queued', 'warning'],
    ['paused', 'warning'],
    ['in_progress', 'info'],
    ['new', 'info'],
    ['draft', 'info'],
    ['info', 'info'],
    ['error', 'danger'],
    ['offline', 'danger'],
    ['down', 'danger'],
    ['rejected', 'danger'],
    ['critical', 'danger'],
    ['unhealthy', 'danger'],
    ['quarantined', 'danger'],
  ] as const)('%s -> %s', (status, tone) => {
    expect(statusTone(status)).toBe(tone)
  })

  it('is case-insensitive, trims, and normalises - and space to _', () => {
    expect(statusTone('  ACTIVE ')).toBe('success')
    expect(statusTone('In Progress')).toBe('info')
    expect(statusTone('in-progress')).toBe('info')
    expect(statusTone('IN__PROGRESS')).toBe('info')
  })

  it('unknown, empty, null, undefined and whitespace resolve to neutral', () => {
    for (const v of ['whatever', '', '   ', null, undefined]) expect(statusTone(v)).toBe('neutral')
  })

  it('does not resolve inherited object keys', () => {
    for (const v of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) expect(statusTone(v)).toBe('neutral')
  })

  it('overrides win and are normalised', () => {
    expect(statusTone('active', { active: 'info' })).toBe('info')
    expect(statusTone('in progress', { 'In-Progress': 'warning' })).toBe('warning')
    expect(statusTone('custom', { custom: 'primary' })).toBe('primary')
  })

  it('ignores override values that are not valid tones and unrelated keys', () => {
    expect(statusTone('active', { active: 'bogus' as never })).toBe('success')
    expect(statusTone('active', { other: 'danger' })).toBe('success')
    expect(statusTone('active', {})).toBe('success')
  })

  it('exposes a frozen default map with only valid tones', () => {
    expect(Object.isFrozen(statusBadgeDefaultTones)).toBe(true)
    for (const v of Object.values(statusBadgeDefaultTones)) {
      expect(['neutral', 'primary', 'success', 'warning', 'danger', 'info']).toContain(v)
    }
    expect(exported).toBe(statusBadgeDefaultTones)
    expect(exportedTone).toBe(statusTone)
  })
})

describe('normalizeStatus / humanizeStatus', () => {
  it('normalises', () => {
    expect(normalizeStatus(' Not Ready-Yet ')).toBe('not_ready_yet')
    expect(normalizeStatus(null)).toBe('unknown')
    expect(normalizeStatus('')).toBe('unknown')
  })

  it('humanises', () => {
    expect(humanizeStatus('in_progress')).toBe('In progress')
    expect(humanizeStatus('FAILED')).toBe('Failed')
    expect(humanizeStatus('  not-ready  ')).toBe('Not ready')
    expect(humanizeStatus(null)).toBe('Unknown')
    expect(humanizeStatus('')).toBe('Unknown')
    expect(humanizeStatus('___')).toBe('Unknown')
  })
})

describe('StatusBadge', () => {
  describe('good path', () => {
    it('renders a badge with data-slot, humanised label and a dot', () => {
      const w = mount(StatusBadge, { props: { status: 'in_progress' } })
      expect(w.element.tagName).toBe('SPAN')
      expect(w.attributes('data-slot')).toBe('status-badge')
      expect(w.text()).toBe('In progress')
      expect(dot(w).exists()).toBe(true)
      expect(dot(w).attributes('aria-hidden')).toBe('true')
    })

    it.each([
      ['active', 'success', 'text-success'],
      ['pending', 'warning', 'bg-warning/20'],
      ['running', 'info', 'text-info'],
      ['failed', 'danger', 'bg-destructive'],
      ['whatever', 'neutral', 'bg-secondary'],
    ])('status %s -> tone %s with badge class %s', (status, tone, cls) => {
      const w = mount(StatusBadge, { props: { status } })
      expect(w.attributes('data-tone')).toBe(tone)
      expect(w.classes()).toContain(cls)
    })

    it('dot uses currentColor so it stays visible on solid badges', () => {
      expect(dot(mount(StatusBadge, { props: { status: 'failed' } })).classes()).toContain('bg-current')
    })

    it('custom label replaces the humanised status', () => {
      expect(mount(StatusBadge, { props: { status: 'failed', label: 'Build broke' } }).text()).toBe('Build broke')
    })

    it('dot=false hides the dot', () => {
      expect(dot(mount(StatusBadge, { props: { status: 'ok', dot: false } })).exists()).toBe(false)
    })

    it('pulse animates the dot', () => {
      const w = mount(StatusBadge, { props: { status: 'running', pulse: true } })
      expect(w.find('[data-slot="status-dot-halo"]').exists()).toBe(true)
    })

    it('no pulse by default', () => {
      expect(mount(StatusBadge, { props: { status: 'running' } }).find('[data-slot="status-dot-halo"]').exists()).toBe(false)
    })

    it('tones prop overrides the built-in map', () => {
      const w = mount(StatusBadge, { props: { status: 'active', tones: { active: 'info' } } })
      expect(w.attributes('data-tone')).toBe('info')
      expect(w.classes()).toContain('text-info')
    })

    it('primary tone (override) maps to the default badge variant', () => {
      expect(mount(StatusBadge, { props: { status: 'vip', tones: { vip: 'primary' } } }).classes()).toContain('bg-primary')
    })

    it('default slot replaces the label and receives label + tone', () => {
      const w = mount(StatusBadge, {
        props: { status: 'ok' },
        slots: { default: `<template #default="{ label, tone }">{{ label }}/{{ tone }}</template>` },
      })
      expect(w.text()).toBe('Ok/success')
    })
  })

  describe('customisation', () => {
    it('merges class and lets it override', () => {
      const w = mount(StatusBadge, { props: { status: 'ok', class: 'bg-pink-500 custom-x' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('bg-pink-500')
      expect(w.classes()).not.toContain('bg-success/15')
    })

    it('passes attributes through', () => {
      const w = mount(StatusBadge, { props: { status: 'ok' }, attrs: { id: 'sb', 'data-test': 'x', title: 'All good' } })
      expect(w.attributes('id')).toBe('sb')
      expect(w.attributes('data-test')).toBe('x')
      expect(w.attributes('title')).toBe('All good')
    })
  })

  describe('bad path', () => {
    it.each([null, undefined, '', '   '])('status %j renders "Unknown" in neutral', (status) => {
      const w = mount(StatusBadge, { props: { status } })
      expect(w.text()).toBe('Unknown')
      expect(w.attributes('data-tone')).toBe('neutral')
    })

    it('no props at all renders Unknown', () => {
      expect(mount(StatusBadge).text()).toBe('Unknown')
    })

    it('empty label falls back to the humanised status', () => {
      expect(mount(StatusBadge, { props: { status: 'down', label: '' } }).text()).toBe('Down')
    })

    it('invalid override tones are ignored', () => {
      const w = mount(StatusBadge, { props: { status: 'active', tones: { active: 'nope' as never } } })
      expect(w.attributes('data-tone')).toBe('success')
    })
  })

  describe('edge cases', () => {
    it('unknown status shows a humanised label in neutral', () => {
      const w = mount(StatusBadge, { props: { status: 'waiting_for_review' } })
      expect(w.text()).toBe('Waiting for review')
      expect(w.attributes('data-tone')).toBe('neutral')
    })

    it('handles unicode and very long status text', () => {
      const long = 'x'.repeat(500)
      expect(mount(StatusBadge, { props: { status: long } }).text()).toBe('X'.concat('x'.repeat(499)))
      expect(mount(StatusBadge, { props: { status: 'résumé_prêt' } }).text()).toBe('Résumé prêt')
    })

    it('reacts to status changes', async () => {
      const w = mount(StatusBadge, { props: { status: 'pending' } })
      await w.setProps({ status: 'failed' })
      expect(w.attributes('data-tone')).toBe('danger')
      expect(w.text()).toBe('Failed')
    })

    it('is case-insensitive in the component', () => {
      expect(mount(StatusBadge, { props: { status: 'HEALTHY' } }).attributes('data-tone')).toBe('success')
    })
  })
})
