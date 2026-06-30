import { describe, it, expect } from 'vitest'
import { pitchHue, validateAudioDuration, playbackAngle, stripExtension } from './utils.ts'

describe('pitchHue', () => {
  it('maps C (pc 0) to 0°', () => {
    expect(pitchHue(0)).toBe(0)
  })
  it('maps A (pc 9) to 270°', () => {
    expect(pitchHue(9)).toBe(270)
  })
  it('wraps B (pc 11) to 330°', () => {
    expect(pitchHue(11)).toBe(330)
  })
  it('stays within [0, 360)', () => {
    for (let pc = 0; pc < 12; pc++) {
      const h = pitchHue(pc)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThan(360)
    }
  })
  it('songs a perfect fifth apart (7 semitones) differ by 210°', () => {
    expect(Math.abs(pitchHue(7) - pitchHue(0))).toBe(210)
  })
})

describe('validateAudioDuration', () => {
  it('accepts 30s exactly', () => {
    expect(validateAudioDuration(30)).toBeNull()
  })
  it('accepts longer files', () => {
    expect(validateAudioDuration(180)).toBeNull()
    expect(validateAudioDuration(600)).toBeNull()
  })
  it('rejects 29.9s', () => {
    expect(validateAudioDuration(29.9)).toBeTypeOf('string')
  })
  it('rejects 0s', () => {
    expect(validateAudioDuration(0)).toBeTypeOf('string')
  })
  it('rejects negative duration', () => {
    expect(validateAudioDuration(-1)).toBeTypeOf('string')
  })
})

describe('playbackAngle', () => {
  const TOP = -Math.PI / 2  // 12 o'clock

  it('starts at 12 o\'clock (−π/2) when currentTime=0', () => {
    expect(playbackAngle(0, 120)).toBeCloseTo(TOP)
  })
  it('reaches 6 o\'clock (π/2) at halfway', () => {
    expect(playbackAngle(60, 120)).toBeCloseTo(TOP + Math.PI)
  })
  it('reaches full circle (3π/2) at end', () => {
    expect(playbackAngle(120, 120)).toBeCloseTo(TOP + 2 * Math.PI)
  })
  it('clamps past end', () => {
    expect(playbackAngle(999, 120)).toBeCloseTo(TOP + 2 * Math.PI)
  })
  it('handles zero duration without NaN', () => {
    const angle = playbackAngle(0, 0)
    expect(Number.isNaN(angle)).toBe(false)
    expect(angle).toBe(TOP)
  })
})

describe('stripExtension', () => {
  it('strips .mp3', () => {
    expect(stripExtension('track.mp3')).toBe('track')
  })
  it('strips .flac', () => {
    expect(stripExtension('my song.flac')).toBe('my song')
  })
  it('leaves dots in the middle intact', () => {
    expect(stripExtension('v1.2.3.wav')).toBe('v1.2.3')
  })
  it('truncates long names with ellipsis', () => {
    const long = 'a'.repeat(65)
    const result = stripExtension(long + '.mp3', 60)
    expect(result).toHaveLength(61)  // 60 chars + '…'
    expect(result.endsWith('…')).toBe(true)
  })
  it('does not truncate exactly 60 chars', () => {
    const exact = 'a'.repeat(60)
    expect(stripExtension(exact + '.mp3', 60)).toBe(exact)
  })
})
