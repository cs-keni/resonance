# AI_CONTEXT — Resonance

## What This Is

Resonance is a browser-only audio fingerprint engine. Drop in an audio file; get back one deterministic circular image that encodes the song's full mathematical structure. No server, no upload, no randomness.

## Stack

| Layer | Technology |
|-------|------------|
| Build | Vite + TypeScript (v6) |
| FFT | fft.js (MIT library) |
| Audio decoding | Web Audio API `AudioContext.decodeAudioData` on **main thread** |
| Rendering | Canvas 2D only (no SVG) — `src/renderer.ts` |
| Tests | Vitest |
| Font | Geist Mono via Google Fonts; `document.fonts.load()` gate before canvas render |

## Architecture

```
Main thread
  └─ File input → AudioContext.decodeAudioData → Float32Array (Transferable) → Worker
  └─ Canvas renderer (src/renderer.ts) — Phase 2 ✅
  └─ Analysis sequence animation (requestAnimationFrame) — Phase 3

Web Worker
  └─ Receives { samples: ArrayBuffer, sampleRate, duration } from main thread
  └─ FFT loop (2048-point, Hann window, HOP_SIZE=1024, 50% overlap)
  └─ src/dsp/ modules (fft, chromagram, rms, centroid, onset, bpm, beats, key, barAggregation)
  └─ Posts: { bars: BarData[], key: string, tempo: number, duration: number }
```

**Critical invariant:** `OfflineAudioContext` is unavailable in Web Workers (browser limitation). Audio decoding happens on the main thread via `AudioContext.decodeAudioData`. The decoded `Float32Array` is transferred as a Transferable; only bar-level features come back from the Worker. Avoid sending raw PCM back from the Worker — OOM risk on files >5 minutes.

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

## Fingerprint Rings (`src/renderer.ts`)

Radii at 2048×2048 export (cx=cy=1024):

| Ring | r_in | r_out | Data source | Visual encoding |
|------|------|-------|-------------|-----------------|
| 1 (inner) | 200 | 420 | pitchClass per bar | hue — chromatic wheel (pc×30°) |
| 2 | 444 | 560 | onsetDensity per bar | saturation (0–88%), same hue |
| 3 | 584 | 724* | rms per bar | radial extension (no inter-segment gap) |
| 4 (outer) | 748 | 870 | spectralCentroid | brightness (lightness 20–85%) |

*Ring 3 outer radius varies: `R3_BASE + bar.rms × 140`. Gap to Ring 4 preserved at 24px.

Center: key + BPM text via `fillText` (Geist Mono, 56px bold / 44px, gated on `document.fonts.load()`).

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
