/* ephemeral. — lógica de la web
   Cada edición es un archivo JSON en /ediciones. El índice (/ediciones/index.json)
   lista las ediciones de la más reciente a la más antigua.
   El resumen del año está en /datos/2026.json y el especial de elecciones en /datos/29n.json. */

// Cuando tengas la newsletter (por ejemplo en beehiiv), pega aquí la dirección de su página de suscripción.
// Formulario de suscripción de beehiiv (Audience → Subscribe forms)

const SECCIONES = {
  espana:        { nombre: "España",               fondo: "#FEF6D2", tinta: "#7A5B00", punto: "#E9C23F", linea: "#EBDB95", reverso: "#FFFBEA" },
  economia:      { nombre: "Economía",             fondo: "#FEEBDA", tinta: "#9A4A0C", punto: "#F0964A", linea: "#F2C79F", reverso: "#FFF6EE" },
  internacional: { nombre: "Internacional",        fondo: "#E8F0FC", tinta: "#24528F", punto: "#5B8FD6", linea: "#BCD2EF", reverso: "#F5F8FE" },
  sociedad:      { nombre: "Sociedad",             fondo: "#F1ECFA", tinta: "#5B3F96", punto: "#9C82D0", linea: "#D3C7EC", reverso: "#F9F6FD" },
  ciencia:       { nombre: "Ciencia y tecnología", fondo: "#E7F6EA", tinta: "#2A6B40", punto: "#5CB874", linea: "#B9DFC2", reverso: "#F4FBF5" },
  deportes:      { nombre: "Deportes",             fondo: "#FCE6E6", tinta: "#A12B2B", punto: "#E57373", linea: "#EFBDBD", reverso: "#FEF4F4" }
};
// Orden de prioridad: España y Economía primero, después Internacional y el resto.
const ORDEN = ["espana", "economia", "internacional", "sociedad", "ciencia", "deportes"];

