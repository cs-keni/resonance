import { describe, it, expect } from 'vitest'
import { trackBeats } from './beats.ts'
import { HOP_SIZE } from './fft.ts'

const SAMPLE_RATE = 44100

function makeClickTrack(bpm: number, durationSeconds: number): Float64Array {
  const fps = SAMPLE_RATE / HOP_SIZE
  const totalFrames = Math.floor(durationSeconds * fps)
  const beatPeriod = (fps * 60) / bpm
  const onset = new Float64Array(totalFrames)
  for (let t = 0; t < totalFrames; t++) {
    if (Math.round(t % beatPeriod) === 0) onset[t] = 1
  }
  return onset
}

describe('trackBeats', () => {
  it('returns [] for bpm=0', () => {
    const signal = makeClickTrack(120, 10)
    expect(trackBeats(signal, 0, SAMPLE_RATE)).toEqual([])
  })

  it('returns [] for empty signal', () => {
    expect(trackBeats(new Float64Array(0), 120, SAMPLE_RATE)).toEqual([])
  })

  it('120 BPM click track → beat spacing within ±5% of 0.5s', () => {
    const signal = makeClickTrack(120, 30)
    const beats = trackBeats(signal, 120, SAMPLE_RATE)

    expect(beats.length).toBeGreaterThan(10)

    const spacings = beats.slice(1).map((t, i) => t - beats[i]!)
    const meanSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length
    const expectedSpacing = 60 / 120 // 0.5s

    expect(meanSpacing).toBeGreaterThan(expectedSpacing * 0.95)
    expect(meanSpacing).toBeLessThan(expectedSpacing * 1.05)
  })

  it('beats are strictly increasing', () => {
    const signal = makeClickTrack(120, 20)
    const beats = trackBeats(signal, 120, SAMPLE_RATE)
    for (let i = 1; i < beats.length; i++) {
      expect(beats[i]!).toBeGreaterThan(beats[i - 1]!)
    }
  })
})
