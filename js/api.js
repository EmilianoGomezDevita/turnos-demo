const API_BASE_URL = window.TURNOS_API_URL || (
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:3001"
    : "https://turnos-api-4id3.onrender.com"
);
const TOKEN_KEY = "turnos_admin_token";

export function obtenerSlug() {
  const slug = new URLSearchParams(window.location.search).get("n");
  return slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

export function urlConSlug(ruta) {
  const url = new URL(ruta, window.location.href);
  const slug = obtenerSlug();
  if (slug) url.searchParams.set("n", slug);
  return `${url.pathname}${url.search}${url.hash}`;
}

function apiUrl(ruta, parametros = {}) {
  const url = new URL(ruta, API_BASE_URL);
  for (const [nombre, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== "") {
      url.searchParams.set(nombre, valor);
    }
  }
  return url;
}

async function solicitar(url, opciones) {
  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch {
    throw new Error("No pudimos conectar con el servidor. Probá de nuevo en un momento.");
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = new Error(datos.error || "No se pudo completar la solicitud.");
    error.status = respuesta.status;
    throw error;
  }
  return datos;
}

export async function cargarNegocio() {
  const slug = obtenerSlug();
  if (!slug) throw new Error("El link no incluye un negocio válido.");
  const { negocio } = await solicitar(
    apiUrl(`/api/negocios/${encodeURIComponent(slug)}`)
  );
  return negocio;
}

export async function cargarServicios() {
  const slug = obtenerSlug();
  if (!slug) throw new Error("El link no incluye un negocio válido.");
  const { servicios } = await solicitar(
    apiUrl(`/api/negocios/${encodeURIComponent(slug)}/servicios`)
  );
  return servicios;
}

export async function cargarDisponibilidad({ servicioId, fecha, profesionalId }) {
  const url = apiUrl("/api/disponibilidad", {
    n: obtenerSlug(),
    servicioId,
    fecha,
    profesionalId,
  });
  const { disponibilidad } = await solicitar(url);
  return disponibilidad;
}

export async function enviarReserva(datos) {
  const url = apiUrl("/api/reservas", { n: obtenerSlug() });
  return solicitar(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
}

export async function iniciarSesionAdmin({ slug, email, password }) {
  return solicitar(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, email, password }),
  });
}

export function guardarTokenAdmin(token) { sessionStorage.setItem(TOKEN_KEY, token); }
export function hayTokenAdmin() { return Boolean(sessionStorage.getItem(TOKEN_KEY)); }
export function cerrarSesionAdmin() { sessionStorage.removeItem(TOKEN_KEY); }

export async function solicitarAdmin(ruta, opciones = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers = new Headers(opciones.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (opciones.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return solicitar(apiUrl(ruta), { ...opciones, headers });
}
