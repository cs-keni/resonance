# Resonance — The Song Fingerprint Engine

## Concept

Resonance listens to a song and generates one image for it. Not a real-time
bouncing visualizer — a single, static, intricate circular image that represents
the entire song's mathematical structure. Drop in a file, watch a 60-second
analysis sequence, and the image assembles itself: a mandala built from the
song's actual audio data. Every ring, every segment, every color chosen by what
the song actually is — its tempo, its key, its harmonic content, its loudest
and quietest moments.

The fingerprint is deterministic: the same song always produces the same image.
Two different songs always produce different images. The images are beautiful
enough to print and frame.

The real-time mode exists as a companion: as the song plays, a simpler animated
form of the fingerprint builds itself live, ring by ring, showing you where you
are in the song's structure. But the fingerprint is the product. The real-time
mode is the preview.

---

## The 10-Second Test

The page loads to a dark background, center of screen. One prompt:

`drop a song.`

A small upload target in the center — not a button, just a drag zone. The user
drops an audio file. The file name appears. Immediately, a thin circle begins
drawing itself at the center. Text below: `analyzing structure...`

The circle expands outward, ring by ring, filling in color. The animation takes
60 seconds. The user watches it build. It's like watching a photograph develop.

When it finishes, the image is there — a full radial mandala, the entire song
compressed into one circle. They read the stats at the bottom: key, tempo,
duration, dominant energy profile.

They drop in a different song. The image that assembles is visually different —
same visual grammar, completely different structure. They want to see every song
they know rendered this way. That is the goal.

---

## The Fingerprint — Visual Structure

The fingerprint is a radial visualization. The circle represents the full
duration of the song. Moving clockwise around the circle traces the song in
time (12 o'clock = beginning, moving clockwise back to 12 o'clock = end).

**Ring 1 (innermost) — Tonal color:**
Divided into segments, one per bar (measure). Each segment is colored by the
dominant pitch class in that bar — mapped to a hue on a perceptual color wheel.
The Krumhansl-Schmuckler profile maps key to hue: C major → warm amber, A
minor → deep violet, etc. The result: a song that stays in one key produces
a mostly single-hue innermost ring. A song that modulates produces a ring with
color changes at the modulation points.

**Ring 2 — Rhythmic density:**
Each segment has fixed inner/outer radius (same as the other rings). Onset
density in that bar drives the **opacity and saturation** of the segment color —
not its width. Sparse sections (long held notes, silence) are more transparent/
muted. Dense sections (fast runs, complex percussion) are more opaque and vivid.
This keeps the ring geometry clean and conflict-free with Rings 3 and 4.

**Ring 3 — Energy:**
A continuous waveform-like ring that plots the RMS energy of the signal over
time. High energy = the ring extends outward. Low energy = it contracts inward.
The ring traces the song's loudness profile in one continuous stroke. A
song with a loud chorus has a ring that balloons outward at that point.

**Ring 4 (outermost) — Spectral texture:**
Color-mapped from the spectral centroid at each moment — the "brightness" of
the sound. High spectral centroid (bright, treble-heavy sound, like a cymbal
or a violin in its upper register) maps to a light, desaturated color segment.
Low spectral centroid (bass-heavy, warm) maps to a dark, saturated segment.

**Center glyph:**
The detected key and tempo, rendered as a small typographic element at the
exact center of the image. Clean, minimal. `A min / 120 bpm`.

**Overall composition:**
The four rings are concentric, with slight gaps between them. The entire
image is rendered on a near-black background (`#0C0C10`). The colors are
saturated but have controlled value — no segment is pure white or pure black.
The innermost ring has the most visual information (most color variety). The
outermost ring is often the most graphic (sharp contrast between bright and
dark segments).

At high quality (2048×2048 export), each segment has a subtle radial gradient
from slightly lighter at the inner edge to slightly darker at the outer edge.
This gives the rings depth — they look like stacked layers, not flat bands.

---

## The Analysis Sequence — What Happens in 60 Seconds

This is what the user watches while the fingerprint builds. The analysis
sequence is not a progress bar — it is itself a visual experience.

