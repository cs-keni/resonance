// Onset strength = sum of positive spectral flux between consecutive frames.
// Robust to tuning shifts and tonal music because it measures energy increases
// rather than raw energy.
export function onsetStrength(curr: Float64Array, prev: Float64Array): number {
  let flux = 0
  for (let k = 0; k < curr.length; k++) {
    const diff = curr[k]! - prev[k]!
    if (diff > 0) flux += diff
  }
  return flux
}
