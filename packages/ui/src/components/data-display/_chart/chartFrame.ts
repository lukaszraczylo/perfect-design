/**
 * Shared frame logic of the newer SVG charts (ScatterChart, RadarChart, FunnelChart, WaterfallChart): accessible name,
 * ids for the description and the summary, and the class fragments that keep marks visible in forced-colors mode.
 */
import { computed, useId } from 'vue'
import { hasText } from '../_shared/contract'
import { useChartContract } from './chartContract'

export interface ChartFrameProps {
  label?: string
  title?: string
  description?: string
}

/** Marks fall back to the system text colour in forced-colors mode, where the tone colours are not available. */
export const FORCED_FILL = 'forced-colors:fill-[CanvasText]'
export const FORCED_STROKE = 'forced-colors:stroke-[CanvasText]'
export const FORCED_CANVAS_STROKE = 'forced-colors:stroke-[Canvas]'

/**
 * Name, ids and root attributes of a chart. A chart is named by `label`, `aria-label`, `aria-labelledby` or, as the
 * visible alternative, `title`; none of them is a ContractError. `check` validates the data props.
 */
export function useChartFrame(component: string, props: ChartFrameProps, check: () => void, sources: (() => unknown)[]) {
  const uid = useId()
  const nameSource = {
    get label() {
      return hasText(props.label) ? props.label : hasText(props.title) ? props.title : undefined
    },
  }
  const { explicitName, labelledby, rootAttrs } = useChartContract(component, nameSource, check, [...sources, () => props.label, () => props.title])
  const ids = { summary: `${uid}-summary`, description: `${uid}-description`, pattern: `${uid}-pattern` }
  const hasTitle = computed(() => hasText(props.title))
  const hasDescription = computed(() => hasText(props.description))
  /** `aria-describedby` of the image: the visible description (when given) and the generated summary. */
  const describedby = computed(() => (hasDescription.value ? `${ids.description} ${ids.summary}` : ids.summary))
  return { explicitName, labelledby, rootAttrs, ids, hasTitle, hasDescription, describedby }
}

/** Bounding-box overlap of two label rectangles (used to drop value labels that would print on top of each other). */
export interface LabelBox {
  x0: number
  y0: number
  x1: number
  y1: number
}
export function overlaps(a: LabelBox, b: LabelBox): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0
}

/** Box of a text label of estimated width `w` and height `h` anchored at (x, y); anchor decides which side x is on. */
export function textBox(x: number, y: number, w: number, h: number, anchor: 'start' | 'middle' | 'end'): LabelBox {
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2
  return { x0, y0: y - h / 2, x1: x0 + w, y1: y + h / 2 }
}

/** Keep a centred label of width `w` inside [0, width]: returns the x to centre it on. */
export function clampCentre(x: number, w: number, width: number): number {
  if (w >= width) return width / 2
  return Math.min(width - w / 2, Math.max(w / 2, x))
}
