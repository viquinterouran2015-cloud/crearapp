// Optimiza las fotos de photos-src/ → public/img/ (WebP responsivo + miniatura borrosa) y escribe manifest.json.
// Uso: coloca fotos con el nombre de su "espacio" (hero.jpg, abs.jpg, ...) y ejecuta `npm run img`.
import { readdirSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const SRC = 'photos-src', OUT = 'public/img', WIDTHS = [480, 960];
const SLOTS = ['hero', 'cuerpo', 'abs', 'espalda', 'gluteos', 'piernas', 'brazos', 'pecho', 'cardio', 'estira'];
const manifest = {};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const files = existsSync(SRC) ? readdirSync(SRC).filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f)) : [];
for (const f of files) {
  const { name } = parse(f);
  if (!SLOTS.includes(name)) { console.warn(`⚠ "${f}" no coincide con ningún espacio (${SLOTS.join(', ')}); se ignora.`); continue; }
  // hero: 16:9 ancho · tarjetas: 4:3 · rotate() respeta la orientación EXIF del teléfono
  const ratio = name === 'hero' ? 9 / 16 : 3 / 4, srcset = [];
  for (const w of WIDTHS) {
    const file = `${name}-${w}.webp`;
    await sharp(join(SRC, f)).rotate().resize(w, Math.round(w * ratio), { fit: 'cover', position: 'attention' })
      .webp({ quality: 72, effort: 5 }).toFile(join(OUT, file));
    srcset.push(`img/${file} ${w}w`);
  }
  const lqip = await sharp(join(SRC, f)).rotate().resize(16, Math.round(16 * ratio), { fit: 'cover' }).blur(1).webp({ quality: 40 }).toBuffer();
  manifest[name] = { src: `img/${name}-${WIDTHS[1]}.webp`, srcset: srcset.join(', '), lqip: `data:image/webp;base64,${lqip.toString('base64')}` };
  console.log(`✔ ${name}`);
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest));
console.log(`${Object.keys(manifest).length} foto(s) optimizadas.`);
