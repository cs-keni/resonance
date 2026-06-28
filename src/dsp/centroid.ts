import { FFT_SIZE } from './fft.ts'

export function spectralCentroid(magnitudes: Float64Array, sampleRate: number): number {
  let weightedSum = 0
  let totalMag = 0

  for (let k = 0; k < magnitudes.length; k++) {
    const freq = (k * sampleRate) / FFT_SIZE
    const mag = magnitudes[k]!
    weightedSum += freq * mag
    totalMag += mag
  }

  // Guard: return 0 on silence (avoids NaN from 0/0)
  return totalMag === 0 ? 0 : weightedSum / totalMag
}
