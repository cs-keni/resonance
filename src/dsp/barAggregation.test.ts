import { describe, it, expect } from 'vitest'
import { aggregateBars, type FrameData } from './barAggregation.ts'

function makeFrame(time: number, pc: number, rmsVal: number): FrameData {
  const chroma = new Float64Array(12)
  chroma[pc] = 1
  return { time, chromagram: chroma, rms: rmsVal, centroid: 1000, onsetStrength: 0.5 }
}

describe('aggregateBars', () => {
  it('bpm=0 → returns [], no divide-by-zero', () => {
    expect(aggregateBars([0, 0.5, 1.0, 1.5, 2.0], [], 0)).toEqual([])
  })

  it('fewer than 5 beats → returns []', () => {
    // Need at least BEATS_PER_BAR+1=5 beats to form one bar
    expect(aggregateBars([0, 0.5, 1.0, 1.5], [], 120)).toEqual([])
  })

  it('empty beats → returns []', () => {
    expect(aggregateBars([], [], 120)).toEqual([])
  })

  it('produces correct number of bars from clean 4/4 beats', () => {
    // 9 beats → 2 complete bars (beats 0-3, 4-7; beat 8 is the boundary)
    const beats = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]
    const frames: FrameData[] = []
    for (let t = 0; t < 4.0; t += 0.05) frames.push(makeFrame(t, 0, 0.5))
    const bars = aggregateBars(beats, frames, 120)
    expect(bars.length).toBe(2)
  })

  it('bar RMS values are normalized to [0, 1]', () => {
    const beats = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]
    const frames: FrameData[] = []
    for (let t = 0; t < 4.0; t += 0.05) frames.push(makeFrame(t, 5, 0.3 + t * 0.1))
    const bars = aggregateBars(beats, frames, 120)
    for (const bar of bars) {
      expect(bar.rms).toBeGreaterThanOrEqual(0)
      expect(bar.rms).toBeLessThanOrEqual(1)
    }
  })

  it('dominant pitch class is the argmax of the bar chromagram', () => {
    const beats = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]
    const frames: FrameData[] = []
    // First bar (0–2s): pitch class 5 (F)
    for (let t = 0; t < 2.0; t += 0.1) frames.push(makeFrame(t, 5, 0.5))
    // Second bar (2–4s): pitch class 9 (A)
    for (let t = 2.0; t < 4.0; t += 0.1) frames.push(makeFrame(t, 9, 0.5))
    const bars = aggregateBars(beats, frames, 120)
    expect(bars[0]?.pitchClass).toBe(5)
    expect(bars[1]?.pitchClass).toBe(9)
  })
})
