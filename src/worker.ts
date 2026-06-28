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

// All audio analysis runs here. The compressed file bytes arrive as a
// Transferable so the main thread never owns the decoded AudioBuffer.
self.onmessage = async (e: MessageEvent<ArrayBuffer>) => {
  const fileBytes = e.data

  // Decode inside the Worker — the ~420MB float32 buffer stays here
  let audioBuffer: AudioBuffer
  try {
    const ctx = new OfflineAudioContext(1, 1, 44100)
    audioBuffer = await ctx.decodeAudioData(fileBytes)
  } catch (err) {
    self.postMessage({ error: `Decode failed: ${String(err)}` })
    return
  }

  const sampleRate = audioBuffer.sampleRate
  const samples = audioBuffer.getChannelData(0) // mono: average if stereo later
  const duration = audioBuffer.duration

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
