import sharp from "sharp";
import crypto from "crypto";

export interface OptimizationResult {
  buffer: Buffer;
  contentType: string;
  fileExtension: string;
  originalSize: number;
  finalSize: number;
  spaceSaved: number;
  percentReduction: number;
  checksum: string;
  status: "optimized" | "unchanged" | "skipped" | "failed";
  errorMessage?: string;
}

export interface OptimizationOptions {
  skipOptimization?: boolean;
  convertToWebp?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const DEFAULT_MAX_WIDTH = Number(process.env.IMAGE_MAX_WIDTH) || 1920;
const DEFAULT_MAX_HEIGHT = Number(process.env.IMAGE_MAX_HEIGHT) || 1920;
const DEFAULT_QUALITY = Number(process.env.IMAGE_DEFAULT_QUALITY) || 80;

export function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Sanitizes and validates SVG file contents against dangerous script injection.
 */
export function validateSvgContent(svgString: string): boolean {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript\s*:/gi,
    /data\s*:\s*text\/html/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers like onload, onclick, onerror
    /<iframe/gi,
    /<embed/gi,
    /<object/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(svgString)) {
      return false;
    }
  }
  return true;
}

/**
 * Optimizes uploaded files based on MIME type and options.
 */
export async function optimizeFile(
  inputBuffer: Buffer,
  originalFilename: string,
  declaredContentType: string,
  options: OptimizationOptions = {}
): Promise<OptimizationResult> {
  const originalSize = inputBuffer.length;
  const initialChecksum = calculateChecksum(inputBuffer);

  const ext = originalFilename.split(".").pop()?.toLowerCase() || "bin";

  // Check if optimization was explicitly skipped
  if (options.skipOptimization) {
    return {
      buffer: inputBuffer,
      contentType: declaredContentType,
      fileExtension: ext,
      originalSize,
      finalSize: originalSize,
      spaceSaved: 0,
      percentReduction: 0,
      checksum: initialChecksum,
      status: "skipped",
    };
  }

  // 1. JSON Processing: Parse and Minify
  if (declaredContentType === "application/json" || ext === "json") {
    try {
      const text = inputBuffer.toString("utf-8");
      const parsed = JSON.parse(text);
      const minified = Buffer.from(JSON.stringify(parsed), "utf-8");
      const finalSize = minified.length;
      const spaceSaved = Math.max(0, originalSize - finalSize);
      const percentReduction = originalSize > 0 ? Number(((spaceSaved / originalSize) * 100).toFixed(2)) : 0;

      return {
        buffer: minified,
        contentType: "application/json",
        fileExtension: "json",
        originalSize,
        finalSize,
        spaceSaved,
        percentReduction,
        checksum: calculateChecksum(minified),
        status: finalSize < originalSize ? "optimized" : "unchanged",
      };
    } catch {
      throw new Error("Invalid JSON file. Failed to parse JSON structure.");
    }
  }

  // 2. SVG Validation
  if (declaredContentType === "image/svg+xml" || ext === "svg") {
    const svgText = inputBuffer.toString("utf-8");
    if (!validateSvgContent(svgText)) {
      throw new Error("SVG rejected: Contains dangerous executable scripts or unsafe handlers.");
    }

    return {
      buffer: inputBuffer,
      contentType: "image/svg+xml",
      fileExtension: "svg",
      originalSize,
      finalSize: originalSize,
      spaceSaved: 0,
      percentReduction: 0,
      checksum: initialChecksum,
      status: "unchanged",
    };
  }

  // 3. PDF Validation
  if (declaredContentType === "application/pdf" || ext === "pdf") {
    // Verify PDF header magic bytes "%PDF-"
    const isPdf = inputBuffer.slice(0, 5).toString("ascii") === "%PDF-";
    if (!isPdf) {
      throw new Error("Invalid PDF file: Missing %PDF- signature.");
    }

    return {
      buffer: inputBuffer,
      contentType: "application/pdf",
      fileExtension: "pdf",
      originalSize,
      finalSize: originalSize,
      spaceSaved: 0,
      percentReduction: 0,
      checksum: initialChecksum,
      status: "unchanged",
    };
  }

  // 4. Raster Images: JPEG, PNG, WebP via Sharp
  const isRasterImage =
    ["image/jpeg", "image/png", "image/webp"].includes(declaredContentType) ||
    ["jpg", "jpeg", "png", "webp"].includes(ext);

  if (isRasterImage) {
    try {
      const maxWidth = options.maxWidth || DEFAULT_MAX_WIDTH;
      const maxHeight = options.maxHeight || DEFAULT_MAX_HEIGHT;
      const quality = options.quality || DEFAULT_QUALITY;
      const convertToWebp = options.convertToWebp ?? true;

      let pipeline = sharp(inputBuffer, { failOn: "error" });
      const metadata = await pipeline.metadata();

      // Dimension resizing (without upscaling)
      const currentWidth = metadata.width || 0;
      const currentHeight = metadata.height || 0;
      const needsResize = currentWidth > maxWidth || currentHeight > maxHeight;

      if (needsResize) {
        pipeline = pipeline.resize({
          width: maxWidth,
          height: maxHeight,
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      let outputBuffer: Buffer;
      let finalContentType: string;
      let finalExtension: string;

      if (convertToWebp) {
        // Convert to WebP with stripped metadata
        outputBuffer = await pipeline
          .webp({ quality, effort: 4 })
          .toBuffer();
        finalContentType = "image/webp";
        finalExtension = "webp";
      } else if (metadata.format === "png") {
        outputBuffer = await pipeline
          .png({ compressionLevel: 8 })
          .toBuffer();
        finalContentType = "image/png";
        finalExtension = "png";
      } else {
        outputBuffer = await pipeline
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
        finalContentType = "image/jpeg";
        finalExtension = "jpg";
      }

      const finalSize = outputBuffer.length;
      // If optimized version is surprisingly larger than original (rare, e.g. already heavily compressed), preserve original
      if (finalSize >= originalSize && !convertToWebp) {
        return {
          buffer: inputBuffer,
          contentType: declaredContentType,
          fileExtension: ext,
          originalSize,
          finalSize: originalSize,
          spaceSaved: 0,
          percentReduction: 0,
          checksum: initialChecksum,
          status: "unchanged",
        };
      }

      const spaceSaved = Math.max(0, originalSize - finalSize);
      const percentReduction = originalSize > 0 ? Number(((spaceSaved / originalSize) * 100).toFixed(2)) : 0;

      return {
        buffer: outputBuffer,
        contentType: finalContentType,
        fileExtension: finalExtension,
        originalSize,
        finalSize,
        spaceSaved,
        percentReduction,
        checksum: calculateChecksum(outputBuffer),
        status: "optimized",
      };
    } catch (error: any) {
      console.warn("Image optimization fallback to original:", error);
      return {
        buffer: inputBuffer,
        contentType: declaredContentType,
        fileExtension: ext,
        originalSize,
        finalSize: originalSize,
        spaceSaved: 0,
        percentReduction: 0,
        checksum: initialChecksum,
        status: "failed",
        errorMessage: error.message,
      };
    }
  }

  // Unhandled / Generic binary files
  return {
    buffer: inputBuffer,
    contentType: declaredContentType,
    fileExtension: ext,
    originalSize,
    finalSize: originalSize,
    spaceSaved: 0,
    percentReduction: 0,
    checksum: initialChecksum,
    status: "unchanged",
  };
}
