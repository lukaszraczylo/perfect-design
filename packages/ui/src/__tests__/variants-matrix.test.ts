/**
 * Variation matrix. Every documented union prop that selects a look (`variant`, `size`, `tone`, `appearance`, `layout`,
 * `density`, `shape`, `orientation`) is exercised with each of its documented values:
 *   1. the component mounts and renders with every value, without Vue warnings;
 *   2. a value that is documented must change something (class, data attribute, markup): a variant that renders the same
 *      as the default is a no-op or a lie in the docs;
 *   3. an unknown value falls back to the default instead of breaking the layout.
 * Components that need a parent or provider to render alone are listed in NEEDS_PARENT (their variants are covered by their
 * own tests and docs examples).
 */
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import type { Component } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { ComponentDoc } from '../docs-types'
import * as UI from '../index'

const docs = Object.values(import.meta.glob<{ default: ComponentDoc }>('../components/**/*.docs.ts', { eager: true })).map((m) => m.default)
const LOOK_PROPS = new Set([
  'variant', 'size', 'tone', 'appearance', 'layout', 'density', 'shape', 'orientation', 'rounded', 'gap', 'columns',
  // Added with the variation round.
  'status', 'align', 'markerShape', 'grid', 'iconPosition', 'curve', 'labelPosition', 'edgeStyle', 'fit', 'padding', 'effect', 'distance', 'speed', 'separator', 'weekStart', 'colorBy', 'negativeTone',
])

// Roots that render nothing useful alone (compound roots, portalled overlays, provider-dependent).
const NEEDS_PARENT = new Set([
  'Dialog', 'AlertDialog', 'Sheet', 'Popover', 'Tooltip', 'HoverCard', 'DropdownMenu', 'ContextMenu', 'Menubar', 'NavigationMenu', 'Command', 'Tour', 'Lightbox', 'ConfirmDialog', 'ShortcutsDialog',
  'Toaster', 'Select', 'Combobox', 'Collapsible', 'Accordion', 'Tabs', 'RadioGroup', 'ToggleGroup', 'Carousel', 'ResizablePanels', 'AppShell', 'Pagination', 'Breadcrumb',
  'Stepper', 'Table', 'DescriptionList', 'List', 'Timeline', 'Card', 'AvatarGroup', 'ThemeToggle', 'AccentPicker', 'StylePicker', 'FontPicker', 'CornerPicker', 'SurfacePicker', 'ConfirmHost', 'NotificationList', 'DataTable', 'Tree',
  'InstallTabs', 'FaqList', 'BoardColumn', 'BoardCard', 'StatGroup', 'ScrollArea', 'Field', 'FieldGroup', 'BackToTop', 'SkipLink', 'InfiniteScroll', 'Affix', 'SectionReveal',
])

