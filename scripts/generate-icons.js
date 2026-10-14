import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c >>> 0;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4);
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crcVal = crc32(typeAndData);
  buf.writeUInt32BE(crcVal, 8 + len);
  return buf;
}

function generatePng(size) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // 8 bit
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // adaptive filter
  ihdrData[12] = 0; // non-interlaced
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data: filter byte (0) + (size * 4) bytes per line
  const rawData = Buffer.alloc(size * (1 + size * 4));
  let offset = 0;

  // Modern cyan/blue gradient theme with rounded rectangle icon
  const center = size / 2;
  const radius = size * 0.44;

  for (let y = 0; y < size; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded container
      const inBox = Math.abs(dx) <= radius && Math.abs(dy) <= radius;
      // Slight corner rounding
      const cornerDx = Math.max(0, Math.abs(dx) - (radius - size * 0.15));
      const cornerDy = Math.max(0, Math.abs(dy) - (radius - size * 0.15));
      const cornerDist = Math.sqrt(cornerDx * cornerDx + cornerDy * cornerDy);
      const isInside = cornerDist <= size * 0.15;

      if (isInside) {
        // Boss直聘 teal/cyan brand gradient: #00bebd to #0088cc
        const t = (x + y) / (size * 2);
        const r = Math.round(0 * (1 - t) + 10 * t);
        const g = Math.round(190 * (1 - t) + 140 * t);
        const b = Math.round(189 * (1 - t) + 215 * t);

        // Draw a neat briefcase or white check mark in center
        const inCenterRect = Math.abs(dx) <= size * 0.22 && Math.abs(dy) <= size * 0.16;
        const inHandle = Math.abs(dx) <= size * 0.12 && dy >= -size * 0.26 && dy <= -size * 0.15;
        const inHandleHole = Math.abs(dx) <= size * 0.07 && dy >= -size * 0.22 && dy <= -size * 0.15;

        if ((inCenterRect || (inHandle && !inHandleHole))) {
          // White symbol
          rawData[offset++] = 255;
          rawData[offset++] = 255;
          rawData[offset++] = 255;
          rawData[offset++] = 255;
        } else {
          rawData[offset++] = r;
          rawData[offset++] = g;
          rawData[offset++] = b;
          rawData[offset++] = 255;
        }
      } else {
        // Transparent
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve('public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const pngBuf = generatePng(size);
  const targetPath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(targetPath, pngBuf);
  console.log(`Generated ${targetPath} (${pngBuf.length} bytes)`);
}
