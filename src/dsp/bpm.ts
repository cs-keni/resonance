import { HOP_SIZE } from './fft.ts'

export function detectBpm(onsetStrengths: Float64Array, sampleRate: number): number {
  if (onsetStrengths.length < 2) return 0

  const fps = sampleRate / HOP_SIZE
  // Search range: 40–240 BPM
  const minLag = Math.max(1, Math.floor((fps * 60) / 240))
  const maxLag = Math.min(onsetStrengths.length - 1, Math.floor((fps * 60) / 40))

  const n = onsetStrengths.length
  let bestLag = minLag
  let bestCorr = -Infinity

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0
    for (let t = 0; t < n - lag; t++) {
      corr += onsetStrengths[t]! * onsetStrengths[t + lag]!
    }
    if (corr > bestCorr) {
      bestCorr = corr
      bestLag = lag
    }
  }

  return (fps * 60) / bestLag
}
