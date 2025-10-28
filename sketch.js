// === GEOMETRIC MOSAIC ===
// Created with p5.js (functional version)

// ---- Config ----
const CELL_SIZE = 178 // Base cell size
const CHANGE_EVERY = 200 // Frames between module switches
let cols,
  rows,
  cells = []
let palette

// ---- Helpers ----
const rnd = (a, b) => random(a, b)
const rndi = (a, b) => floor(random(a, b + 1))
const pick = (arr) => arr[floor(random(arr.length))]

function setup() {
  createCanvas(windowWidth, windowHeight)
  noStroke()
  palette = [
    color('#ff3ea5'), // magenta
    color('#00d1ff'), // cyan
    color('#00d36f'), // green
    color('#ffa500'), // orange
    color('#ffd83e'), // yellow
    color('#ffffff'), // white
  ]
  initGrid()
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
  initGrid()
}

// ---- Grid initialization ----
function initGrid() {
  cols = ceil(width / CELL_SIZE)
  rows = ceil(height / CELL_SIZE)
  cells = []

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i * CELL_SIZE
      const y = j * CELL_SIZE
      cells.push(createCell(x, y, CELL_SIZE))
    }
  }

  background(0)
}

// ---- Cell factory ----
function createCell(x, y, s) {
  const seed = random(10000)
  let type = pick(ModuleTypes)
  let lastSwitch = frameCount

  return {
    draw(t) {
      // Check if it’s time to switch the module
      if ((frameCount - lastSwitch) % CHANGE_EVERY === 0) {
        type = pick(ModuleTypes)
        lastSwitch = frameCount + rndi(0, 10)
      }

      // Background
      fill(0)
      rect(x, y, s, s)

      // Transform and draw module
      push()
      translate(x + s / 2, y + s / 2)

      const n = noise(seed, t * 0.05)
      const rot = map(n, 0, 1, 0, TWO_PI / 2)
      rotate(rot)

      type.render(s, t, palette, seed)
      pop()
    },
  }
}

// ---- Modules (as plain objects) ----
const ModuleTypes = [
  {
    name: 'Dots',
    render: (s, t, pal, seed) => {
      const n = noise(seed, t * 0.04)
      const cols = floor(map(n, 0, 1, 2, 5))
      const r = s / (cols * 2.2)
      const step = s / cols

      // Slow color timer (every 3s)
      const period = 3000
      const idx = floor(int((millis() + seed * 1000) / period) % pal.length)
      const c = pal[idx]
      fill(c)

      for (let y = -s / 2 + step / 2; y < s / 2; y += step) {
        for (let x = -s / 2 + step / 2; x < s / 2; x += step) {
          circle(x, y, r * 2)
        }
      }
    },
  },
  {
    name: 'Plus',
    render: (s, t, pal, seed) => {
      const c = pick(pal)
      const thick = map(noise(seed + 1, t * 0.2), 0, 1, s * 0.12, s * 0.32)
      fill(c)
      rectMode(CENTER)
      rect(0, 0, s * 0.8, thick, 4)
      rect(0, 0, thick, s * 0.8, 4)
    },
  },
  {
    name: 'Stripes',
    render: (s, t, pal, seed) => {
      const k = floor(map(noise(seed + 2, t * 0.08), 0, 1, 3, 9))
      const c = pick(pal)
      const mode = noise(seed + 3) < 0.5 ? 'H' : 'V'
      noStroke()
      fill(c)

      if (mode === 'H') {
        const h = s / (k * 2)
        for (let i = 0; i < k; i++) {
          rectMode(CENTER)
          rect(0, -s / 2 + i * (2 * h) + h / 2, s, h)
        }
      } else {
        const w = s / (k * 2)
        for (let i = 0; i < k; i++) {
          rectMode(CENTER)
          rect(-s / 2 + i * (2 * w) + w / 2, 0, w, s)
        }
      }
    },
  },
  {
    name: 'Checker',
    render: (s, t, pal, seed) => {
      const n = floor(map(noise(seed + 4, t * 0.1), 0, 1, 3, 6))
      const c = pick(pal)
      const w = s / n
      noFill()
      stroke(c)
      strokeWeight(max(2, s * 0.04))

      for (let i = 0; i <= n; i++) {
        line(-s / 2 + i * w, -s / 2, -s / 2 + i * w, s / 2)
        line(-s / 2, -s / 2 + i * w, s / 2, -s / 2 + i * w)
      }
      noStroke()
    },
  },
  {
    name: 'Disc',
    render: (s, t, pal, seed) => {
      const outer = pick(pal)
      const inner = pick(pal)
      fill(outer)
      circle(0, 0, s * 0.9)
      fill(inner)
      circle(0, 0, s * 0.5)
    },
  },
]

// ---- Main draw loop ----
function draw() {
  background(0)
  const t = frameCount / 60
  cells.forEach((c) => c.draw(t))
}

// ---- Quick controls ----
function keyPressed() {
  if (key === 'S') saveCanvas('frame', 'png')
  if (key === 'R') initGrid()
}
