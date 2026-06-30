import './style.css'
import type { BarData } from './dsp/barAggregation.ts'
import { drawFingerprint, exportFingerprint } from './renderer.ts'
import { pitchHue, annularSector, validateAudioDuration, playbackAngle, stripExtension } from './utils.ts'

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
const app = document.querySelector<HTMLDivElement>('#app')!

// Active animation + playback cancellation
let rafCancel: (() => void) | null = null
let currentAudioSource: AudioBufferSourceNode | null = null

// Stored for re-decode on play and export filename
let currentFile: File | null = null

// Job ID stamp: guards stale Worker responses when user drops a new file mid-decode
let currentJobId = 0

function stopAnimation() {
  rafCancel?.()
  rafCancel = null
  try { currentAudioSource?.stop() } catch { /* already stopped */ }
  currentAudioSource = null
}

function renderDropZone() {
  stopAnimation()
  app.innerHTML = `
    <div class="drop-zone" id="drop-zone">
      <span class="prompt">drop a song.</span>
      <input type="file" id="file-input" accept="audio/*" hidden />
    </div>
  `
  const zone = document.getElementById('drop-zone')!
  const input = document.getElementById('file-input') as HTMLInputElement

  zone.addEventListener('click', () => input.click())
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over') })
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'))
  zone.addEventListener('drop', (e) => {
    e.preventDefault()
    zone.classList.remove('drag-over')
    const file = e.dataTransfer?.files[0]
    if (file) processFile(file)
  })
  input.addEventListener('change', () => {
    if (input.files?.[0]) processFile(input.files[0])
  })
}

function processFile(file: File) {
  stopAnimation()
  currentFile = file
  const jobId = ++currentJobId

  const analyzing = document.createElement('div')
  analyzing.className = 'analyzing'
  const fname = document.createElement('span')
  fname.className = 'filename'
  fname.textContent = file.name
  analyzing.appendChild(fname)
  app.innerHTML = ''
  app.appendChild(analyzing)

  const reader = new FileReader()
  reader.onload = async (e) => {
    if (jobId !== currentJobId) return  // stale: user dropped a newer file

    const compressed = e.target!.result as ArrayBuffer
    let audioBuffer: AudioBuffer
    const ctx = new AudioContext()
    try {
      audioBuffer = await ctx.decodeAudioData(compressed)
    } catch {
      if (jobId !== currentJobId) return
      showError('Could not read this file — try a different format (MP3, WAV, FLAC, AAC)')
      return
    } finally {
      ctx.close()
    }

    if (jobId !== currentJobId) return

    const durationError = validateAudioDuration(audioBuffer.duration)
    if (durationError) {
      showError(durationError)
      return
    }

    const samples = audioBuffer.getChannelData(0)
    const payload = {
      samples: samples.buffer as ArrayBuffer,
      sampleRate: audioBuffer.sampleRate,
      duration: audioBuffer.duration,
    }
    worker.postMessage(payload, [payload.samples])
  }
  reader.readAsArrayBuffer(file)
}

function showError(msg: string) {
  stopAnimation()
  app.innerHTML = ''
  const err = document.createElement('div')
  err.className = 'error'
  err.textContent = msg
  const btn = document.createElement('button')
  btn.id = 'retry'
  btn.textContent = 'try another file'
  btn.addEventListener('click', renderDropZone)
  app.appendChild(err)
  app.appendChild(btn)
}

// ─── Phase 3 animation ────────────────────────────────────────────────────────

