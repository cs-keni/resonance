import './style.css'
import type { BarData } from './dsp/barAggregation.ts'

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
  reader.onload = (e) => {
    const buf = e.target!.result as ArrayBuffer
    worker.postMessage(buf, [buf])
  }
  reader.readAsArrayBuffer(file)
}

function drawRmsChart(bars: BarData[], canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0C0C10'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const maxRms = Math.max(...bars.map((b) => b.rms), 0.001)
  const bw = canvas.width / bars.length

  bars.forEach((bar, i) => {
    const h = (bar.rms / maxRms) * canvas.height
    ctx.fillStyle = '#3a6fff'
    ctx.fillRect(i * bw, canvas.height - h, Math.max(bw - 1, 1), h)
  })
}

worker.onmessage = (e: MessageEvent) => {
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
  canvas.width = 800
  canvas.height = 160
  drawRmsChart(bars, canvas)

  app.innerHTML = `
    <div class="result">
      <div class="stats">${key} &nbsp;/&nbsp; ${tempo} bpm &nbsp;/&nbsp; ${Math.round(duration)}s &nbsp;/&nbsp; ${bars.length} bars</div>
    </div>
  `
  app.querySelector('.result')!.prepend(canvas)

  const again = document.createElement('button')
  again.id = 'retry'
  again.textContent = 'drop another'
  app.querySelector('.result')!.appendChild(again)
  again.addEventListener('click', renderDropZone)
}

worker.onerror = (e) => {
  app.innerHTML = `<div class="error">worker error: ${e.message}</div>`
}

renderDropZone()
