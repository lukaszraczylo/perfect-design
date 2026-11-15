/**
 * `renderModel`: AST in, a drawable model (SVG items plus text alternative) or a typed error out. Never throws.
 */
import { metricsFor } from '../../_diagram/text'
import { ParseFail, type MermaidParseError, type RenderModel, type RenderOptions, type RenderResult } from '../../_diagram/types'
import type { MermaidAst } from '../parse'
import { renderClass } from './class'
import { renderEr } from './er'
import { renderFlowchart } from './flowchart'
import { renderGantt } from './gantt'
import { renderJourney } from './journey'
import { renderMindmap } from './mindmap'
import { renderPie } from './pie'
import { renderSequence } from './sequence'
import { renderState } from './state'
import { renderTimeline } from './timeline'

function build(ast: MermaidAst, opts: RenderOptions): RenderModel {
  const m = metricsFor(opts.size, opts.density, opts.rounded)
  switch (ast.type) {
    case 'flowchart': return renderFlowchart(ast, opts, m)
    case 'sequence': return renderSequence(ast, opts, m)
    case 'pie': return renderPie(ast, opts, m)
    case 'state': return renderState(ast, opts, m)
    case 'er': return renderEr(ast, opts, m)
    case 'class': return renderClass(ast, opts, m)
    case 'gantt': return renderGantt(ast, opts, m)
    case 'mindmap': return renderMindmap(ast, opts, m)
    case 'timeline': return renderTimeline(ast, opts, m)
    default: return renderJourney(ast, opts, m)
  }
}

export function renderModel(ast: MermaidAst, options: RenderOptions = {}): RenderResult {
  try {
    return { ok: true, model: build(ast, options) }
  } catch (e) {
    if (e instanceof ParseFail) {
      const error: MermaidParseError = { code: e.code, message: e.message, line: e.line, column: e.column, sourceLine: '', diagramType: ast.type }
      return { ok: false, error }
    }
    const message = e instanceof Error ? e.message : 'unknown error'
    return { ok: false, error: { code: 'syntax', message: `The diagram could not be drawn (${message}).`, line: ast.headerLine, column: 1, sourceLine: '', diagramType: ast.type } }
  }
}
