/* ephemeral. — lógica de la web
   Cada edición es un archivo JSON en /ediciones. El índice (/ediciones/index.json)
   lista las ediciones de la más reciente a la más antigua. */

// Cuando tengas la newsletter (por ejemplo en beehiiv), pega aquí la dirección de su página de suscripción.
const NEWSLETTER_URL = "";

const SECCIONES = {
  espana:        { nombre: "España",               fondo: "#FEF6D2", tinta: "#7A5B00", punto: "#E9C23F", linea: "#EBDB95" },
  internacional: { nombre: "Internacional",        fondo: "#E8F0FC", tinta: "#24528F", punto: "#5B8FD6", linea: "#BCD2EF" },
  economia:      { nombre: "Economía",             fondo: "#FEEBDA", tinta: "#9A4A0C", punto: "#F0964A", linea: "#F2C79F" },
  sociedad:      { nombre: "Sociedad",             fondo: "#F1ECFA", tinta: "#5B3F96", punto: "#9C82D0", linea: "#D3C7EC" },
  ciencia:       { nombre: "Ciencia y tecnología", fondo: "#E7F6EA", tinta: "#2A6B40", punto: "#5CB874", linea: "#B9DFC2" },
  deportes:      { nombre: "Deportes",             fondo: "#FCE6E6", tinta: "#A12B2B", punto: "#E57373", linea: "#EFBDBD" }
};
const ORDEN = ["espana", "internacional", "economia", "sociedad", "ciencia", "deportes"];

const $ = (sel) => document.querySelector(sel);

function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function seccion(clave) {
  return SECCIONES[clave] || { nombre: clave, fondo: "#F1F1EC", tinta: "#1C1E24", punto: "#1C1E24", linea: "#D9D9D2" };
}