```
0s–5s:   Waveform draw. The song's waveform traces itself across the
          screen in a thin white line, end-to-end.

5s–15s:  Frequency decomposition. The waveform splits into frequency bands.
          Each band animates to a different position, stacking vertically.

15s–30s: Chromagram assembly. A 12×N grid (12 pitch classes, N time windows)
          fills in, color by color, showing the harmonic content over time.

30s–45s: Ring 1 draws itself. The innermost ring assembles clockwise,
          segment by segment, at 3× normal speed.

45s–55s: Rings 2, 3, 4 draw themselves simultaneously, expanding outward.

55s–60s: The analysis overlay fades. The center glyph fades in.
          The fingerprint is complete.
```

The analysis sequence is designed so that a technically curious user understands
what the algorithm is doing. The chromagram step, in particular, makes the key
detection logic visible: you can see where the color in Ring 1 is coming from.

---

## Design Language

**Overall register:** Scientific precision + quiet beauty. The fingerprint
should look like a piece of scientific visualization that happens to be art.
Think: a cross-section of a mineral under a microscope, a star map, a
spectrum analysis made beautiful.

**Color philosophy:** The colors are data, not decoration. The hue of a
segment is determined by the audio content, not by a designer's choice. This
means two things:
1. The palette changes completely per song. A post-rock track in D minor
   will look different from a jazz track in F major.
2. The overall palette of any given fingerprint is almost always coherent —
   most songs stay in one key most of the time, so the colors tend to be
   harmonious by mathematical necessity.

**Typography:** Geist Mono for all labels and stats. Small, precise, left-aligned
when not centered. The typographic approach is minimal — the image is the
focus.

**Background:** Near-black `#0C0C10`. Not pure black (too harsh). The slight
blue undertone in this specific value makes the colored segments read warmer
by contrast.

**Export treatment:** The exported PNG at 2048×2048 includes a 1px border rule
in `#333` around the image, and the song name, key, and tempo in small Geist
Mono below the image. Like a scientific plate with a caption.

---

## What Makes It Unrecognizable

**From Milkdrop / real-time visualizers:** Those are reactive — they respond
to the current moment of the audio. Resonance is analytical — it reads the
whole song and produces a summary. The output is not an animation, it's an
image. You cannot produce Resonance's output by watching audio in real time.
The algorithm processes the entire file first.

**From spectrogram viewers:** Spectrograms are linear (time on one axis,
frequency on the other). The radial structure of Resonance's fingerprint is a
deliberate choice: it makes the song feel like a unified whole, not a sequence
of moments. The beginning and end of the song are adjacent on the circle —
time wraps. It's a different philosophical framing of what a song is.

**The detail that nobody does:** The determinism. Same song = same image.
Always. This means if two people drop in "Kind of Blue" by Miles Davis, they
get the same fingerprint. This creates a shared visual language for music.
"Here's what that album looks like" is a sentence that hasn't meant anything
until now.

---

## Technical Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Audio decoding | Web Audio API `decodeAudioData` | Decodes any browser-supported format (MP3, AAC, WAV, FLAC) into raw samples |
| FFT analysis | fft.js (library) | AnalyserNode is real-time only; fft.js chosen over custom implementation to eliminate correctness risk that corrupts all downstream features |
| Chromagram | Custom pitch class profile (12-bin) | Sum FFT energy into 12 pitch class bins per analysis window |
| Key detection | Krumhansl-Schmuckler algorithm | Correlation of chromagram against major/minor templates |
| Onset detection | Energy flux in sub-bands → onset strength function | Multi-band positive spectral flux per frame produces onset strength signal |
| RMS energy | Standard per-window RMS | For Ring 3 (energy profile) |
| Spectral centroid | Weighted mean of frequency bins | For Ring 4 (brightness) |
| Rendering | Canvas 2D only | All rendering including center glyph via fillText. SVG hybrid dropped — SVG-to-canvas has cross-browser font rendering issues that corrupt PNG export. Geist Mono preloaded via FontFace API. |
| Analysis worker | Web Worker | All audio processing runs off the main thread. The UI (including the analysis sequence animation) remains 60fps while analysis runs. |
| Export | Canvas `toDataURL('image/png')` | 2048×2048 canvas, rendered at 2x device pixel ratio |
| Framework | Vite + TS | Minimal; the logic is in the Web Worker and canvas renderer |

