const MAX_SIDE = 400;
const QUALITY = 0.8;
const FORMAT = 'image/jpeg';

export async function readPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext('2d');

  if (!context) {
    bitmap.close();
    throw new Error('Canvas 2d context is unavailable');
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL(FORMAT, QUALITY);
}
