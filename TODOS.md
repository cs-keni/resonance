# Resonance — TODOS

Items deferred from /plan-eng-review. Each has context and rationale.

---

## TODO-1: Define quantitative pass/fail criteria for Phase 2 song quality test

**What:** Add explicit success criteria to the SPEC.md Visual Quality Targets section for the "10+ diverse songs" test.

**Why:** Without measurable criteria, Phase 2 quality check is declared done on vibes. A fingerprint that "looks okay" to a tired developer is not the same as one that actually encodes musical structure meaningfully.

**Pros:** Phase 2 can't be falsely declared complete. Bugs in Ring 3 (energy) or Ring 1 (pitch class) are caught before Phase 3 animation work begins.

**Cons:** Criteria may be slightly wrong initially. But wrong-and-explicit is better than implicit.

**Context:** Minimum bar proposed:
- A 4-chorus pop song must show ≥3 visible energy peaks in Ring 3 (energy ring).
- Two songs a perfect fifth apart (e.g. C major, G major) must produce visibly different dominant hues in Ring 1. With pc×30° (chromatic wheel), 7 semitones = 210° difference — perceptually very distinct colors, not neighbors.
- A classical piano piece and a metal track must produce fingerprints that a non-musician can distinguish at a glance.

**Depends on:** Phase 2 renderer complete, 10+ songs available for testing.

---

## TODO-2: Real-time companion mode architecture spec (Phase 5 gate)

**What:** Write a separate architecture document for the real-time companion mode before Phase 5 begins.

**Why:** Real-time mode has fundamentally different constraints from whole-file analysis:
- Streaming FFT chunks (can't wait for full file)
- No lookahead (can't use future frames for beat tracking or K-S key detection)
- Latency target <100ms visual update
- The beat tracking approach chosen in Phase 1 won't work in real-time

**Pros:** Phase 5 doesn't scope-creep. Real-time mode gets a proper design before any code is written for it.

**Cons:** Requires design time that could be spent on Phase 4/5 work.

**Context:** Phase 4 implemented a playback tracker (white radial line that sweeps clockwise as the decoded audio plays). This satisfies the visual companion use-case without streaming analysis. Decision deferred: does real-time streaming mode add enough value over the playback tracker to justify the architecture difference?

**Depends on:** Phase 4 complete; decision needed before Phase 5 starts.

---

## TODO-3: Collision smoke test — verify same-genre songs produce distinct fingerprints

**What:** After Phase 2, systematically test whether 5 same-genre, similar-tempo songs produce visually distinct fingerprints.

**Why:** "Two different songs always produce different images" is the core value proposition. Four aggregate features (pitch class, onset density, RMS, spectral centroid) quantized to bar-level segments may produce near-identical fingerprints for songs that are genuinely similar musically (e.g. two lo-fi hip-hop tracks at 85 BPM in D minor).

**Pros:** Validates the uniqueness claim before it appears on the portfolio. If it fails, there's time to add discriminating features before Phase 3.

**Cons:** May require adding features (spectral roll-off, zero-crossing rate, sub-band energy distribution) which adds Phase 2 scope.

**Context:** If fingerprints of similar songs are visually indistinct, two options:
1. Add more discriminating DSP features to Phase 1/2 (increases implementation scope)
2. Restate uniqueness claim as "perceptual" rather than mathematical — a different song will always look visually *different* to a human, even if two songs look similar.

**Depends on:** Phase 2 renderer complete, 10+ songs available including same-genre pairs.

---

## TODO-4: File size and duration policy

**What:** Define and document what Resonance does with very large files (>100MB, >60 min) and very short files (<30s).

**Why:** Short files are already rejected with a user-friendly error. Long files have no upper bound guard — a 3-hour live recording would run the Worker for several seconds and produce a very dense fingerprint. No OOM guard exists for files >~200MB (the Float32Array for 3hrs × 44100Hz ≈ 475M floats ≈ 1.9GB).

**Pros:** Clear policy prevents silent hang or OOM crash on edge-case inputs. Communicates constraints to users upfront.

**Cons:** Arbitrary cap may reject legitimate long-form content (DJ sets, classical symphonies).

**Context:** Options:
1. Truncate to first N minutes (simple, silent — bad UX)
2. Reject with error if >X minutes/MB (explicit, honest)
3. Subsample frames for very long files (complex, maintains representation)

Recommend option 2 (reject with error) for a first pass. Reasonable threshold: warn at >30 min, reject at >60 min or >200MB.

**Depends on:** Phase 4 complete (export wired); add before public release.
