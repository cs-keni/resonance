import { describe, it, expect } from 'vitest'
import { rms } from './rms.ts'

describe('rms', () => {
  it('silence returns 0', () => {
    expect(rms(new Float32Array(1024))).toBe(0)
  })

  it('unit DC signal returns 1', () => {
    const samples = new Float32Array(1024).fill(1)
    expect(rms(samples)).toBeCloseTo(1, 10)
  })

  it('sine wave of amplitude A returns A / sqrt(2)', () => {
    const samples = new Float32Array(4096)
    const A = 0.8
    for (let i = 0; i < samples.length; i++) {
      samples[i] = A * Math.sin((2 * Math.PI * i) / 64)
    }
    expect(rms(samples)).toBeCloseTo(A / Math.sqrt(2), 3)
  })
})
