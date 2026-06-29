# Current Task — Resonance

## Active: Phase 3 — Analysis Sequence (Implementation)

**Status:** Design review complete. 11 decisions locked in PHASES.md. Ready to implement.

**Phase 3 implementation order:**
- [ ] T1: Add cancellation token (AbortController or cancel flag) to animation state — `src/main.ts`
- [ ] T9: Wall-clock timer via `performance.now()` drives all phase timing — `src/main.ts`
- [ ] T7: Stage label below canvas (Geist Mono 0.7rem `#444`, updates per phase) — `src/main.ts`, `src/style.css`
- [ ] T8: Inter-phase crossfades (0.3s fade-out + 0.2s fade-in) — `src/main.ts`
- [ ] T2: Waveform draw (0–5s): Path2D stroke, 1px, `#dedede` at 0.35 opacity, ±30% height — `src/main.ts`
- [ ] T3: Frequency decomposition (5–15s): 8–12 stacked thin traces — `src/main.ts`
- [ ] T4: Chromagram fill (15–30s): 12×N column-by-column, HSL colors, no borders — `src/main.ts`
- [ ] T5: Ring 1 assembly (30–45s) + Rings 2–4 (45–55s): clockwise linear draw rate — `src/main.ts`
- [ ] T6: Glyph reveal (55–60s): overlay opacity 0.8→0 over 5s — `src/main.ts`
- [ ] T10: Mobile chromagram cap at 12×50 on ≤480px — `src/main.ts`
- [ ] T11: Error path: cancel RAF loops, fade 0.3s, existing error UI — `src/main.ts`

**Phase 2 deferred (do after Phase 3 ships):**
- [ ] Song quality test: 4-chorus pop → ≥3 visible Ring 3 energy peaks
- [ ] Two songs a perfect fifth apart → visibly different dominant hues in Ring 1
- [ ] Classical piano vs. metal → distinguishable at a glance
- [ ] 10+ diverse songs tested

**Blockers:** None — design review cleared
