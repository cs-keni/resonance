import { describe, it, expect } from 'vitest'
import { magnitudeSpectrum, FFT_SIZE } from './fft.ts'

describe('magnitudeSpectrum', () => {
  it('returns the correct number of bins', () => {
    const samples = new Float32Array(FFT_SIZE)
    const mag = magnitudeSpectrum(samples)
    expect(mag.length).toBe(FFT_SIZE / 2 + 1)
  })

  it('silence produces near-zero magnitudes', () => {
    const samples = new Float32Array(FFT_SIZE) // all zeros
    const mag = magnitudeSpectrum(samples)
    const max = Math.max(...mag)
    expect(max).toBeLessThan(1e-10)
  })

  it('440 Hz sine wave produces a peak near the A4 bin', () => {
    const sampleRate = 44100
    const samples = new Float32Array(FFT_SIZE)
    for (let i = 0; i < FFT_SIZE; i++) {
      samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate)
    }

    const mag = magnitudeSpectrum(samples)

    // 440 Hz bin = round(440 * FFT_SIZE / sampleRate) = round(20.39) = 20
    const expectedBin = Math.round((440 * FFT_SIZE) / sampleRate)
    const peak = Array.from(mag).indexOf(Math.max(...mag))
    expect(Math.abs(peak - expectedBin)).toBeLessThanOrEqual(1)
  })
})
