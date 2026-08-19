import { mkdir, readdir } from 'node:fs/promises';
import { join, parse } from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const SOURCE = 'raw-photos';
const OUTPUT = 'public/foods';
const SIZE = 600;
const QUALITY = 80;

await mkdir(OUTPUT, { recursive: true });

let files: string[] = [];

try {
  files = (await readdir(SOURCE)).filter(file => /\.(?:jpe?g|png|heic|webp)$/i.test(file));
}
catch {
  console.error(`Положи исходные фотографии в ${SOURCE}/, назвав файлы идентификаторами блюд.`);
  process.exit(1);
}

if (files.length === 0) {
  console.log(`В ${SOURCE}/ нечего сжимать.`);
}

for (const file of files) {
  const { name } = parse(file);

  await sharp(join(SOURCE, file))
    .rotate()
    .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
    .webp({ quality: QUALITY })
    .toFile(join(OUTPUT, `${name}.webp`));

  console.log(`✓ ${name}.webp`);
}
