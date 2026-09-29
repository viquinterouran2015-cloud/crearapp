// Prepara los clips de ejercicios: videos-src/<código>.(mp4|mov|webm|gif) → public/video/<código>.mp4 + póster WebP
// - Sin audio, 24 fps, ancho 360 px. MP4/H.264 (Safari, iOS, Chrome) + WebM/VP9 de respaldo (Chromium/Firefox sin códec H.264)
// - Detecta automáticamente el mejor punto de repetición para que el bucle no dé saltos
// Uso: npm run video   (opcional: npm run video -- sq pu   para procesar solo esos códigos)
import { readdirSync, mkdirSync, writeFileSync, existsSync, statSync, readFileSync, rmSync } from 'node:fs';
import { join, parse } from 'node:path';
import { execFileSync } from 'node:child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import sharp from 'sharp';
import { EX } from '../src/data.js';

const SRC = 'videos-src', OUT = 'public/video', W = 360, FPS = 24;
const FF = ffmpegInstaller.path, FP = ffprobeInstaller.path;
const only = process.argv.slice(2);

const probe = file => JSON.parse(execFileSync(FP, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', file]));

// Busca el par de fotogramas (inicio, fin) más parecidos → un ciclo de movimiento sin salto visible
function findLoop(file, duration) {
  const gw = 48, gh = 72;
  const raw = execFileSync(FF, ['-v', 'error', '-i', file, '-vf', `fps=${FPS},scale=${gw}:${gh},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 28 });
  const size = gw * gh, n = Math.floor(raw.length / size);
  const mse = (a, b) => { let s = 0; for (let k = 0; k < size; k++) { const d = raw[a * size + k] - raw[b * size + k]; s += d * d; } return s / size; };
  const minLen = Math.round(1.2 * FPS), maxLen = Math.min(n - 1, Math.round(5 * FPS));
  let best = { score: Infinity, i: 0, j: n - 1 };
  for (let i = 0; i < n * 0.6; i++) {
    for (let j = i + minLen; j <= Math.min(n - 1, i + maxLen); j++) {
      const score = mse(i, j) * (1 + 0.03 * ((j - i) / FPS)); // ligera preferencia por ciclos cortos
      if (score < best.score) best = { score, i, j };
    }
  }
  return { start: best.i / FPS, length: (best.j - best.i) / FPS, mse: Math.sqrt(best.score) };
}

mkdirSync(OUT, { recursive: true });
const manifestPath = join(OUT, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

const files = existsSync(SRC) ? readdirSync(SRC).filter(f => /\.(mp4|mov|m4v|webm|gif)$/i.test(f)) : [];
for (const f of files) {
  const { name, ext } = parse(f);
  if (!EX[name]) { console.warn(`⚠ "${f}": "${name}" no es un código de ejercicio (ver src/data.js); se ignora.`); continue; }
  if (only.length && !only.includes(name)) continue;
  const input = join(SRC, f), info = probe(input), duration = parseFloat(info.format.duration);
  const isGif = /gif/i.test(ext);
  const loop = isGif ? { start: 0, length: duration, mse: 0 } : findLoop(input, duration);
  const h = Math.round(W * info.streams[0].height / info.streams[0].width / 2) * 2;
  const mp4 = join(OUT, `${name}.mp4`), poster = join(OUT, `${name}.webp`);
  execFileSync(FF, ['-v', 'error', '-y', '-ss', loop.start.toFixed(3), '-i', input, '-t', loop.length.toFixed(3), '-an',
    '-vf', `fps=${FPS},scale=${W}:${h}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-profile:v', 'main',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  const webm = join(OUT, `${name}.webm`);
  execFileSync(FF, ['-v', 'error', '-y', '-i', mp4, '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', '-pix_fmt', 'yuv420p', webm]);
  const png = join(OUT, `.${name}.png`);
  execFileSync(FF, ['-v', 'error', '-y', '-i', mp4, '-frames:v', '1', png]);
  await sharp(png).webp({ quality: 72 }).toFile(poster);
  rmSync(png);
  manifest[name] = { src: `video/${name}.mp4`, webm: `video/${name}.webm`, poster: `video/${name}.webp`, w: W, h, s: Math.round(loop.length * 10) / 10 };
  console.log(`✔ ${name}: ${loop.length.toFixed(1)} s desde ${loop.start.toFixed(1)} s · salto del bucle ${loop.mse.toFixed(1)}/255 · ${(statSync(mp4).size / 1024).toFixed(0)} KB mp4 + ${(statSync(webm).size / 1024).toFixed(0)} KB webm`);
}
// Solo se conservan las entradas cuyos archivos existen
for (const k of Object.keys(manifest)) if (!existsSync(join(OUT, `${k}.mp4`))) delete manifest[k];
writeFileSync(manifestPath, JSON.stringify(manifest));
console.log(`${Object.keys(manifest).length} clip(s) en el catálogo.`);
