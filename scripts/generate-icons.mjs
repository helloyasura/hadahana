/**
 * Rasterize Hadahana brand icons from the SVG sources.
 * Usage: node scripts/generate-icons.mjs
 */
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function markSvg({ rounded, padded }) {
  // padded=true shrinks the sun+ring slightly so maskable/Apple crops stay safe.
  const s = padded ? 0.86 : 1;
  const cx = 16;
  const cy = 16;
  const ringR = 12.15 * s;
  const ringW = padded ? 2.0 : 2.2;
  const sunR = 5.55 * s;
  // Ticks sit on the ring and point inward only, so large sizes don't grow "bolts".
  const tickW = 1.2 * s;
  const inward = 1.7 * s;
  const tickH = ringW + inward;
  const outer = ringR + ringW / 2;
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const y = cy - outer;
    return `    <rect x="${(cx - tickW / 2).toFixed(3)}" y="${y.toFixed(3)}" width="${tickW.toFixed(3)}" height="${tickH.toFixed(3)}" rx="${(0.28 * s).toFixed(3)}" transform="rotate(${i * 30} ${cx} ${cy})"/>`;
  }).join("\n");

  const bg = rounded
    ? `<rect x="0.5" y="0.5" width="31" height="31" rx="6.8" fill="url(#h-bg)" stroke="#b4a0ff" stroke-width="0.7" stroke-opacity="0.45"/>`
    : `<rect width="32" height="32" fill="url(#h-bg)"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Hadahana">
  <title>Hadahana</title>
  <defs>
    <radialGradient id="h-bg" cx="36%" cy="30%" r="78%">
      <stop offset="0" stop-color="#32286a"/>
      <stop offset=".52" stop-color="#15182e"/>
      <stop offset="1" stop-color="#090c19"/>
    </radialGradient>
    <radialGradient id="h-sun" cx="36%" cy="32%" r="68%">
      <stop offset="0" stop-color="#fff6d4"/>
      <stop offset=".45" stop-color="#edcc91"/>
      <stop offset="1" stop-color="#c1964e"/>
    </radialGradient>
  </defs>
  ${bg}
  <circle cx="${cx}" cy="${cy}" r="${ringR.toFixed(3)}" fill="none" stroke="#edcc91" stroke-width="${ringW.toFixed(3)}"/>
  <g fill="#edcc91">
${ticks}
  </g>
  <circle cx="${cx}" cy="${cy}" r="${sunR.toFixed(3)}" fill="url(#h-sun)"/>
</svg>
`;
}

async function raster(svg, size, dest, { flatten } = {}) {
  let pipeline = sharp(Buffer.from(svg), {
    density: Math.round((96 * size) / 32),
  })
    .resize(size, size, { kernel: sharp.kernel.lanczos3, fit: "fill" })
    .png({ compressionLevel: 9, adaptiveFiltering: true });
  if (flatten) {
    pipeline = pipeline.flatten({ background: "#090c19" });
  }
  await pipeline.toFile(dest);
  return dest;
}

async function main() {
  const faviconSvg = markSvg({ rounded: true, padded: false });
  const appSvg = markSvg({ rounded: false, padded: true });

  const iconSvgPath = join(root, "src/app/icon.svg");
  writeFileSync(iconSvgPath, faviconSvg);
  mkdirSync(join(root, "public/icons"), { recursive: true });

  const tmp16 = join(root, "public/icons/.tmp-16.png");
  const tmp32 = join(root, "public/icons/.tmp-32.png");
  const tmp48 = join(root, "public/icons/.tmp-48.png");

  await raster(faviconSvg, 16, tmp16);
  await raster(faviconSvg, 32, tmp32);
  await raster(faviconSvg, 48, tmp48);
  await raster(appSvg, 180, join(root, "src/app/apple-icon.png"), {
    flatten: true,
  });
  await raster(appSvg, 192, join(root, "public/icons/icon-192.png"), {
    flatten: true,
  });
  await raster(appSvg, 512, join(root, "public/icons/icon-512.png"), {
    flatten: true,
  });

  // Write a true multi-size ICO by embedding the 16/32/48 PNGs (Pillow's
  // append_images path only kept the first frame).
  const py = `
import struct
from pathlib import Path
files = ${JSON.stringify([tmp16, tmp32, tmp48])}
out = Path(${JSON.stringify(join(root, "src/app/favicon.ico"))})
from PIL import Image
entries = []
for p in files:
    im = Image.open(p)
    entries.append((im.width, im.height, Path(p).read_bytes()))
count = len(entries)
offset = 6 + 16 * count
buf = bytearray(struct.pack("<HHH", 0, 1, count))
for w, h, data in entries:
    buf += struct.pack("<BBBBHHII", w if w < 256 else 0, h if h < 256 else 0, 0, 0, 1, 32, len(data), offset)
    offset += len(data)
for _, _, data in entries:
    buf += data
out.write_bytes(buf)
from PIL import IcoImagePlugin, Image as Im
ico = Im.open(out)
print("wrote", out, out.stat().st_size, "sizes", sorted(ico.ico.sizes()))
`;
  const res = spawnSync("python3", ["-c", py], { encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || "ICO write failed");
  }
  console.log(res.stdout.trim());
  for (const tmp of [tmp16, tmp32, tmp48]) {
    try {
      unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
  console.log("generated", iconSvgPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
