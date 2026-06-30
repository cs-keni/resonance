// Chromatic color wheel: each semitone = 30°
export function pitchHue(pc: number): number {
  return (pc * 30) % 360
}

// Annular sector: outer arc clockwise → inner arc counter-clockwise → close
export function annularSector(
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

// Returns null if duration is valid, or an error string if too short.
export function validateAudioDuration(duration: number): string | null {
  return duration < 30 ? 'File too short — Resonance needs at least 30 seconds of audio' : null
}

// Angle (radians) from 12 o'clock for the playback tracker line.
// Clamps to [0, 2π]. startAngle (-π/2) is 12 o'clock.
export function playbackAngle(currentTime: number, duration: number): number {
  const fraction = duration > 0 ? Math.min(currentTime / duration, 1) : 0
  return -Math.PI / 2 + fraction * 2 * Math.PI
}

// Strips file extension and truncates to maxChars with ellipsis.
export function stripExtension(filename: string, maxChars = 60): string {
  const base = filename.replace(/\.[^.]+$/, '')
  return base.length > maxChars ? base.slice(0, maxChars) + '…' : base
}
