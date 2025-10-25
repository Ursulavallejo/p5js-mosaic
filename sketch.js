// --- Grid Wall (anti-strobe colors) ---

// Config
const CELL = 204
const FADE_FRAMES = 50 // crossfade duration
const HOLD_FRAMES = 100 // time a tile stays before changing
const NOISE_SCALE = 0.08
const BG_LIGHT = '#f5f5f5'
const BG_DARK = '#000000'

let cols,
  rows,
  cells = []
let palette

// Helpers
const rndi = (a, b) => floor(random(a, b + 1))
const pick = (a) => a[floor(random(a.length))]

// A tiny deterministic picker based on noise (stable per seed)
function pickStableColor(pal, seed, k = 0) {
  const idx = floor(noise(seed * 1.371 + k) * pal.length) % pal.length
  return pal[idx]
}

function setup() {
  createCanvas(windowWidth, windowHeight)
  pixelDensity(1) // Avoid hairline gaps on HiDPI screens
  noStroke()
  palette = [
    color('#ff3ea5'),
    color('#00d1ff'),
    color('#00d36f'),
    color('#ffa500'),
    color('#ffd83e'),
    color('#ffffff'),
  ]
  initGrid()
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
  initGrid()
}

function initGrid() {
  cols = ceil(width / CELL)
  rows = ceil(height / CELL)
  cells.length = 0

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i * CELL,
        y = j * CELL
      const isLight = noise(i * NOISE_SCALE, j * NOISE_SCALE) > 0.6
      cells.push(createCell(x, y, CELL, isLight))
    }
  }
  background(BG_DARK)
}

/* ---------- Module factories (stable params per instance) ----------
   Each factory returns an object { draw(s, t) } with colors/options
   chosen deterministically from 'seed' so they don't flicker per frame.
--------------------------------------------------------------------*/

function makePinkDotsTile(seed, pal, isLight) {
  // color is fixed (pink), grid density animates with time but not color
  const plateColor = color('#f1f1f1')
  const dotColor = color('#ff3ea5')

  return {
    draw(s, t) {
      push()
      const cols = floor(map(noise(seed, t * 0.3), 0, 1, 3, 6))
      const step = s / cols
      const r = step * 0.42
      if (!isLight) {
        rectMode(CENTER)
        fill(plateColor)
        rect(0, 0, s * 0.98, s * 0.98, 6)
      }
      fill(dotColor)
      noStroke()
      for (let y = -s / 2 + step / 2; y < s / 2; y += step) {
        for (let x = -s / 2 + step / 2; x < s / 2; x += step) {
          circle(x, y, r * 2)
        }
      }
      pop()
    },
  }
}

function makePlus(seed, pal) {
  const c = pickStableColor(pal, seed, 11) // fixed color
  return {
    draw(s, t) {
      push()
      const thick = map(noise(seed + 1, t * 0.25), 0, 1, s * 0.12, s * 0.32)
      rectMode(CENTER)
      noStroke()
      fill(c)
      rect(0, 0, s * 0.84, thick, 5)
      rect(0, 0, thick, s * 0.84, 5)
      pop()
    },
  }
}

function makeStripes(seed, pal) {
  const c = pickStableColor(pal, seed, 23) // fixed color
  const horiz = noise(seed + 3) < 0.5 // fixed orientation
  return {
    draw(s, t) {
      push()
      const k = floor(map(noise(seed + 2, t * 0.15), 0, 1, 3, 9))
      rectMode(CENTER)
      noStroke()
      fill(c)
      if (horiz) {
        const h = s / (k * 2)
        for (let i = 0; i < k; i++)
          rect(0, -s / 2 + i * (2 * h) + h / 2, s * 0.98, h)
      } else {
        const w = s / (k * 2)
        for (let i = 0; i < k; i++)
          rect(-s / 2 + i * (2 * w) + w / 2, 0, w, s * 0.98)
      }
      pop()
    },
  }
}

