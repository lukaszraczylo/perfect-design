import { describe, expect, it } from 'vitest'
import { colorTone, interpretStyle, mergeStyles, parseDecl } from './style'

describe('parseDecl', () => {
  it('splits key:value pairs, lower-cases keys and trims', () => {
    expect(parseDecl('Fill:#f96, stroke : #333 ,stroke-width:4px;')).toEqual({ fill: '#f96', stroke: '#333', 'stroke-width': '4px' })
  })
  it('keeps commas inside parentheses and ignores junk', () => {
    expect(parseDecl('fill:rgb(1,2,3),nokey,:novalue,x:')).toEqual({ fill: 'rgb(1,2,3)' })
    expect(parseDecl('')).toEqual({})
  })
})

describe('colorTone maps colours to the nearest tone, never to a raw colour', () => {
  it.each([
    ['#e11', 'danger'], ['#ff0000', 'danger'], ['#f96', 'warning'], ['#fc0', 'warning'], ['#2a2', 'success'], ['#00ff00', 'success'], ['#0cc', 'primary'],
    ['#26f', 'info'], ['#0000ff', 'info'], ['#a2f', 'primary'], ['#f06', 'danger'], ['#f0a', 'primary'], ['#888', 'neutral'], ['#fff', 'neutral'], ['#000', 'neutral'], ['#ff000080', 'danger'], ['#f00f', 'danger'],
    ['rgb(220, 30, 30)', 'danger'], ['rgba(30,200,30,0.5)', 'success'], ['red', 'danger'], ['Green', 'success'], ['blue', 'info'], ['orange', 'warning'], ['teal', 'primary'], ['gray', 'neutral'],
  ])('%s maps to %s', (value, tone) => {
    expect(colorTone(value)).toBe(tone)
  })
  it.each([[undefined], [''], ['none'], ['transparent'], ['inherit'], ['currentColor'], ['#12'], ['#12345'], ['notacolour'], ['url(#x)']])('%j carries no colour', (value) => {
    expect(colorTone(value)).toBeUndefined()
  })
})

describe('interpretStyle', () => {
  it('an explicit tone wins over colours and class names', () => {
    expect(interpretStyle({ tone: 'success', fill: '#e11' }, 'danger')).toEqual({ tone: 'success' })
  })
  it('a tone-like class name selects a tone', () => {
    expect(interpretStyle(undefined, 'Warning')).toEqual({ tone: 'warning' })
    expect(interpretStyle({}, 'failed')).toEqual({ tone: 'danger' })
    expect(interpretStyle(undefined, 'plain')).toEqual({})
  })
  it('fill wins over stroke, a neutral fill yields to a coloured stroke', () => {
    expect(interpretStyle({ fill: '#e11', stroke: '#2a2' })).toEqual({ tone: 'danger' })
    expect(interpretStyle({ fill: '#fff', stroke: '#2a2' })).toEqual({ tone: 'success' })
    expect(interpretStyle({ fill: '#fff', stroke: '#333' })).toEqual({ tone: 'neutral' })
    expect(interpretStyle({ stroke: '#26f' })).toEqual({ tone: 'info' })
  })
  it('dasharray makes it dashed and width 3 or more makes it thick', () => {
    expect(interpretStyle({ 'stroke-dasharray': '5 5' })).toEqual({ dashed: true })
    expect(interpretStyle({ 'stroke-dasharray': '0' })).toEqual({})
    expect(interpretStyle({ 'stroke-dasharray': 'none' })).toEqual({})
    expect(interpretStyle({ 'stroke-width': '4px' })).toEqual({ thick: true })
    expect(interpretStyle({ 'stroke-width': '2px' })).toEqual({})
    expect(interpretStyle({ 'stroke-width': 'wide' })).toEqual({})
  })
  it('ignores unknown tone words', () => {
    expect(interpretStyle({ tone: 'rainbow' })).toEqual({})
  })
})

describe('mergeStyles', () => {
  it('lets later styles win per field and skips undefined', () => {
    expect(mergeStyles({ tone: 'danger', dashed: true }, undefined, { tone: 'info' }, { thick: true })).toEqual({ tone: 'info', dashed: true, thick: true })
    expect(mergeStyles()).toEqual({})
  })
})
