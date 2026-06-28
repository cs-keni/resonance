import { HOP_SIZE } from './fft.ts'

// Dynamic-programming beat tracker after Ellis (2007).
// Finds the globally optimal set of beat positions given an onset strength
// signal and a prior BPM estimate.
export function trackBeats(
  onsetStrengths: Float64Array,
  bpm: number,
  sampleRate: number,
): number[] {
  if (bpm === 0 || onsetStrengths.length === 0) return []

  const fps = sampleRate / HOP_SIZE
  const beatPeriod = (fps * 60) / bpm // frames per beat
  const alpha = 100 // log-Gaussian penalty weight

  const n = onsetStrengths.length
  const score = new Float64Array(onsetStrengths) // copy as initial scores
  const backtrack = new Int32Array(n).fill(-1)

  const minStep = Math.max(1, Math.round(beatPeriod * 0.5))
  const maxStep = Math.round(beatPeriod * 2)

  for (let t = 1; t < n; t++) {
    const lo = Math.max(0, t - maxStep)
    const hi = Math.max(0, t - minStep)
    let bestScore = -Infinity
    let bestPrev = -1

    for (let prev = lo; prev <= hi; prev++) {
      const delta = t - prev
      const penalty = alpha * Math.pow(Math.log(delta / beatPeriod), 2)
      const candidate = score[prev]! - penalty
      if (candidate > bestScore) {
        bestScore = candidate
        bestPrev = prev
      }
    }

    if (bestPrev >= 0) {
      score[t] = onsetStrengths[t]! + bestScore
      backtrack[t] = bestPrev
    }
  }

  // Find the highest-scoring terminal beat
  let lastBeat = 0
  for (let t = 1; t < n; t++) {
    if (score[t]! > score[lastBeat]!) lastBeat = t
  }

  // Backtrack to recover the full beat sequence
  const beats: number[] = []
  let t = lastBeat
  while (t >= 0) {
    beats.push((t * HOP_SIZE) / sampleRate)
    const prev = backtrack[t]!
    if (prev < 0) break
    t = prev
  }

  return beats.reverse()
}
