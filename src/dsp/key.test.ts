import { describe, it, expect } from 'vitest'
import { detectKey } from './key.ts'

// C major scale pitch classes: 0(C) 2(D) 4(E) 5(F) 7(G) 9(A) 11(B)
const C_MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]

function buildChroma(activePitchClasses: number[], weight = 1): Float64Array {
  const chroma = new Float64Array(12)
  for (const pc of activePitchClasses) chroma[pc] = weight
  return chroma
}

describe('detectKey', () => {
  it('C major scale chromagram → "C major"', () => {
    const chroma = buildChroma(C_MAJOR_SCALE)
    const { key } = detectKey(chroma)
    expect(key).toBe('C major')
  })

  it('A minor chromagram with tonic emphasis → "A minor"', () => {
    // Uniform scale tones are ambiguous with C major (relative major/minor share
    // all 7 pitch classes). Emphasize the tonic A and the characteristic fifth E
    // so K-S correctly resolves the root.
    const chroma = new Float64Array(12)
    chroma[9] = 3.0  // A — tonic (highest)
    chroma[4] = 2.0  // E — perfect fifth
    chroma[0] = 1.0  // C — minor third
    const { key } = detectKey(chroma)
    expect(key).toBe('A minor')
  })

  it('uniform chromagram → "unclear"', () => {
    const chroma = new Float64Array(12).fill(1)
    const { key } = detectKey(chroma)
    expect(key).toBe('unclear')
  })

  it('all-zero chromagram → "unclear"', () => {
    const chroma = new Float64Array(12)
    const { key } = detectKey(chroma)
    expect(key).toBe('unclear')
  })

  it('confidence is between -1 and 1', () => {
    const chroma = buildChroma(C_MAJOR_SCALE)
    const { confidence } = detectKey(chroma)
    expect(confidence).toBeGreaterThanOrEqual(-1)
    expect(confidence).toBeLessThanOrEqual(1)
  })
})