function fechaLarga(iso) {
  const d = new Date(iso + "T12:00:00");
  const txt = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function hoyISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function estadoEdicion(fecha) {
  const hoy = hoyISO();
  if (fecha < hoy) return "Edición archivada";
  if (fecha > hoy) return "Edición de mañana";
  const ahora = new Date();
  const fin = new Date(ahora);
  fin.setHours(24, 0, 0, 0);
  const min = Math.floor((fin - ahora) / 60000);
  return "Se archiva en " + Math.floor(min / 60) + " h " + (min % 60) + " min";
}

async function cargarJSON(ruta) {
  const r = await fetch(ruta, { cache: "no-cache" });
  if (!r.ok) throw new Error("No se pudo cargar " + ruta);
  return r.json();
}

function enlacesFuentes(fuentes) {
  if (!fuentes || !fuentes.length) return "";
  return "Fuentes: " + fuentes.map((f) => f.url
    ? '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.nombre) + "</a>"
    : esc(f.nombre)).join(", ");
}

function htmlBulo(bulo, etiquetaTitulo) {
  if (!bulo) return "";
  const t = etiquetaTitulo || "h2";
  return '<article class="caja bulo">' +
    '<span class="etiqueta" style="color:#3B3F48">El bulo del día</span>' +
    '<span class="sello" aria-label="Falso">FALSO</span>' +
    "<" + t + ">" + esc(bulo.titulo) + "</" + t + ">" +
    "<p>" + esc(bulo.texto) + "</p>" +
    '<span class="fuentes">Verificado por ' + (bulo.url
      ? '<a href="' + esc(bulo.url) + '" target="_blank" rel="noopener">' + esc(bulo.verificador) + "</a>"
      : esc(bulo.verificador)) + (bulo.nota ? " · " + esc(bulo.nota) : "") + "</span>" +
    "</article>";
}

/* ---------- Portada ---------- */
async function portada() {
  const zona = $("#edicion");
  try {
    const params = new URLSearchParams(location.search);
    let fecha = params.get("fecha");
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const indice = await cargarJSON("ediciones/index.json");
      fecha = indice.ediciones[0].fecha;
    }
    const ed = await cargarJSON("ediciones/" + fecha + ".json");
    document.title = "ephemeral. · " + fechaLarga(ed.fecha);

    const noticias = ed.noticias || [];
    const usadas = ORDEN.filter((k) => noticias.some((n) => n.seccion === k));
    const dato = ed.dato;
    const sd = dato ? seccion(dato.seccion) : null;

    let html = '<section class="portada">' +
      '<div class="portada-texto">' +
        '<span class="meta">' + esc(fechaLarga(ed.fecha)) + " · Edición nº " + String(ed.numero).padStart(3, "0") + "</span>" +
        '<h1 class="gran">' + esc(ed.titular || "El día, en cinco minutos.") + "</h1>" +
        '<p class="entradilla">' + esc(ed.entradilla || "") + "</p>" +
        '<div class="barra" aria-hidden="true">' + noticias.map((n) => '<i style="background:' + seccion(n.seccion).punto + '"></i>').join("") + "</div>" +
        '<div class="barra-pie"><span>' + noticias.length + " noticias · " + esc(ed.minutos || 5) + ' min de lectura</span><span id="estado">' + esc(estadoEdicion(ed.fecha)) + "</span></div>" +
      "</div>";
    if (dato) {
      html += '<aside class="caja dato" style="background:' + sd.fondo + '">' +
        '<span class="etiqueta" style="color:' + sd.tinta + '">El dato del día · ' + esc(sd.nombre) + "</span>" +
        '<span class="cifra">' + esc(dato.cifra) + "</span>" +
        '<span class="frase">' + esc(dato.frase) + "</span>" +
        '<span class="detalle">' + esc(dato.detalle) + "</span>" +
        "</aside>";
    }
    html += "</section>";

    html += '<nav class="filtro" aria-label="Filtrar por sección">' +
      '<button type="button" data-filtro="todas" aria-pressed="true"><span class="punto" style="background:#1C1E24"></span>Todas</button>' +
      usadas.map((k) => '<button type="button" data-filtro="' + k + '" aria-pressed="false"><span class="punto" style="background:' + seccion(k).punto + '"></span>' + esc(seccion(k).nombre) + "</button>").join("") +
      "</nav>";

    html += '<section class="noticias">' + noticias.map((n, i) => {
      const s = seccion(n.seccion);
      const id = "mas-" + (i + 1);
      return '<article class="noticia" data-seccion="' + esc(n.seccion) + '" style="background:' + s.fondo + '">' +
        '<div class="cabeza" style="color:' + s.tinta + '"><span>' + String(i + 1).padStart(2, "0") + " · " + esc(s.nombre) + "</span><span>1 min</span></div>" +
        "<h2>" + esc(n.titulo) + "</h2>" +
        "<p>" + esc(n.resumen) + "</p>" +
        '<p class="porque"><em style="color:' + s.tinta + '">Por qué importa: </em>' + esc(n.porque) + "</p>" +
        (n.mas ? '<p class="mas" id="' + id + '" hidden style="border-color:' + s.linea + '">' + esc(n.mas) + "</p>" : "") +
        '<div class="pie">' +
          (n.mas ? '<button type="button" class="boton-texto" aria-expanded="false" aria-controls="' + id + '" style="color:' + s.tinta + '">Abrir · +' + esc(n.minutosMas || 3) + " min</button>" : "<span></span>") +
          '<span class="fuentes">' + enlacesFuentes(n.fuentes) + "</span>" +
        "</div>" +
        "</article>";
    }).join("") + "</section>";

    html += '<section class="fila">' + htmlBulo(ed.bulo) + formularioSuscripcion() + "</section>";

    zona.innerHTML = html;
    activarFiltro();
    activarAmpliar();
    activarSuscripcion();
    setInterval(() => { const e = $("#estado"); if (e) e.textContent = estadoEdicion(ed.fecha); }, 60000);
  } catch (err) {
    zona.innerHTML = '<p class="vacio">No hemos podido cargar la edición. Vuelve a intentarlo en unos minutos.</p>';
    console.error(err);
  }
}

function activarFiltro() {
  const botones = document.querySelectorAll(".filtro button");
  botones.forEach((b) => b.addEventListener("click", () => {
    const f = b.dataset.filtro;
    botones.forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    document.querySelectorAll(".noticia").forEach((n) => { n.hidden = !(f === "todas" || n.dataset.seccion === f); });
  }));
}

