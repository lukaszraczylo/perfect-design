import { cn } from '../../../lib/cn'
import { oneOf } from './pick'

/**
 * Shared look dimensions for marketing cards (FeatureCard, Testimonial and the grids that pass them down).
 * `tone` swaps the surface; each tone pairs a surface with a text token the contrast test already covers
 * (foreground on muted, primary-foreground on primary, background on foreground).
 */
export const SURFACE_TONES = ['default', 'muted', 'primary', 'inverted'] as const
export type SurfaceTone = (typeof SURFACE_TONES)[number]
export const SURFACE_SIZES = ['sm', 'md', 'lg'] as const
export type SurfaceSize = (typeof SURFACE_SIZES)[number]
export const SURFACE_SHAPES = ['rounded', 'square'] as const
export type SurfaceShape = (typeof SURFACE_SHAPES)[number]
export const SURFACE_GAPS = ['sm', 'md', 'lg'] as const
export type SurfaceGap = (typeof SURFACE_GAPS)[number]

export const resolveSurfaceTone = (value: unknown): SurfaceTone => oneOf(value, SURFACE_TONES, 'default')
export const resolveSurfaceSize = (value: unknown): SurfaceSize => oneOf(value, SURFACE_SIZES, 'md')
export const resolveSurfaceShape = (value: unknown): SurfaceShape => oneOf(value, SURFACE_SHAPES, 'rounded')
export const resolveSurfaceGap = (value: unknown): SurfaceGap => oneOf(value, SURFACE_GAPS, 'md')

/** Wrap a cva helper so its output is conflict-free (later classes win) when used outside a component. */
export function merged<A extends unknown[]>(fn: (...args: A) => string): (...args: A) => string {
  return (...args) => cn(fn(...args))
}
