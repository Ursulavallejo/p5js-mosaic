// === GEOMETRIC MOSAIC ===
// Created with p5.js

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
      cells.push(new Cell(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE))
    }
  }
  background(0)
}

// ---- Cell class ----
class Cell {
  constructor(x, y, s) {
    this.x = x
    this.y = y
    this.s = s
    this.type = pick(Module.types)
    this.nextType = this.type
    this.lastSwitch = frameCount
    this.bg = color(0) // black background
    this.seed = random(10000) // unique per-cell seed
  }

  maybeSwitch() {
    if ((frameCount - this.lastSwitch) % CHANGE_EVERY === 0) {
      this.nextType = pick(Module.types)
      this.type = this.nextType
      this.lastSwitch = frameCount + rndi(0, 10) // desynchronize slightly
    }
  }

  draw(t) {
    this.maybeSwitch()

    // Cell background
    fill(0)
    rect(this.x, this.y, this.s, this.s)

    // Call the active module
    push()
    translate(this.x + this.s / 2, this.y + this.s / 2)

    // Slower rotation (was t * 0.1)
    const n = noise(this.seed, t * 0.05)
    const rot = map(n, 0, 1, 0, TWO_PI / 2)
    rotate(rot)

    this.type.render(this.s, t, palette, this.seed)
    pop()
  }
}

// ---- Graphic modules ----
class Module {
  static types = []

  // Dots: matrix of filled circles
  // Dots: matrix of filled circles (with slow color timer)
  static Dots = {
    render: (s, t, pal, seed) => {
      const n = noise(seed, t * 0.04)
      const cols = floor(map(n, 0, 1, 2, 5))
      const r = s / (cols * 2.2)
      const step = s / cols

      // --- Slow color change timer ---
      const period = 3000 // milliseconds between color changes (3s)
      const idx = floor(int((millis() + seed * 1000) / period) % pal.length)
      const c = pal[idx]
      fill(c)

      for (let y = -s / 2 + step / 2; y < s / 2; y += step) {
        for (let x = -s / 2 + step / 2; x < s / 2; x += step) {
          circle(x, y, r * 2)
        }
      }
    },
  }

  // Plus: thick crosses
  static Plus = {
    render: (s, t, pal, seed) => {
      const c = pick(pal)
      // Slower (was t * 0.6)
      const thick = map(noise(seed + 1, t * 0.2), 0, 1, s * 0.12, s * 0.32)
      fill(c)
      rectMode(CENTER)
      rect(0, 0, s * 0.8, thick, 4)
      rect(0, 0, thick, s * 0.8, 4)
    },
  }

  // Stripes: horizontal or vertical bands
  static Stripes = {
    render: (s, t, pal, seed) => {
      // Slower (was t * 0.15)
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
  }

  // Checker: grid-like structure
  static Checker = {
    render: (s, t, pal, seed) => {
      // Slower (was t * 0.2)
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
  }

  // Disc: large circular shapes
  static Disc = {
    render: (s, t, pal, seed) => {
      const outer = pick(pal)
      const inner = pick(pal)
      fill(outer)
      circle(0, 0, s * 0.9)
      fill(inner)
      circle(0, 0, s * 0.5)
    },
  }
}

Module.types = [
  Module.Dots,
  Module.Plus,
  Module.Stripes,
  Module.Checker,
  Module.Disc,
]

// ---- Main draw loop ----
function draw() {
  background(0)
  const t = frameCount / 60
  cells.forEach((c) => c.draw(t))
}

// ---- Quick controls ----
// S: save frame, R: re-randomize modules
function keyPressed() {
  if (key === 'S') saveCanvas('frame', 'png')
  if (key === 'R')
    cells.forEach((c) => {
      c.type = pick(Module.types)
      c.lastSwitch = frameCount
    })
}
