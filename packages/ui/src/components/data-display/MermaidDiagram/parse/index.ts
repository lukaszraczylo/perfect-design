/**
 * `parseMermaid`: Mermaid source text in, a typed AST or typed errors out. Never throws.
 */
import { prepareSource, splitSemicolons, toParseError, SUPPORTED_KEYWORDS, UNSUPPORTED_TYPES, splitSource, type PreparedSource } from '../../_diagram/source'
import { ParseFail, type MermaidParseError } from '../../_diagram/types'
import { parseClass, type ClassAst } from './class'
import { parseEr, type ErAst } from './er'
import { parseFlowchart, type FlowchartAst } from './flowchart'
import { parseGantt, type GanttAst } from './gantt'
import { parseJourney, type JourneyAst } from './journey'
import { parseMindmap, type MindmapAst } from './mindmap'
import { parsePie, type PieAst } from './pie'
import { parseSequence, type SequenceAst } from './sequence'
import { parseState, type StateAst } from './state'
import { parseTimeline, type TimelineAst } from './timeline'

export type MermaidAst = (FlowchartAst | SequenceAst | PieAst | StateAst | ErAst | ClassAst | GanttAst | MindmapAst | TimelineAst | JourneyAst) & {
  /** 1-based line of the diagram keyword. */
  headerLine: number
}
export type MermaidDiagramType = MermaidAst['type']
export type ParseResult = { ok: true; ast: MermaidAst } | { ok: false; errors: MermaidParseError[] }

const PARSERS: Record<string, (p: PreparedSource) => Omit<MermaidAst, 'headerLine'>> = {
  graph: parseFlowchart,
  flowchart: parseFlowchart,
  'flowchart-elk': parseFlowchart,
  sequenceDiagram: parseSequence,
  pie: parsePie,
  stateDiagram: parseState,
  'stateDiagram-v2': parseState,
  erDiagram: parseEr,
  classDiagram: parseClass,
  'classDiagram-v2': parseClass,
  gantt: parseGantt,
  mindmap: parseMindmap,
  timeline: parseTimeline,
  journey: parseJourney,
}

/** Diagram types in which `;` ends a statement (flowcharts do their own splitting, they need bracket awareness). */
const SEMICOLON_TYPES = new Set(['sequenceDiagram', 'stateDiagram', 'stateDiagram-v2', 'erDiagram', 'classDiagram', 'classDiagram-v2'])

export function parseMermaid(source: unknown): ParseResult {
  let prepared: PreparedSource | undefined
  try {
    prepared = prepareSource(source)
    const parse = Object.hasOwn(PARSERS, prepared.keyword) ? PARSERS[prepared.keyword] : undefined
    if (!parse) {
      const unsupported = UNSUPPORTED_TYPES.includes(prepared.keyword)
      throw new ParseFail(
        prepared.header.no,
        prepared.header.col,
        unsupported
          ? `The diagram type "${prepared.keyword}" is not supported. Supported types: ${SUPPORTED_KEYWORDS.join(', ')}.`
          : `Unknown diagram type "${prepared.keyword}". Supported types: ${SUPPORTED_KEYWORDS.join(', ')}.`,
        unsupported ? 'unsupported' : 'syntax',
      )
    }
    if (SEMICOLON_TYPES.has(prepared.keyword)) {
      const semi = prepared.rest.indexOf(';')
      if (semi !== -1) {
        // statements after the keyword on the header line move to their own lines
        const tail = prepared.rest.slice(semi + 1)
        const at = prepared.header.col + prepared.header.text.length - tail.length
        prepared.lines.unshift({ no: prepared.header.no, text: tail, indent: 0, col: at })
        prepared.rest = prepared.rest.slice(0, semi).trim()
      }
      prepared.lines = splitSemicolons(prepared.lines)
    }
    const ast = parse(prepared)
    return { ok: true, ast: { ...ast, headerLine: prepared.header.no } as MermaidAst }
  } catch (e) {
    if (e instanceof ParseFail) return { ok: false, errors: [toParseError(e, prepared?.raw ?? splitSource(source), prepared?.keyword)] }
    // a parser bug must not take the page down: report it as a syntax problem at the top
    const message = e instanceof Error ? e.message : 'unknown error'
    return { ok: false, errors: [{ code: 'syntax', message: `The diagram could not be read (${message}).`, line: 1, column: 1, sourceLine: splitSource(source)[0] ?? '' }] }
  }
}

export type { FlowchartAst, SequenceAst, PieAst, StateAst, ErAst, ClassAst, GanttAst, MindmapAst, TimelineAst, JourneyAst }
