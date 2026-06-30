# Engineering Log — Resonance

## 2026-06-30

### T12 — Per-segment angular highlight (`src/renderer.ts`)

Added `segmentHighlight()`: 9% white overlay on the center 44% of each segment's angular span, applied after the base fill and before `ringDepth()` on Rings 1, 2, and 4. Ring 3 excluded (continuous RMS profile, no gaps). Creates subtle convex-tile effect most visible on songs with <80 bars. Evaluated in browser — kept.

**Phase 4 complete. ✅**

---

### Animation pass — 60s build, idle life, micro-interactions (`src/main.ts`, `src/style.css`)

**During the 60s build:**
- Waveform (0–5s): radial glow dot at draw head (scanner aesthetic)
- Bands (5–15s): now scan left-to-right over 10s instead of rendering statically; soft vertical shimmer at leading edge
- Ring assembly (30–55s): smoothstep easing replaces linear (starts fast, decelerates to stop); white shimmer arc at leading edge of each ring

**Post-analysis:**
- Fingerprint canvas gets `.idle` class after `drawFingerprint()` resolves → `breathe` keyframe (scale 1→1.007, 7s loop)
- Stats + actions use `.fade-up` with staggered delays (60ms / 180ms) instead of instant pop-in

**Micro-interactions:**
- Buttons: `translateY(-2px)` on hover, `scale(0.96)` on active
- Drop zone: `scale(1.03)` on drag-over, `zone-in` entrance animation on mount
- `.analyzing` state gets `zone-in` entrance

**Commit:** see git log.

---

## 2026-06-29

### Phase 4 — Core architecture + P1 fixes (`src/utils.ts`, `src/main.ts`, `src/renderer.ts`)

Phase 4 architecture locked via /plan-eng-review (10 decisions, D1–D10). All P1 tasks and most P2 tasks complete.

**New files:**
- `src/utils.ts` — shared `pitchHue()`, `annularSector()`, `validateAudioDuration()`, `playbackAngle()`, `stripExtension()`
- `src/utils.test.ts` — 20 Vitest unit tests for pure helpers

**Key changes:**
- `stopAnimation()` now also stops `currentAudioSource` (AudioBufferSourceNode) — playback and overlay RAF stop on new file drop
- `currentJobId` stamp in `processFile()` guards stale Worker responses when a second file is dropped mid-decode
- `bars.length === 0` guard in `worker.onmessage` prevents 60s black-screen silent failure
- Short file detection (< 30s) in main thread before Worker postMessage — user-friendly error message
- `currentFile: File | null` stored module-level for re-decode on play and export filename
- `exportFingerprint()` in `renderer.ts` — 2048×2260 offscreen canvas; draws fingerprint, then adds song name/key/tempo/duration caption in the 212px margin below
- Save button now calls `exportFingerprint()` and downloads `{songname}_resonance.png`
- Song name (extension stripped) added to stats DOM line below fingerprint
- Playback tracker: "play" button → re-decode from `currentFile` → AudioBufferSourceNode + overlay canvas → white radial line tracks `playbackAngle(audioCtx.currentTime, duration)`

**Test count:** 34 → 54 (20 new utils tests).

### Phase 3 — Animation sequence implemented (`src/main.ts`, `src/style.css`)

Full 60-second animated build sequence implemented. All 11 tasks complete.

**Architecture:**
- `stopAnimation()` + `rafCancel` flag provide RAF cancellation; new file drop hard-cuts any running animation
- `runPhase3(bars, key, tempo, duration)` builds canvas + stage label DOM, starts the `tick()` RAF loop
- Wall-clock timing via `performance.now()` — phase boundaries at 0/5/15/30/45/55/60s
- Crossfade overlay (0.3s fade-out at phase end, 0.2s fade-in at start) via canvas `rgba(12,12,16,α)` rect
- Phase 5 (glyph reveal) has its own reveal mechanism — crossfade overlay suppressed there

**Phase implementations:**
- Phase 0 (0–5s): single waveform stroke, `bars[i].rms` mapped to ±30% height, draws left-to-right
- Phase 1 (5–15s): 8 stacked traces, each drawing energy derived from `pitchClassProfile` grouped by pitch-class band
- Phase 2 (15–30s): 12×N chromagram grid, column-by-column; cell opacity = normalized `pitchClassProfile[pc]`; 12×50 cap on ≤480px
- Phase 3 (30–45s): Ring 1 assembles clockwise, linear rate
- Phase 4 (45–55s): Rings 2–4 draw simultaneously (same loop, same linear rate)
- Phase 5 (55–60s): rings fully assembled (all progress clamped ≥1); dark center overlay fades 0.8→0, glyph fades in; stage label opacity tracks reveal
- After 60s: `drawFingerprint()` from renderer.ts redraws the canonical output (applies depth gradients), then stats + buttons appear

