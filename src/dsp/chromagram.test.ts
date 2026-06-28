import { describe, it, expect } from 'vitest'
import { magnitudeSpectrum, FFT_SIZE } from './fft.ts'
import { chromagram } from './chromagram.ts'

const SAMPLE_RATE = 44100

// A4 = 440 Hz → pitch class 9 (A = 0:C, 1:C#, 2:D, 3:D#, 4:E, 5:F, 6:F#, 7:G, 8:G#, 9:A)
describe('chromagram', () => {
  it('440 Hz sine wave → A (pitch class 9) is dominant', () => {
    const samples = new Float32Array(FFT_SIZE)
    for (let i = 0; i < FFT_SIZE; i++) {
      samples[i] = Math.sin((2 * Math.PI * 440 * i) / SAMPLE_RATE)
    }
    const mag = magnitudeSpectrum(samples)
    const profile = chromagram(mag, SAMPLE_RATE)

    const dominant = Array.from(profile).indexOf(Math.max(...profile))
    expect(dominant).toBe(9) // A
  })

  it('returns a 12-element profile', () => {
    const mag = new Float64Array(FFT_SIZE / 2 + 1)
    const profile = chromagram(mag, SAMPLE_RATE)
    expect(profile.length).toBe(12)
  })

  it('silence returns all-zero profile', () => {
    const mag = new Float64Array(FFT_SIZE / 2 + 1)
    const profile = chromagram(mag, SAMPLE_RATE)
    expect(Math.max(...profile)).toBe(0)
  })
})
