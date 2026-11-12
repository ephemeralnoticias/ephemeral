// Formulario propio de la newsletter.
// Recibe el correo desde la web y lo da de alta en beehiiv con su API.
// Los secretos NO están en el código: se guardan en Cloudflare Pages como variables
//   BEEHIIV_API_KEY         → clave de API de beehiiv
//   BEEHIIV_PUBLICATION_ID  → ID de la publicación (empieza por "pub_")
// Mientras falte alguna, la web sigue usando el formulario de beehiiv.

const responder = (cuerpo, estado = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const configurado = (env) => Boolean(env.BEEHIIV_API_KEY && env.BEEHIIV_PUBLICATION_ID);

// GET /api/suscribir → la web pregunta si el formulario propio está listo
export async function onRequestGet({ env }) {
  return responder({ listo: configurado(env) });
}

// POST /api/suscribir  { "email": "...", "web": "" }
export async function onRequestPost({ request, env }) {
  if (!configurado(env)) return responder({ ok: false, error: "config" }, 503);

  let datos;
  try { datos = await request.json(); } catch { return responder({ ok: false, error: "formato" }, 400); }

  // Campo trampa: las personas no lo ven; si viene relleno, es un robot. Fingimos que todo fue bien.
  if (datos && datos.web) return responder({ ok: true });

  const email = String((datos && datos.email) || "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return responder({ ok: false, error: "email" }, 400);
  }

  const url = "https://api.beehiiv.com/v2/publications/" + encodeURIComponent(env.BEEHIIV_PUBLICATION_ID) + "/subscriptions";
  let r;
  try {
    r = await fetch(url, {
      method: "POST",
      headers: { Authorization: "Bearer " + env.BEEHIIV_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: true,
        utm_source: "web",
        utm_medium: "formulario",
        referring_site: "ephemeral-5aj.pages.dev",
      }),
    });
  } catch {
    return responder({ ok: false, error: "red" }, 502);
  }
  if (!r.ok) {
    console.log("beehiiv respondió", r.status, (await r.text()).slice(0, 300));
    return responder({ ok: false, error: "beehiiv" }, 502);
  }
  return responder({ ok: true });
}
