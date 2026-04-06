// generates proper macos template pngs for the tray icon
// template images must be black pixels with alpha, on transparent background
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// draw a daemon silhouette into an rgba buffer
function drawDaemon(size) {
  const buf = Buffer.alloc(size * size * 4, 0)
  const cx = size / 2
  const cy = size / 2

  const set = (x, y, a) => {
    x = Math.round(x)
    y = Math.round(y)
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const i = (y * size + x) * 4
    buf[i] = 0     // r
    buf[i + 1] = 0 // g
    buf[i + 2] = 0 // b
    buf[i + 3] = Math.min(255, buf[i + 3] + a) // alpha
  }

  // filled circle
  const fillCircle = (ox, oy, r, a) => {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) set(ox + dx, oy + dy, a)
      }
    }
  }

  // filled ellipse
  const fillEllipse = (ox, oy, rx, ry, a) => {
    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) set(ox + dx, oy + dy, a)
      }
    }
  }

  // line
  const drawLine = (x0, y0, x1, y1, thickness, a) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = x0 + (x1 - x0) * t
      const y = y0 + (y1 - y0) * t
      fillCircle(x, y, thickness, a)
    }
  }

  const s = size / 22 // scale factor

  // body - main round shape
  fillEllipse(cx, cy + 1 * s, 6 * s, 7 * s, 255)

  // left horn
  drawLine(cx - 4 * s, cy - 5 * s, cx - 6 * s, cy - 9 * s, 1 * s, 255)

  // right horn
  drawLine(cx + 4 * s, cy - 5 * s, cx + 6 * s, cy - 9 * s, 1 * s, 255)

  // head
  fillCircle(cx, cy - 3 * s, 5 * s, 255)

  // eyes - cut out (transparent)
  const clearCircle = (ox, oy, r) => {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const x = Math.round(ox + dx)
          const y = Math.round(oy + dy)
          if (x >= 0 && x < size && y >= 0 && y < size) {
            const i = (y * size + x) * 4
            buf[i + 3] = 0
          }
        }
      }
    }
  }
  clearCircle(cx - 2.5 * s, cy - 4 * s, 1.2 * s)
  clearCircle(cx + 2.5 * s, cy - 4 * s, 1.2 * s)

  // smile - cut out
  for (let angle = 0.2; angle < Math.PI - 0.2; angle += 0.05) {
    const x = cx + Math.cos(angle) * 2.5 * s
    const y = cy - 1.5 * s + Math.sin(angle) * 1.5 * s
    const px = Math.round(x)
    const py = Math.round(y)
    if (px >= 0 && px < size && py >= 0 && py < size) {
      const i = (py * size + px) * 4
      buf[i + 3] = 0
    }
  }

  // tail - curving right
  const tailPoints = []
  for (let t = 0; t <= 1; t += 0.02) {
    const x = cx + 5 * s + t * 4 * s
    const y = cy + 7 * s - t * 3 * s - Math.sin(t * Math.PI) * 2 * s
    tailPoints.push([x, y])
  }
  for (let i = 0; i < tailPoints.length - 1; i++) {
    const thick = (1 - i / tailPoints.length) * 1.2 * s + 0.3
    drawLine(tailPoints[i][0], tailPoints[i][1], tailPoints[i + 1][0], tailPoints[i + 1][1], thick, 255)
  }

  // feet
  fillEllipse(cx - 3 * s, cy + 8 * s, 2 * s, 1 * s, 255)
  fillEllipse(cx + 3 * s, cy + 8 * s, 2 * s, 1 * s, 255)

  return buf
}

// encode rgba buffer as png
function encodePng(width, height, rgba) {
  // png signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // ihdr chunk
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type rgba
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // raw image data with filter byte per row
  const raw = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0 // no filter
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4)
  }

  const compressed = zlib.deflateSync(raw)

  const makeChunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length, 0)
    const typeB = Buffer.from(type)
    const crcData = Buffer.concat([typeB, data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(crcData) >>> 0, 0)
    return Buffer.concat([len, typeB, data, crc])
  }

  // crc32 table
  const crcTable = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crcTable[n] = c
  }

  function crc32(buf) {
    let c = 0xffffffff
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
    return c ^ 0xffffffff
  }

  const ihdrChunk = makeChunk('IHDR', ihdr)
  const idatChunk = makeChunk('IDAT', compressed)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

// generate 22x22 and 44x44 versions
const assets = path.join(__dirname, '..', 'assets')

const sizes = [
  { size: 22, file: 'tray-iconTemplate.png' },
  { size: 44, file: 'tray-iconTemplate@2x.png' },
]

for (const { size, file } of sizes) {
  const rgba = drawDaemon(size)
  const png = encodePng(size, size, rgba)
  fs.writeFileSync(path.join(assets, file), png)
  console.log(`wrote ${file} (${size}x${size})`)
}
