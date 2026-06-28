# AI_CONTEXT — Resonance

## What This Is

Resonance is a browser-only audio fingerprint engine. Drop in an audio file; get back one deterministic circular image that encodes the song's full mathematical structure. No server, no upload, no randomness.

## Stack

| Layer | Technology |
|-------|------------|
| Build | Vite + TypeScript (v6) |
| FFT | fft.js (MIT library) |
| Audio decoding | Web Audio API `decodeAudioData` via `OfflineAudioContext` inside Worker |
| Rendering | Canvas 2D only (no SVG) |
| Tests | Vitest |
| Font | Geist Mono (to be loaded via FontFace API before any canvas render — Phase 2) |

## Architecture

```
Main thread
  └─ File input → Worker (compressed bytes as Transferable)
  └─ Analysis sequence animation (requestAnimationFrame) — Phase 3
  └─ Canvas renderer (fingerprint + export) — Phase 2

Web Worker
  └─ OfflineAudioContext.decodeAudioData (decoded buffer stays in Worker)
  └─ FFT loop (2048-point, Hann window, HOP_SIZE=1024, 50% overlap)
  └─ src/dsp/ modules (fft, chromagram, rms, centroid, onset, bpm, beats, key, barAggregation)
  └─ Posts: { bars: BarData[], key: string, tempo: number, duration: number }
```

**Critical invariant:** The decoded float32 AudioBuffer never crosses the Worker boundary. Only compressed file bytes go in (Transferable); only the bar-level feature struct comes out. Violating this causes OOM on files >5 minutes.

## Data Shape

```typescript
interface BarData {
  startTime: number         // seconds
  endTime: number           // seconds
  pitchClass: number        // 0–11 (C=0, C#=1, ... B=11) — argmax of chromagram
  pitchClassProfile: number[] // 12-bin chromagram sum for this bar
  onsetDensity: number      // normalized 0–1 across all bars
  rms: number               // normalized 0–1 across all bars
  spectralCentroid: number  // Hz, mean for this bar
}
```

## DSP Modules (`src/dsp/`)

| Module | Input | Output | Notes |
|--------|-------|--------|-------|
| `fft.ts` | Float32Array (2048 samples) | magnitude spectrum (1025 bins) | Hann window applied before FFT |
| `chromagram.ts` | magnitude spectrum | 12-bin profile | STFT bins; bass below C3 coarser |
| `rms.ts` | Float32Array | scalar | per-window |
| `centroid.ts` | magnitude spectrum | Hz | returns 0 on silence (NaN guard) |
| `onset.ts` | magnitude spectra (t, t-1) | scalar | sum of positive spectral flux |
| `bpm.ts` | onset strength signal | BPM | autocorrelation; can return sub-harmonic on clean synthetic signals |
| `beats.ts` | onset strength + BPM | timestamp[] | dynamic programming beat tracker |
| `key.ts` | time-accumulated chromagram | { key, confidence } | Krumhansl-Schmuckler; "unclear" below 0.6 |
| `barAggregation.ts` | beats + per-frame data | BarData[] | returns [] when BPM=0 or <5 beats |

## Fingerprint Rings (Phase 2+)

| Ring | Data source | Visual encoding |
|------|-------------|-----------------|
| 1 (inner) | pitchClass per bar | hue (K-S color wheel) |
| 2 | onsetDensity per bar | opacity + saturation of segment |
| 3 | rms continuous | radial extension (waveform-like) |
| 4 (outer) | spectralCentroid | brightness/saturation |

Center: key + BPM text via `fillText` (Geist Mono).

## Key Decisions

- **fft.js over custom FFT** — eliminates silent correctness bugs in all downstream features
- **Onset strength autocorrelation for BPM** — robust to swing and rubato vs. onset-interval autocorrelation
- **Canvas 2D only** — SVG hybrid dropped due to cross-browser font rendering failures in export
- **Same-browser determinism only** — lossy codecs (MP3/AAC) decode differently per browser; WAV/FLAC are cross-browser deterministic
- **STFT chromagram** — CQT would be better below C3 but has no browser-compatible library; revisit Phase 4

## Known Limitations

- Bass pitch class estimation (below C3) is coarser with STFT
- MP3/AAC fingerprints vary across browsers (codec output differs)
- BPM detection assumes constant tempo
- Analysis time for 10-min files is uncharted — benchmark required (Phase 1 task)
