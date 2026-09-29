# Clips de ejercicios (personas reales)

Suelta aquí el video (o GIF) de cada ejercicio y **nómbralo con su código**:
`sq.mp4`, `pu.mov`, `pl.gif`… (los códigos están en `src/data.js`, p. ej. `sq` = Sentadillas, `pu` = Flexiones, `pl` = Plancha).

Luego ejecuta `npm run video` (o `npm run video -- sq pu` para procesar solo algunos). El script:
- detecta solo el mejor tramo para que el video **repita sin saltos** (un ciclo de movimiento),
- quita el audio, lo reduce a 360 px de ancho / 24 fps y genera **MP4 + WebM** y un póster WebP en `public/video/`,
- actualiza `public/video/manifest.json`.

La app usa el clip automáticamente (reproductor y vista previa de la rutina). Los ejercicios sin clip
siguen mostrando la figura animada.

**Recomendado al grabar:** cámara fija, cuerpo completo, fondo liso, formato vertical 2:3, 6–10 s con
2–4 repeticiones limpias. Pesan ~50 KB por clip después de procesarse.

**Derechos:** usa solo videos propios, con permiso de la persona que aparece, o con licencia comercial.