**Audio analysis architecture:**
The audio file is decoded to a raw `AudioBuffer` *inside the Worker* via
`OfflineAudioContext` (the compressed file bytes are transferred to the Worker
as a Transferable — the decoded ~420MB float32 buffer never crosses the Worker
boundary). The buffer is processed in chunks (analysis windows) of ~46ms
(2048 samples at 44.1kHz). For each window:
1. Apply a Hann window function (reduces spectral leakage)
2. Run FFT using fft.js on the windowed samples
3. Compute: pitch class profile (12 bins), RMS energy, spectral centroid,
   per-frame onset strength (sum of positive spectral flux)
4. Store results indexed by time

After all windows are processed, aggregate to bar-level data:
- Find the tempo (BPM) via autocorrelation of the onset strength function
  (not onset intervals — onset strength is robust to swing and rubato)
- Find beat positions via dynamic-programming beat tracker seeded by the BPM
  estimate. Output: array of beat timestamps.
- Group beats into bars (assume 4/4 by default)
- Per bar: dominant pitch class (argmax from chromagram sum), mean onset density,
  mean RMS, mean spectral centroid

**Note on chromagram accuracy:** STFT bins are linearly spaced. Below C3 (~130Hz),
resolution is 1-2 bins per semitone. Bass pitch class estimation is coarser than
mid-range. This is a known limitation of the STFT approach. CQT would improve
bass accuracy but adds significant complexity and has no browser-native library.
Revisit in Phase 4 if low-register songs produce indistinct Ring 1 patterns.

**Note on determinism:** Same audio file + same browser = same fingerprint.
Cross-browser determinism is not achievable for lossy formats (MP3, AAC) because
different browser codecs produce different PCM samples from `decodeAudioData`.
WAV/FLAC inputs are deterministic across all browsers.

The bar-level data drives the fingerprint rendering.

**The Web Worker boundary:**
```
Main thread:
  - File input handler
  - Analysis sequence animation
  - Canvas rendering of the fingerprint
  - Export handler

Web Worker:
  - decodeAudioData (via OfflineAudioContext)
  - All FFT analysis
  - Chromagram, key detection, onset detection, RMS, centroid
  - Bar aggregation
  - Posts a message: { bars: [...], key: "A minor", tempo: 120, duration: 243 }

Main thread receives the message and drives the fingerprint rendering.
```

---

## Visual Quality Targets

1. **The fingerprint must be printable.** At 2048×2048 and ~8 inches square
   at 300dpi, the image must hold up: segment edges clean and anti-aliased,
   the center glyph readable at 10pt, the radial gradients smooth. Test by
   actually printing a test image before Phase 3.

2. **The color wheel mapping must be perceptually balanced.** All 12 pitch
   classes map to hues, and the mapping must be chosen so that common key
   transitions (relative major/minor, dominant, subdominant) produce adjacent
   colors. If C major → orange and G major → orange-yellow, modulation
   to the dominant feels visually smooth. If the mapping is random, the ring
   looks noisy even when the song is harmonically simple.

3. **The analysis sequence must feel like it's revealing something.** Each
   step should produce a "I see what it's doing" moment. The chromagram step
   in particular — where a 12×N grid fills in color by color — should be
   fast enough to not feel like waiting but slow enough that the pattern is
   visible as it builds. Target: 10 seconds for the chromagram, 10 rows per
   second.

4. **Songs with clear structure must produce visually legible fingerprints.**
   Drop in any song with a clear verse/chorus structure. The energy ring (Ring 3)
   should show obvious repeating patterns at chorus positions. If a 4-minute
   pop song with 4 choruses doesn't produce a Ring 3 with 4 visible energy
   peaks, the onset detection or bar aggregation is wrong.

5. **The image must be recognizably different between genres.** A classical
   piano piece and a metal track should produce fingerprints that look nothing
   like each other. Test with at least 10 genre-diverse songs before Phase 3.
   If two visually similar fingerprints come from very different music, the
   feature extraction is not discriminative enough.

---

## Feature Breakdown

### Phase 1 — Audio Pipeline (Weeks 1–6)

**Module structure:** Each DSP concern is its own importable module under `src/dsp/`.
Worker imports and orchestrates them. Vite bundles the worker. All modules are unit-testable in Node without a browser.

