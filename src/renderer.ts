import type { BarData } from './dsp/barAggregation.ts'

const EXPORT_SIZE = 2048
const BG = '#0C0C10'

// Ring radii (canvas pixels at 2048×2048, from center outward)
const R1_IN   = 200   // Ring 1: pitch class hue
const R1_OUT  = 420
const R2_IN   = 444   // Ring 2: onset density → saturation
const R2_OUT  = 560
const R3_BASE = 584   // Ring 3: RMS → radial extension (no inter-segment gap)
const R3_EXT  = 140   // max radial extension beyond R3_BASE
const R4_IN   = 748   // Ring 4: spectral centroid → brightness
const R4_OUT  = 870

// Chromatic color wheel: each semitone = 30°
function pitchHue(pc: number): number {
  return (pc * 30) % 360
}

// Annular sector: outer arc clockwise → inner arc counter-clockwise → close
function annularSector(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rIn: number, rOut: number,
  a0: number, a1: number,
): void {
  ctx.beginPath()
  ctx.arc(cx, cy, rOut, a0, a1)
  ctx.arc(cx, cy, rIn, a1, a0, true)
  ctx.closePath()
}

// Subtle depth: darker inner edge, slight sheen at outer edge
function ringDepth(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rIn: number, rOut: number,
): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, rOut, 0, Math.PI * 2)
  ctx.moveTo(cx + rIn, cy)
  ctx.arc(cx, cy, rIn, 0, Math.PI * 2, true)
  ctx.clip('evenodd')
  const grad = ctx.createRadialGradient(cx, cy, rIn, cx, cy, rOut)
  grad.addColorStop(0,    'rgba(0,0,0,0.22)')
  grad.addColorStop(0.3,  'rgba(0,0,0,0)')
  grad.addColorStop(0.8,  'rgba(0,0,0,0)')
  grad.addColorStop(1,    'rgba(255,255,255,0.06)')
  ctx.fillStyle = grad
  ctx.fillRect(cx - rOut, cy - rOut, rOut * 2, rOut * 2)
  ctx.restore()
}

export async function drawFingerprint(
  canvas: HTMLCanvasElement,
  bars: BarData[],
  key: string,
  tempo: number,
): Promise<void> {
  canvas.width  = EXPORT_SIZE
  canvas.height = EXPORT_SIZE

  const ctx = canvas.getContext('2d')!
  const cx  = EXPORT_SIZE / 2
  const cy  = EXPORT_SIZE / 2

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)

  if (bars.length === 0) return

  await document.fonts.load("bold 56px 'Geist Mono'").catch(() => undefined)

  const n      = bars.length
  const dTheta = (2 * Math.PI) / n
  const start  = -Math.PI / 2               // 12 o'clock
  const gap    = Math.min(0.003, dTheta * 0.04) // adaptive inter-segment gap

  // Normalize spectral centroid to [0, 1] across all bars
  const cVals = bars.map(b => b.spectralCentroid).filter(c => c > 0)
  const cMin  = cVals.length ? Math.min(...cVals) : 0
  const cMax  = Math.max(...cVals, 1)
  const normC = (c: number): number => cMax === cMin ? 0.5 : (c - cMin) / (cMax - cMin)

  // ── Ring 1: pitch class → hue ───────────────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const bar = bars[i]!
    annularSector(ctx, cx, cy, R1_IN, R1_OUT,
      start + i * dTheta + gap,
      start + (i + 1) * dTheta - gap)
    ctx.fillStyle = `hsl(${pitchHue(bar.pitchClass)}, 78%, 54%)`
    ctx.fill()
  }
  ringDepth(ctx, cx, cy, R1_IN, R1_OUT)

  // ── Ring 2: onset density → saturation ─────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const bar = bars[i]!
    annularSector(ctx, cx, cy, R2_IN, R2_OUT,
      start + i * dTheta + gap,
      start + (i + 1) * dTheta - gap)
    const sat = Math.round(bar.onsetDensity * 88)
    ctx.fillStyle = `hsl(${pitchHue(bar.pitchClass)}, ${sat}%, 56%)`
    ctx.fill()
  }
  ringDepth(ctx, cx, cy, R2_IN, R2_OUT)

  // ── Ring 3: RMS → radial extension (no gap = continuous profile) ────────────
  for (let i = 0; i < n; i++) {
    const bar    = bars[i]!
    const rOuter = R3_BASE + bar.rms * R3_EXT
    const light  = Math.round(30 + bar.rms * 52)
    annularSector(ctx, cx, cy, R3_BASE, rOuter,
      start + i * dTheta,
      start + (i + 1) * dTheta)
    ctx.fillStyle = `hsl(${pitchHue(bar.pitchClass)}, 48%, ${light}%)`
    ctx.fill()
  }
  ringDepth(ctx, cx, cy, R3_BASE, R3_BASE + R3_EXT)

  // ── Ring 4: spectral centroid → brightness ──────────────────────────────────
  for (let i = 0; i < n; i++) {
    const bar   = bars[i]!
    const light = Math.round(20 + normC(bar.spectralCentroid) * 65)
    annularSector(ctx, cx, cy, R4_IN, R4_OUT,
      start + i * dTheta + gap,
      start + (i + 1) * dTheta - gap)
    ctx.fillStyle = `hsl(${pitchHue(bar.pitchClass)}, 90%, ${light}%)`
    ctx.fill()
  }
  ringDepth(ctx, cx, cy, R4_IN, R4_OUT)

  // ── Center glyph ────────────────────────────────────────────────────────────
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'

  ctx.font      = "bold 56px 'Geist Mono', 'Courier New', monospace"
  ctx.fillStyle = '#dedede'
  ctx.fillText(key, cx, cy - 38)

  ctx.font      = "44px 'Geist Mono', 'Courier New', monospace"
  ctx.fillStyle = '#555'
  ctx.fillText(`${tempo} bpm`, cx, cy + 42)
}
