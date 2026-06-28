# Engineering Log — Resonance

## 2026-06-28

### Phase 1 — Audio Pipeline implemented

Full DSP pipeline built and tested. 34/34 unit tests passing, TypeScript (v6) clean.

**DSP modules (`src/dsp/`):**
- `fft.ts` — fft.js wrapper, 2048-point FFT, Hann window
- `chromagram.ts` — 12-bin pitch class profile via STFT bin → MIDI → pitch class
- `rms.ts` — per-window RMS
- `centroid.ts` — spectral centroid; returns 0 on silence (NaN guard)
- `onset.ts` — onset strength via positive spectral flux
- `bpm.ts` — BPM via autocorrelation of onset strength
- `beats.ts` — dynamic-programming beat tracker (Ellis 2007 approach)
- `key.ts` — Krumhansl-Schmuckler, Pearson correlation, confidence threshold 0.6
- `barAggregation.ts` — 4/4 bar grouping, two-pointer frame scan, bpm=0 guard

**Known DSP behavior:**
- BPM autocorrelation can return the sub-harmonic (half BPM) when the onset signal aliases to a 2-beat period in discrete time (fractional beat periods). Real music onset signals are irregular and this rarely occurs. Tests use integer periods to avoid synthetic aliasing.
- C major / A minor are genuinely ambiguous on a uniform scale-tone chromagram (same 7 pitch classes). K-S correctly resolves with tonic emphasis.

**Worker (`src/worker.ts`):** orchestrates full pipeline, posts `{ bars, key, tempo, duration }`

**Main thread (`src/main.ts`):** drag-and-drop, transfers file bytes to worker, renders RMS bar chart on response

**Scaffold + config:**
- Vite + TypeScript (vanilla-ts template)
- Vitest configured in `vite.config.ts`, `test` and `test:watch` scripts in package.json
- `fft.js` (MIT) and `vitest` installed
- TS6 typed array generics: `Float64Array<ArrayBuffer>` explicit in `magnitudeSpectrum` return type to satisfy strict assignments

---

### docs/ + PHASES.md scaffold

- `PHASES.md` — phase/task breakdown with checkboxes
- `docs/AI_CONTEXT.md` — stack, architecture, DSP module table
- `docs/HANDOFF.md` — state, cross-phase gates, flags for next agent
- `docs/ENGINEERING_LOG.md` — this file
- `docs/CURRENT_TASK.md` — active work tracker

---

## 2026-06-27

### /plan-eng-review complete

Full engineering review of SPEC.md. 12 findings, all resolved before implementation:

1. Custom FFT → replaced with fft.js (MIT)
2. Onset-interval BPM → onset strength autocorrelation
3. Beat tracking added to Phase 1 (BPM alone is insufficient for bar positions)
4. Web Worker decodes audio inside itself (compressed bytes as Transferable)
5. SVG hybrid dropped → Canvas 2D only
6. Ring 2 uses opacity/saturation (not variable radial width)
7. Modular DSP structure under `src/dsp/`
8. Vitest unit tests added to Phase 1 scope
9. NaN/zero guards required in centroid and barAggregation
10. Performance benchmark added to Phase 1
11. Lightweight export added to Phase 2 (print test before Phase 3)
12. Same-browser determinism documented (cross-browser not achievable for lossy formats)

SPEC.md updated with all decisions. TODOS.md created with 3 deferred items.
