# Fluir · Entrena en casa

PWA de entrenamiento en casa: sin anuncios, sin cuentas, sin pagos y sin equipo. Instalable, con modo oscuro y funcional sin conexión.

**En vivo:** https://viquinterouran2015-cloud.github.io/crearapp/

## Stack
HTML + CSS + JavaScript (módulos ES) con [Vite](https://vite.dev) y `vite-plugin-pwa`. Sin frameworks: ~20 KB de JS comprimido.
Lighthouse (móvil): Rendimiento 100 · Accesibilidad 98+ · Buenas prácticas 100.

## Comandos
```
npm install
npm run dev       # desarrollo en http://localhost:5173
npm run build     # optimiza fotos (si hay) y compila a dist/
npm run preview   # sirve dist/ en http://localhost:4173
npm run lint      # ESLint
npm test          # pruebas unitarias (Vitest)
npm run e2e       # pruebas de extremo a extremo + accesibilidad (Playwright + axe)
npm run img       # optimiza las fotos de photos-src/ (ver photos-src/README.md)
npm run video     # convierte los clips de videos-src/ en MP4+WebM en bucle (ver videos-src/README.md)
```

## Estructura
| Ruta | Qué contiene |
|---|---|
| `src/model.js` | Lógica pura y probada: fechas, rutinas, plan de 4 semanas, racha, validación del estado guardado |
| `src/data.js` | Catálogo de ejercicios, rutinas, niveles y objetivos |
| `src/anim.js` | Figuras animadas (SVG) de cada ejercicio |
| `src/main.js` | Vistas, navegación, hojas modales, reproductor y ajustes |
| `tests/` · `e2e/` | Unitarias · flujos completos y auditoría WCAG (móvil y escritorio) |
| `photos-src/` | Fotos originales opcionales → WebP responsivo en `public/img/` |
| `videos-src/` | Clips de personas reales por ejercicio → `public/video/` (MP4 + WebM + póster) |
| `.github/workflows/` | `ci.yml` (lint + pruebas en cada PR) · `deploy.yml` (GitHub Pages al fusionar en `main`) |

## Decisiones de calidad
- **Datos locales y a prueba de corrupción:** todo lo guardado pasa por `sanitizeState` (descarta lo inválido); exportar/importar copia de seguridad.
- **Accesibilidad:** diálogos con foco atrapado y fondo inerte, `Esc`, salto al contenido, anuncios para lectores de pantalla, teclado en el reproductor (espacio, ←, →, Esc), `prefers-reduced-motion`, auditoría axe en CI.
- **Seguridad:** Content-Security-Policy estricta en producción, sin scripts de terceros, todo texto de usuario escapado.
- **PWA:** aviso de «nueva versión», botón de instalación, caché de fotos bajo demanda, íconos maskable.
- **Reproductor:** se pausa al salir de la pestaña, mantiene la pantalla encendida y no pierde tiempo si el navegador lo congela.
- **Salud:** aviso de que las rutinas son orientativas y las calorías, estimaciones.

## Publicación
Al fusionar en `main`, `deploy.yml` ejecuta lint + pruebas + build y publica en GitHub Pages (Settings → Pages → Source = *GitHub Actions*).
