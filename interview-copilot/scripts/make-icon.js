// Run: node scripts/make-icon.js
// Generates assets/icon.png (512x512 purple gradient) — required before `npm run dist`
const fs   = require('fs')
const path = require('path')
const zlib = require('zlib')

const SIZE = 512
const rowSize = 1 + SIZE * 3
const raw = Buffer.alloc(SIZE * rowSize)

for (let y = 0; y < SIZE; y++) {
  raw[y * rowSize] = 0  // PNG filter: None
  for (let x = 0; x < SIZE; x++) {
    const cx = SIZE / 2, cy = SIZE / 2
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / (SIZE / 2)
    const f = Math.max(0.55, 1 - dist * 0.42)
    const i = y * rowSize + 1 + x * 3
    raw[i]     = Math.round(124 * f)  // R
    raw[i + 1] = Math.round(90  * f)  // G
    raw[i + 2] = Math.round(240 * f)  // B
  }
}

const compressed = zlib.deflateSync(raw)

function crc32(buf) {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  let crc = -1
  for (const byte of buf) crc = t[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const t   = Buffer.from(type, 'ascii')
  const crc = crc32(Buffer.concat([t, data]))
  const out = Buffer.alloc(4 + 4 + data.length + 4)
  out.writeUInt32BE(data.length, 0)
  t.copy(out, 4)
  data.copy(out, 8)
  out.writeUInt32BE(crc, 8 + data.length)
  return out
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)  // width
ihdr.writeUInt32BE(SIZE, 4)  // height
ihdr[8]  = 8   // bit depth
ihdr[9]  = 2   // color type: RGB
ihdr[10] = 0   // compression
ihdr[11] = 0   // filter
ihdr[12] = 0   // interlace

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),  // PNG signature
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
])

const outPath = path.join(__dirname, '..', 'assets', 'icon.png')
fs.writeFileSync(outPath, png)
console.log(`Icon written → ${outPath} (${(png.length / 1024).toFixed(1)} KB)`)