// Partidos: siglas y color para las chapas (orden = media de encuestas)
const PARTIDOS = {
  pp:      { siglas: "PP",      nombre: "Partido Popular",     color: "#1D84CE" },
  psoe:    { siglas: "PSOE",    nombre: "PSOE",                color: "#E30613" },
  vox:     { siglas: "VOX",     nombre: "Vox",                 color: "#63BE21" },
  fa:      { siglas: "FA",      nombre: "Frente Amplio",       color: "#E34A2B" },
  salf:    { siglas: "SALF",    nombre: "Se Acabó La Fiesta",  color: "#4A4F57" },
  podemos: { siglas: "PODEMOS", nombre: "Podemos",             color: "#6B2C6E" },
  sumar:   { siglas: "SUMAR",   nombre: "Sumar",               color: "#E5195B" },
  erc:     { siglas: "ERC",     nombre: "ERC",                 color: "#FFB232" },
  junts:   { siglas: "JUNTS",   nombre: "Junts",               color: "#00C3B2" }
};
function chapasDe(ids) {
  const lista = (ids || []).filter((id) => PARTIDOS[id]);
  if (!lista.length) return "";
  return '<div class="chapas-partidos" aria-label="Partidos en esta noticia">' +
    lista.map((id) => chapa(PARTIDOS[id].siglas, PARTIDOS[id].color, PARTIDOS[id].nombre)).join("") + "</div>";
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function seccion(clave) {
  return SECCIONES[clave] || { nombre: clave, fondo: "#F1F1EC", tinta: "#1C1E24", punto: "#1C1E24", linea: "#D9D9D2", reverso: "#FAFAF6" };
}

function varsSeccion(s) {
  return "--fondo-s:" + s.fondo + ";--tinta-s:" + s.tinta + ";--linea-s:" + s.linea + ";--reverso-s:" + s.reverso + ";";
}

function fechaLarga(iso) {
  const d = new Date(iso + "T12:00:00");
  const txt = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function fechaCorta(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.getDate() + " " + MESES[d.getMonth()];
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

function enlacesFuentes(fuentes, prefijo) {
  if (!fuentes || !fuentes.length) return "";
  return (prefijo === undefined ? "Fuentes: " : prefijo) + fuentes.map((f) => f.url
    ? '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.nombre) + "</a>"
    : esc(f.nombre)).join(", ");
}

function palabras(textos) {
  return textos.join(" ").split(/\s+/).filter(Boolean).length;
}

function minutosDe(textos) {
  return Math.max(1, Math.round(palabras(textos) / 200));
}

// «Qué se reclama. La plataforma…» → la primera frase corta se muestra como entradilla en negrita.
function parrafoConEntrada(texto) {
  const m = /^([^.]{2,48}\.)\s+(.*)$/s.exec(texto);
  if (!m) return "<p>" + esc(texto) + "</p>";
  return "<p><strong>" + esc(m[1]) + "</strong> " + esc(m[2]) + "</p>";
}

const ICONO_GIRO = '<svg class="icono-giro" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M15.5 6.5A6.5 6.5 0 1 0 16.5 11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M16.8 2.8v4.2h-4.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------- Tarjetas que se dan la vuelta ---------- */
const sinMovimiento = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function girarTarjeta(tarjeta, abrir) {
  const cara = tarjeta.querySelector(".cara");
  const reverso = tarjeta.querySelector(".reverso");
  const boton = cara.querySelector("[data-girar]");
  const cambiar = () => {
    cara.hidden = abrir;
    reverso.hidden = !abrir;
    tarjeta.classList.toggle("abierta", abrir);
    if (boton) boton.setAttribute("aria-expanded", abrir ? "true" : "false");
    const destino = abrir ? reverso.querySelector("h3") : boton;
    if (destino) destino.focus({ preventScroll: true });
  };
  const alFinal = () => {
    if (!abrir) return;
    const r = tarjeta.getBoundingClientRect();
    if (r.top < 70 || r.top > window.innerHeight * 0.6) {
      window.scrollTo({ top: window.scrollY + r.top - 90, behavior: sinMovimiento() ? "auto" : "smooth" });
    }
  };
  if (sinMovimiento() || !tarjeta.animate) { cambiar(); alFinal(); return; }
  const p = "perspective(1600px) ";
  const ida = tarjeta.animate([{ transform: p + "rotateY(0deg)" }, { transform: p + "rotateY(90deg)" }], { duration: 170, easing: "cubic-bezier(.45,0,1,1)" });
  ida.onfinish = () => {
    cambiar();
    const vuelta = tarjeta.animate([{ transform: p + "rotateY(-90deg)" }, { transform: p + "rotateY(0deg)" }], { duration: 260, easing: "cubic-bezier(0,0,.25,1)" });
    vuelta.onfinish = alFinal;
  };
}

function activarGiros(raiz) {
  $$("[data-girar]", raiz).forEach((b) => b.addEventListener("click", () => {
    const tarjeta = b.closest(".tarjeta");
    girarTarjeta(tarjeta, b.dataset.girar === "abrir");
  }));
}

function botonAbrir(texto, idReverso) {
  return '<button type="button" class="boton-texto" data-girar="abrir" aria-expanded="false" aria-controls="' + idReverso + '">' + esc(texto) + " " + ICONO_GIRO + "</button>";
}

function botonVolver() {
  return '<button type="button" class="boton-volver" data-girar="cerrar">' + ICONO_GIRO + " Volver</button>";
}

/* ---------- Portada (edición del día) ---------- */
function tarjetaNoticia(n, i) {
  const s = seccion(n.seccion);
  const id = "n" + (i + 1);
  const d = n.detalle || {};
  const parrafos = d.parrafos || (n.mas ? [n.mas] : []);
  const minFrente = minutosDe([n.resumen, n.porque]) <= 1 ? "1 min" : minutosDe([n.resumen, n.porque]) + " min";
  const minMas = n.minutosMas || minutosDe(parrafos);
  let html = '<article class="tarjeta noticia" data-seccion="' + esc(n.seccion) + '" style="' + varsSeccion(s) + '">';
  html += '<div class="cara">' +
    (n.ilustracion ? '<img class="ilustracion" src="' + esc(n.ilustracion) + '" alt="" width="600" height="240" decoding="async">' : "") +
    '<div class="cabeza"><span>' + String(i + 1).padStart(2, "0") + " · " + esc(s.nombre) + "</span><span>" + minFrente + "</span></div>" +
    chapasDe(n.partidos) +
    "<h2>" + esc(n.titulo) + "</h2>" +
    '<p class="resumen">' + esc(n.resumen) + "</p>" +
    '<p class="porque"><em>Por qué importa: </em>' + esc(n.porque) + "</p>" +
    '<div class="pie">' + (parrafos.length ? botonAbrir("Abrir · +" + minMas + " min", "rev-" + id) : "<span></span>") + "</div>" +
    "</div>";
  if (parrafos.length) {
    html += '<div class="reverso" id="rev-' + id + '" hidden>' +
      '<div class="cabeza"><span>En detalle · ' + esc(s.nombre) + "</span>" + botonVolver() + "</div>" +
      '<h3 tabindex="-1">' + esc(n.titulo) + "</h3>" +
      '<div class="cuerpo">' + parrafos.map(parrafoConEntrada).join("") + "</div>" +
      (d.claves && d.claves.length ? '<div class="claves"><span class="etiqueta">Claves</span><ul>' + d.claves.map((c) => "<li>" + esc(c) + "</li>").join("") + "</ul></div>" : "") +
      (d.ahora ? '<p class="ahora"><em>Qué pasa ahora: </em>' + esc(d.ahora) + "</p>" : "") +
      '<div class="pie"><span class="fuentes">' + enlacesFuentes(n.fuentes) + "</span>" + botonVolver() + "</div>" +
      "</div>";
  }
  return html + "</article>";
}

function navFiltro(claves, etiquetaTodas) {
  return '<nav class="filtro" aria-label="Filtrar por sección">' +
    '<button type="button" data-filtro="todas" aria-pressed="true"><span class="punto" style="background:#1C1E24"></span>' + esc(etiquetaTodas || "Todas") + "</button>" +
    claves.map((k) => '<button type="button" data-filtro="' + k + '" aria-pressed="false"><span class="punto" style="background:' + seccion(k).punto + '"></span>' + esc(seccion(k).nombre) + "</button>").join("") +
    "</nav>";
}

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

    const noticias = (ed.noticias || []).slice().sort((a, b) => ORDEN.indexOf(a.seccion) - ORDEN.indexOf(b.seccion));
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
    html += '<a class="aviso-29n" href="29n.html"><span class="punto" style="background:#E9C23F"></span><b>Especial 29N</b> Qué propone cada partido y el diario de la campaña →</a>';
    html += navFiltro(usadas);
    html += '<section class="noticias">' + noticias.map(tarjetaNoticia).join("") + "</section>";

    zona.innerHTML = html;
    activarFiltro(".noticia");
    activarGiros(zona);
    const fila = $("#fila-final");
    if (fila && ed.bulo) fila.insertAdjacentHTML("afterbegin", htmlBulo(ed.bulo));
    if (location.hash === "#suscribir") { const c = $("#suscribir"); if (c) c.scrollIntoView(); }
    setInterval(() => { const e = $("#estado"); if (e) e.textContent = estadoEdicion(ed.fecha); }, 60000);
  } catch (err) {
    zona.innerHTML = '<p class="vacio">No hemos podido cargar la edición. Vuelve a intentarlo en unos minutos.</p>';
    console.error(err);
  }
}

function activarFiltro(selector, alCambiar) {
  const botones = $$(".filtro button");
  const aplicar = (f) => {
    botones.forEach((x) => x.setAttribute("aria-pressed", x.dataset.filtro === f ? "true" : "false"));
    $$(selector).forEach((n) => { n.hidden = !(f === "todas" || n.dataset.seccion === f); });
    if (alCambiar) alCambiar(f);
  };
  botones.forEach((b) => b.addEventListener("click", () => aplicar(b.dataset.filtro)));
  return aplicar;
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

// Newsletter. Si el servidor (functions/api/suscribir.js) tiene configurada la API de beehiiv,
// se usa el formulario propio, que no bloquean los bloqueadores de anuncios.
// Si no, se queda el formulario de beehiiv, y si a los 8 s no ha cargado se muestra un aviso.
async function prepararNewsletter() {
  const propio = $("#form-propio"), embed = $("#form-beehiiv"), aviso = $("#form-aviso");
  if (!propio || !embed) return;
  let listo = false;
  try {
    const r = await fetch("api/suscribir", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (r.ok) listo = (await r.json()).listo === true;
  } catch (e) { listo = false; }

  if (listo) {
    embed.hidden = true;
    if (aviso) aviso.hidden = true;
    propio.hidden = false;
    activarFormularioPropio(propio);
    return;
  }
  if (aviso) setTimeout(() => {
    // Se considera cargado si el formulario ocupa espacio visible (no basta con que exista).
    if (embed.getBoundingClientRect().height < 40) aviso.hidden = false;
  }, 8000);
}

function activarFormularioPropio(form) {
  const estado = $("#form-estado"), boton = form.querySelector("button"), campo = form.querySelector("#correo");
  const decir = (texto, tipo) => { estado.textContent = texto; estado.dataset.tipo = tipo || ""; };
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const email = campo.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { decir("Revisa el correo: parece que falta algo.", "error"); campo.focus(); return; }
    boton.disabled = true; decir("Enviando…");
    try {
      const r = await fetch("api/suscribir", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, web: form.elements.web.value }),
      });
      if (r.ok) {
        form.reset();
        decir("¡Hecho! Revisa tu correo (y la carpeta de spam): te acabamos de escribir.", "ok");
      } else if (r.status === 400) {
        decir("Revisa el correo: parece que falta algo.", "error");
      } else {
        decir("No hemos podido apuntarte ahora mismo. Inténtalo en unos minutos o escríbenos a ephemeralnoticias@gmail.com.", "error");
      }
    } catch (e) {
      decir("Sin conexión. Inténtalo de nuevo en unos minutos.", "error");
    } finally {
      boton.disabled = false;
    }
  });
}

