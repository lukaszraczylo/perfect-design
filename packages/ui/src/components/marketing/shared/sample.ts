/**
 * Offline sample image for docs examples and tests: flat neutral panels, no gradients, no remote URL.
 * It is a placeholder asset (an <img> cannot read CSS tokens), never a design surface. Not exported from the barrel.
 */
export type SampleRatio = '16/9' | '4/3' | '1/1'

const SIZES: Record<SampleRatio, [number, number]> = { '16/9': [16, 9], '4/3': [4, 3], '1/1': [1, 1] }

/** `data:image/svg+xml` URI of a flat placeholder panel with a few block shapes. */
export function sampleImage(ratio: SampleRatio = '16/9'): string {
  const [w, h] = SIZES[ratio] ?? SIZES['16/9']
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='xMidYMid slice'>` +
    `<rect width='${w}' height='${h}' fill='%23e4e2dc'/>` +
    `<rect x='${w * 0.1}' y='${h * 0.15}' width='${w * 0.5}' height='${h * 0.12}' fill='%23b9b6ad'/>` +
    `<rect x='${w * 0.1}' y='${h * 0.35}' width='${w * 0.8}' height='${h * 0.5}' fill='%23cfccc3'/>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${svg}`
}
