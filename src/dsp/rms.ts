export function rms(samples: Float32Array | Float64Array): number {
  let sum = 0
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]!
    sum += s * s
  }
  return Math.sqrt(sum / samples.length)
}