/* ---------- 2026, explicado ---------- */
function tarjetaAnual(it, n, clave) {
  const s = seccion(clave);
  const id = "a-" + clave + "-" + n;
  const textos = it.partes.map((p) => p.p);
  const min = minutosDe(textos.concat([it.entradilla]));
  return '<article class="tarjeta anual" style="' + varsSeccion(s) + '">' +
    '<div class="cara">' +
      '<div class="cabeza"><span>' + String(n).padStart(2, "0") + " · " + esc(it.mes) + "</span><span>" + min + " min</span></div>" +
      chapasDe(it.partidos) +
      "<h3>" + esc(it.titulo) + "</h3>" +
      '<p class="resumen">' + esc(it.entradilla) + "</p>" +
      '<div class="pie">' + botonAbrir("Leer a fondo", "rev-" + id) + "</div>" +
    "</div>" +
    '<div class="reverso" id="rev-' + id + '" hidden>' +
      '<div class="cabeza"><span>' + esc(s.nombre) + " · " + esc(it.mes) + "</span>" + botonVolver() + "</div>" +
      '<h3 tabindex="-1">' + esc(it.titulo) + "</h3>" +
      '<div class="cuerpo partes">' + it.partes.map((p) => "<h4>" + esc(p.t) + "</h4><p>" + esc(p.p) + "</p>").join("") + "</div>" +
      (it.claves && it.claves.length ? '<div class="claves"><span class="etiqueta">Claves</span><ul>' + it.claves.map((c) => "<li>" + esc(c) + "</li>").join("") + "</ul></div>" : "") +
      '<div class="pie"><span class="fuentes">' + enlacesFuentes(it.fuentes) + "</span>" + botonVolver() + "</div>" +
    "</div>" +
  "</article>";
}

