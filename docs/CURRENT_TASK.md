# Current Task — Resonance

## Active: Phase 1 — Audio Pipeline

**Status:** Starting — scaffold first

**Next immediate step:**
```
npm create vite@latest . -- --template vanilla-ts
npm install fft.js
npm install -D vitest
```

**Acceptance criteria:**
- Worker receives compressed file bytes, decodes via OfflineAudioContext, processes all DSP modules, posts `{ bars, key, tempo, duration }`
- All Vitest unit tests pass (see PHASES.md Phase 1 test list)
- Performance benchmark documented in SPEC.md
- RMS bar chart on screen confirms end-to-end pipeline

**Blockers:** None
