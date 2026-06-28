import { describe, it, expect } from 'vitest'
import { detectBpm } from './bpm.ts'
import { HOP_SIZE } from './fft.ts'

const SAMPLE_RATE = 44100
const FPS = SAMPLE_RATE / HOP_SIZE // ~43.07 frames/sec

// Use exact integer beat periods to avoid sub-harmonic aliasing.
// The effective BPM from an integer period L is: (FPS * 60) / L.
function makeClickTrack(period: number, totalFrames: number): Float64Array {
  const onset = new Float64Array(totalFrames)
  for (let t = 0; t < totalFrames; t++) {
    if (t % period === 0) onset[t] = 1
  }
  return onset
}

function bpmFromPeriod(period: number): number {
  return (FPS * 60) / period
}

describe('detectBpm', () => {
  it('period-22 click track → ~117.5 BPM, within ±2%', () => {
    // period=22 frames → FPS*60/22 ≈ 117.5 BPM
    const signal = makeClickTrack(22, 3000)
    const detected = detectBpm(signal, SAMPLE_RATE)
    const expected = bpmFromPeriod(22)
    expect(detected / expected).toBeGreaterThan(0.98)
    expect(detected / expected).toBeLessThan(1.02)
  })

  it('period-30 click track → ~86 BPM, within ±2%', () => {
    const signal = makeClickTrack(30, 3000)
    const detected = detectBpm(signal, SAMPLE_RATE)
    const expected = bpmFromPeriod(30)
    expect(detected / expected).toBeGreaterThan(0.98)
    expect(detected / expected).toBeLessThan(1.02)
  })

  it('empty signal returns 0', () => {
    expect(detectBpm(new Float64Array(0), SAMPLE_RATE)).toBe(0)
  })
})