async function anual() {
  const zona = $("#anual");
  try {
    const datos = await cargarJSON("datos/2026.json");
    const secciones = datos.secciones.slice().sort((a, b) => ORDEN.indexOf(a.id) - ORDEN.indexOf(b.id));
    const total = secciones.reduce((t, s) => t + s.items.length, 0);
    let html = '<section class="pagina-titulo">' +
      '<span class="meta">Actualizado el ' + esc(fechaLarga(datos.actualizado).replace(/^./, (c) => c.toLowerCase())) + " · " + total + " noticias</span>" +
      '<h1 class="gran">' + esc(datos.titulo) + "</h1>" +
      '<p class="entradilla">' + esc(datos.entradilla) + "</p>" +
      '<div class="barra" aria-hidden="true">' + secciones.map((s) => '<i style="background:' + seccion(s.id).punto + '"></i>').join("") + "</div>" +
    "</section>";
    html += navFiltro(secciones.map((s) => s.id), "Todo el año");
    html += secciones.map((s) => {
      const sc = seccion(s.id);
      return '<section class="bloque-anual" id="' + esc(s.id) + '" data-seccion="' + esc(s.id) + '">' +
        '<h2 class="titulo-seccion"><span class="punto" style="background:' + sc.punto + '"></span>' + esc(sc.nombre) + "</h2>" +
        '<div class="noticias">' + s.items.map((it, i) => tarjetaAnual(it, i + 1, s.id)).join("") + "</div>" +
      "</section>";
    }).join("");
    zona.innerHTML = html;
    const aplicar = activarFiltro(".bloque-anual", (f) => {
      if (history.replaceState) history.replaceState(null, "", f === "todas" ? location.pathname : "#" + f);
    });
    activarGiros(zona);
    const inicial = location.hash.replace("#", "");
    if (SECCIONES[inicial]) aplicar(inicial);
  } catch (err) {
    zona.innerHTML = '<p class="vacio">No hemos podido cargar el resumen del año.</p>';
    console.error(err);
  }
}

