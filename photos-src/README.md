# Fotos motivacionales

Suelta aquí tus fotos originales (JPG, PNG o WebP; cualquier tamaño, mejor ≥ 1200 px de ancho).
El nombre del archivo indica dónde se usa:

| Archivo | Dónde aparece | Encuadre recomendado |
|---|---|---|
| `hero.jpg` | Portada de «Hoy» | Horizontal 16:9, persona a la derecha (el texto va a la izquierda) |
| `cuerpo.jpg` `abs.jpg` `espalda.jpg` `gluteos.jpg` `piernas.jpg` `brazos.jpg` `pecho.jpg` `cardio.jpg` `estira.jpg` | Tarjetas de cada zona | 4:3, persona centrada |

Luego ejecuta `npm run img` (también se ejecuta solo en `npm run build`).
Genera WebP de 480 y 960 px + miniatura borrosa en `public/img/` y la app las usa automáticamente;
lo que no tenga foto sigue mostrando el diseño actual.

**Derechos:** usa solo fotos propias, con permiso escrito de la persona que aparece, o con licencia
que permita uso comercial (p. ej. Pexels / Unsplash / paquetes de stock pagados). No uses imágenes
de otras apps ni de buscadores.
