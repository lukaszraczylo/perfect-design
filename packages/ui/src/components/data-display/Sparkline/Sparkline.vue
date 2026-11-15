<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { requireOneOf, violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { curveAreaPath, curvePath, extent, formatNumber, isFiniteNumber, isolatedPoints, normalizeCurve, r2, runs, type Curve, type Point } from '../_chart/chartMath'
import { dimension, oneOf, scaleSafe } from '../_chart/chartKit'
import { useMountedCheck } from '../_shared/contract'
import { toneClasses, type ChartTone } from '../_chart/tones'
import { sparklineVariants, type SparklineSize, type SparklineVariant } from './variants'

export interface SparklineProps extends BaseProps {
  /** Series values. NaN / Infinity / null entries become gaps. */
  data: number[]
  tone?: ChartTone
  /**
   * `line`, `area` (soft fill), `bar` (one bar per value from a zero baseline) or `winloss` (equal squares up for positive
   * values and down for negative ones, a short tick for zero). Without it, `area` decides between `line` and `area`.
   */
  variant?: SparklineVariant
  /** Soft fill under the line. Same as `variant="area"`. */
  area?: boolean
  /** How `line` and `area` join points: straight, a monotone smooth curve or steps. */
  curve?: Curve
  /** Rendered width: `sm` w-16, `md` w-24, `lg` w-32. `class` overrides it. */
  size?: SparklineSize
  /** Tone of negative values in `bar` and `winloss`. Their position below the baseline is the primary cue; colour repeats it. */
  negativeTone?: ChartTone
  strokeWidth?: number
  /** ViewBox width (the rendered size is controlled with `class`). */
  width?: number
  /** ViewBox height. */
  height?: number
  /** Accessible label (or pass `aria-label`). Required: without it the chart falls back to an auto-generated summary of the numbers. */
  label?: string
  /** Emphasise the last value with a dot. */
  showLast?: boolean
}

const props = withDefaults(defineProps<SparklineProps>(), {
  tone: 'chart-1',
  area: false,
  curve: 'linear',
  size: 'md',
  negativeTone: 'danger',
  strokeWidth: 1.5,
  width: 96,
  height: 32,
  showLast: false,
})

const attrs = useAttrs()
useMountedCheck(
  () => {
    requireOneOf('Sparkline', { label: props.label, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, 'The sparkline is an image for assistive technology, so say what it shows, e.g. `label="Signups, last 7 days"`.')
    if (!Array.isArray(props.data)) violation('Sparkline', 'requires-data', 'requires `data`, an array of numbers. An empty array draws nothing.')
  },
  [() => props.data],
)

const W = computed(() => dimension(props.width, 96))
const H = computed(() => dimension(props.height, 32))
const sw = computed(() => dimension(props.strokeWidth, 1.5))
const classes = computed(() => toneClasses[props.tone] ?? toneClasses['chart-1'])
const negClasses = computed(() => toneClasses[props.negativeTone] ?? toneClasses.danger)
const mode = computed(() => oneOf<SparklineVariant>(props.variant, ['line', 'area', 'bar', 'winloss'], props.area ? 'area' : 'line'))
const barMode = computed(() => mode.value === 'bar' || mode.value === 'winloss')
const curve = computed(() => normalizeCurve(props.curve))

const values = computed<unknown[]>(() => (Array.isArray(props.data) ? props.data : []))
const range = computed(() => extent(values.value))

const model = computed(() => {
  const r = range.value
  const n = values.value.length
  if (!r) return { points: [] as (Point | null)[], first: null as number | null, last: null as number | null, lastPoint: null as Point | null }
  const pad = Math.max(sw.value, 3) + 1
  const x0 = Math.min(pad, W.value / 2)
  const x1 = W.value - x0
  const y0 = Math.min(pad, H.value / 2)
  const y1 = H.value - y0
  const sy = scaleSafe(r[0], r[1], y1, y0)
  const points: (Point | null)[] = new Array(n)
  let first: number | null = null
  let last: number | null = null
  let lastPoint: Point | null = null
  for (let i = 0; i < n; i++) {
    const v = values.value[i]
    if (!isFiniteNumber(v)) {
      points[i] = null
      continue
    }
    const p = { x: n === 1 ? W.value / 2 : x0 + (i * (x1 - x0)) / (n - 1), y: sy(v) }
    points[i] = p
    if (first === null) first = v
    last = v
    lastPoint = p
  }
  return { points, first, last, lastPoint }
})

const line = computed(() => (!barMode.value && runs(model.value.points).some((r) => r.length > 1) ? curvePath(model.value.points, curve.value) : ''))
const fill = computed(() => (mode.value === 'area' ? curveAreaPath(model.value.points, H.value, curve.value) : ''))
const dots = computed(() => {
  if (barMode.value) return []
  const last = model.value.lastPoint
  return isolatedPoints(model.value.points).filter((p) => p !== last)
})
const lastDot = computed(() => {
  const p = model.value.lastPoint
  if (!p || barMode.value) return null
  return props.showLast || isolatedPoints(model.value.points).includes(p) ? p : null
})

/** One closed rectangle sub-path. */
const rectPath = (x: number, y: number, w: number, h: number) => `M${r2(x)},${r2(y)} h${r2(w)} v${r2(h)} h${r2(-w)} Z`

/**
 * Bars for `bar` and `winloss`. Bar heights are proportional to the value from a zero baseline; win/loss squares all have
 * the same height and sit above or below the centre line, so the sign reads without colour.
 */
const bars = computed(() => {
  const empty = { up: '', down: '', zero: '', baseline: null as number | null }
  const r = range.value
  if (!barMode.value || !r) return empty
  const n = values.value.length
  const pad = Math.max(sw.value, 3) + 1
  const x0 = Math.min(pad, W.value / 2)
  const x1 = W.value - x0
  const y0 = Math.min(pad, H.value / 2)
  const y1 = H.value - y0
  const slot = (x1 - x0) / n
  const bw = Math.max(1, Math.min(slot * 0.7, 8))
  const winloss = mode.value === 'winloss'
  const sy = scaleSafe(Math.min(0, r[0]), Math.max(0, r[1]), y1, y0)
  const base = winloss ? (y0 + y1) / 2 : sy(0)
  const half = Math.max(1, (y1 - y0) / 2 - 0.5)
  const up: string[] = []
  const down: string[] = []
  const zero: string[] = []
  let negative = false
  values.value.forEach((v, i) => {
    if (!isFiniteNumber(v)) return
    const x = x0 + (i + 0.5) * slot - bw / 2
    if (v === 0) {
      if (winloss) zero.push(rectPath(x, base - 0.75, bw, 1.5))
    } else if (v > 0) {
      const h = winloss ? half : Math.max(1, base - sy(v))
      up.push(rectPath(x, base - h - (winloss ? 0.5 : 0), bw, h))
    } else {
      negative = true
      const h = winloss ? half : Math.max(1, sy(v) - base)
      down.push(rectPath(x, base + (winloss ? 0.5 : 0), bw, h))
    }
  })
  return { up: up.join(' '), down: down.join(' '), zero: zero.join(' '), baseline: winloss || negative ? r2(base) : null }
})

const summary = computed(() => {
  const r = range.value
  if (!r) return 'No data'
  if (mode.value === 'winloss') {
    const nums = values.value.filter(isFiniteNumber)
    const wins = nums.filter((v) => v > 0).length
    const losses = nums.filter((v) => v < 0).length
    return `Wins and losses: ${wins} ${wins === 1 ? 'win' : 'wins'}, ${losses} ${losses === 1 ? 'loss' : 'losses'}, ${nums.length - wins - losses} even`
  }
  const count = values.value.filter(isFiniteNumber).length
  return `Trend: ${count} ${count === 1 ? 'point' : 'points'}, from ${formatNumber(model.value.first!)} to ${formatNumber(model.value.last!)}, min ${formatNumber(r[0])}, max ${formatNumber(r[1])}`
})
const sizeClass = computed(() => sparklineVariants({ size: oneOf<SparklineSize>(props.size, ['sm', 'md', 'lg'], 'md') }))
const dotR = computed(() => r2(Math.max(sw.value * 1.4, 2)))
</script>

<template>
  <svg
    data-slot="sparkline"
    role="img"
    :aria-label="label || summary"
    :viewBox="`0 0 ${W} ${H}`"
    :class="cn(sizeClass, $props.class)"
    :data-variant="mode === 'line' || mode === 'area' ? undefined : mode"
  >
    <line
      v-if="bars.baseline !== null"
      data-slot="sparkline-baseline"
      :x1="0" :x2="W" :y1="bars.baseline" :y2="bars.baseline"
      stroke-width="1"
      class="stroke-border"
    />
    <path v-if="bars.up" data-slot="sparkline-bars" :d="bars.up" :class="[classes.fill, 'stroke-none']" />
    <path v-if="bars.down" data-slot="sparkline-bars-negative" :d="bars.down" :class="[negClasses.fill, 'stroke-none']" />
    <path v-if="bars.zero" data-slot="sparkline-bars-zero" :d="bars.zero" class="fill-muted-foreground stroke-none" />
    <path v-if="fill" data-slot="sparkline-area" :d="fill" :class="[classes.fillSoft, 'stroke-none']" />
    <path
      v-if="line"
      data-slot="sparkline-line"
      :d="line"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      :stroke-width="sw"
      :class="classes.stroke"
    />
    <circle
      v-for="(p, i) in dots"
      :key="i"
      data-slot="sparkline-dot"
      :cx="r2(p.x)"
      :cy="r2(p.y)"
      :r="dotR"
      :class="classes.fill"
    />
    <circle
      v-if="lastDot"
      data-slot="sparkline-last"
      :cx="r2(lastDot.x)"
      :cy="r2(lastDot.y)"
      :r="dotR"
      :class="classes.fill"
    />
  </svg>
</template>