**Key finding:** `BarData.pitchClassProfile: number[]` (12-bin chromagram per bar) already existed — no Worker or DSP changes needed.

**CSS added:** `.stage-label` — Geist Mono 0.7rem `#444`, 0.3s opacity transition.

**Commit:** see git log.

---

## 2026-06-28

### Phase 3 — Design review complete (/plan-design-review)

11 design decisions locked for the 60-second animation sequence. PHASES.md updated with full Phase 3 spec.

**Key decisions:**
- All 6 animation phases run within fixed `clamp(300px, 70vmin, 700px)` center zone (no viewport-spanning waveform)
- Wall-clock timing via `performance.now()` — Worker pre-loads all data (~0.23s); 60-second build is intentional UX
- RAF cancellation token required — new file drop must hard-cut in-progress animation loops
- Waveform (0–5s): single Path2D stroke, 1px, `#dedede` at 0.35 opacity, ±30% height (oscilloscope, not EQ bars)
- Frequency bands (5–15s): 8–12 stacked thin traces, same stroke style, 0.25–0.45 opacity
- Chromagram (15–30s): 12×N column-by-column fill, HSL pitch-class colors, opacity = weight, no borders; 12×50 cap on ≤480px
- Ring assembly (30–55s): clockwise linear draw rate, N / (phase_duration × 60fps) segments per frame
- Glyph reveal (55–60s): `#0C0C10` overlay fades opacity 0.8→0 over 5s; rings stay in place
- Stage labels: Geist Mono 0.7rem `#444` below canvas, one line, updates per phase
- Inter-phase crossfades: 0.3s fade-out + 0.2s fade-in between each boundary
- No skip button — 60-second build is the experience per SPEC.md

**Implementation start order:** T1 (cancellation token) + T9 (wall-clock timer) first, then T2–T11 in phase order.

**Design review score:** 2/10 → 8/10. GSTACK REVIEW REPORT appended to PHASES.md.

**Commit:** see git log.

---

### Phase 2 — Canvas renderer scaffolded

Created `src/renderer.ts` — 4-ring Canvas 2D fingerprint renderer at 2048×2048 export resolution.

**Ring layout:**
- Ring 1 (r 200–420): pitch class hue — chromatic color wheel (pc × 30°)
- Ring 2 (r 444–560): onset density → saturation (0–88%); hue shared with Ring 1
- Ring 3 (r 584–724+): RMS → radial extension; no inter-segment gap for continuous profile; lightness 30–82%
- Ring 4 (r 748–870): spectral centroid → lightness (20–85%); saturation 90%
- Center glyph: key (bold 56px) + BPM (44px) in Geist Mono, gated on `document.fonts.load()`
- Depth overlay: per-ring `createRadialGradient` under `clip('evenodd')` — darker inner, slight sheen at outer edge

**main.ts changes:** removed `drawRmsChart`; `worker.onmessage` is now async, calls `drawFingerprint`, adds "save png" download button. Canvas display scaled via CSS (`clamp(300px, 70vmin, 700px)`).

**style.css:** fingerprint canvas display size, `appear` animation (scale 0.96→1 + fade), `.actions` flex row for buttons.

**index.html:** added Geist Mono from Google Fonts (preconnect + stylesheet link).

**docs/AI_CONTEXT.md:** corrected stale architecture note — audio decode is on main thread, not in Worker.

**Commit:** see git log.

---

### Phase 1 — Complete ✅

**Validation:** dropped GD track (985099.mp3, 103s) in Chrome → F# major / 104 BPM / 266s / 168 bars, RMS bar chart renders correctly.

**Performance benchmark:** 0.23s Worker analysis time for 103s audio (~450× real-time). No optimization needed. Results written to SPEC.md "Measured Performance".

**Architecture bug fixed:** `OfflineAudioContext` is not available in Web Workers (browser limitation, not spec). Moved audio decode to the main thread via `AudioContext.decodeAudioData`. Main thread now decodes, closes the context, and transfers the `Float32Array` samples to the Worker as a Transferable. Worker receives `{ samples: ArrayBuffer, sampleRate, duration }`. Root cause of symptom: stale Vite dev server cache was serving old JS — full server restart on a new port resolved delivery. SPEC.md architecture notes updated to reflect new boundary.

**Commit:** see git log for hash.

---

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
