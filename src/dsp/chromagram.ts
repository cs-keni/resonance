import { FFT_SIZE } from './fft.ts'

// C0 reference frequency for pitch class mapping
const C0_HZ = 16.3516

export function chromagram(magnitudes: Float64Array, sampleRate: number): Float64Array {
  const profile = new Float64Array(12)
  const numBins = magnitudes.length

  for (let k = 1; k < numBins; k++) {
    const freq = (k * sampleRate) / FFT_SIZE
    if (freq < 20) continue

    const midi = 12 * Math.log2(freq / C0_HZ)
    const pc = ((Math.round(midi) % 12) + 12) % 12
    profile[pc] += magnitudes[k]!
  }
  return profile
}

export function addChromagram(acc: Float64Array, profile: Float64Array): void {
  for (let i = 0; i < 12; i++) acc[i] += profile[i]!
}
