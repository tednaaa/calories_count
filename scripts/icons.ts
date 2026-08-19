import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const BACKGROUND = '#0b0b0c';
const TRACK = '#2a2d35';
const BRAND = '#1677ff';
const SIZE = 512;
const RADIUS = 150;
const STROKE = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const FILLED = 0.75;

function logo(cornerRadius: number): string {
  const center = SIZE / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="${cornerRadius}" fill="${BACKGROUND}"/>
  <circle cx="${center}" cy="${center}" r="${RADIUS}" fill="none" stroke="${TRACK}" stroke-width="${STROKE}"/>
  <circle cx="${center}" cy="${center}" r="${RADIUS}" fill="none" stroke="${BRAND}" stroke-width="${STROKE}"
    stroke-linecap="round" stroke-dasharray="${CIRCUMFERENCE.toFixed(2)}"
    stroke-dashoffset="${(CIRCUMFERENCE * (1 - FILLED)).toFixed(2)}"
    transform="rotate(-90 ${center} ${center})"/>
</svg>
`;
}

const rounded = Buffer.from(logo(112));
const square = Buffer.from(logo(0));

await mkdir('public/icons', { recursive: true });
await writeFile('public/favicon.svg', rounded);

const targets = [
  { source: rounded, size: 192, file: 'icons/192.png' },
  { source: rounded, size: 512, file: 'icons/512.png' },
  { source: square, size: 512, file: 'icons/maskable-512.png' },
  { source: square, size: 180, file: 'apple-touch-icon.png' },
];

for (const { source, size, file } of targets) {
  await sharp(source).resize(size, size).png().toFile(join('public', file));
  console.log(`✓ ${file}`);
}