- [ ] Project scaffold: Vite + TypeScript, Vitest, fft.js installed
- [ ] File input: drag-and-drop + file picker, any common audio format
- [ ] Web Worker: compressed file bytes transferred as Transferable; Worker decodes
      via `OfflineAudioContext` (no float32 buffer crossing Worker boundary)
- [ ] `src/dsp/fft.ts` — wrapper around fft.js, 2048-point forward transform with Hann window
- [ ] `src/dsp/chromagram.ts` — 12-bin pitch class profile from FFT magnitudes
- [ ] `src/dsp/rms.ts` — per-window RMS energy
- [ ] `src/dsp/centroid.ts` — spectral centroid (weighted mean of bins); NaN guard on silence
- [ ] `src/dsp/onset.ts` — per-frame onset strength (sum of positive spectral flux)
- [ ] `src/dsp/bpm.ts` — BPM via autocorrelation of onset strength function
- [ ] `src/dsp/beats.ts` — dynamic-programming beat tracker: onset strength + BPM → beat timestamps
- [ ] `src/dsp/key.ts` — Krumhansl-Schmuckler on time-averaged chromagram; returns `{key, confidence}`
- [ ] `src/dsp/barAggregation.ts` — group beats into bars; NaN guard when BPM=0
- [ ] `src/worker.ts` — orchestrates pipeline, posts `{ bars, key, tempo, duration }`
- [ ] Performance benchmark: profile FFT Worker loop on 3-min MP3 and 10-min FLAC;
      document wall time in this SPEC.md under "Measured Performance"
- [ ] Vitest unit tests for each DSP module:
      - 440Hz sine wave → chromagram A4 bin dominant
      - 120BPM click track → BPM within 2% of 120
      - Pure C major scale → K-S returns "C major", high confidence
      - Uniform chromagram → key returned as "unclear"
      - barAggregation(bpm=0) → returns [], no divide-by-zero
      - centroid(silence) → returns 0, not NaN
- [ ] First visual output: rough bar chart of RMS over time confirms pipeline is working

### Phase 2 — Fingerprint Renderer (Weeks 7–11)
- [ ] Canvas renderer: draw the four rings from bar-level data
- [ ] Ring 1: pitch class → hue mapping (Krumhansl-Schmuckler color wheel)
- [ ] Ring 2: onset density → segment **opacity/saturation** (fixed inner/outer radius; no variable width)
- [ ] Ring 3: RMS energy → radial extension as continuous line
- [ ] Ring 4: spectral centroid → brightness/saturation mapping
- [ ] Center glyph: key + BPM via `fillText` in Geist Mono (preloaded via FontFace API;
      `FontFace.load()` gate before any canvas render)
