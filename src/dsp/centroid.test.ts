import { describe, it, expect } from 'vitest'
import { spectralCentroid } from './centroid.ts'
import { FFT_SIZE } from './fft.ts'

const SAMPLE_RATE = 44100
const NUM_BINS = FFT_SIZE / 2 + 1

describe('spectralCentroid', () => {
  it('silence (all-zero magnitudes) returns 0, not NaN', () => {
    const mag = new Float64Array(NUM_BINS)
    const result = spectralCentroid(mag, SAMPLE_RATE)
    expect(result).toBe(0)
    expect(Number.isNaN(result)).toBe(false)
  })

  it('single bin has centroid at that frequency', () => {
    const targetBin = 100
    const targetFreq = (targetBin * SAMPLE_RATE) / FFT_SIZE
    const mag = new Float64Array(NUM_BINS)
    mag[targetBin] = 1.0
    const result = spectralCentroid(mag, SAMPLE_RATE)
    expect(result).toBeCloseTo(targetFreq, 1)
  })

  it('two equal bins → centroid halfway between them', () => {
    const binA = 50, binB = 150
    const freqA = (binA * SAMPLE_RATE) / FFT_SIZE
    const freqB = (binB * SAMPLE_RATE) / FFT_SIZE
    const mag = new Float64Array(NUM_BINS)
    mag[binA] = 1.0
    mag[binB] = 1.0
    const result = spectralCentroid(mag, SAMPLE_RATE)
    expect(result).toBeCloseTo((freqA + freqB) / 2, 1)
  })
})
