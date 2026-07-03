import { readdir, mkdir, stat } from "node:fs/promises";
import { join, parse } from "node:path";
import sharp from "sharp";

const SRC = "assets/splash";
const OUT = "public/splash-display";
const WIDTH = 1920;
const QUALITY = 82;

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) =>
  /\.(jpe?g|png|webp)$/i.test(f),
);

let written = 0;
await Promise.all(
  files.map(async (file) => {
    const src = join(SRC, file);
    const out = join(OUT, `${parse(file).name}.webp`);
    try {
      const [s, o] = await Promise.all([stat(src), stat(out)]);
      if (o.mtimeMs >= s.mtimeMs) return;
    } catch {}
    const image = sharp(src);
    const meta = await image.metadata();
    if (meta.width && meta.width > WIDTH) image.resize({ width: WIDTH });
    await image.webp({ quality: QUALITY }).toFile(out);
    written += 1;
  }),
);

console.log(
  `splash-display: ${written} generated, ${files.length - written} cached`,
);