function activarAmpliar() {
  document.querySelectorAll(".noticia .boton-texto").forEach((b) => b.addEventListener("click", () => {
    const p = document.getElementById(b.getAttribute("aria-controls"));
    const abrir = b.getAttribute("aria-expanded") !== "true";
    p.hidden = !abrir;
    b.setAttribute("aria-expanded", abrir ? "true" : "false");
    b.textContent = abrir ? "Cerrar" : b.dataset.textoAbrir || "Abrir · +3 min";
  }));
  document.querySelectorAll(".noticia .boton-texto").forEach((b) => { b.dataset.textoAbrir = b.textContent; });
}

function formularioSuscripcion() {
  return '<form class="caja suscripcion" id="suscribir" novalidate>' +
    '<span class="etiqueta" style="color:#C9CCD3">Newsletter</span>' +
    '<span class="titulo">Cada mañana, antes de que caduque.</span>' +
    '<span class="suave">La edición llega a tu correo a las 7:30. Gratis.</span>' +
    '<label for="email">Tu correo</label>' +
    '<input id="email" name="email" type="email" autocomplete="email" placeholder="nombre@correo.com" required>' +
    '<button type="submit">Suscribirme</button>' +
    '<span class="aviso" id="aviso" role="status"></span>' +
    "</form>";
}

function activarSuscripcion() {
  const f = $("#suscribir");
  if (!f) return;
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#email").value.trim();
    const aviso = $("#aviso");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { aviso.textContent = "Escribe un correo válido, por ejemplo nombre@correo.com."; return; }
    if (NEWSLETTER_URL) {
      location.href = NEWSLETTER_URL + (NEWSLETTER_URL.includes("?") ? "&" : "?") + "email=" + encodeURIComponent(email);
    } else {
      aviso.textContent = "La newsletter arranca muy pronto. ¡Gracias por tu interés!";
    }
  });
}

/* ---------- Archivo ---------- */
async function archivo() {
  const zona = $("#lista");
  try {
    const indice = await cargarJSON("ediciones/index.json");
    if (!indice.ediciones.length) { zona.innerHTML = '<p class="vacio">Todavía no hay ediciones archivadas.</p>'; return; }
    zona.innerHTML = '<ul class="lista-archivo">' + indice.ediciones.map((e) =>
      '<li><a href="index.html?fecha=' + esc(e.fecha) + '">' +
        '<span class="fecha">' + esc(fechaLarga(e.fecha)) + "</span>" +
        '<span class="tit">' + esc(e.resumen || "Edición nº " + e.numero) + "</span>" +
        '<span class="puntos" aria-hidden="true">' + (e.secciones || []).map((k) => '<span class="punto" style="background:' + seccion(k).punto + '"></span>').join("") + "</span>" +
      "</a></li>").join("") + "</ul>";
  } catch (err) {
    zona.innerHTML = '<p class="vacio">No hemos podido cargar el archivo.</p>';
    console.error(err);
  }
}

/* ---------- Bulos ---------- */
async function bulos() {
  const zona = $("#lista");
  try {
    const indice = await cargarJSON("ediciones/index.json");
    const eds = await Promise.all(indice.ediciones.map((e) => cargarJSON("ediciones/" + e.fecha + ".json").catch(() => null)));
    const conBulo = eds.filter((e) => e && e.bulo);
    if (!conBulo.length) { zona.innerHTML = '<p class="vacio">Todavía no hay bulos desmentidos.</p>'; return; }
    zona.innerHTML = '<div style="display:flex;flex-direction:column;gap:22px">' + conBulo.map((e) =>
      '<div style="display:flex;flex-direction:column;gap:8px"><span class="meta">' + esc(fechaLarga(e.fecha)) + "</span>" + htmlBulo(e.bulo, "h2") + "</div>").join("") + "</div>";
  } catch (err) {
    zona.innerHTML = '<p class="vacio">No hemos podido cargar los bulos.</p>';
    console.error(err);
  }
}

const pagina = document.body.dataset.pagina;
if (pagina === "portada") portada();
if (pagina === "archivo") archivo();
if (pagina === "bulos") bulos();
