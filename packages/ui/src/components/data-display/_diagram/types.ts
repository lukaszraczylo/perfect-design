/**
 * Shared types of the Mermaid renderer: tones, parse errors, the render model that every diagram type produces and the
 * text alternative. Pure types and constants, no Vue.
 */

export const DIAGRAM_TONES = ['neutral', 'primary', 'success', 'info', 'warning', 'danger'] as const
export type DiagramTone = (typeof DIAGRAM_TONES)[number]
/** Categorical slots (pie slices, journey sections...). They resolve to the `chart-1..5` tokens. */
export type ChartSlot = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'
export type PaintTone = DiagramTone | ChartSlot

export type Direction = 'TB' | 'BT' | 'LR' | 'RL'
export const DIRECTIONS: readonly Direction[] = ['TB', 'BT', 'LR', 'RL']
export type EdgeStyle = 'curved' | 'straight' | 'orthogonal'
export type DiagramSize = 'sm' | 'md' | 'lg'
export type DiagramDensity = 'compact' | 'comfortable' | 'spacious'
export type DiagramRounded = 'none' | 'sm' | 'md' | 'full'

export interface Point {
  x: number
  y: number
}

/* ------------------------------------------------------------------ errors */

export type ParseErrorCode = 'empty' | 'syntax' | 'unsupported' | 'limit'

/** A problem found while parsing or laying out. `line` and `column` are 1-based and point into the original source. */
export interface MermaidParseError {
  code: ParseErrorCode
  message: string
  line: number
  column: number
  /** The offending source line (without line ending), for display. Empty when there is no line. */
  sourceLine: string
  /** Diagram type keyword when known, for example `gitGraph` for an unsupported type. */
  diagramType?: string
}

/** Thrown inside parsers; `parseMermaid` converts it into a typed error. Never escapes the public API. */
export class ParseFail extends Error {
  readonly line: number
  readonly column: number
  readonly code: ParseErrorCode
  constructor(line: number, column: number, message: string, code: ParseErrorCode = 'syntax') {
    super(message)
    this.name = 'ParseFail'
    this.line = line
    this.column = column
    this.code = code
  }
}

export const fail = (line: number, column: number, message: string): never => {
  throw new ParseFail(line, column, message)
}

/* ------------------------------------------------------------------ source preparation */

/** One significant source line: comments, blank lines, directives and accessibility lines are already removed. */
export interface SourceLine {
  /** 1-based line number in the original source. */
  no: number
  /** Text with leading and trailing whitespace removed. */
  text: string
  /** Number of leading whitespace characters (a tab counts as one; mindmap compares them relatively). */
  indent: number
  /** 1-based column of the first character of `text`. */
  col: number
}

export interface DiagramMeta {
  /** From the front matter `title:` or a diagram-specific `title` line. */
  title?: string
  accTitle?: string
  accDescr?: string
}

/* ------------------------------------------------------------------ render model */

export type Marker =
  | 'arrow' | 'open' | 'cross' | 'circle'
  | 'triangle' | 'diamond' | 'diamond-filled'
  | 'one' | 'exactly-one' | 'zero-one' | 'many' | 'zero-many' | 'one-many'

/**
 * How a shape is painted. The variant of the component decides the actual classes:
 * `surface` is a node body, `muted` a container or panel, `solid` a filled accent (bar, slice), `canvas` the colour
 * of the diagram background (label plates), `none` leaves it open.
 */
export interface Paint {
  fill: 'surface' | 'muted' | 'solid' | 'canvas' | 'none'
  tone: PaintTone
  stroke: 'none' | 'thin' | 'normal' | 'thick'
  dash?: 'dashed' | 'dotted'
}

export interface RShape {
  kind: 'shape'
  d: string
  paint: Paint
  /** Native tooltip. */
  title?: string
  /** Hook for tests and CSS: `node`, `cluster`, `lifeline`... */
  role: string
  id?: string
}

export interface RPath {
  kind: 'path'
  d: string
  style: 'solid' | 'dashed' | 'dotted'
  thick?: boolean
  markerStart?: Marker
  markerEnd?: Marker
  /** Lighter line for grids, lifelines and axes. */
  faint?: boolean
  role: string
  id?: string
  /** Tone of the stroke; default is the neutral edge colour. */
  tone?: PaintTone
}

export interface RText {
  kind: 'text'
  x: number
  y: number
  /** One entry per line; centred vertically on `y`. */
  lines: string[]
  anchor: 'start' | 'middle' | 'end'
  size: number
  bold?: boolean
  muted?: boolean
  mono?: boolean
  italic?: boolean
  /** Text sits on a solid fill of this tone, so it uses the matching foreground token. */
  onSolid?: PaintTone
  /** Rotation in degrees around (x, y). */
  rotate?: number
  role: string
  id?: string
  /** Native tooltip, for example the full text of a truncated label. */
  title?: string
}

export type RenderItem = RShape | RPath | RText

/** Text alternative: what a screen reader (or the "Show as text" disclosure) reads instead of the picture. */
export interface TextAlt {
  sections: { title: string; ordered: boolean; items: string[] }[]
}

export interface RenderModel {
  type: string
  /** Title written in the diagram itself (`pie title ...`, `title ...`); the component shows it as the caption, so renderers must NOT draw it inside the SVG. */
  title?: string
  width: number
  height: number
  items: RenderItem[]
  alt: TextAlt
  /** One sentence for the image description, e.g. "Flowchart with 6 nodes and 7 connections, top to bottom". */
  summary: string
  /** Counts for the `rendered` event. */
  nodes: number
  edges: number
  /** Base font size in user units (px at natural size). */
  fontSize: number
}

/** Result of `renderModel`: a model, or a typed error (limits, empty graphs). */
export type RenderResult = { ok: true; model: RenderModel } | { ok: false; error: MermaidParseError }

export interface RenderOptions {
  direction?: Direction
  edgeStyle?: EdgeStyle
  size?: DiagramSize
  density?: DiagramDensity
  rounded?: DiagramRounded
  tone?: DiagramTone
  maxNodes?: number
  maxEdges?: number
  /** Title from the component prop; wins over the title in the source. */
  title?: string
}

/** Metrics derived from `size`, `density` and `rounded`, shared by every renderer. */
export interface Metrics {
  font: number
  lineHeight: number
  padX: number
  padY: number
  nodeSep: number
  rankSep: number
  radius: number
  wrap: number
  margin: number
}
