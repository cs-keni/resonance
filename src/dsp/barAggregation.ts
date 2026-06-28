const BEATS_PER_BAR = 4 // assume 4/4

export interface BarData {
  startTime: number
  endTime: number
  pitchClass: number       // 0–11, dominant pitch class (argmax of chromagram)
  pitchClassProfile: number[] // 12-bin chromagram sum for this bar
  onsetDensity: number     // normalized 0–1 across all bars
  rms: number              // normalized 0–1 across all bars
  spectralCentroid: number // Hz, mean for this bar
}

export interface FrameData {
  time: number
  chromagram: Float64Array
  rms: number
  centroid: number
  onsetStrength: number
}

interface RawBar {
  startTime: number
  endTime: number
  chromaSum: Float64Array
  rmsSum: number
  centroidSum: number
  onsetSum: number
  frameCount: number
}

export function aggregateBars(
  beats: number[],
  frames: FrameData[],
  bpm: number,
): BarData[] {
  if (bpm === 0 || beats.length < BEATS_PER_BAR + 1) return []

  // Build bar intervals from complete groups of 4 beats
  const rawBars: RawBar[] = []
  for (let b = 0; b + BEATS_PER_BAR < beats.length; b += BEATS_PER_BAR) {
    rawBars.push({
      startTime: beats[b]!,
      endTime: beats[b + BEATS_PER_BAR]!,
      chromaSum: new Float64Array(12),
      rmsSum: 0,
      centroidSum: 0,
      onsetSum: 0,
      frameCount: 0,
    })
  }

  if (rawBars.length === 0) return []

  // Two-pointer scan (frames and bars are both time-sorted)
  let barIdx = 0
  for (const frame of frames) {
    while (barIdx < rawBars.length && frame.time >= rawBars[barIdx]!.endTime) barIdx++
    if (barIdx >= rawBars.length) break
    const bar = rawBars[barIdx]!
    if (frame.time < bar.startTime) continue

    for (let i = 0; i < 12; i++) bar.chromaSum[i] += frame.chromagram[i]!
    bar.rmsSum += frame.rms
    bar.centroidSum += frame.centroid
    bar.onsetSum += frame.onsetStrength
    bar.frameCount++
  }

  // Normalization denominators
  let maxRms = 0, maxOnset = 0
  for (const r of rawBars) {
    if (r.rmsSum > maxRms) maxRms = r.rmsSum
    if (r.onsetSum > maxOnset) maxOnset = r.onsetSum
  }

  return rawBars.map((r) => {
    const fc = r.frameCount || 1

    let pitchClass = 0, maxChroma = -1
    for (let i = 0; i < 12; i++) {
      if (r.chromaSum[i]! > maxChroma) { maxChroma = r.chromaSum[i]!; pitchClass = i }
    }

    return {
      startTime: r.startTime,
      endTime: r.endTime,
      pitchClass,
      pitchClassProfile: Array.from(r.chromaSum),
      onsetDensity: maxOnset > 0 ? r.onsetSum / maxOnset : 0,
      rms: maxRms > 0 ? r.rmsSum / maxRms : 0,
      spectralCentroid: r.centroidSum / fc,
    }
  })
}
