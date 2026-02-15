/**
 * Compress an image file for avatar upload.
 * Resizes to max 400px, outputs JPEG ~0.8 quality, target ~100KB.
 * Converts HEIC/HEIF to JPEG when browser can't decode them natively.
 */

const MAX_DIM = 400;
const JPEG_QUALITY = 0.8;
const TARGET_BYTES = 100 * 1024;

const HEIC_TYPES = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];
const HEIC_EXT = /\.(heic|heif)$/i;

export function isHeic(file: File): boolean {
  return HEIC_TYPES.includes(file.type.toLowerCase()) || HEIC_EXT.test(file.name);
}

/** Returns an object URL for img src. For HEIC, converts to JPEG first. Caller must revoke the URL. */
export async function getImagePreviewUrl(file: File): Promise<string> {
  if (!isHeic(file)) {
    return URL.createObjectURL(file);
  }
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({ blob: file, toType: "image/jpeg" });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return URL.createObjectURL(blob);
}

export async function compressImage(file: File): Promise<Blob> {
  let source = file;
  if (isHeic(file)) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: file, toType: "image/jpeg" });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    source = new File([blob], file.name.replace(/\.[^.]+$/i, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }
  const img = await loadImage(source);
  const { width, height } = clampDimensions(img.width, img.height, MAX_DIM);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d not available");
  ctx.drawImage(img, 0, 0, width, height);

  let quality = JPEG_QUALITY;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > TARGET_BYTES && quality > 0.3) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality);
  }

  return blob;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function clampDimensions(
  w: number,
  h: number,
  max: number
): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const scale = max / Math.max(w, h);
  return {
    width: Math.round(w * scale),
    height: Math.round(h * scale),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    );
  });
}
