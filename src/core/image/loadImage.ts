import type { RgbaImage } from '../types';

/**
 * Browser-only edge of the pipeline: decode a user's file into a plain RgbaImage.
 *
 * Transparency is flattened onto white so transparent PNGs don't quantize toward
 * garbage. Very large uploads are capped on the longest side before we read
 * pixels back — the pipeline downscales to the stitch grid anyway, so there is no
 * benefit to holding a 6000px buffer in memory.
 */
const MAX_SOURCE_DIM = 1600;

export async function loadImageFromFile(file: File): Promise<RgbaImage> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadHtmlImage(url);
    return drawToRgba(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
}

function drawToRgba(img: HTMLImageElement): RgbaImage {
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  const scale = Math.min(1, MAX_SOURCE_DIM / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Flatten transparency onto white.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  return { width: w, height: h, data: imageData.data };
}

/** Convert a pipeline image back into DOM ImageData (for canvas rendering). */
export function rgbaToImageData(image: RgbaImage): ImageData {
  return new ImageData(new Uint8ClampedArray(image.data), image.width, image.height);
}
