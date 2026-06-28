// Krumhansl-Kessler (1982) key profiles
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Minimum Pearson r to declare a key; below this → "unclear"
const CONFIDENCE_THRESHOLD = 0.6

function pearson(a: number[], b: number[]): number {
  const n = a.length
  let sumA = 0, sumB = 0
  for (let i = 0; i < n; i++) { sumA += a[i]!; sumB += b[i]! }
  const meanA = sumA / n
  const meanB = sumB / n
  let num = 0, denomA = 0, denomB = 0
  for (let i = 0; i < n; i++) {
    const da = a[i]! - meanA
    const db = b[i]! - meanB
    num += da * db
    denomA += da * da
    denomB += db * db
  }
  const denom = Math.sqrt(denomA * denomB)
  return denom === 0 ? 0 : num / denom
}

export interface KeyResult {
  key: string
  confidence: number
}

export function detectKey(chromaAcc: Float64Array): KeyResult {
  const chroma = Array.from(chromaAcc)
  let bestKey = 'unclear'
  let bestCorr = -Infinity

  for (let root = 0; root < 12; root++) {
    // Rotate chroma so index 0 = root pitch class, then correlate with profiles
    const rotated = Array.from({ length: 12 }, (_, i) => chroma[(i + root) % 12]!)

    const majorCorr = pearson(rotated, MAJOR)
    const minorCorr = pearson(rotated, MINOR)

    if (majorCorr > bestCorr) { bestCorr = majorCorr; bestKey = `${NOTES[root]} major` }
    if (minorCorr > bestCorr) { bestCorr = minorCorr; bestKey = `${NOTES[root]} minor` }
  }

  return {
    key: bestCorr < CONFIDENCE_THRESHOLD ? 'unclear' : bestKey,
    confidence: bestCorr,
  }
}
