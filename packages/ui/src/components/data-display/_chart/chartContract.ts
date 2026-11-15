/**
 * Contract checks shared by the SVG charts. A chart is exposed as `role="img"`, which needs a name, and its data props
 * must have the documented shape (an empty array is fine: it renders the `emptyText` state).
 */
import { computed, useAttrs } from 'vue'
import { requireOneOf, violation } from '../../../lib/contract'
import { hasText, useMountedCheck } from '../_shared/contract'

const NAME_HINT = 'The chart is an image for assistive technology, so name what it shows, e.g. `label="Requests per day"`.'

/**
 * Name handling and checks for a chart. `check` runs the shape checks of the data props (call `violation` from it).
 * Returns the explicit name (`label` or `aria-label`), the `aria-labelledby` value and the remaining attributes, which
 * the chart binds to its wrapper so the name lands on the image and not on a generic wrapper.
 */
export function useChartContract(component: string, props: { label?: string }, check: () => void, sources: (() => unknown)[]) {
  const attrs = useAttrs()
  const explicitName = computed(() => (hasText(props.label) ? props.label : hasText(attrs['aria-label']) ? (attrs['aria-label'] as string) : undefined))
  const labelledby = computed(() => (hasText(attrs['aria-labelledby']) ? (attrs['aria-labelledby'] as string) : undefined))
  const rootAttrs = computed(() => {
    const { 'aria-label': _label, 'aria-labelledby': _by, ...rest } = attrs
    return rest
  })
  useMountedCheck(() => {
    requireOneOf(component, { label: props.label, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, NAME_HINT)
    check()
  }, sources)
  return { explicitName, labelledby, rootAttrs }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** `labels` + `series` of BarChart and LineChart. */
export function checkCategorySeries(component: string, labels: unknown, series: unknown): void {
  if (!Array.isArray(labels)) violation(component, 'requires-labels', 'requires `labels`, an array of category names (one per point), e.g. `["Mon", "Tue"]`. An empty array shows the empty state.')
  if (!Array.isArray(series)) {
    violation(component, 'requires-series', 'requires `series`, an array of `{ name, data }` objects. An empty array shows the empty state.')
    return
  }
  series.forEach((s: unknown, i: number) => {
    if (!isRecord(s) || !Array.isArray(s.data)) {
      violation(component, 'series-shape', `series ${i + 1} needs a \`data\` array of numbers: \`{ name: "Requests", data: [3, 5, 4] }\`.`)
    }
  })
}
