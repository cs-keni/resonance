import './style.css'
import type { BarData } from './dsp/barAggregation.ts'
import { drawFingerprint } from './renderer.ts'

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
const app = document.querySelector<HTMLDivElement>('#app')!

function renderDropZone() {
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
  app.innerHTML = `
    <div class="analyzing">
      <span class="filename">${file.name}</span>
      <span class="status">analyzing structure...</span>
    </div>
  `
  const reader = new FileReader()
  reader.onload = async (e) => {
    const compressed = e.target!.result as ArrayBuffer
    let audioBuffer: AudioBuffer
    const ctx = new AudioContext()
    try {
      audioBuffer = await ctx.decodeAudioData(compressed)
    } catch (err) {
      app.innerHTML = `<div class="error">Decode failed: ${String(err)}</div><button id="retry">try another file</button>`
      document.getElementById('retry')?.addEventListener('click', renderDropZone)
      return
    } finally {
      ctx.close()
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

worker.onmessage = async (e: MessageEvent) => {
  const { bars, key, tempo, duration, error } = e.data as {
    bars: BarData[]
    key: string
    tempo: number
    duration: number
    error?: string
  }

  if (error) {
    app.innerHTML = `<div class="error">${error}</div><button id="retry">try another file</button>`
    document.getElementById('retry')?.addEventListener('click', renderDropZone)
    return
  }

  const canvas = document.createElement('canvas')
  canvas.classList.add('fingerprint')
  await drawFingerprint(canvas, bars, key, tempo)

  const stats = document.createElement('div')
  stats.className = 'stats'
  stats.textContent = `${key} / ${tempo} bpm / ${Math.round(duration)}s / ${bars.length} bars`

  const dlBtn = document.createElement('button')
  dlBtn.textContent = 'save png'
  dlBtn.addEventListener('click', () => {
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'resonance.png'
    a.click()
  })

  const retryBtn = document.createElement('button')
  retryBtn.textContent = 'drop another'
  retryBtn.addEventListener('click', renderDropZone)

  const actions = document.createElement('div')
  actions.className = 'actions'
  actions.appendChild(dlBtn)
  actions.appendChild(retryBtn)

  const result = document.createElement('div')
  result.className = 'result'
  result.appendChild(canvas)
  result.appendChild(stats)
  result.appendChild(actions)

  app.innerHTML = ''
  app.appendChild(result)
}

worker.onerror = (e) => {
  app.innerHTML = `<div class="error">worker error: ${e.message}</div>`
}

renderDropZone()
