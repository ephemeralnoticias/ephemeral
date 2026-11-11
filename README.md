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

Opcionalmente, cada noticia puede llevar una `ilustracion` con la ruta de un dibujo (por ejemplo `"assets/ilustraciones/2026-11-11-huelga.svg"`). Los dibujos van en `assets/ilustraciones/`, miden 600×240, son escenas con degradados y textura de grano, y usan la gama de color de su sección. Si una noticia no lleva `ilustracion`, la tarjeta se muestra sin imagen.

En `datos/29n.json`, cada propuesta lleva `texto` (el resumen) y `puntos` (la lista de medidas que se muestra con guiones); `intro` es opcional. Las propuestas sin anunciar llevan `"vacio": true` y solo `texto`.

Si una noticia nombra a algún partido, añade `"partidos": ["pp", "psoe"]` y la tarjeta mostrará sus chapas. El mismo campo funciona en el resumen de 2026 y en el diario del 29N. Identificadores disponibles: `pp`, `psoe`, `vox`, `fa`, `salf`, `podemos`, `sumar`, `erc` y `junts`. Las siglas y los colores se definen en `PARTIDOS`, al principio de `assets/app.js`. Ordénalos siempre igual, por la media de encuestas.

Orden de prioridad: España y Economía (unas tres noticias cada una), Internacional (dos) y una de Sociedad, Ciencia y Deportes.

## Buscadores (SEO)

- `robots.txt` y `sitemap.xml` indican a Google qué páginas indexar.
- Cada página lleva en `<!-- seo -->` su dirección canónica y la imagen para compartir (`assets/compartir.png`).
- Si cambiáis de dominio (por ejemplo a un .es), sustituid `https://ephemeral-5aj.pages.dev` por el nuevo en `robots.txt`, `sitemap.xml` y los bloques `<!-- seo -->` de cada página.

## Fuentes y veda electoral

- Cada propuesta de `datos/29n.json` lleva `tipo`: `programa`, `web`, `gobierno` o `declaraciones`. La web lo muestra como etiqueta. La fuente principal es siempre la del propio partido, si existe.
- `encuestas.veda` fija el periodo en que las encuestas se ocultan solas (art. 69.7 de la LOREG). Para otras elecciones, cambia las fechas `inicio` y `fin`.
- Las normas de redacción y fuentes están en la guía interna (documento aparte).
