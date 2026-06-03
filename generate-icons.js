const { Jimp } = require('./node_modules/jimp');
const path = require('path');

const BASE = path.resolve(__dirname);

async function main() {
  const img = await Jimp.read(path.join(BASE, 'icon-original.png'));
  const { width, height } = img.bitmap;
  const d = img.bitmap.data;

  // --- 1. Bounding box of opaque content ---
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (d[(y * width + x) * 4 + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log(`Bounding box: (${minX},${minY}) -> (${maxX},${maxY})`);

  // Small padding so content doesn't touch the edge
  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const cropSize = Math.max(cropW, cropH);

  // --- 2. Crop and center in square canvas ---
  const cropped = img.clone();
  cropped.crop({ x: minX, y: minY, w: cropW, h: cropH });

  const offsetX = Math.round((cropSize - cropW) / 2);
  const offsetY = Math.round((cropSize - cropH) / 2);

  const square = new Jimp({ width: cropSize, height: cropSize, color: 0x00000000 });
  square.composite(cropped, offsetX, offsetY);

  // --- 3. BFS fill: spread opaque border colors into transparent pixels ---
  const sd = square.bitmap.data;
  const sw = cropSize;

  const queue = [];
  const visited = new Uint8Array(sw * sw);

  for (let y = 0; y < sw; y++) {
    for (let x = 0; x < sw; x++) {
      const idx = (y * sw + x) * 4;
      if (sd[idx + 3] >= 128) {
        let border = false;
        for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < sw && ny >= 0 && ny < sw) {
            if (sd[(ny * sw + nx) * 4 + 3] < 128) { border = true; break; }
          }
        }
        if (border) {
          queue.push(x, y, sd[idx], sd[idx+1], sd[idx+2]);
          visited[y * sw + x] = 1;
        }
      }
    }
  }

  let qi = 0;
  while (qi < queue.length) {
    const x = queue[qi++], y = queue[qi++];
    const r = queue[qi++], g = queue[qi++], b = queue[qi++];
    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= sw || ny < 0 || ny >= sw) continue;
      const npos = ny * sw + nx;
      if (visited[npos]) continue;
      visited[npos] = 1;
      const nidx = npos * 4;
      if (sd[nidx + 3] < 128) {
        sd[nidx] = r; sd[nidx+1] = g; sd[nidx+2] = b; sd[nidx+3] = 255;
        queue.push(nx, ny, r, g, b);
      }
    }
  }

  // --- 4. Generate output files ---
  const outputs = [
    { size: 512, file: 'icon-512.png' },
    { size: 192, file: 'icon-192.png' },
    { size: 48,  file: 'favicon-48.png' },
  ];

  for (const { size, file } of outputs) {
    const out = square.clone();
    out.resize({ w: size, h: size });
    await out.write(path.join(BASE, file));
    console.log(`Gerado: ${file} (${size}x${size})`);
  }

  console.log('Pronto!');
}

main().catch(err => { console.error(err); process.exit(1); });
