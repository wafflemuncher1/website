import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const INPUT_DIR = path.join(ROOT, "src", "assets", "raw");
const OUTPUT_DIR = path.join(ROOT, "src", "assets", "optimized");

// Tune these once and forget them:
const MAX_WIDTH = 1600;   // good for full-width/hero images
const QUALITY = 78;       // 70-82 is usually a sweet spot for WebP

const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff", ".avif"]);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function baseNameNoExt(file) {
  return path.basename(file, path.extname(file));
}

async function run() {
  ensureDir(INPUT_DIR);
  ensureDir(OUTPUT_DIR);

  const files = fs.readdirSync(INPUT_DIR)
    .filter((f) => allowedExt.has(path.extname(f).toLowerCase()));

  if (files.length === 0) {
    console.log(`No images found in ${INPUT_DIR}`);
    console.log("Drop images there (jpg/png/webp) then re-run: npm run images");
    return;
  }

  console.log(`Optimizing ${files.length} image(s)...`);

  for (const file of files) {
    const inPath = path.join(INPUT_DIR, file);
    const outName = `${baseNameNoExt(file)}.webp`;
    const outPath = path.join(OUTPUT_DIR, outName);

    const image = sharp(inPath, { failOnError: false });
    const meta = await image.metadata();

    // Avoid upscaling small images
    const resizeWidth = meta.width && meta.width > MAX_WIDTH ? MAX_WIDTH : meta.width;

    await image
      .resize({ width: resizeWidth, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outPath);

    console.log(`✔ ${file} -> optimized/${outName}`);
  }

  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});