/* ---------- Especial 29N ---------- */
function cuentaAtras(objetivoISO) {
  const ms = new Date(objetivoISO) - new Date();
  if (ms <= 0) return { cifra: "Hoy", texto: "se vota" };
  const dias = Math.ceil(ms / 86400000);
  return { cifra: String(dias), texto: dias === 1 ? "día para votar" : "días para votar" };
}

async function especial29n() {
  const zona = $("#especial");
  try {
    const d = await cargarJSON("datos/29n.json");
    const hoy = hoyISO();
    const s = seccion("espana");
    const ca = cuentaAtras(d.votacion);
    const proximo = d.calendario.find((c) => c.fecha >= hoy);

    let html = '<section class="portada">' +
      '<div class="portada-texto">' +
        '<span class="meta">Elecciones generales · Domingo 29 de noviembre de 2026 · Actualizado el ' + esc(fechaCorta(d.actualizado)) + "</span>" +
        '<h1 class="gran">29N.</h1>' +
        '<p class="entradilla">Todo lo que necesitas para votar informado: qué propone cada partido, tema a tema, y lo que pasa cada día de la campaña. Cada propuesta enlaza a su fuente. No recomendamos el voto.</p>' +
      "</div>" +
      '<aside class="caja dato" style="background:' + s.fondo + '">' +
        '<span class="etiqueta" style="color:' + s.tinta + '">Cuenta atrás</span>' +
        '<span class="cifra" id="cuenta">' + esc(ca.cifra) + "</span>" +
        '<span class="frase">' + esc(ca.texto) + "</span>" +
        '<span class="detalle">Votación de 9:00 a 20:00. Consulta tu colegio en la <a href="https://29neleccionesgenerales.es" target="_blank" rel="noopener">web oficial</a>.</span>' +
      "</aside>" +
    "</section>";

    // Calendario
    html += '<section class="bloque"><h2 class="titulo-bloque">El calendario</h2><ol class="calendario">' +
      d.calendario.map((c) => {
        const estado = c.fecha < hoy ? "pasado" : (proximo && c.fecha === proximo.fecha ? "proximo" : "futuro");
        return '<li class="' + estado + '"><span class="dia">' + esc(fechaCorta(c.fecha)) + "</span><span>" + esc(c.texto) + "</span>" + (estado === "proximo" ? '<span class="chip">Lo próximo</span>' : "") + "</li>";
      }).join("") + "</ol>" +
      '<span class="fuentes">' + enlacesFuentes(d.calendarioFuentes, "Fuentes oficiales: ") + "</span></section>";

    // Por qué + encuestas
    const max = Math.max.apply(null, d.encuestas.datos.map((e) => e.valor));
    // Veda electoral (art. 69.7 LOREG): sin encuestas los cinco días anteriores a la votación
    const veda = d.encuestas.veda, ahoraMs = Date.now();
    const enVeda = !!(veda && ahoraMs >= Date.parse(veda.inicio) && ahoraMs < Date.parse(veda.fin));
    html += '<section class="fila">' +
      '<article class="caja porque-votamos" style="background:' + s.fondo + '">' +
        '<span class="etiqueta" style="color:' + s.tinta + '">Contexto</span>' +
        "<h2>" + esc(d.porque.titulo) + "</h2>" +
        "<p>" + esc(d.porque.texto) + "</p>" +
        '<a class="enlace-serif" href="' + esc(d.porque.enlace) + '">La historia completa, en 2026 explicado →</a>' +
        '<span class="fuentes">' + enlacesFuentes(d.porque.fuentes) + "</span>" +
      "</article>" +
      (enVeda
      ? '<article class="caja encuestas veda">' +
        '<span class="etiqueta">Encuestas</span>' +
        "<h2>Periodo sin encuestas</h2>" +
        "<p>" + esc(d.encuestas.veda.texto) + "</p>" +
      "</article>"
      : '<article class="caja encuestas">' +
        '<span class="etiqueta">Encuestas</span>' +
        "<h2>" + esc(d.encuestas.titulo) + "</h2>" +
        '<ul class="barras">' + d.encuestas.datos.map((e) =>
          '<li style="--partido:' + esc(e.color || "#3B3F48") + '"><span class="nombre">' + chapa(e.siglas || e.partido, e.color, e.partido) + '<span class="visualmente-oculto">' + esc(e.partido) + '</span></span><span class="pista"><span style="width:' + (e.valor / max * 100).toFixed(1) + '%"></span></span><span class="valor">' + String(e.valor.toFixed(1)).replace(".", ",") + "%</span></li>").join("") +
        "</ul>" +
        '<span class="fuentes">' + esc(d.encuestas.nota) + " " + enlacesFuentes([d.encuestas.fuente], "Fuente: ") + "</span>" +
      "</article>") +
    "</section>";

    // Comparador
    html += '<section class="bloque comparador" id="programas">' +
      '<div class="cabeza-bloque"><h2 class="titulo-bloque">Qué propone cada partido</h2>' +
      '<p class="suave">Ordenados por la media de encuestas. Cada propuesta enlaza a su fuente original: el programa o la web del partido siempre que existe. La etiqueta indica de dónde sale.</p></div>' +
      '<div class="modo" role="group" aria-label="Cómo comparar">' +
        '<button type="button" data-modo="tema" aria-pressed="true">Por tema</button>' +
        '<button type="button" data-modo="partido" aria-pressed="false">Por partido</button>' +
      "</div>" +
      '<div class="chips" id="chips"></div>' +
      '<div id="comparacion" aria-live="polite"></div>' +
    "</section>";

    // Diario
    html += '<section class="bloque" id="diario"><h2 class="titulo-bloque">Diario de campaña</h2><ol class="diario">' +
      d.diario.map((e) => '<li><time datetime="' + esc(e.fecha) + '">' + esc(fechaCorta(e.fecha)) + "</time>" +
        "<div>" + chapasDe(e.partidos) + "<h3>" + esc(e.titulo) + "</h3><p>" + esc(e.texto) + '</p><span class="fuentes">' + enlacesFuentes(e.fuentes) + "</span></div></li>").join("") +
      "</ol></section>";

    zona.innerHTML = html;
    activarComparador(d);
    setInterval(() => { const c = cuentaAtras(d.votacion); const e = $("#cuenta"); if (e) e.textContent = c.cifra; }, 60000);
  } catch (err) {
    zona.innerHTML = '<p class="vacio">No hemos podido cargar el especial del 29N.</p>';
    console.error(err);
  }
}

