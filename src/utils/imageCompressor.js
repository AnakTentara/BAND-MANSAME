import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Compresses an image file in-place using sharp at maximum quality.
 * @param {string} filePath - Absolute path to the image file on disk.
 * @param {number} maxDimension - Maximum width/height boundary (default 1600px).
 * @returns {Promise<void>}
 */
export async function compressImageInPlace(filePath, maxDimension = 1600) {
  if (!fs.existsSync(filePath)) return;

  try {
    const ext = path.extname(filePath).toLowerCase();
    const tempPath = `${filePath}.tmp`;

    // Initialize sharp
    let pipeline = sharp(filePath);
    const metadata = await pipeline.metadata();

    // Determine if resizing is needed (resize only if dimensions exceed maxDimension)
    if (metadata.width > maxDimension || metadata.height > maxDimension) {
      pipeline = pipeline.resize({
        width: metadata.width > metadata.height ? maxDimension : undefined,
        height: metadata.height >= metadata.width ? maxDimension : undefined,
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Set high-quality compression options based on format
    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: 92, progressive: true, mozjpeg: true });
    } else if (ext === '.png') {
      pipeline = pipeline.png({ compressionLevel: 8, quality: 92 });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 92, lossless: false });
    } else {
      // Fallback for other formats supported by sharp (e.g. gif, avif)
      pipeline = pipeline.keepMetadata();
    }

    // Write to temporary file first
    await pipeline.toFile(tempPath);

    // Replace original file with compressed one
    fs.unlinkSync(filePath);
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    console.error(`Error compressing image at ${filePath}:`, error);
    // If anything fails, keep the original file untouched
  }
}
