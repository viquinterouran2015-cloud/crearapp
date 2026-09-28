# Fluir · Entrena en casa

PWA de entrenamiento en casa: sin anuncios, sin cuentas, sin pagos y sin equipo.

**Stack:** HTML + CSS + JavaScript (módulos ES) con [Vite](https://vite.dev) y `vite-plugin-pwa` (manifest + service worker generados, instalable y offline). Sin frameworks: el bundle pesa ~12 KB gzip.

```
npm install
npm run dev       # desarrollo en http://localhost:5173
npm run build     # produce dist/
npm run preview   # sirve dist/ en http://localhost:4173
```

**Publicación:** `.github/workflows/deploy.yml` publica `dist/` en GitHub Pages al fusionar en `main` (o manualmente desde la pestaña Actions). Requiere una vez: Settings → Pages → Source = *GitHub Actions*. La app queda en `https://<usuario>.github.io/crearapp/` y, al abrirla en el teléfono, el navegador ofrece «Instalar / Añadir a pantalla de inicio».

**Estructura:** `index.html` · `src/main.js` (vistas, router, reproductor) · `src/data.js` (ejercicios y rutinas de ejemplo) · `src/styles.css` · `public/icons/`.

**Alcance v1:** diseño + navegación completa (Hoy, Explorar, Plan, Progreso, reproductor, ajustes) con datos de ejemplo guardados en `localStorage`.

## Decisiones de diseño (según competidores y reseñas frecuentes)
| Queja / sugerencia habitual | Qué hace Fluir |
|---|---|
| Navegación densa | 4 pestañas: Hoy · Explorar · Plan · Progreso |
| Muchos pasos para empezar | "Empezar ahora" en la pantalla inicial; botón ▶ en cada tarjeta; atajos de 5/10/15 min |
| Anuncios y muros de pago | Ninguno; datos solo en el dispositivo |
| Plan rígido / no editable | Plan de 4 semanas por objetivo, nivel y días; rutinas propias |
| Temporizador poco flexible | Pausa, anterior/siguiente, +20 s de descanso, guía por voz, pantalla siempre activa |
| Sin seguimiento | Racha, minutos, kcal, calendario, gráfico semanal y registro de peso |
| Carga lenta | Sin dependencias ni imágenes; service worker cache-first |
| Fatiga visual | Paleta salvia/arena suave, modo oscuro automático, sin colores saturados |

## Pendiente / ideas
Videos o animaciones por ejercicio, más rutinas, sincronización opcional, notificaciones push reales (requieren servidor).
