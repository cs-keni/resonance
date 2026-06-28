import FFT from 'fft.js'

export const FFT_SIZE = 2048
export const HOP_SIZE = 1024 // 50% overlap

const _fft = new FFT(FFT_SIZE)
const _hann = Float64Array.from(
  { length: FFT_SIZE },
  (_, i) => 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1))),
)

export function magnitudeSpectrum(samples: Float32Array<ArrayBufferLike> | Float64Array<ArrayBufferLike>): Float64Array<ArrayBuffer> {
  const windowed = new Array<number>(FFT_SIZE)
  for (let i = 0; i < FFT_SIZE; i++) {
    windowed[i] = (samples[i] ?? 0) * _hann[i]!
  }

  const out: number[] = _fft.createComplexArray()
  _fft.realTransform(out, windowed)

  const numBins = FFT_SIZE / 2 + 1
  const mag = new Float64Array(numBins)
  for (let k = 0; k < numBins; k++) {
    const re = out[2 * k]!
    const im = out[2 * k + 1]!
    mag[k] = Math.sqrt(re * re + im * im)
  }
  return mag
}