/* Chapa de partido: siglas en la tipografía de ephemeral. sobre el color del partido */
function textoSobre(hex) {
  const lum = (h) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const L = lum(hex), blanco = 1.05 / (L + 0.05), tinta = (L + 0.05) / (lum("#23252B") + 0.05);
  return blanco >= tinta ? "#FFFFFF" : "#23252B";
}
function chapa(siglas, color, nombre) {
  const c = color || "#3B3F48";
  return '<span class="chapa" style="background:' + esc(c) + ";color:" + textoSobre(c) + '"' + (nombre && nombre !== siglas ? ' title="' + esc(nombre) + '"' : "") + ">" + esc(siglas) + "</span>";
}

function activarComparador(d) {
  const estado = { modo: "tema", tema: d.temas[0].id, partido: d.partidos[0].id };
  const chips = $("#chips");
  const salida = $("#comparacion");

  const pintarChips = () => {
    const lista = estado.modo === "tema" ? d.temas : d.partidos;
    const activo = estado.modo === "tema" ? estado.tema : estado.partido;
    chips.setAttribute("aria-label", estado.modo === "tema" ? "Elige un tema" : "Elige un partido");
    chips.classList.toggle("de-partidos", estado.modo === "partido");
    chips.innerHTML = lista.map((x) => '<button type="button" data-id="' + esc(x.id) + '" aria-pressed="' + (x.id === activo) + '"' + (x.color ? ' style="--partido:' + esc(x.color) + '"' : "") + ">" + (x.color ? '<i class="punto-partido"></i>' : "") + esc(x.nombre) + "</button>").join("");
    $$("button", chips).forEach((b) => b.addEventListener("click", () => {
      if (estado.modo === "tema") estado.tema = b.dataset.id; else estado.partido = b.dataset.id;
      pintar();
    }));
  };

  const tarjetaPropuesta = (titulo, sub, p, color, conPunto) => {
    const vacio = !p || p.vacio;
    return '<article class="propuesta' + (vacio ? " vacia" : "") + '" style="--partido:' + esc(color) + '">' +
      '<div class="cabeza">' + (conPunto ? '<b class="con-chapa">' + chapa(conPunto, color, titulo) + (titulo.toUpperCase() !== conPunto ? '<span class="nombre-largo">' + esc(titulo) + "</span>" : "") + "</b>" : "<b>" + esc(titulo) + "</b>") + (sub ? "<span>" + esc(sub) + "</span>" : "") + "</div>" +
      (p && p.puntos && p.puntos.length
        ? (p.intro ? '<p class="intro">' + esc(p.intro) + "</p>" : "") + '<ul class="puntos">' + p.puntos.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>"
        : "<p>" + esc(p ? p.texto : "Sin información todavía.") + "</p>") +
      (p && p.tipo && d.tiposFuente && d.tiposFuente[p.tipo] ? '<span class="tipo-fuente tipo-' + esc(p.tipo) + '">' + esc(d.tiposFuente[p.tipo]) + "</span>" : "") +
      (p && p.fuentes && p.fuentes.length ? '<span class="fuentes">' + enlacesFuentes(p.fuentes) + "</span>" : "") +
      "</article>";
  };

  const pintar = () => {
    pintarChips();
    if (estado.modo === "tema") {
      const tema = d.temas.find((t) => t.id === estado.tema);
      salida.innerHTML = '<h3 class="subtitulo">' + esc(tema.nombre) + '</h3><div class="propuestas">' +
        d.partidos.map((p) => tarjetaPropuesta(p.nombre, p.candidato, (d.propuestas[p.id] || {})[tema.id], p.color, p.siglas || p.nombre)).join("") + "</div>";
    } else {
      const p = d.partidos.find((x) => x.id === estado.partido);
      salida.innerHTML = '<div class="ficha-partido" style="--partido:' + esc(p.color) + '">' +
        '<h3>' + chapa(p.siglas || p.nombre, p.color) + esc(p.nombre) + "</h3>" +
        "<p><b>Candidato/a:</b> " + esc(p.candidato) + (p.lema ? " · <b>Lema:</b> «" + esc(p.lema) + "»" : "") + "</p>" +
        '<p class="suave">' + esc(p.estado) + (p.web ? ' · <a href="' + esc(p.web) + '" target="_blank" rel="noopener">Web oficial</a>' : "") + "</p>" +
        '</div><div class="propuestas">' +
        d.temas.map((t) => tarjetaPropuesta(t.nombre, "", (d.propuestas[p.id] || {})[t.id], p.color, false)).join("") + "</div>";
    }
  };

  $$(".modo button").forEach((b) => b.addEventListener("click", () => {
    estado.modo = b.dataset.modo;
    $$(".modo button").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    pintar();
  }));
  pintar();
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
if (pagina === "portada") { portada(); prepararNewsletter(); }
if (pagina === "anual") anual();
if (pagina === "29n") especial29n();
if (pagina === "archivo") archivo();
if (pagina === "bulos") bulos();
