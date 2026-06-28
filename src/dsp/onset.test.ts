import { describe, it, expect } from 'vitest'
import { onsetStrength } from './onset.ts'

describe('onsetStrength', () => {
  it('identical frames → 0 (no flux)', () => {
    const mag = new Float64Array([1, 2, 3, 4, 5])
    expect(onsetStrength(mag, mag)).toBe(0)
  })

  it('energy increase → positive flux', () => {
    const prev = new Float64Array([1, 1, 1])
    const curr = new Float64Array([2, 2, 2])
    expect(onsetStrength(curr, prev)).toBeCloseTo(3)
  })

  it('energy decrease → 0 (negative flux is ignored)', () => {
    const prev = new Float64Array([5, 5, 5])
    const curr = new Float64Array([1, 1, 1])
    expect(onsetStrength(curr, prev)).toBe(0)
  })

  it('mixed: only positive differences count', () => {
    const prev = new Float64Array([1, 5, 1])
    const curr = new Float64Array([3, 2, 4]) // +2, -3, +3
    expect(onsetStrength(curr, prev)).toBeCloseTo(5) // 2 + 3
  })
})
