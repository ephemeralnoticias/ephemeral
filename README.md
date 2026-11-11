# ephemeral.

Las noticias del día en cinco minutos: verificadas, sin opinión y explicadas.

Web estática (HTML, CSS y JavaScript, sin compilación). Se publica en Cloudflare Pages.

## Cómo está organizada

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Portada: muestra la edición más reciente (o la de `?fecha=AAAA-MM-DD`). |
| `archivo.html` | Lista de todas las ediciones. |
| `bulos.html` | Todos los bulos desmentidos. |
| `como-trabajamos.html` | Política editorial. Rellena los textos entre corchetes. |
| `assets/style.css` | Diseño: colores, tipografías y formas. |
| `assets/app.js` | Lógica. Aquí están los colores de cada sección y la dirección de la newsletter (`NEWSLETTER_URL`). |
| `ediciones/` | Una edición por archivo JSON, más `index.json` con la lista. |

## Cómo publicar la edición del día

1. Crea `ediciones/AAAA-MM-DD.json` copiando la estructura de una edición anterior.
2. Añade la edición **al principio** de la lista en `ediciones/index.json`.
3. Guarda los cambios en GitHub. Cloudflare Pages publica la web sola en uno o dos minutos.

Secciones disponibles: `espana`, `internacional`, `economia`, `sociedad`, `ciencia`, `deportes`.

## Publicar en Cloudflare Pages

Cloudflare → Workers & Pages → Create → Pages → Connect to Git → elige este repositorio.
- Framework preset: **None**
- Build command: *(vacío)*
- Build output directory: `/`

## Secciones especiales

| Archivo | Para qué sirve |
|---|---|
| `29n.html` + `datos/29n.json` | Especial elecciones: calendario oficial, encuestas, comparador de propuestas por tema y partido, y diario de campaña. Para añadir un día de campaña, añade una entrada **al principio** de `diario`. |
| `resumen-2026.html` + `datos/2026.json` | Las 30 noticias del año, cinco por sección. |

## Formato de cada noticia

Cada noticia tiene un `resumen` (unas cinco líneas), un `porque` y un `detalle` con `parrafos`, `claves` y `ahora`. Al pulsar «Abrir», la tarjeta se da la vuelta y muestra el detalle. Empieza cada párrafo con una frase corta acabada en punto («Qué se reclama.») y la web la pondrá en negrita.

Orden de prioridad: España y Economía (unas tres noticias cada una), Internacional (dos) y una de Sociedad, Ciencia y Deportes.