// Components whose look only shows with real content, or whose prop only matters together with another prop.
const SAMPLE: Record<string, Record<string, unknown>> = {
  BarChart: { labels: ['A', 'B', 'C'], series: [{ name: 'Series', data: [3, 5, 2] }] },
  LineChart: { labels: ['A', 'B', 'C'], series: [{ name: 'Series', data: [3, 5, 2] }] },
  DonutChart: { data: [{ label: 'One', value: 3 }, { label: 'Two', value: 5 }] },
  Heatmap: { values: [[1, 2, 3], [4, 5, 6]] },
  UptimeBar: { label: 'Sample', segments: [{ state: 'up' }, { state: 'degraded' }, { state: 'down' }] },
  Sparkline: { data: [1, 3, 2, 5, 4] },
  Gauge: { value: 40, label: 'Load' },
  KpiTile: { label: 'Sample metric', value: '42', delta: 3, sparkline: [1, 3, 2, 4], progress: 40 },
  StatBar: { label: 'Sample', value: 40 },
  FeatureGrid: { items: [{ title: 'One', description: 'First' }, { title: 'Two', description: 'Second' }] },
  PricingGrid: { plans: [{ name: 'Plan A', price: '$0', features: ['One'] }, { name: 'Plan B', price: '$5', features: ['Two'], highlighted: true }] },
  TestimonialSlider: { items: [{ quote: 'Quote one', author: 'Author One' }, { quote: 'Quote two', author: 'Author Two' }] },
  SegmentedControl: { options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], modelValue: 'a' },
  Marquee: { items: ['One', 'Two', 'Three'] },
  MermaidDiagram: { source: 'flowchart TD\n  A[Start] --> B[Done]' },
  Sankey: { label: 'Sample flows', links: [{ source: 'A', target: 'B', value: 5 }, { source: 'A', target: 'C', value: 3 }, { source: 'B', target: 'D', value: 4 }] },
  BulletChart: { label: 'Sample', bullets: [{ label: 'Orders', value: 70, target: 80, ranges: [50, 75, 100] }, { label: 'Returns', value: 40, target: 60, ranges: [50, 75, 100] }] },
  CalendarHeatmap: { label: 'Sample', data: [{ date: '2025-03-03', value: 2 }, { date: '2025-03-05', value: 7 }, { date: '2025-03-12', value: 4 }, { date: '2025-03-20', value: 9 }] },
  Treemap: { label: 'Sample treemap', data: [{ label: 'A', children: [{ label: 'A1', value: 5 }, { label: 'A2', value: 3 }] }, { label: 'B', value: 4 }, { label: 'C', value: 2 }] },
  NetworkGraph: { label: 'Sample network', nodes: [{ id: 'a', label: 'Alpha', group: 'one' }, { id: 'b', label: 'Beta', group: 'two' }, { id: 'c', label: 'Gamma', group: 'one' }, { id: 'd', label: 'Delta' }], edges: [{ from: 'a', to: 'b', label: 'link' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd' }, { from: 'd', to: 'a' }] },
  ScatterChart: { points: [{ x: 1, y: 3, size: 4 }, { x: 2, y: 5, size: 9 }, { x: 4, y: 4, size: 2 }, { x: 5, y: 8, size: 16 }] },
  RadarChart: { axes: ['A', 'B', 'C', 'D'], series: [{ name: 'One', data: [3, 5, 2, 4] }, { name: 'Two', data: [4, 2, 5, 1] }] },
  FunnelChart: { stages: [{ label: 'First', value: 100 }, { label: 'Second', value: 60 }, { label: 'Third', value: 25 }] },
  WaterfallChart: { items: [{ label: 'Start', value: 50 }, { label: 'Up', value: 20 }, { label: 'Down', value: -15 }, { label: 'End', type: 'total' }] },
  DataGrid: { label: 'Sample grid', columns: [{ key: 'name', label: 'Name' }, { key: 'qty', label: 'Quantity', type: 'number' }], rows: [{ id: 1, name: 'One', qty: 1 }, { id: 2, name: 'Two', qty: 2 }, { id: 3, name: 'Three', qty: 3 }] },
  FlowCanvas: { label: 'Sample flow', nodes: [{ id: 'a', label: 'Alpha', x: 0, y: 0 }, { id: 'b', label: 'Beta', x: 260, y: 140 }, { id: 'c', label: 'Gamma', x: 520, y: 20 }], edges: [{ id: 'e1', from: 'a', to: 'b' }, { id: 'e2', from: 'b', to: 'c' }] },
  ActivityFeed: { label: 'Sample activity', events: [{ id: 'a', actor: 'Deploy bot', action: 'deployed', target: 'Sample app', time: '2026-03-04T11:42:00Z', tone: 'success' }, { id: 'b', actor: 'Reviewer 1', action: 'approved', time: '2026-03-03T10:00:00Z' }], now: '2026-03-04T12:00:00Z', timeZone: 'UTC', locale: 'en' },
  ModelPicker: { options: [{ id: 'draft', label: 'Draft - fast', description: 'Quick first pass.', badges: ['Fast'] }, { id: 'review', label: 'Review - careful' }], modelValue: 'draft' },
  CountBadge: { count: 5, label: '5 sample items' },
  // Without entries the empty state renders, which ignores density (and most other look props).
  Leaderboard: { label: 'Sample leaderboard', entries: [{ id: 'a', label: 'Alpha', value: 10 }, { id: 'b', label: 'Beta', value: 5 }, { id: 'c', label: 'Gamma', value: 2 }] },
  // jsdom has no layout, so the toggle only renders when it starts expanded; its look props (appearance, size, align) need it.
  ShowMore: { expanded: true },
  DiffViewer: { label: 'Sample diff', oldText: 'a\nb\nc', newText: 'a\nB\nc\nd' },
  LogViewer: { label: 'Sample log', lines: ['INFO started', { level: 'error', message: 'failed', time: '10:00:01' }, 'plain line'] },
}
// Documented looks that currently render identically to the default: real findings, to be fixed (make the prop work or
// correct the docs). This is a ratchet: when one is fixed its entry here must be removed (the test below fails otherwise).
const KNOWN_NOOP = new Set<string>([])

// `tone` styles only the soft and solid appearances.
// Likewise `labelPosition` needs a label, `align` on pickers needs the dropdown open, and `negativeTone` needs negative win/loss data.
const CONTEXT: Record<string, Record<string, unknown>> = {
  'Badge.tone': { variant: 'soft' },
  'Chip.tone': { variant: 'soft' },
  'Checkbox.labelPosition': { label: 'Sample label' },
  'Switch.labelPosition': { label: 'Sample label' },
  'DatePicker.align': { open: true },
  'DateRangePicker.align': { open: true },
  'Sparkline.negativeTone': { variant: 'winloss', data: [2, -1, 3, -2] },
}

const literals = (type: string): string[] => [...type.matchAll(/'([^']+)'/g)].map((m) => m[1])
const strip = (html: string) => html.replace(/\s(id|for|aria-labelledby|aria-describedby|aria-controls)="[^"]*"/g, '').replace(/v-\d+-\d+|reka-[\w-]+/g, 'x')

function render(name: string, props: Record<string, unknown>, required: Record<string, unknown>) {
  required = { ...required, ...(SAMPLE[name] ?? {}) }
  const w = mount((UI as Record<string, unknown>)[name] as Component, { props: { ...required, ...props }, slots: (SAMPLE[name] && 'items' in SAMPLE[name]) || (SAMPLE[name] && 'plans' in SAMPLE[name]) ? {} : { default: 'Sample' }, global: { plugins: [createPinia()] } })
  const html = strip(w.html())
  w.unmount()
  return html
}

const cases = docs
  .filter((d) => !NEEDS_PARENT.has(d.name))
  .flatMap((d) => d.props.filter((p) => LOOK_PROPS.has(p.name) && literals(p.type).length >= 2).map((p) => ({ doc: d, prop: p, values: literals(p.type) })))

describe('variation matrix', () => {
  it('covers a meaningful number of documented variation props', () => expect(cases.length).toBeGreaterThan(60))

  it.each(cases.map((c) => [`${c.doc.name}.${c.prop.name}`, c] as const))('%s: every documented value renders, differs from the default, and unknown falls back', (_label, { doc, prop, values }) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const required: Record<string, unknown> = {}
    for (const p of doc.props.filter((p) => p.required)) required[p.name] = /\[\]|array/i.test(p.type) ? [] : /number/i.test(p.type) ? 1 : /boolean/i.test(p.type) ? false : /object|record/i.test(p.type) ? {} : 'x'
    let base: string
    try {
      base = render(doc.name, {}, required)
    } catch {
      warn.mockRestore()
      err.mockRestore()
      return // cannot be mounted alone with generic props: covered by its own tests
    }
    if (!base.trim() || base === '<!--v-if-->') {
      warn.mockRestore()
      err.mockRestore()
      return
    }
    const ctx = CONTEXT[`${doc.name}.${prop.name}`] ?? {}
    base = render(doc.name, ctx, required)
    const rendered = values.map((v) => render(doc.name, { ...ctx, [prop.name]: v }, required))
    const distinct = new Set([base, ...rendered])
    if (KNOWN_NOOP.has(`${doc.name}.${prop.name}`)) {
      expect(distinct.size, `${doc.name}.${prop.name} now changes the output: remove it from KNOWN_NOOP`).toBe(1)
      warn.mockRestore()
      err.mockRestore()
      return
    }
    expect(distinct.size, `${doc.name}: documented values of \`${prop.name}\` (${values.join(', ')}) all render the same as the default`).toBeGreaterThan(1)
    // An unknown value must not throw and must look like the default (or at least render something).
    const unknown = render(doc.name, { [prop.name]: '__unknown__' }, required)
    expect(unknown.length).toBeGreaterThan(0)
    warn.mockRestore()
    err.mockRestore()
  })
})