- [ ] Near-black background (#0C0C10), gaps between rings, radial gradient per segment
- [ ] Lightweight export: `canvas.toDataURL('image/png')` at 2048×2048 (no caption yet)
      — required to satisfy VQT #1 (print test before Phase 3)
- [ ] Test with 10+ diverse songs. Pass criteria:
      - A 4-chorus pop song must show ≥3 visible energy peaks in Ring 3
      - Two songs a perfect fifth apart must produce visibly different dominant hues in Ring 1
      - A classical piano piece and a metal track must be distinguishable at a glance

### Phase 3 — Analysis Sequence (Weeks 11–15)
- [ ] Waveform draw animation (full-song waveform traces itself)
- [ ] Frequency decomposition animation (band splitting)
- [ ] Chromagram fill animation (12×N grid, 10 rows/second)
- [ ] Ring assembly animations (clockwise, bar by bar, outward)
- [ ] Fade-in of center glyph on completion
- [ ] All animations driven by requestAnimationFrame, independent of analysis
      (analysis runs in the Worker; animation is on a separate timeline)

### Phase 4 — Polish and Export (Weeks 16–22)
- [ ] Export: 2048×2048 PNG with song name, key, tempo caption below image
- [ ] Color wheel tuning: refine the pitch-class-to-hue mapping based on
      visual evaluation of diverse songs
- [ ] Segment radial gradient (subtle, adds depth to the rings)
- [ ] Error handling: corrupted file, unsupported format, silent file, very
      short file (<30s) — each has a graceful degradation path
- [ ] Real-time companion mode: as the song plays back, the fingerprint
      highlights the current position (a thin white radial line moves clockwise)
- [ ] Song name and duration displayed below the fingerprint

### Phase 5 — Depth (Months 6+)
- [ ] Fingerprint gallery: store the last 12 fingerprints in IndexedDB.
      A minimal gallery view shows all of them as small thumbnails. Clicking
      expands to full view.
- [ ] Comparison view: two fingerprints side by side. Useful for comparing
      albums by the same artist.
- [ ] Shareable link: encode fingerprint data (bar-level features) as a URL
      hash. The recipient sees the same image without uploading the file.
      (Audio never leaves the browser — only the extracted features are encoded.)
- [ ] Ensemble mode: drop in an entire album (multiple files). A larger
      radial image shows all songs as concentric sub-rings. The album as a whole
      has a fingerprint.
- [ ] AI genre label: integrate a lightweight TensorFlow.js model (YAMNet or
      MusiCNN) to classify genre. Display as a secondary label. Use genre as
      an additional visual modifier (e.g., jazz gets slightly more complex
      Ring 2 geometry than pop).

---

## Key Design Decisions

1. **Whole-file analysis, not real-time.** This is the fundamental choice that
   differentiates Resonance. The 60-second analysis wait is a feature, not a
   bug. It produces better feature extraction and a better image. The wait is
   part of the ritual.

2. **Radial structure, not linear.** Time wraps. The song is a circle. This is
   a philosophical choice about how to represent music — as a sequence (linear)
   or as a unified form (circular). The circular framing is what makes the
   image feel like a portrait of the song, not a recording of it.

3. **The image is the product.** Not the real-time animation. Not the analysis
   sequence. The final static fingerprint PNG is what people share. Design every
   other feature to support this artifact.

4. **Determinism is non-negotiable.** The same audio file always produces the
   same fingerprint. This means no randomness anywhere in the feature extraction
   or rendering pipeline. Every parameter is derived from the audio data.

5. **Audio never leaves the browser.** The entire analysis runs in the browser.
   No server, no upload, no API. This is both a privacy feature and an
   architectural choice — the experience works offline.

---

## Open Questions

- **Key detection accuracy on non-tonal music:** Electronic, ambient, and
  atonal music often has no clear key. What does the fingerprint look like
  when key detection fails? The chromagram will be uniformly distributed across
  all 12 pitch classes, producing a rainbow Ring 1. This might actually be
  beautiful, but it's not "accurate." Label it `key: unclear` in the center glyph?
- **BPM detection on music with tempo changes:** The autocorrelation approach
  assumes a constant tempo. Music that changes tempo produces incorrect BPM
  estimates. How gracefully does this degrade visually?
- **Analysis time for long files:** A 10-minute file has ~13,000 analysis
  windows. Even in a Web Worker, this may take more than 60 seconds. Profile
  this early and optimize the FFT loop or reduce window overlap if needed.
- **Perceptual color wheel mapping:** The Krumhansl-Schmuckler profile gives
  key confidence, not a direct hue. The mapping from key to hue is a creative
  choice. The Scriabin color wheel and Rimsky-Korsakov's associations are
  historical references, but neither is a standard. We author the mapping and
  document it.

---

## Measured Performance

_(Populated after Phase 1 benchmark — see Phase 1 task list)_

| File | Duration | Format | Worker analysis time | Hardware |
|------|----------|--------|---------------------|---------|
| TBD  | 3 min    | MP3    | TBD                 | TBD     |
| TBD  | 10 min   | FLAC   | TBD                 | TBD     |

If analysis time exceeds 30 seconds on mid-range hardware (M1 MacBook or equivalent),
options: reduce window overlap (2x → 4x hop size), upgrade to WASM FFT, or fully
decouple Phase 3 animation from analysis wall time (progress reported via Worker messages).

---

## Estimated Investment

Minimum shippable, impressive version: **5–7 months** (Phase 1 extended by ~1 week for beat tracking + Vitest)
Gallery, comparison, ensemble mode, AI genre: **14–20 months**

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Outside Voice | `/plan-eng-review` | Independent 2nd opinion | 1 | issues_found | 10 findings (4 raised to user) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 12 issues found, all resolved |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**VERDICT:** ENG CLEARED — all 12 architecture/test/performance findings resolved before implementation begins.

NO UNRESOLVED DECISIONS
