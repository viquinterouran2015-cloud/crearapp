# Fluir · Entrena en casa

PWA de entrenamiento en casa: sin anuncios, sin cuentas, sin pagos y sin equipo. HTML/CSS/JS puro (sin build), instalable y funciona offline.

## Ejecutar
```
python3 -m http.server 8080   # abrir http://localhost:8080
```
(El service worker y la instalación requieren `localhost` o HTTPS.)

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
