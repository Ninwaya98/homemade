/**
 * Client-side image processing: square crop + compress to ≤1MB.
 * Uses Canvas API — no dependencies.
 */

const MAX_SIZE_BYTES = 1_000_000; // 1MB
const MAX_DIMENSION = 1024; // max px for width/height
const INITIAL_QUALITY = 0.85;
const MIN_QUALITY = 0.3;
const QUALITY_STEP = 0.1;

/**
 * Process an image file:
 * 1. Accept any image format the browser can decode
 * 2. Center-crop to square
 * 3. Scale down if larger than MAX_DIMENSION
 * 4. Compress to JPEG ≤1MB
 *
 * Returns a new File ready for upload.
 */
export async function processImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);

  // Center-crop to square
  const size = Math.min(bitmap.width, bitmap.height);
  const offsetX = Math.floor((bitmap.width - size) / 2);
  const offsetY = Math.floor((bitmap.height - size) / 2);

  // Scale down if needed
  const outputSize = Math.min(size, MAX_DIMENSION);

  const canvas = new OffscreenCanvas(outputSize, outputSize);
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    bitmap,
    offsetX, offsetY, size, size, // source: square crop from center
    0, 0, outputSize, outputSize, // destination: fill the canvas
  );

  bitmap.close();

  // Compress to JPEG, stepping down quality until ≤1MB
  let quality = INITIAL_QUALITY;
  let blob: Blob;

  do {
    blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
    if (blob.size <= MAX_SIZE_BYTES) break;
    quality -= QUALITY_STEP;
  } while (quality >= MIN_QUALITY);

  // If still too large at min quality, scale down further
  if (blob.size > MAX_SIZE_BYTES) {
    const scale = Math.sqrt(MAX_SIZE_BYTES / blob.size);
    const smallerSize = Math.floor(outputSize * scale);
    const smallCanvas = new OffscreenCanvas(smallerSize, smallerSize);
    const smallCtx = smallCanvas.getContext("2d")!;
    smallCtx.drawImage(canvas, 0, 0, smallerSize, smallerSize);
    blob = await smallCanvas.convertToBlob({ type: "image/jpeg", quality: MIN_QUALITY });
  }

  // Build a File from the blob
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

/**
 * Process multiple image files. Returns processed files in order.
 */
export async function processImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(processImage));
}
