/// <reference lib="webworker" />

import { magnitudeSpectrum, FFT_SIZE, HOP_SIZE } from './dsp/fft.ts'
import { chromagram, addChromagram } from './dsp/chromagram.ts'
import { rms } from './dsp/rms.ts'
import { spectralCentroid } from './dsp/centroid.ts'
import { onsetStrength } from './dsp/onset.ts'
import { detectBpm } from './dsp/bpm.ts'
import { trackBeats } from './dsp/beats.ts'
import { detectKey } from './dsp/key.ts'
import { aggregateBars, type FrameData } from './dsp/barAggregation.ts'

interface WorkerPayload {
  samples: ArrayBuffer
  sampleRate: number
  duration: number
}

// Decoded Float32 samples arrive as a Transferable from the main thread.
// OfflineAudioContext is not available in Workers; decoding happens in main.ts.
self.onmessage = async (e: MessageEvent<WorkerPayload>) => {
  const { samples: samplesBuffer, sampleRate, duration } = e.data
  const samples = new Float32Array(samplesBuffer)

  const frames: FrameData[] = []
  const onsetSignal: number[] = []
  const chromaAcc = new Float64Array(12)
  let prevMag = new Float64Array(FFT_SIZE / 2 + 1)

  for (let offset = 0; offset + FFT_SIZE <= samples.length; offset += HOP_SIZE) {
    const window = samples.subarray(offset, offset + FFT_SIZE) as Float32Array
    const mag = magnitudeSpectrum(window)
    const chroma = chromagram(mag, sampleRate)
    const rmsVal = rms(window)
    const centroid = spectralCentroid(mag, sampleRate)
    const onset = onsetStrength(mag, prevMag)

    addChromagram(chromaAcc, chroma)
    frames.push({ time: offset / sampleRate, chromagram: chroma, rms: rmsVal, centroid, onsetStrength: onset })
    onsetSignal.push(onset)
    prevMag = mag
  }

  const onsetArr = new Float64Array(onsetSignal)
  const bpm = detectBpm(onsetArr, sampleRate)
  const beats = trackBeats(onsetArr, bpm, sampleRate)
  const { key } = detectKey(chromaAcc)
  const bars = aggregateBars(beats, frames, bpm)

  self.postMessage({ bars, key, tempo: Math.round(bpm), duration })
}
