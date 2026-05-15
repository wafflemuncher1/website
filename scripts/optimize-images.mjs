import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import heicConvert from "heic-convert";

const ROOT = process.cwd();
const RAW_DIR = path.join(ROOT, "src", "assets", "raw");
const OUT_DIR = path.join(ROOT, "src", "assets", "optimized");

const MAX_WIDTH = 1600;
const QUALITY = 78;

const allowedExt = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".tiff", ".avif",
  ".heic", ".heif"
]);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function getNextImageNumber(outDir) {
  ensureDir(outDir);
  const files = fs.readdirSync(outDir);

  let maxN = 0;
  for (const f of files) {
    const m = /^image(\d+)\.webp$/i.exec(f);
    if (m) maxN = Math.max(maxN, Number(m[1]));
  }
  return maxN + 1;
}

async function bufferToWebp(buffer, outPath) {
  const image = sharp(buffer, { failOnError: false });
  const meta = await image.metadata();

  const resizeWidth =
    meta.width && meta.width > MAX_WIDTH ? MAX_WIDTH : meta.width;

  await image
    .resize({ width: resizeWidth, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(outPath);
}

async function readAsBufferPossiblyHeic(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const inputBuffer = fs.readFileSync(filePath);

  if (ext === ".heic" || ext === ".heif") {
    // HEIC -> JPEG buffer
    const jpegBuffer = await heicConvert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.92
    });
    return jpegBuffer;
  }

  return inputBuffer;
}

async function run() {
  ensureDir(RAW_DIR);
  ensureDir(OUT_DIR);

  const rawFiles = fs.readdirSync(RAW_DIR)
    .filter((f) => {
      const p = path.join(RAW_DIR, f);
      if (!fs.statSync(p).isFile()) return false;
      return allowedExt.has(path.extname(f).toLowerCase());
    });

  if (rawFiles.length === 0) {
    console.log(`No images found in ${RAW_DIR}`);
    console.log("Drop photos in raw/ then run: npm run images");
    return;
  }

  let nextN = getNextImageNumber(OUT_DIR);
  console.log(`Found ${rawFiles.length} raw image(s). Next output will start at image${nextN}.webp`);

  for (const file of rawFiles) {
    const inPath = path.join(RAW_DIR, file);
    const outName = `image${nextN}.webp`;
    const outPath = path.join(OUT_DIR, outName);

    const buffer = await readAsBufferPossiblyHeic(inPath);
    await bufferToWebp(buffer, outPath);

    // DELETE original after successful conversion
    fs.unlinkSync(inPath);

    console.log(`✔ ${file} -> optimized/${outName} (deleted raw)`);
    nextN++;
  }

  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});