function makeChecker(seed, pal) {
  const c = pickStableColor(pal, seed, 37) // fixed color
  return {
    draw(s, t) {
      push()
      const n = floor(map(noise(seed + 4, t * 0.2), 0, 1, 3, 6))
      const w = s / n
      noFill()
      stroke(c)
      strokeCap(SQUARE)
      strokeWeight(max(2, s * 0.06))
      for (let i = 0; i <= n; i++) {
        line(-s / 2 + i * w, -s / 2, -s / 2 + i * w, s / 2)
        line(-s / 2, -s / 2 + i * w, s / 2, -s / 2 + i * w)
      }
      noStroke()
      pop()
    },
  }
}

function makeSolidBlock(seed, pal) {
  const c = pickStableColor(pal, seed, 51) // fixed color
  return {
    draw(s, t) {
      push()
      const w = map(noise(seed + 5, t * 0.18), 0, 1, s * 0.45, s * 0.95)
      const x = map(noise(seed + 6, t * 0.1), 0, 1, -s * 0.2, s * 0.2)
      rectMode(CENTER)
      noStroke()
      fill(c)
      rect(x, 0, w, s * 0.98, 6)
      pop()
    },
  }
}

function makeDisc(seed, pal) {
  // Fixed outer/inner colors to remove strobe
  const outer = pickStableColor(pal, seed, 71)
  const inner = pickStableColor(pal, seed, 83)
  return {
    draw(s, t) {
      push()
      noStroke()
      fill(outer)
      circle(0, 0, s * 0.94)
      fill(inner)
      circle(0, 0, s * 0.52)
      pop()
    },
  }
}

// List of module factories
const MODULE_FACTORIES = [
  makePinkDotsTile,
  makePlus,
  makeStripes,
  makeChecker,
  makeSolidBlock,
  makeDisc,
]

/* ---------- Cell factory (each grid tile crossfades between module instances)
   'curr' and 'next' are *instances* with fixed colors/options,
   so they don't flicker per frame.
--------------------------------------------------------------------*/
function createCell(x, y, s, isLight) {
  const seed = random(10000)

  function makeInstance(factorySeed) {
    const factory = pick(MODULE_FACTORIES)
    return factory(factorySeed, palette, isLight)
  }

  let curr = makeInstance(seed)
  let next = makeInstance(seed + 77)
  let t0 = frameCount + rndi(0, HOLD_FRAMES) // desync starts
  let phase = 'hold' // 'hold' -> 'fade'

  function shouldSwitch() {
    if (phase === 'hold' && frameCount - t0 > HOLD_FRAMES + rndi(-10, 10)) {
      phase = 'fade'
      t0 = frameCount
      next = makeInstance(seed + frameCount + 123) // new stable instance
    } else if (phase === 'fade' && frameCount - t0 > FADE_FRAMES) {
      phase = 'hold'
      t0 = frameCount
      curr = next
    }
  }

  function drawCell(t) {
    shouldSwitch()

    // Stable tile background (no gaps)
    push()
    rectMode(CORNER)
    noStroke()
    fill(isLight ? BG_LIGHT : BG_DARK)
    rect(x, y, s + 1, s + 1)
    pop()

    // Local drawing space for the module (center + gentle rotation)
    push()
    translate(x + s / 2, y + s / 2)
    const rot = map(noise(seed, t * 0.12), 0, 1, -PI / 8, PI / 8)
    rotate(rot)

    // Crossfade
    const k = phase === 'fade' ? (frameCount - t0) / FADE_FRAMES : 0
    const aCurr = 1 - constrain(k, 0, 1)
    const aNext = constrain(k, 0, 1)

    push()
    drawingContext.globalAlpha = aCurr
    curr.draw(s, t)
    pop()

    if (aNext > 0) {
      push()
      drawingContext.globalAlpha = aNext
      next.draw(s, t)
      pop()
    }

    pop()
  }

  return { draw: drawCell }
}

// --------- Main loop ----------
function draw() {
  background(BG_DARK)
  const t = frameCount / 60
  for (const c of cells) c.draw(t)
}

function keyPressed() {
  if (key === 'S') saveCanvas('frame', 'png')
  if (key === 'R') initGrid() // Reshuffle
}