function runPhase3(bars: BarData[], key: string, tempo: number, duration: number): void {
  stopAnimation()

  let cancelled = false
  let rafId = 0

  // DOM
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 2048
  canvas.classList.add('fingerprint')
  const ctx = canvas.getContext('2d')!

  const label = document.createElement('div')
  label.className = 'stage-label'
  label.textContent = 'reading waveform'

  const container = document.createElement('div')
  container.className = 'result'
  container.appendChild(canvas)
  container.appendChild(label)
  app.innerHTML = ''
  app.appendChild(container)

  // Precomputed constants
  const n     = bars.length
  const SIZE  = 2048
  const CX    = SIZE / 2
  const CY    = SIZE / 2
  const dTheta     = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2
  const GAP        = Math.min(0.003, dTheta * 0.04)

  // Ring radii — mirror renderer.ts exactly
  const R1_IN  = 200, R1_OUT = 420
  const R2_IN  = 444, R2_OUT = 560
  const R3_BASE = 584, R3_EXT = 140
  const R4_IN  = 748, R4_OUT = 870

  // Normalise spectral centroid range across all bars
  const cVals = bars.map(b => b.spectralCentroid).filter(c => c > 0)
  const cMin  = cVals.length ? Math.min(...cVals) : 0
  const cMax  = Math.max(...cVals, 1)
  const normC = (c: number) => cMax === cMin ? 0.5 : (c - cMin) / (cMax - cMin)

  // Max chromagram value per bar (for normalising pitch class profiles)
  const maxChroma = bars.map(b => Math.max(...b.pitchClassProfile, 1e-9))

  // Phase timing in ms and labels
  const T: number[] = [0, 5000, 15000, 30000, 45000, 55000, 60000]
  const LABELS = [
    'reading waveform',
    'isolating harmonics',
    'mapping pitch field',
    'assembling ring 1',
    'composing fingerprint',
    '',
  ]
  const FADE_OUT = 300  // ms — fade-out at end of each phase
  const FADE_IN  = 200  // ms — fade-in at start of each phase

  // ── Phase draw functions ──────────────────────────────────────────────────

  function clearBg() {
    ctx.fillStyle = '#0C0C10'
    ctx.fillRect(0, 0, SIZE, SIZE)
  }

  // Phase 0 (0–5s): waveform trace draws left-to-right
  function drawWaveform(elapsed: number) {
    clearBg()
    const drawUpTo = Math.min(Math.floor((elapsed / T[1]!) * n), n)
    if (drawUpTo === 0) return
    const xScale = SIZE / n
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(222,222,222,0.35)'
    ctx.lineWidth = 1
    for (let i = 0; i < drawUpTo; i++) {
      const x = i * xScale
      const y = CY - bars[i]!.rms * SIZE * 0.3
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Phase 1 (5–15s): stacked thin amplitude traces per frequency band
  function drawBands(elapsed: number) {
    clearBg()
    const NUM_BANDS = 8
    const fadeIn    = Math.min((elapsed - T[1]!) / 1000, 1)  // bands fade in over 1s
    const xScale    = SIZE / n
    const bandH     = SIZE / (NUM_BANDS + 2)
    const yAmp      = bandH * 0.45

    for (let b = 0; b < NUM_BANDS; b++) {
      const pcStart = Math.floor(b * 12 / NUM_BANDS)
      const pcEnd   = Math.ceil((b + 1) * 12 / NUM_BANDS)
      // Lower bands slightly brighter (more prominent bass foundation)
      const baseOpacity = 0.25 + (NUM_BANDS - 1 - b) / NUM_BANDS * 0.2
      ctx.beginPath()
      ctx.strokeStyle = `rgba(222,222,222,${baseOpacity * fadeIn})`
      ctx.lineWidth = 1
      const yBase = bandH * (b + 1.5)

      for (let i = 0; i < n; i++) {
        let energy = 0
        const mc = maxChroma[i]!
        for (let pc = pcStart; pc < pcEnd; pc++) energy += bars[i]!.pitchClassProfile[pc]! / mc
        energy /= Math.max(pcEnd - pcStart, 1)
        const x = i * xScale
        const y = yBase - energy * yAmp
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  }

  // Phase 2 (15–30s): chromagram grid fills column by column
  function drawChromagram(elapsed: number) {
    clearBg()
    const isMobile = window.innerWidth <= 480
    const numCols  = isMobile ? Math.min(n, 50) : n
    const phaseT   = (elapsed - T[2]!) / (T[3]! - T[2]!)
    const colsToShow = Math.floor(phaseT * numCols)
    const cellW = SIZE / numCols
    const cellH = SIZE / 12

    for (let col = 0; col < colsToShow; col++) {
      const barIdx = Math.min(Math.floor(col * n / numCols), n - 1)
      const bar    = bars[barIdx]!
      const mc     = maxChroma[barIdx]!
      for (let pc = 0; pc < 12; pc++) {
        const weight = bar.pitchClassProfile[pc]! / mc
        if (weight < 0.02) continue
        ctx.fillStyle = `hsla(${pitchHue(pc)},70%,50%,${weight * 0.9})`
        ctx.fillRect(col * cellW, pc * cellH, cellW, cellH)
      }
    }
  }

  // Phases 3–5 (30–60s): ring assembly, used for all three phases
  function drawRings(elapsed: number) {
    clearBg()

    // Ring 1 — phase 3 (30–45s), clockwise linear draw
    const r1p    = Math.min((elapsed - T[3]!) / (T[4]! - T[3]!), 1)
    const r1Segs = Math.floor(r1p * n)
    for (let i = 0; i < r1Segs; i++) {
      annularSector(ctx, CX, CY, R1_IN, R1_OUT,
        startAngle + i * dTheta + GAP, startAngle + (i + 1) * dTheta - GAP)
      ctx.fillStyle = `hsl(${pitchHue(bars[i]!.pitchClass)},78%,54%)`
      ctx.fill()
    }

    if (elapsed < T[4]!) return  // still in Ring 1 phase — done

    // Ring 1 now complete — render remaining segments in one pass
    for (let i = r1Segs; i < n; i++) {
      annularSector(ctx, CX, CY, R1_IN, R1_OUT,
        startAngle + i * dTheta + GAP, startAngle + (i + 1) * dTheta - GAP)
      ctx.fillStyle = `hsl(${pitchHue(bars[i]!.pitchClass)},78%,54%)`
      ctx.fill()
    }

    // Rings 2–4 — phase 4 (45–55s), all three draw simultaneously
    const r24p    = Math.min((elapsed - T[4]!) / (T[5]! - T[4]!), 1)
    const r24Segs = Math.floor(r24p * n)
    for (let i = 0; i < r24Segs; i++) {
      const bar = bars[i]!
      // Ring 2: onset density → saturation
      annularSector(ctx, CX, CY, R2_IN, R2_OUT,
        startAngle + i * dTheta + GAP, startAngle + (i + 1) * dTheta - GAP)
      ctx.fillStyle = `hsl(${pitchHue(bar.pitchClass)},${Math.round(bar.onsetDensity * 88)}%,56%)`
      ctx.fill()
      // Ring 3: RMS → radial extension (no gap)
      annularSector(ctx, CX, CY, R3_BASE, R3_BASE + bar.rms * R3_EXT,
        startAngle + i * dTheta, startAngle + (i + 1) * dTheta)
      ctx.fillStyle = `hsl(${pitchHue(bar.pitchClass)},48%,${Math.round(30 + bar.rms * 52)}%)`
      ctx.fill()
      // Ring 4: spectral centroid → brightness
      annularSector(ctx, CX, CY, R4_IN, R4_OUT,
        startAngle + i * dTheta + GAP, startAngle + (i + 1) * dTheta - GAP)
      ctx.fillStyle = `hsl(${pitchHue(bar.pitchClass)},90%,${Math.round(20 + normC(bar.spectralCentroid) * 65)}%)`
      ctx.fill()
    }
  }

  // Phase 5 overlay: center fades to reveal key+BPM glyph
  function drawGlyphReveal(elapsed: number) {
    const revealT = Math.min((elapsed - T[5]!) / (T[6]! - T[5]!), 1)

    // Dark center overlay fades out over 5s
    ctx.save()
    ctx.globalAlpha = 0.8 * (1 - revealT)
    ctx.fillStyle = '#0C0C10'
    ctx.beginPath()
    ctx.arc(CX, CY, R1_IN, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Glyph fades in
    ctx.save()
    ctx.globalAlpha = revealT
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.font      = "bold 56px 'Geist Mono','Courier New',monospace"
    ctx.fillStyle = '#dedede'
    ctx.fillText(key, CX, CY - 38)
    ctx.font      = "44px 'Geist Mono','Courier New',monospace"
    ctx.fillStyle = '#555'
    ctx.fillText(`${tempo} bpm`, CX, CY + 42)
    ctx.restore()

    // Stage label fades out as glyph comes in
    label.style.opacity = String(Math.max(0, 1 - revealT * 4))
  }

  // ── Main loop ─────────────────────────────────────────────────────────────

  const startTime = performance.now()

  function tick() {
    if (cancelled) return
    const elapsed = performance.now() - startTime

    // Which phase are we in? (0–5)
    let phase = 5
    for (let i = 0; i < 6; i++) {
      if (elapsed < T[i + 1]!) { phase = i; break }
    }

    // Stage label — update only for phases 0–4
    if (phase < 5) label.textContent = LABELS[phase]!

    // Draw phase content
    if      (phase === 0)            drawWaveform(elapsed)
    else if (phase === 1)            drawBands(elapsed)
    else if (phase === 2)            drawChromagram(elapsed)
    else if (phase === 3 || phase === 4) drawRings(elapsed)
    else {
      drawRings(elapsed)       // all rings fully assembled (progress clamped ≥ 1)
      drawGlyphReveal(elapsed)
    }

    // Crossfade overlay between phases (phases 0–4 only; phase 5 has its own reveal)
    if (phase < 5) {
      const pStart     = T[phase]!
      const pEnd       = T[phase + 1]!
      const sinceStart = elapsed - pStart
      const untilEnd   = pEnd - elapsed
      let overlayA = 0
      if (untilEnd   < FADE_OUT) overlayA = (FADE_OUT - untilEnd)   / FADE_OUT
      else if (sinceStart < FADE_IN) overlayA = (FADE_IN  - sinceStart) / FADE_IN
      if (overlayA > 0) {
        ctx.fillStyle = `rgba(12,12,16,${overlayA})`
        ctx.fillRect(0, 0, SIZE, SIZE)
      }
    }

    if (elapsed < 60000) {
      rafId = requestAnimationFrame(tick)
    } else {
      // Finalize: call canonical renderer for depth gradients + correct glyph
      rafCancel = null
      void drawFingerprint(canvas, bars, key, tempo).then(() => {
        label.remove()

        const songTitle = currentFile
          ? stripExtension(currentFile.name)  // strip extension
          : ''

        const stats = document.createElement('div')
        stats.className  = 'stats'
        stats.textContent = [
          songTitle,
          `${key} / ${tempo} bpm / ${Math.round(duration)}s / ${bars.length} bars`,
        ].filter(Boolean).join(' · ')

        const filename = currentFile
          ? stripExtension(currentFile.name)
          : 'resonance'

        const dlBtn = document.createElement('button')
        dlBtn.textContent = 'save png'
        dlBtn.addEventListener('click', async () => {
          dlBtn.textContent = 'saving…'
          dlBtn.disabled = true
          try {
            const dataUrl = await exportFingerprint(bars, key, tempo, duration, filename)
            const a = document.createElement('a')
            a.href     = dataUrl
            a.download = `${filename}_resonance.png`
            a.click()
          } finally {
            dlBtn.textContent = 'save png'
            dlBtn.disabled = false
          }
        })

        const playBtn = document.createElement('button')
        playBtn.textContent = 'play'
        playBtn.addEventListener('click', async () => {
          if (!currentFile || currentAudioSource) return  // playing or no file

          const fileToPlay = currentFile
          playBtn.textContent = 'loading…'
          playBtn.disabled = true

          let audioBuffer: AudioBuffer
          const audioCtx = new AudioContext()
          try {
            const compressed = await fileToPlay.arrayBuffer()
            audioBuffer = await audioCtx.decodeAudioData(compressed)
          } catch {
            audioCtx.close()
            playBtn.textContent = 'play'
            playBtn.disabled = false
            return
          }

          // Overlay canvas for the radial progress line
          const overlay = document.createElement('canvas')
          overlay.width  = 2048
          overlay.height = 2048
          overlay.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'
          container.style.position = 'relative'
          container.insertBefore(overlay, canvas.nextSibling)
          const ovCtx = overlay.getContext('2d')!

          const R_LINE = 870  // R4_OUT — line extends to outer ring
          const CX = 1024, CY = 1024

          let overlayCancel = false
          const overlayRafCancel = () => { overlayCancel = true; overlay.remove() }

          rafCancel = () => {
            cancelled = true
            cancelAnimationFrame(rafId)
            overlayRafCancel()
          }

          function drawOverlay() {
            if (overlayCancel) return
            const angle = playbackAngle(audioCtx.currentTime, duration)
            ovCtx.clearRect(0, 0, 2048, 2048)
            ovCtx.save()
            ovCtx.strokeStyle = 'rgba(255,255,255,0.85)'
            ovCtx.lineWidth = 2
            ovCtx.beginPath()
            ovCtx.moveTo(CX, CY)
            ovCtx.lineTo(CX + Math.cos(angle) * R_LINE, CY + Math.sin(angle) * R_LINE)
            ovCtx.stroke()
            ovCtx.restore()
            if (audioCtx.currentTime < duration) requestAnimationFrame(drawOverlay)
          }

          const source = audioCtx.createBufferSource()
          source.buffer = audioBuffer
          source.connect(audioCtx.destination)
          source.onended = () => {
            overlayRafCancel()
            playBtn.textContent = 'play'
            playBtn.disabled = false
            currentAudioSource = null
            audioCtx.close()
          }
          source.start()
          currentAudioSource = source

          playBtn.textContent = '■ stop'
          playBtn.disabled = false
          playBtn.onclick = () => {
            stopAnimation()
            playBtn.textContent = 'play'
            playBtn.disabled = false
            playBtn.onclick = null  // reset to outer handler
          }

          requestAnimationFrame(drawOverlay)
        })

        const retryBtn = document.createElement('button')
        retryBtn.textContent = 'drop another'
        retryBtn.addEventListener('click', renderDropZone)

        const actions = document.createElement('div')
        actions.className = 'actions'
        actions.appendChild(dlBtn)
        actions.appendChild(playBtn)
        actions.appendChild(retryBtn)

        container.appendChild(stats)
        container.appendChild(actions)
      })
    }
  }

  rafCancel = () => {
    cancelled = true
    cancelAnimationFrame(rafId)
  }

  rafId = requestAnimationFrame(tick)
}

// ─── Worker ──────────────────────────────────────────────────────────────────

worker.onmessage = (e: MessageEvent) => {
  const { bars, key, tempo, duration, error } = e.data as {
    bars: BarData[]
    key: string
    tempo: number
    duration: number
    error?: string
  }

  if (error) {
    showError(error)
    return
  }

  if (bars.length === 0) {
    showError('Could not detect musical structure — try a track with a clear beat and pitch content')
    return
  }

  runPhase3(bars, key, tempo, duration)
}

worker.onerror = (e) => {
  showError(`worker error: ${e.message}`)
}

renderDropZone()
